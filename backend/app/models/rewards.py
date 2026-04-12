from sqlalchemy import Column, String, ForeignKey, Numeric, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base, TimestampMixin

class RewardsTier(TimestampMixin, Base):
    __tablename__ = "rewards_tiers"

    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    name = Column(String(255), nullable=False)
    threshold_amount = Column(Numeric(10, 2), nullable=False)
    reward_type = Column(String(50), nullable=False) # 'flat_discount', 'percentage_discount', 'free_delivery'
    reward_value = Column(Numeric(10, 2), nullable=False)
    expiry_days = Column(Integer, default=30)
    
    # Store ID is optional. If null, global, else store-specific tier
    store_id = Column(UUID(as_uuid=True), ForeignKey("stores.id", ondelete="CASCADE"), nullable=True)


class CustomerMonthlySpend(TimestampMixin, Base):
    __tablename__ = "customer_monthly_spends"

    customer_id = Column(
        UUID(as_uuid=True),
        ForeignKey("customers.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    store_id = Column(
        UUID(as_uuid=True),
        ForeignKey("stores.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    year_month = Column(String(7), nullable=False, index=True) # Format: YYYY-MM
    spend_amount = Column(Numeric(10, 2), default=0.00, nullable=False)

    def __repr__(self):
        return f"<CustomerMonthlySpend(customer_id={self.customer_id}, month={self.year_month}, spend={self.spend_amount})>"


class RewardEvent(TimestampMixin, Base):
    __tablename__ = "reward_events"

    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    store_id = Column(UUID(as_uuid=True), ForeignKey("stores.id", ondelete="CASCADE"), nullable=True)
    tier_id = Column(UUID(as_uuid=True), ForeignKey("rewards_tiers.id", ondelete="CASCADE"), nullable=False)
    coupon_id = Column(UUID(as_uuid=True), ForeignKey("coupons.id", ondelete="SET NULL"), nullable=True)

    def __repr__(self):
        return f"<RewardEvent(customer_id={self.customer_id}, tier={self.tier_id})>"
