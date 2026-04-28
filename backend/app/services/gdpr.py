"""
GDPR Compliance service — Data Export and Account Erasure (Anonymization).
"""
import hashlib
import logging
from uuid import UUID
from typing import Dict, Any, List

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer import Customer
from app.models.order import Order
from app.models.review import Review
from app.models.notification import Notification
from app.models.refresh_token import RefreshToken
from app.core.exceptions import NotFoundException

logger = logging.getLogger(__name__)

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
        }

        # Orders (simplified)
        order_result = await self.db.execute(
            select(Order).where(Order.customer_id == customer_id).order_by(Order.created_at.desc())
        )
        orders = order_result.scalars().all()
        for o in orders:
            data["orders"].append({
                "id": str(o.id),
                "reference": o.order_number,
                "status": o.status,
                "total_amount": float(o.total),
                "created_at": o.created_at.isoformat(),
                "items_count": len(o.items) if hasattr(o, 'items') else 0,
            })

        # Reviews
        review_result = await self.db.execute(
            select(Review).where(Review.customer_id == customer_id)
        )
        reviews = review_result.scalars().all()
        for r in reviews:
            data["reviews"].append({
                "id": str(r.id),
                "rating": r.rating,
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
        customer.password_hash = "ANONYMIZED"
        customer.is_active = False
        
        # 3. Delete sensitive linked data
        # Notifications
        await self.db.execute(
            update(Notification).where(Notification.customer_id == customer_id).values(is_deleted=True)
        )
        
        # Refresh Tokens (revokes all sessions)
        await self.db.execute(
            update(RefreshToken).where(RefreshToken.customer_id == customer_id).values(revoked=True)
        )

        # 4. Reviews - could either delete or anonymize
        # We'll keep them but mark as 'Anonymous' if we had a name field in Review, 
        # but Review links to Customer, and Customer is now "Deleted User".

        await self.db.commit()
        return True
