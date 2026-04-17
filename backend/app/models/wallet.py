"""
Wallet Transaction model — tracks all customer balance changes.
"""
from sqlalchemy import Column, String, ForeignKey, Numeric, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base, TimestampMixin

class WalletTransaction(TimestampMixin, Base):
    __tablename__ = "wallet_transactions"

    customer_id = Column(
        UUID(as_uuid=True),
        ForeignKey("customers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    amount = Column(Numeric(12, 2), nullable=False)  # positive = credit, negative = debit
    transaction_type = Column(String(20), nullable=False)  # credit, debit
    source = Column(String(30), nullable=False)  # refund, payment, referral, admin_adjustment
    reference_id = Column(UUID(as_uuid=True), nullable=True)  # order_id, refund_id, etc.
    notes = Column(Text, nullable=True)
    balance_after = Column(Numeric(12, 2), nullable=False)  # snapshot of balance after this txn

    # Relationships
    customer = relationship("Customer")

    def __repr__(self):
        return f"<WalletTransaction(customer={self.customer_id}, amount={self.amount}, source={self.source})>"
