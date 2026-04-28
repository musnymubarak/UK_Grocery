"""
Refund model — tracks granular refund requests and approvals at the item level.
"""
from sqlalchemy import Column, String, ForeignKey, Numeric, Text, Boolean, Index, text
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
    
    # Denormalized total sum of APPROVED RefundItems (+ potential delivery fee)
    total_amount = Column(Numeric(12, 2), default=0, nullable=False)
    
    # Destination of funds: original_method, wallet
    destination = Column(String(20), default="wallet", nullable=False)
    
    # Parent status derived from children: pending, approved, rejected, partially_approved
    status = Column(String(20), default="pending", nullable=False)
    
    admin_notes = Column(Text, nullable=True)
    processed_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    order = relationship("Order", back_populates="refunds")
    customer = relationship("Customer")
    items = relationship("RefundItem", back_populates="refund", cascade="all, delete-orphan", lazy="selectin")

    def __repr__(self):
        return f"<Refund(id={self.id}, order={self.order_id}, status={self.status})>"

class RefundItem(TimestampMixin, Base):
    __tablename__ = "refund_items"

    refund_id = Column(
        UUID(as_uuid=True),
        ForeignKey("refunds.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    order_item_id = Column(
        UUID(as_uuid=True),
        ForeignKey("order_items.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    
    # missing_item, wrong_item, damaged_item, expired_item, quality_issue, not_received, other
    reason = Column(String(50), nullable=False)
    
    quantity = Column(Numeric(10, 3), nullable=False)
    # Calculated as quantity * order_item.effective_unit_price
    amount = Column(Numeric(12, 2), nullable=False)
    
    status = Column(String(20), default="pending", nullable=False) # pending, approved, rejected
    admin_notes = Column(Text, nullable=True)
    customer_notes = Column(Text, nullable=True)
    requires_manual_review = Column(Boolean, default=True, nullable=False)

    # Relationships
    refund = relationship("Refund", back_populates="items")
    order_item = relationship("OrderItem", back_populates="refund_items")
    evidence = relationship("RefundEvidence", backref="refund_item", cascade="all, delete-orphan", lazy="selectin")

    __table_args__ = (
        # Prevent multiple PENDING refund requests for the same order item
        Index(
            "ix_refund_items_pending_unique",
            "order_item_id",
            unique=True,
            postgresql_where=text("status = 'pending'")
        ),
        # Optimize refund history and status lookups
        Index("ix_refund_items_composite_lookup", "order_item_id", "status"),
    )

    def __repr__(self):
        return f"<RefundItem(id={self.id}, refund={self.refund_id}, status={self.status})>"
