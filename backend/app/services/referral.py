"""Referral service — code generation, validation, and reward distribution."""
import secrets
import string
from uuid import UUID
from decimal import Decimal
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer import Customer
from app.services.wallet import WalletService
# Import WalletTransaction to check for existing credits
from app.models.wallet import WalletTransaction
from app.core.exceptions import ValidationException, NotFoundException

class ReferralService:
    # Configurable reward amounts
    REFERRER_REWARD = Decimal("5.00")   # Existing customer gets £5
    REFEREE_REWARD = Decimal("3.00")    # New customer gets £3

    def __init__(self, db: AsyncSession):
        self.db = db

    @staticmethod
    def _generate_code(length: int = 8) -> str:
        """Generate a short, unique referral code like 'GRO-A7X9B2'."""
        chars = string.ascii_uppercase + string.digits
        suffix = ''.join(secrets.choice(chars) for _ in range(length))
        return f"GRO-{suffix}"

    async def ensure_referral_code(self, customer_id: UUID) -> str:
        """Generate and persist a referral code for a customer if they don't have one."""
        customer = await self.db.get(Customer, customer_id)
        if not customer:
            raise NotFoundException("Customer", customer_id)
        
        if customer.referral_code:
            return customer.referral_code

        # Generate unique code with retry
        for _ in range(5):
            code = self._generate_code()
            existing = await self.db.execute(
                select(Customer).where(Customer.referral_code == code)
            )
            if not existing.scalar_one_or_none():
                customer.referral_code = code
                await self.db.flush()
                return code
        raise ValidationException("Failed to generate unique referral code")

    async def apply_referral(self, new_customer_id: UUID, referral_code: str) -> dict:
        """Apply a referral code during/after registration."""
        # Look up the referrer
        result = await self.db.execute(
            select(Customer).where(Customer.referral_code == referral_code)
        )
        referrer = result.scalar_one_or_none()
        if not referrer:
            raise ValidationException(f"Invalid referral code: {referral_code}")

        # Prevent self-referral
        if referrer.id == new_customer_id:
            raise ValidationException("You cannot refer yourself")

        # Check if already referred
        new_customer = await self.db.get(Customer, new_customer_id)
        if not new_customer:
            raise NotFoundException("Customer", new_customer_id)
        if new_customer.referred_by:
            raise ValidationException("You have already used a referral code")

        # Link the referral
        new_customer.referred_by = referrer.id
        await self.db.flush()

        # Credit referee immediately
        wallet = WalletService(self.db)
        await wallet.credit(
            customer_id=new_customer_id,
            amount=self.REFEREE_REWARD,
            source="referral",
            reference_id=referrer.id,
            notes=f"Welcome bonus from referral code {referral_code}",
        )

        return {
            "referrer_name": referrer.full_name,
            "referee_credit": float(self.REFEREE_REWARD),
            "message": f"£{self.REFEREE_REWARD} added to your wallet!",
        }

    async def credit_referrer_on_first_order(self, customer_id: UUID, order_id: UUID) -> None:
        """Called after a referred customer's FIRST delivered order. Credits the referrer."""
        customer = await self.db.get(Customer, customer_id)
        if not customer or not customer.referred_by:
            return  # Not a referred customer

        # Check if referrer was already credited (idempotency)
        existing = await self.db.execute(
            select(WalletTransaction).where(
                WalletTransaction.customer_id == customer.referred_by,
                WalletTransaction.source == "referral",
                WalletTransaction.reference_id == customer_id,
            )
        )
        if existing.scalar_one_or_none():
            return  # Already credited

        wallet = WalletService(self.db)
        await wallet.credit(
            customer_id=customer.referred_by,
            amount=self.REFERRER_REWARD,
            source="referral",
            reference_id=customer_id,
            notes=f"Referral reward: your friend completed their first order",
        )
