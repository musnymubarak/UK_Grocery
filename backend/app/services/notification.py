"""Notification service — create and query notifications."""
from uuid import UUID
from typing import List, Optional
from sqlalchemy import select, func, update
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.models.customer import Customer

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

    # --- Admin operations ---

    async def broadcast_to_org(
        self, org_id: UUID, title: str, body: str,
        notification_type: str = "promo",
        active_only: bool = True,
    ) -> int:
        """Send the same notification to every customer in the org. Returns recipient count."""
        q = select(Customer.id).where(Customer.organization_id == org_id)
        if active_only:
            q = q.where(Customer.is_active == True)
        ids = (await self.db.execute(q)).scalars().all()
        for cid in ids:
            self.db.add(Notification(
                customer_id=cid,
                title=title,
                body=body,
                notification_type=notification_type,
            ))
        await self.db.flush()
        return len(ids)

    async def list_recent(self, org_id: UUID, limit: int = 50) -> List[dict]:
        """Admin audit view of recent notifications across customers in the org."""
        q = (
            select(Notification, Customer.full_name, Customer.email)
            .join(Customer, Customer.id == Notification.customer_id)
            .where(Customer.organization_id == org_id)
            .order_by(Notification.created_at.desc())
            .limit(limit)
        )
        rows = (await self.db.execute(q)).all()
        return [
            {
                "id": n.id,
                "customer_id": n.customer_id,
                "customer_name": full_name,
                "customer_email": email,
                "title": n.title,
                "body": n.body,
                "notification_type": n.notification_type,
                "is_read": n.is_read,
                "created_at": n.created_at,
            }
            for n, full_name, email in rows
        ]
