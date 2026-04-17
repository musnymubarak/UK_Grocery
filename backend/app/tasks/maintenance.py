"""Maintenance background tasks."""
from app.core.celery_app import celery_app
from app.core.database import async_session_factory
from sqlalchemy import select, update
from datetime import datetime, timezone, timedelta
import asyncio

@celery_app.task(name="app.tasks.maintenance.expire_stale_coupons")
def expire_stale_coupons():
    """Mark expired coupons as inactive. Runs daily at 01:00."""
    asyncio.run(_expire_stale_coupons())

async def _expire_stale_coupons():
    from app.models.coupon import Coupon
    async with async_session_factory() as db:
        now = datetime.now(timezone.utc)
        stmt = (
            update(Coupon)
            .where(Coupon.valid_until < now, Coupon.is_active == True)
            .values(is_active=False)
        )
        result = await db.execute(stmt)
        await db.commit()
        return {"expired": result.rowcount}

@celery_app.task(name="app.tasks.maintenance.order_timeout_check")
def order_timeout_check():
    """Auto-reject orders stuck in 'placed' for >15 min. Runs every 2 min."""
    asyncio.run(_order_timeout_check())

async def _order_timeout_check():
    from app.models.order import Order, OrderStatusHistory
    from app.models.inventory import Inventory
    from sqlalchemy import select
    import logging
    logger = logging.getLogger(__name__)
    
    async with async_session_factory() as db:
        threshold = datetime.now(timezone.utc) - timedelta(minutes=15)
        query = select(Order).where(
            Order.status == "placed",
            Order.created_at < threshold,
        )
        result = await db.execute(query)
        stuck_orders = result.scalars().all()
        
        rejected_count = 0
        now = datetime.now(timezone.utc)
        for order in stuck_orders:
            logger.warning(f"Auto-rejecting order {order.order_number} (stuck >15min)")
            
            old_status = order.status
            order.status = "rejected"
            order.rejected_reason = "Automatically rejected: no store response within 15 minutes"
            order.updated_at = now
            
            # Release reserved inventory
            from sqlalchemy.orm import selectinload
            from app.models.order import OrderItem
            items_query = select(OrderItem).where(OrderItem.order_id == order.id)
            items_result = await db.execute(items_query)
            items = items_result.scalars().all()
            
            for item in items:
                inv_query = select(Inventory).where(
                    Inventory.product_id == item.product_id,
                    Inventory.store_id == order.store_id,
                )
                inv_result = await db.execute(inv_query)
                inv = inv_result.scalar_one_or_none()
                if inv:
                    inv.reserved_quantity = max(0, inv.reserved_quantity - int(item.quantity))
            
            # Log status history
            history = OrderStatusHistory(
                order_id=order.id,
                from_status=old_status,
                to_status="rejected",
                changed_by_type="system",
                changed_by_id=None,
                notes="Auto-rejected: no store response within 15 minutes",
            )
            db.add(history)
            rejected_count += 1
        
        await db.commit()
        logger.info(f"Auto-reject completed: {rejected_count} orders rejected")
        return {"rejected": rejected_count}
