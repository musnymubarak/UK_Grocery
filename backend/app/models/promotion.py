"""
Promotion model — product-level deals like Buy X Get Y.
"""
from sqlalchemy import Column, String, ForeignKey, Boolean, Integer, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base, TimestampMixin

class Promotion(TimestampMixin, Base):
    __tablename__ = "promotions"

    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    store_id = Column(
        UUID(as_uuid=True),
        ForeignKey("stores.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    ) # null means applicable to all stores in the org
    
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    promotion_type = Column(String(50), nullable=False) # buy_x_get_y, quantity_discount, bundle_price
    
    # Configuration varies by type:
    # buy_x_get_y: {"buy_product_id": UUID, "buy_qty": int, "get_qty": int, "discount_pct": float}
    # quantity_discount: {"product_id": UUID, "min_qty": int, "discount_pct": float}
    config = Column(JSONB, nullable=False)
    
    starts_at = Column(DateTime(timezone=True), nullable=True)
    ends_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    def __repr__(self):
        return f"<Promotion(name='{self.name}', type='{self.promotion_type}')>"
