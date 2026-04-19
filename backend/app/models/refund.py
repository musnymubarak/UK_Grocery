"""
Refund model — tracks refund requests and approvals.
"""
from sqlalchemy import Column, String, ForeignKey, Numeric, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base, TimestampMixin

class Refund(TimestampMixin, Base):
    __tablename__ = "refunds"

    order_id = Column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    customer_id = Column(
        UUID(as_uuid=True),
        ForeignKey("customers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    amount = Column(Numeric(12, 2), nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String(20), default="pending", nullable=False)  # pending, approved, rejected
    admin_notes = Column(Text, nullable=True)
    processed_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    order = relationship("Order", back_populates="refunds")
    customer = relationship("Customer")

    def __repr__(self):
        return f"<Refund(order={self.order_id}, amount={self.amount}, status={self.status})>"
