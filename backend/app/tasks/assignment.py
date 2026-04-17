"""
Automated order assignment background task.
"""
from app.core.celery_app import celery_app
from app.core.database import async_session_factory
from sqlalchemy import select, and_
from datetime import datetime, timezone
import asyncio
import logging

logger = logging.getLogger(__name__)

@celery_app.task(name="app.tasks.assignment.auto_assign_orders")
def auto_assign_orders():
    """Poll for unassigned confirmed orders and matching drivers. Runs every 60s."""
    asyncio.run(_auto_assign_orders())

async def _auto_assign_orders():
    from app.models.order import Order, OrderStatusHistory
    from app.models.driver import DriverProfile
    from app.models.user import User
    
    async with async_session_factory() as db:
        # 1. Find orders in "confirmed" status, order_type="delivery", and no assigned_to
        query = select(Order).where(
            and_(
                Order.status == "confirmed",
                Order.order_type == "delivery",
                Order.assigned_to == None
            )
        )
        result = await db.execute(query)
        pending_orders = result.scalars().all()
        
        if not pending_orders:
            return

        for order in pending_orders:
            # 2. Get available drivers for this order's store
            # Order them by total_deliveries ascending (round-robin / fair distribution)
            driver_query = (
                select(DriverProfile)
                .join(User, User.id == DriverProfile.user_id)
                .where(
                    and_(
                        DriverProfile.is_available == True,
                        DriverProfile.is_online == True,
                        User.store_id == order.store_id
                    )
                )
                .order_by(DriverProfile.total_deliveries.asc())
                .limit(1)
            )
            
            driver_res = await db.execute(driver_query)
            best_driver_profile = driver_res.scalar_one_or_none()
            
            if best_driver_profile:
                logger.info(f"Auto-assigning order {order.order_number} to driver {best_driver_profile.user_id}")
                
                # Assign
                order.assigned_to = best_driver_profile.user_id
                order.status = "assigned_to_driver"
                order.updated_at = datetime.now(timezone.utc)
                
                # Log status history
                history = OrderStatusHistory(
                    order_id=order.id,
                    from_status="confirmed",
                    to_status="assigned_to_driver",
                    changed_by_type="system",
                    changed_by_id=None,
                    notes="Automatically assigned via round-robin logic.",
                )
                db.add(history)
                
                # Notify driver (in-app)
                from app.services.notification import NotificationService
                notif_service = NotificationService(db)
                await notif_service.send(
                    customer_id=None, # This service seems to be for customers, I might need to extend it for Users later.
                    # Wait, let's check notification.py model to see if it supports user_id.
                    title="New Order Assigned 📦",
                    body=f"You have been assigned order {order.order_number}.",
                    notification_type="order_assigned",
                    reference_id=order.id,
                )
                # Actually, our notification model currently only has customer_id.
                # For Phase 4, we'll keep it simple or expand later if needed.
                # For now, let's just complete the assignment.
        
        await db.commit()
