"""
Banner model — homepage promotional banners.
"""
from sqlalchemy import Column, String, ForeignKey, Text, Boolean, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base, TimestampMixin

class Banner(TimestampMixin, Base):
    __tablename__ = "banners"

    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    store_id = Column(UUID(as_uuid=True), ForeignKey("stores.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(255), nullable=False)
    subtitle = Column(String(500), nullable=True)
    image_url = Column(String(500), nullable=False)
    link_url = Column(String(500), nullable=True)  # deep link or external URL
    position = Column(Integer, default=0, nullable=False)  # display order
    is_active = Column(Boolean, default=True, nullable=False)
    starts_at = Column(DateTime(timezone=True), nullable=True)
    ends_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<Banner(title='{self.title}', active={self.is_active})>"
