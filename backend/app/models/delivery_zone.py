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
    store = relationship("Store")

    def __repr__(self):
        return f"<DeliveryZone(id={self.id}, name='{self.name}')>"

class PostcodeZoneMapping(TimestampMixin, Base):
    __tablename__ = "postcode_zone_mappings"

    postcode = Column(String(20), nullable=False, primary_key=True, index=True)
    zone_id = Column(
        UUID(as_uuid=True),
        ForeignKey("delivery_zones.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Actually postcode map doesn't inherit TimestampMixin if it doesn't need to but we have it. Let's provide a dummy ID or just use postcode as primary key.
    # Base expects 'id' column if it's the custom Base from app.core.database. 
    # Let's check how Base is defined, if it has 'id'. If it has 'id', we override it or let it be. Let's just follow the timestamp mixin style.
    
    # We will override the id behavior if needed by adding id Column, or just let TimestampMixin provide id.
    # It's better to add id UUID explicitly if we are using the Base which might add it automatically if it's not defined explicitly.
    # Oh wait, we used primary_key=True on `postcode`. If Base adds `id`, SQLAlchemy will complain about two primary keys.
    # Let me just provide id to be safe.
    id = Column(UUID(as_uuid=True), primary_key=True, default=__import__("uuid").uuid4)

    zone = relationship("DeliveryZone")

    def __repr__(self):
        return f"<PostcodeZoneMapping(postcode='{self.postcode}', zone_id='{self.zone_id}')>"
