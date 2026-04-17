"""
Notification model — in-app notification inbox for customers.
"""
from sqlalchemy import Column, String, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base, TimestampMixin

class Notification(TimestampMixin, Base):
    __tablename__ = "notifications"

    customer_id = Column(
        UUID(as_uuid=True),
        ForeignKey("customers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    notification_type = Column(String(50), nullable=False)  # order_update, promo, reward, refund
    reference_id = Column(UUID(as_uuid=True), nullable=True)  # order_id, coupon_id, etc.
    is_read = Column(Boolean, default=False, nullable=False)

    def __repr__(self):
        return f"<Notification(customer={self.customer_id}, type={self.notification_type})>"
