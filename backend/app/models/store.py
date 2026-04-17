"""
Store model — physical retail locations within an organization.
"""
from sqlalchemy import Column, String, Text, Boolean, ForeignKey, Numeric, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
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

    # shop.md extensions
    slug = Column(String(100), unique=True, nullable=True, index=True)
    store_type = Column(String(50), nullable=True)  # Nisa, SPAR, Independent
    description = Column(Text, nullable=True)
    logo_url = Column(String(500), nullable=True)
    banner_url = Column(String(500), nullable=True)
    lat = Column(Numeric(10, 7), nullable=True)
    lng = Column(Numeric(10, 7), nullable=True)
    opening_hours = Column(JSONB, nullable=True)
    default_delivery_fee = Column(Numeric(10, 2), default=1.99, nullable=False)
    free_delivery_threshold = Column(Numeric(10, 2), default=30.00, nullable=False)
    min_order_value = Column(Numeric(10, 2), default=10.00, nullable=False)
    avg_prep_time_min = Column(Integer, default=15, nullable=False)
    is_open = Column(Boolean, default=True, nullable=False)
    temporarily_closed_reason = Column(Text, nullable=True)
    
    # Surge pricing
    surge_multiplier = Column(Numeric(4, 2), default=1.00, nullable=True)
    is_surge_active = Column(Boolean, default=False, nullable=True)

    # Relationships
    organization = relationship("Organization", back_populates="stores")
    users = relationship("User", back_populates="store", lazy="raise")
    inventory = relationship("Inventory", back_populates="store", lazy="raise")
    orders = relationship("Order", back_populates="store", lazy="raise")
    outgoing_movements = relationship(
        "StockMovement",
        back_populates="store",
        foreign_keys="StockMovement.store_id",
        lazy="raise",
    )
    incoming_movements = relationship(
        "StockMovement",
        back_populates="from_store",
        foreign_keys="StockMovement.from_store_id",
        lazy="raise",
    )

    delivery_zones = relationship("DeliveryZone", back_populates="store", lazy="raise")

    def __repr__(self):
        return f"<Store(id={self.id}, name='{self.name}')>"
