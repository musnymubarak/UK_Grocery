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
    """Flag orders stuck in PLACED status too long. Runs every 2 min."""
    asyncio.run(_order_timeout_check())

async def _order_timeout_check():
    from app.models.order import Order
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
        
        for order in stuck_orders:
            logger.warning(f"Order {order.order_number} stuck in PLACED for >15min")
            # Future: auto-cancel or notify admin
        
        return {"stuck_orders": len(stuck_orders)}
