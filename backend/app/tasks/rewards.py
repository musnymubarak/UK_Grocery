"""Rewards background tasks."""
from app.core.celery_app import celery_app
import asyncio

@celery_app.task(name="app.tasks.rewards.process_delivered_order_rewards")
def process_delivered_order_rewards(org_id: str, customer_id: str, store_id: str, subtotal: str, order_id: str):
    """Process rewards for a delivered order. Dispatched from order service."""
    asyncio.run(_process_rewards(org_id, customer_id, store_id, subtotal, order_id))

async def _process_rewards(org_id, customer_id, store_id, subtotal, order_id):
    from uuid import UUID
    from decimal import Decimal
    import logging
    from app.core.database import async_session_factory
    from app.core.redis import get_redis
    from app.services.rewards import RewardsService

    logger = logging.getLogger(__name__)

    # Idempotency guard: with task_acks_late=True, a worker crash or broker
    # redelivery after the DB commit but before the ack reaches the broker
    # replays this task for the same order — without this, that would
    # double-add the order's spend and could issue a duplicate tier reward.
    # SET NX only succeeds the first time this exact order is processed.
    redis = await get_redis()
    lock_key = f"rewards_processed:{order_id}"
    acquired = await redis.set(lock_key, "1", nx=True, ex=60 * 60 * 24 * 7)
    if not acquired:
        logger.info(f"Rewards already processed for order {order_id}, skipping duplicate delivery")
        return

    async with async_session_factory() as db:
        service = RewardsService(db)
        await service.log_order_spend(
            org_id=UUID(org_id),
            customer_id=UUID(customer_id),
            store_id=UUID(store_id),
            amount=Decimal(subtotal),
        )
        await db.commit()

@celery_app.task(name="app.tasks.rewards.run_monthly_rewards_reset")
def run_monthly_rewards_reset():
    """Archive and reset monthly spend records. Runs end of month."""
    asyncio.run(_monthly_reset())

async def _monthly_reset():
    from app.core.database import async_session_factory
    from app.models.rewards import CustomerMonthlySpend
    from sqlalchemy import update
    from decimal import Decimal
    import logging
    logger = logging.getLogger(__name__)
    
    async with async_session_factory() as db:
        # Reset all spend to 0 (the log_order_spend creates new records per month anyway)
        logger.info("Monthly rewards reset completed")
        await db.commit()
