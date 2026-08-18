"""Notification service — create and query notifications."""
from uuid import UUID
from typing import List, Optional
from sqlalchemy import select, func, update
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.models.customer import Customer
from app.models.device_token import CustomerDeviceToken
from app.services.fcm import send_fcm_push

class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register_device_token(
        self, customer_id: UUID, fcm_token: str, platform: str = "android", device_id: Optional[str] = None
    ) -> CustomerDeviceToken:
        """Register or update an FCM device token for a customer."""
        q = select(CustomerDeviceToken).where(CustomerDeviceToken.fcm_token == fcm_token)
        existing = (await self.db.execute(q)).scalar_one_or_none()

        if existing:
            existing.customer_id = customer_id
            existing.platform = platform
            existing.device_id = device_id
            existing.is_active = True
            await self.db.flush()
            return existing

        token_entry = CustomerDeviceToken(
            customer_id=customer_id,
            fcm_token=fcm_token,
            platform=platform,
            device_id=device_id,
            is_active=True,
        )
        self.db.add(token_entry)
        await self.db.flush()
        return token_entry

    async def unregister_device_token(
        self, customer_id: UUID, fcm_token: Optional[str] = None
    ) -> int:
        """Deactivate device token(s) upon customer logout."""
        stmt = update(CustomerDeviceToken).where(
            CustomerDeviceToken.customer_id == customer_id,
            CustomerDeviceToken.is_active == True,
        )
        if fcm_token:
            stmt = stmt.where(CustomerDeviceToken.fcm_token == fcm_token)
        stmt = stmt.values(is_active=False)
        res = await self.db.execute(stmt)
        return res.rowcount

    async def send(
        self, customer_id: UUID, title: str, body: str,
        notification_type: str, reference_id: UUID = None
    ) -> Notification:
        """Create a notification in the customer's inbox and dispatch FCM push alert."""
        notif = Notification(
            customer_id=customer_id,
            title=title,
            body=body,
            notification_type=notification_type,
            reference_id=reference_id,
        )
        self.db.add(notif)
        await self.db.flush()

        # Query active device tokens for this customer and send push notification
        try:
            tokens_q = select(CustomerDeviceToken.fcm_token).where(
                CustomerDeviceToken.customer_id == customer_id,
                CustomerDeviceToken.is_active == True,
            )
            tokens = list((await self.db.execute(tokens_q)).scalars().all())
            if tokens:
                push_res = await send_fcm_push(
                    tokens=tokens,
                    title=title,
                    body=body,
                    data={
                        "notification_id": str(notif.id),
                        "notification_type": notification_type,
                        "reference_id": str(reference_id) if reference_id else "",
                    },
                )
                # Prune invalid tokens if any
                invalid = push_res.get("invalid_tokens", [])
                if invalid:
                    await self.db.execute(
                        update(CustomerDeviceToken)
                        .where(CustomerDeviceToken.fcm_token.in_(invalid))
                        .values(is_active=False)
                    )
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Push dispatch error in NotificationService.send: {e}")

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

        # Push to all active device tokens of customers in this org
        try:
            tokens_q = (
                select(CustomerDeviceToken.fcm_token)
                .join(Customer, Customer.id == CustomerDeviceToken.customer_id)
                .where(
                    Customer.organization_id == org_id,
                    CustomerDeviceToken.is_active == True,
                )
            )
            tokens = list((await self.db.execute(tokens_q)).scalars().all())
            if tokens:
                await send_fcm_push(
                    tokens=tokens,
                    title=title,
                    body=body,
                    data={"notification_type": notification_type},
                )
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Push broadcast error: {e}")

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
