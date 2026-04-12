from sqlalchemy import Column, String, ForeignKey, Numeric, Integer, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base, TimestampMixin

class Coupon(TimestampMixin, Base):
    __tablename__ = "coupons"

    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    code = Column(String(50), nullable=False, unique=True, index=True)
    discount_type = Column(String(20), nullable=False) # flat_discount, percentage_discount, free_delivery
    discount_value = Column(Numeric(10, 2), nullable=False)
    
    minimum_order_value = Column(Numeric(10, 2), nullable=True)
    max_redemptions = Column(Integer, nullable=True)
    current_redemptions = Column(Integer, default=0, nullable=False)
    max_per_customer = Column(Integer, default=1, nullable=False)
    
    valid_from = Column(DateTime(timezone=True), nullable=True)
    valid_until = Column(DateTime(timezone=True), nullable=True)
    
    applicable_store_ids = Column(JSONB, nullable=True) 
    applicable_category_ids = Column(JSONB, nullable=True)
    
    is_first_order_only = Column(Boolean, default=False, nullable=False)
    is_combinable = Column(Boolean, default=False, nullable=False)
    
    issued_to_customer_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("customers.id", ondelete="CASCADE"), 
        nullable=True
    )
    source = Column(String(50), default="manual", nullable=False) # manual, referral, loyalty
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    issued_to_customer = relationship("Customer", foreign_keys=[issued_to_customer_id])
    redemptions = relationship("CouponRedemption", back_populates="coupon")

    def __repr__(self):
        return f"<Coupon(code='{self.code}', type='{self.discount_type}')>"


class CouponRedemption(TimestampMixin, Base):
    __tablename__ = "coupon_redemptions"

    coupon_id = Column(
        UUID(as_uuid=True),
        ForeignKey("coupons.id", ondelete="CASCADE"),
        nullable=False,
    )
    customer_id = Column(
        UUID(as_uuid=True),
        ForeignKey("customers.id", ondelete="CASCADE"),
        nullable=False,
    )
    order_id = Column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Relationships
    coupon = relationship("Coupon", back_populates="redemptions")
    customer = relationship("Customer")
    order = relationship("Order")

    def __repr__(self):
        return f"<CouponRedemption(coupon_id='{self.coupon_id}', customer_id='{self.customer_id}')>"
