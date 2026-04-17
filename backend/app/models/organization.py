"""
Organization model — top-level tenant in multi-tenant SaaS.
"""
from sqlalchemy import Column, String, Text, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base, TimestampMixin


class Organization(TimestampMixin, Base):
    __tablename__ = "organizations"

    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    settings = Column(JSON, default=dict, nullable=False)
    logo_url = Column(String(500), nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)

    # Relationships
    stores = relationship("Store", back_populates="organization", lazy="raise")
    users = relationship("User", back_populates="organization", lazy="raise")
    products = relationship("Product", back_populates="organization", lazy="raise")
    categories = relationship("Category", back_populates="organization", lazy="raise")

    def __repr__(self):
        return f"<Organization(id={self.id}, name='{self.name}')>"
