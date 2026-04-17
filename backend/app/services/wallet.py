"""Wallet service — credit, debit, and history for customer balances."""
from uuid import UUID
from decimal import Decimal
from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.wallet import WalletTransaction
from app.models.customer import Customer
from app.core.exceptions import ValidationException, NotFoundException

class WalletService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def credit(
        self, customer_id: UUID, amount: Decimal,
        source: str, reference_id: UUID = None, notes: str = None
    ) -> WalletTransaction:
        """Add funds to customer wallet."""
        if amount <= 0:
            raise ValidationException("Credit amount must be positive")

        customer = await self.db.get(Customer, customer_id)
        if not customer:
            raise NotFoundException("Customer", customer_id)

        customer.wallet_balance += amount
        new_balance = customer.wallet_balance

        txn = WalletTransaction(
            customer_id=customer_id,
            amount=amount,
            transaction_type="credit",
            source=source,
            reference_id=reference_id,
            notes=notes,
            balance_after=new_balance,
        )
        self.db.add(txn)
        await self.db.flush()
        return txn

    async def debit(
        self, customer_id: UUID, amount: Decimal,
        source: str, reference_id: UUID = None, notes: str = None
    ) -> WalletTransaction:
        """Deduct funds from customer wallet."""
        if amount <= 0:
            raise ValidationException("Debit amount must be positive")

        customer = await self.db.get(Customer, customer_id)
        if not customer:
            raise NotFoundException("Customer", customer_id)

        if customer.wallet_balance < amount:
            raise ValidationException(
                f"Insufficient wallet balance: £{customer.wallet_balance}, required: £{amount}"
            )

        customer.wallet_balance -= amount
        new_balance = customer.wallet_balance

        txn = WalletTransaction(
            customer_id=customer_id,
            amount=-amount,
            transaction_type="debit",
            source=source,
            reference_id=reference_id,
            notes=notes,
            balance_after=new_balance,
        )
        self.db.add(txn)
        await self.db.flush()
        return txn

    async def get_balance(self, customer_id: UUID) -> Decimal:
        customer = await self.db.get(Customer, customer_id)
        if not customer:
            raise NotFoundException("Customer", customer_id)
        return customer.wallet_balance

    async def get_history(
        self, customer_id: UUID, skip: int = 0, limit: int = 50
    ) -> List[WalletTransaction]:
        query = (
            select(WalletTransaction)
            .where(WalletTransaction.customer_id == customer_id)
            .order_by(WalletTransaction.created_at.desc())
            .offset(skip).limit(limit)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())
