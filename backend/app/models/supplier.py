"""
Supplier + SupplierPayment models — procurement (supply side).
"""
from datetime import datetime, timezone

from sqlalchemy import Column, String, ForeignKey, Boolean, Integer, Text, Numeric, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base, TimestampMixin


class Supplier(TimestampMixin, Base):
    __tablename__ = "suppliers"

    organization_id = Column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name = Column(String(255), nullable=False)
    contact_name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    payment_terms = Column(String(100), nullable=True)   # e.g. "Net 30"
    lead_time_days = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    payments = relationship("SupplierPayment", back_populates="supplier", cascade="all, delete-orphan", lazy="raise")

    def __repr__(self):
        return f"<Supplier(name='{self.name}')>"


class SupplierPayment(TimestampMixin, Base):
    __tablename__ = "supplier_payments"

    organization_id = Column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    supplier_id = Column(
        UUID(as_uuid=True), ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    purchase_order_id = Column(
        UUID(as_uuid=True), ForeignKey("purchase_orders.id", ondelete="SET NULL"), nullable=True
    )
    amount = Column(Numeric(12, 2), nullable=False)
    payment_date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    method = Column(String(50), nullable=True)   # bank_transfer, cash, card, cheque
    reference = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    created_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    supplier = relationship("Supplier", back_populates="payments")

    def __repr__(self):
        return f"<SupplierPayment(amount={self.amount})>"
