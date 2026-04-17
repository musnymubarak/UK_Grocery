"""Notification service — create and query notifications."""
from uuid import UUID
from typing import List
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification

class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def send(
        self, customer_id: UUID, title: str, body: str,
        notification_type: str, reference_id: UUID = None
    ) -> Notification:
        """Create a notification in the customer's inbox."""
        notif = Notification(
            customer_id=customer_id,
            title=title,
            body=body,
            notification_type=notification_type,
            reference_id=reference_id,
        )
        self.db.add(notif)
        await self.db.flush()
        return notif

    async def get_inbox(
        self, customer_id: UUID, unread_only: bool = False,
        skip: int = 0, limit: int = 30
    ) -> List[Notification]:
        query = select(Notification).where(Notification.customer_id == customer_id)
        if unread_only:
            query = query.where(Notification.is_read == False)
        query = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_unread_count(self, customer_id: UUID) -> int:
        query = select(func.count(Notification.id)).where(
            Notification.customer_id == customer_id,
            Notification.is_read == False,
        )
        result = await self.db.execute(query)
        return result.scalar() or 0

    async def mark_as_read(self, notification_id: UUID, customer_id: UUID) -> None:
        stmt = (
            update(Notification)
            .where(Notification.id == notification_id, Notification.customer_id == customer_id)
            .values(is_read=True)
        )
        await self.db.execute(stmt)

    async def mark_all_read(self, customer_id: UUID) -> int:
        stmt = (
            update(Notification)
            .where(Notification.customer_id == customer_id, Notification.is_read == False)
            .values(is_read=True)
        )
        result = await self.db.execute(stmt)
        return result.rowcount
