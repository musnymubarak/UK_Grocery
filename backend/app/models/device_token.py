"""
Customer device push tokens model for Firebase Cloud Messaging (FCM).
"""
from sqlalchemy import Column, String, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base, TimestampMixin

class CustomerDeviceToken(TimestampMixin, Base):
    __tablename__ = "customer_device_tokens"

    customer_id = Column(
        UUID(as_uuid=True),
        ForeignKey("customers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    fcm_token = Column(String(512), nullable=False, unique=True, index=True)
    platform = Column(String(20), nullable=False, default="android")  # android, ios, web
    device_id = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    def __repr__(self):
        return f"<CustomerDeviceToken(customer={self.customer_id}, platform={self.platform}, active={self.is_active})>"
