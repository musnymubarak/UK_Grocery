"""
Order model — Customer orders and items.
"""
from sqlalchemy import Column, String, ForeignKey, Numeric, Text, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base, TimestampMixin

class Order(TimestampMixin, Base):
    __tablename__ = "orders"

    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    store_id = Column(
        UUID(as_uuid=True),
        ForeignKey("stores.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    customer_id = Column(
        UUID(as_uuid=True),
        ForeignKey("customers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    delivery_address_id = Column(
        UUID(as_uuid=True),
        ForeignKey("customer_addresses.id", ondelete="SET NULL"),
        nullable=True,
    )
    assigned_to = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    
    order_number = Column(String(50), unique=True, nullable=False, index=True)
    status = Column(String(20), default="placed", nullable=False) # placed, confirmed, picking...
    
    # shop.md extensions
    order_type = Column(String(20), default="delivery", nullable=False) # delivery, collection
    service_fee = Column(Numeric(10, 2), default=0, nullable=False)
    tip_amount = Column(Numeric(10, 2), default=0, nullable=False)
    coupon_id = Column(UUID(as_uuid=True), nullable=True) # FK added in Phase 2
    coupon_code = Column(String(50), nullable=True)
    
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    picked_at = Column(DateTime(timezone=True), nullable=True)
    dispatched_at = Column(DateTime(timezone=True), nullable=True)
    rejected_reason = Column(Text, nullable=True)
    
    subtotal = Column(Numeric(12, 2), default=0, nullable=False)
    delivery_fee = Column(Numeric(10, 2), default=0, nullable=False)
    discount = Column(Numeric(10, 2), default=0, nullable=False)
    total = Column(Numeric(12, 2), default=0, nullable=False)
    
    payment_method = Column(String(20), default="cod", nullable=False) # cod, online, wallet
    payment_status = Column(String(20), default="pending", nullable=False) # pending, paid, refunded
    
    notes = Column(Text, nullable=True)
    delivery_instructions = Column(Text, nullable=True)
    
    estimated_delivery_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    organization = relationship("Organization")
    store = relationship("Store", back_populates="orders")
    customer = relationship("Customer", back_populates="orders")
    delivery_address = relationship("CustomerAddress")
    delivery_boy = relationship("User", back_populates="assigned_orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan", lazy="selectin")

    def __repr__(self):
        return f"<Order(order_number='{self.order_number}', status='{self.status}')>"

class OrderItem(TimestampMixin, Base):
    __tablename__ = "order_items"

    order_id = Column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id = Column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=False,
    )
    product_name = Column(String(255), nullable=False)
    product_sku = Column(String(100), nullable=True)
    
    quantity = Column(Numeric(10, 3), nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    tax_amount = Column(Numeric(12, 2), default=0.00, nullable=False)
    total = Column(Numeric(12, 2), nullable=False)

    # shop.md extensions
    is_substituted = Column(Boolean, default=False, nullable=False)
    substituted_product_id = Column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items", foreign_keys=[product_id])
    substituted_product = relationship("Product", foreign_keys=[substituted_product_id])

    def __repr__(self):
        return f"<OrderItem(id={self.id}, product='{self.product_name}', qty={self.quantity})>"
