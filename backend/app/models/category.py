"""
Category model — product categories with hierarchical support.
"""
from sqlalchemy import Column, String, Text, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base, TimestampMixin


class Category(TimestampMixin, Base):
    __tablename__ = "categories"

    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    parent_id = Column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
    )
    sort_order = Column(Integer, default=0, nullable=False)

    # Relationships
    organization = relationship("Organization", back_populates="categories")
    parent = relationship("Category", remote_side="Category.id", backref="children")
    products = relationship("Product", back_populates="category", lazy="selectin")

    def __repr__(self):
        return f"<Category(id={self.id}, name='{self.name}')>"
