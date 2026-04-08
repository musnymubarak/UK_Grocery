"""
Store model — physical retail locations within an organization.
"""
from sqlalchemy import Column, String, Text, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base, TimestampMixin


class Store(TimestampMixin, Base):
    __tablename__ = "stores"

    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False, index=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    organization = relationship("Organization", back_populates="stores")
    users = relationship("User", back_populates="store", lazy="selectin")
    inventory = relationship("Inventory", back_populates="store", lazy="selectin")
    orders = relationship("Order", back_populates="store", lazy="selectin")
    outgoing_movements = relationship(
        "StockMovement",
        back_populates="store",
        foreign_keys="[StockMovement.store_id]",
        lazy="selectin",
    )
    incoming_movements = relationship(
        "StockMovement",
        back_populates="from_store",
        foreign_keys="[StockMovement.from_store_id]",
        lazy="selectin",
    )

    def __repr__(self):
        return f"<Store(id={self.id}, name='{self.name}')>"
