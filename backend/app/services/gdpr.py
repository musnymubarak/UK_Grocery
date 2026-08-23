"""
GDPR Compliance service — Data Export and Account Erasure (Anonymization).
"""
import hashlib
import logging
import uuid as uuid_lib
from datetime import datetime, timezone, timedelta
from uuid import UUID
from typing import Dict, Any, List, Optional

from sqlalchemy import select, update, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer import Customer, CustomerAddress
from app.models.order import Order
from app.models.review import Review
from app.models.notification import Notification
from app.models.refresh_token import RefreshToken
from app.models.wallet import WalletTransaction
from app.models.refund import Refund
from app.core.security import hash_password
from app.core.exceptions import NotFoundException

logger = logging.getLogger(__name__)

# How long an order's delivery-address snapshot must be kept for tax/accounting
# purposes (UK HMRC financial record-keeping guidance) before it can be scrubbed
# even for an anonymized customer. The Order row itself is kept indefinitely for
# accounting — only the free-text address/instructions fields get redacted.
ORDER_ADDRESS_RETENTION_YEARS = 6
REDACTED_TEXT = "[redacted]"
ANONYMIZED_EMAIL_PATTERN = "deleted-%@anonymized.invalid"


class GDPRService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def export_customer_data(self, customer_id: UUID) -> Dict[str, Any]:
        """
        Collect all personal data for a customer (Right to Data Portability).
        """
        customer = await self.db.get(Customer, customer_id)
        if not customer:
            raise NotFoundException("Customer", customer_id)

        # Basic profile
        data = {
            "profile": {
                "id": str(customer.id),
                "email": customer.email,
                "full_name": customer.full_name,
                "phone": customer.phone,
                "created_at": customer.created_at.isoformat(),
                "is_active": customer.is_active,
            },
            "addresses": [],
            "orders": [],
            "reviews": [],
            "wallet": {"balance": float(customer.wallet_balance), "transactions": []},
            "refunds": [],
        }

        # Addresses — previously declared in the response shape but never
        # populated, so a data-portability export silently omitted them.
        address_result = await self.db.execute(
            select(CustomerAddress).where(CustomerAddress.customer_id == customer_id)
        )
        for a in address_result.scalars().all():
            data["addresses"].append({
                "id": str(a.id),
                "label": a.label,
                "street": a.street,
                "city": a.city,
                "state": a.state,
                "postcode": a.postcode,
                "country": a.country,
                "is_default": a.is_default,
            })

        # Wallet transaction history
        wallet_result = await self.db.execute(
            select(WalletTransaction)
            .where(WalletTransaction.customer_id == customer_id)
            .order_by(WalletTransaction.created_at.desc())
        )
        for t in wallet_result.scalars().all():
            data["wallet"]["transactions"].append({
                "id": str(t.id),
                "amount": float(t.amount),
                "type": t.transaction_type,
                "source": t.source,
                "balance_after": float(t.balance_after),
                "created_at": t.created_at.isoformat(),
            })

        # Refund history
        refund_result = await self.db.execute(
            select(Refund).where(Refund.customer_id == customer_id).order_by(Refund.created_at.desc())
        )
        for r in refund_result.scalars().all():
            data["refunds"].append({
                "id": str(r.id),
                "order_id": str(r.order_id),
                "status": r.status,
                "destination": r.destination,
                "total_amount": float(r.total_amount),
                "created_at": r.created_at.isoformat(),
            })

        # Orders (simplified)
        from sqlalchemy.orm import selectinload
        order_result = await self.db.execute(
            select(Order)
            .options(selectinload(Order.items))
            .where(Order.customer_id == customer_id)
            .order_by(Order.created_at.desc())
        )
        orders = order_result.scalars().all()
        for o in orders:
            data["orders"].append({
                "id": str(o.id),
                "reference": o.order_number,
                "status": o.status,
                "total_amount": float(o.total),
                "created_at": o.created_at.isoformat(),
                "items_count": len(o.items),
            })

        # Reviews
        review_result = await self.db.execute(
            select(Review).where(Review.customer_id == customer_id)
        )
        reviews = review_result.scalars().all()
        for r in reviews:
            data["reviews"].append({
                "id": str(r.id),
                "store_rating": r.store_rating,
                "delivery_rating": r.delivery_rating,
                "comment": r.comment,
                "created_at": r.created_at.isoformat(),
            })

        return data

    async def anonymize_customer(self, customer_id: UUID) -> bool:
        """
        Anonymize customer PII (Right to be Forgotten).
        Keeps order records for accounting but removes the link to the real person.
        """
        customer = await self.db.get(Customer, customer_id)
        if not customer:
            raise NotFoundException("Customer", customer_id)

        logger.info(f"Anonymizing customer {customer_id}")

        # 1. Generate stable but irreversible hashes for PII we must keep as identifiers (email for unique constraint)
        email_hash = hashlib.sha256(f"deleted-{customer_id}".encode()).hexdigest()[:20]
        anon_email = f"deleted-{email_hash}@anonymized.invalid"

        # 2. Update Customer record
        customer.full_name = "Deleted User"
        customer.email = anon_email
        customer.phone = None
        customer.dob = None
        customer.referral_code = None
        # Previously set customer.password_hash — the actual column is
        # hashed_password, so that assignment silently did nothing and the
        # real bcrypt hash survived anonymization. Hashing a random, unknown,
        # discarded value (rather than a fixed placeholder string) guarantees
        # the old password can never be used again, even if is_active is
        # later reversed.
        customer.hashed_password = hash_password(uuid_lib.uuid4().hex)
        customer.is_active = False

        # 3. Delete sensitive linked data
        # Addresses — previously untouched by anonymization despite being
        # clear PII (street/city/postcode). Order.delivery_address is a
        # separate point-in-time snapshot string, so scrubbing these doesn't
        # affect historical order records.
        await self.db.execute(
            update(CustomerAddress)
            .where(CustomerAddress.customer_id == customer_id)
            .values(street="REDACTED", city="REDACTED", state=None, postcode="REDACTED", label="removed")
        )

        # Notifications
        await self.db.execute(
            update(Notification).where(Notification.customer_id == customer_id).values(is_deleted=True)
        )

        # Refresh Tokens (revokes all sessions). The column is is_revoked, not
        # revoked — this update previously raised a CompileError every time,
        # meaning anonymize_customer never actually completed successfully
        # for anyone; it always failed before reaching the final commit below.
        from datetime import datetime, timezone as tz
        await self.db.execute(
            update(RefreshToken)
            .where(RefreshToken.customer_id == customer_id)
            .values(is_revoked=True, revoked_at=datetime.now(tz.utc))
        )

        # 4. Reviews - could either delete or anonymize
        # We'll keep them but mark as 'Anonymous' if we had a name field in Review,
        # but Review links to Customer, and Customer is now "Deleted User".

        # 5. Redact this customer's order address snapshots that are already past
        # the retention window — no need to wait for the nightly sweep below if
        # the legal retention period has already elapsed by the time of the request.
        await self.redact_expired_order_addresses(customer_id=customer_id)

        await self.db.commit()
        return True

    async def redact_expired_order_addresses(self, customer_id: Optional[UUID] = None) -> int:
        """Scrub Order.delivery_address / delivery_instructions once
        ORDER_ADDRESS_RETENTION_YEARS has passed since the order was placed.

        The Order row itself is never touched — orders are kept indefinitely for
        accounting. Only the free-text address snapshot gets redacted, since that's
        the part that's actually personal data.

        Pass customer_id to redact one customer's orders immediately (called from
        anonymize_customer for orders already past retention at request time).
        With no customer_id, sweeps every anonymized customer's orders — used by
        the nightly app.tasks.gdpr task to catch orders that cross the retention
        threshold later, after the customer was already forgotten.
        """
        cutoff = datetime.now(timezone.utc) - timedelta(days=ORDER_ADDRESS_RETENTION_YEARS * 365)
        stmt = (
            update(Order)
            .where(
                Order.created_at < cutoff,
                or_(
                    Order.delivery_address.isnot(None),
                    Order.delivery_instructions.isnot(None),
                ),
                # is_distinct_from (not !=) so a NULL delivery_address doesn't get
                # silently excluded — plain `!=` against NULL is unknown/false in SQL,
                # which would skip redacting delivery_instructions on that row forever.
                Order.delivery_address.is_distinct_from(REDACTED_TEXT),
            )
            .values(delivery_address=REDACTED_TEXT, delivery_instructions=REDACTED_TEXT)
        )
        if customer_id is not None:
            stmt = stmt.where(Order.customer_id == customer_id)
        else:
            stmt = stmt.where(
                Order.customer_id.in_(
                    select(Customer.id).where(Customer.email.like(ANONYMIZED_EMAIL_PATTERN))
                )
            )
        result = await self.db.execute(stmt)
        return result.rowcount or 0
