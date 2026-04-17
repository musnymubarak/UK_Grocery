"""
Delivery Zone model — for mapping postcodes to delivery fees.
"""
from sqlalchemy import Column, String, ForeignKey, Boolean, Numeric
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship

from app.core.database import Base, TimestampMixin

class DeliveryZone(TimestampMixin, Base):
    __tablename__ = "delivery_zones"

    store_id = Column(
        UUID(as_uuid=True),
        ForeignKey("stores.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = Column(String(100), nullable=False) # Zone A, Central London
    base_fee = Column(Numeric(10, 2), default=0.00, nullable=False)
    per_km_fee = Column(Numeric(10, 2), default=0.00, nullable=False)
    min_order_for_free_delivery = Column(Numeric(10, 2), default=50.00, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    postcode_patterns = Column(ARRAY(String), default=list, nullable=False)

    # Relationships
    store = relationship("Store", back_populates="delivery_zones")

    def __repr__(self):
        return f"<DeliveryZone(id={self.id}, name='{self.name}')>"

class PostcodeZoneMapping(TimestampMixin, Base):
    __tablename__ = "postcode_zone_mappings"

    # To avoid composite primary keys since postcode is already the PK, we don't
    # make id a primary key, or instead we make id the PK and just index the postcode.
    # We will make id the primary key and make postcode unique per zone instead.
    postcode = Column(String(20), nullable=False, unique=True, index=True)
    zone_id = Column(
        UUID(as_uuid=True),
        ForeignKey("delivery_zones.id", ondelete="CASCADE"),
        nullable=False,
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=__import__("uuid").uuid4)

    zone = relationship("DeliveryZone")

    def __repr__(self):
        return f"<PostcodeZoneMapping(postcode='{self.postcode}', zone_id='{self.zone_id}')>"
