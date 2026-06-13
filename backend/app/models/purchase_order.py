"""
PurchaseOrder + PurchaseOrderItem models — procurement (ordering from suppliers).
Mirrors the Order/OrderItem header+line-item pattern.
"""
from datetime import datetime, timezone

from sqlalchemy import Column, String, ForeignKey, Integer, Text, Numeric, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base, TimestampMixin


class PurchaseOrder(TimestampMixin, Base):
    __tablename__ = "purchase_orders"

    organization_id = Column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    supplier_id = Column(
        UUID(as_uuid=True), ForeignKey("suppliers.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    store_id = Column(
        UUID(as_uuid=True), ForeignKey("stores.id", ondelete="CASCADE"), nullable=False, index=True
    )
    po_number = Column(String(50), unique=True, nullable=False, index=True)
    # draft -> sent -> partially_received -> received ; cancelled from any pre-received state
    status = Column(String(20), default="draft", nullable=False, index=True)
    order_date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    expected_date = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    subtotal = Column(Numeric(12, 2), default=0, nullable=False)
    total = Column(Numeric(12, 2), default=0, nullable=False)
    amount_paid = Column(Numeric(12, 2), default=0, nullable=False)
    created_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    supplier = relationship("Supplier", lazy="selectin")
    store = relationship("Store")
    items = relationship("PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan", lazy="selectin")

    def __repr__(self):
        return f"<PurchaseOrder(po_number='{self.po_number}', status='{self.status}')>"


class PurchaseOrderItem(TimestampMixin, Base):
    __tablename__ = "purchase_order_items"

    purchase_order_id = Column(
        UUID(as_uuid=True), ForeignKey("purchase_orders.id", ondelete="CASCADE"), nullable=False, index=True
    )
    product_id = Column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="RESTRICT"), nullable=False
    )
    product_name = Column(String(255), nullable=False)   # denormalized snapshot
    product_sku = Column(String(100), nullable=True)
    quantity_ordered = Column(Integer, nullable=False)
    quantity_received = Column(Integer, default=0, nullable=False)
    unit_cost = Column(Numeric(12, 2), nullable=False)
    total = Column(Numeric(12, 2), nullable=False)

    purchase_order = relationship("PurchaseOrder", back_populates="items")
    product = relationship("Product")

    def __repr__(self):
        return f"<PurchaseOrderItem(product='{self.product_name}', qty={self.quantity_ordered})>"
