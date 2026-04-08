"""
Product model — SKU-based products with pricing and barcode support.
"""
from sqlalchemy import Column, String, Text, Numeric, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base, TimestampMixin


class Product(TimestampMixin, Base):
    __tablename__ = "products"

    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category_id = Column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    sku = Column(String(100), unique=True, nullable=False, index=True)
    barcode = Column(String(100), unique=True, nullable=True, index=True)
    qr_code_data = Column(String(500), nullable=True)
    cost_price = Column(Numeric(12, 2), nullable=False, default=0)
    selling_price = Column(Numeric(12, 2), nullable=False, default=0)
    tax_rate = Column(Numeric(5, 2), nullable=False, default=0)  # percentage
    unit = Column(String(50), default="pcs", nullable=False)
    low_stock_threshold = Column(Integer, default=10, nullable=False)
    image_url = Column(String(500), nullable=True)

    # Relationships
    organization = relationship("Organization", back_populates="products")
    category = relationship("Category", back_populates="products")
    inventory = relationship("Inventory", back_populates="product", lazy="selectin")
    order_items = relationship("OrderItem", back_populates="product", lazy="selectin")
    stock_movements = relationship("StockMovement", back_populates="product", lazy="selectin")

    def __repr__(self):
        return f"<Product(id={self.id}, sku='{self.sku}', name='{self.name}')>"
