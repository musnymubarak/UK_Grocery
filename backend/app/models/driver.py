"""
Driver profile — availability and delivery stats for automated assignment.
"""
from sqlalchemy import Column, String, ForeignKey, Boolean, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base, TimestampMixin

class DriverProfile(TimestampMixin, Base):
    __tablename__ = "driver_profiles"

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True, nullable=False, index=True,
    )
    vehicle_type = Column(String(50), nullable=True)
    is_available = Column(Boolean, default=False, nullable=False)
    is_online = Column(Boolean, default=False, nullable=False)
    
    total_deliveries = Column(Integer, default=0, nullable=False)
    
    # Track current shift
    shift_start = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", backref="driver_profile")

    def __repr__(self):
        return f"<DriverProfile(user_id={self.user_id}, available={self.is_available})>"
