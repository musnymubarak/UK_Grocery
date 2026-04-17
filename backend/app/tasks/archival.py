"""
Data archival and cleanup tasks.
"""
from datetime import datetime, timezone, timedelta
import asyncio
from sqlalchemy import delete
from app.core.celery_app import celery_app
from app.core.database import async_session_factory
from app.models.notification import Notification
from app.models.refresh_token import RefreshToken
from app.models.webhook import WebhookDelivery

@celery_app.task(name="app.tasks.archival.cleanup_old_notifications")
def cleanup_old_notifications():
    """Delete notifications older than 90 days."""
    asyncio.run(_cleanup_old_notifications())

async def _cleanup_old_notifications():
    cutoff = datetime.now(timezone.utc) - timedelta(days=90)
    async with async_session_factory() as db:
        stmt = delete(Notification).where(Notification.created_at < cutoff)
        await db.execute(stmt)
        await db.commit()

@celery_app.task(name="app.tasks.archival.cleanup_expired_tokens")
def cleanup_expired_tokens():
    """Delete expired or revoked refresh tokens."""
    asyncio.run(_cleanup_expired_tokens())

async def _cleanup_expired_tokens():
    now = datetime.now(timezone.utc)
    async with async_session_factory() as db:
        stmt = delete(RefreshToken).where(
            (RefreshToken.expires_at < now) | (RefreshToken.is_revoked == True)
        )
        await db.execute(stmt)
        await db.commit()

@celery_app.task(name="app.tasks.archival.cleanup_webhook_logs")
def cleanup_webhook_logs():
    """Delete webhook delivery logs older than 30 days."""
    asyncio.run(_cleanup_webhook_logs())

async def _cleanup_webhook_logs():
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    async with async_session_factory() as db:
        stmt = delete(WebhookDelivery).where(WebhookDelivery.created_at < cutoff)
        await db.execute(stmt)
        await db.commit()
