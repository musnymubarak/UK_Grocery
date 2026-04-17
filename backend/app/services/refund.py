"""Refund service — request, approve, and reject refunds."""
from uuid import UUID
from decimal import Decimal
from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.refund import Refund
from app.models.order import Order
from app.models.user import User
from app.services.wallet import WalletService
from app.core.exceptions import NotFoundException, ValidationException

class RefundService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def request_refund(self, customer_id: UUID, order_id: UUID, reason: str) -> Refund:
        """Customer requests a refund for a delivered/failed order."""
        order = await self.db.get(Order, order_id)
        if not order or order.customer_id != customer_id:
            raise NotFoundException("Order", order_id)

        if order.status not in ("delivered", "delivery_failed"):
            raise ValidationException(
                f"Cannot request refund for order in '{order.status}' status. "
                "Refunds are only available for delivered or failed orders."
            )

        # Check for existing pending refund
        existing = await self.db.execute(
            select(Refund).where(
                Refund.order_id == order_id,
                Refund.status == "pending",
            )
        )
        if existing.scalar_one_or_none():
            raise ValidationException("A refund request is already pending for this order")

        refund = Refund(
            order_id=order_id,
            customer_id=customer_id,
            amount=order.total,
            reason=reason,
            status="pending",
        )
        self.db.add(refund)
        await self.db.flush()
        return refund

    async def process_refund(
        self, refund_id: UUID, status: str, admin_user: User, admin_notes: str = None
    ) -> Refund:
        """Admin approves or rejects a refund."""
        refund = await self.db.get(Refund, refund_id)
        if not refund:
            raise NotFoundException("Refund", refund_id)

        if refund.status != "pending":
            raise ValidationException(f"Refund is already '{refund.status}'")

        refund.status = status
        refund.admin_notes = admin_notes
        refund.processed_by = admin_user.id

        if status == "approved":
            # Credit customer wallet
            wallet = WalletService(self.db)
            await wallet.credit(
                customer_id=refund.customer_id,
                amount=refund.amount,
                source="refund",
                reference_id=refund.id,
                notes=f"Refund for order. Reason: {refund.reason[:100]}",
            )

            # Update order payment status
            order = await self.db.get(Order, refund.order_id)
            if order:
                order.payment_status = "refunded"

        await self.db.flush()
        return refund

    async def get_refunds_for_org(
        self, org_id: UUID, status_filter: str = None, skip: int = 0, limit: int = 50
    ) -> List[Refund]:
        """Admin: list all refund requests."""
        query = (
            select(Refund)
            .join(Order, Order.id == Refund.order_id)
            .where(Order.organization_id == org_id)
        )
        if status_filter:
            query = query.where(Refund.status == status_filter)
        query = query.order_by(Refund.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())
