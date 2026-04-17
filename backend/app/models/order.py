"""
Order model — Customer orders and items.
"""
from sqlalchemy import Column, String, ForeignKey, Numeric, Text, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
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
    delivery_address = Column(Text, nullable=True)
    delivery_postcode = Column(String(20), nullable=True)
    
    # shop.md extensions
    order_type = Column(String(20), default="delivery", nullable=False) # delivery, collection
    service_fee = Column(Numeric(10, 2), default=0, nullable=False)
    tip_amount = Column(Numeric(10, 2), default=0, nullable=False)
    coupon_id = Column(UUID(as_uuid=True), nullable=True) # FK added in Phase 2
    coupon_code = Column(String(50), nullable=True)
    
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    picked_at = Column(DateTime(timezone=True), nullable=True)
    dispatched_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    cancel_window_expires_at = Column(DateTime(timezone=True), nullable=True)
    scheduled_delivery_start = Column(DateTime(timezone=True), nullable=True)
    scheduled_delivery_end = Column(DateTime(timezone=True), nullable=True)
    rejected_reason = Column(Text, nullable=True)
    delivery_fee = Column(Numeric(10, 2), default=0, nullable=False)
    discount = Column(Numeric(10, 2), default=0, nullable=False)
    promotion_discount = Column(Numeric(10, 2), default=0, nullable=False)
    applied_promotions = Column(JSONB, nullable=True) # List of metadata
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
    delivery_address_record = relationship("CustomerAddress")
    delivery_boy = relationship("User", back_populates="assigned_orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan", lazy="selectin")
    status_history = relationship("OrderStatusHistory", back_populates="order", cascade="all, delete-orphan", lazy="raise")

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

    @property
    def product_image_url(self) -> str | None:
        """Expose the product image URL via the product relationship."""
        if self.product:
            return getattr(self.product, 'image_url', None)
        return None

    def __repr__(self):
        return f"<OrderItem(id={self.id}, product='{self.product_name}', qty={self.quantity})>"

class OrderStatusHistory(TimestampMixin, Base):
    __tablename__ = "order_status_history"

    order_id = Column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    from_status = Column(String(30), nullable=True)  # null for initial placement
    to_status = Column(String(30), nullable=False)
    changed_by_type = Column(String(20), nullable=False)  # "staff", "customer", "system"
    changed_by_id = Column(UUID(as_uuid=True), nullable=True)  # user.id or customer.id
    notes = Column(Text, nullable=True)

    # Relationships
    order = relationship("Order", back_populates="status_history")

    def __repr__(self):
        return f"<OrderStatusHistory({self.from_status} → {self.to_status})>"
