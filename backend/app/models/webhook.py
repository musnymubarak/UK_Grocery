"""
Webhook models for outbound event integration.
"""
from sqlalchemy import Column, String, Boolean, Text, Integer
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from app.core.database import Base, TimestampMixin

class WebhookEndpoint(TimestampMixin, Base):
    __tablename__ = "webhook_endpoints"

    organization_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    url = Column(String(500), nullable=False)
    secret = Column(String(255), nullable=False)  # For HMAC-SHA256 signing
    
    # Events to subscribe to: ["order.placed", "order.delivered", etc.]
    events = Column(ARRAY(String), default=list, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    description = Column(Text, nullable=True)

    def __repr__(self):
        return f"<WebhookEndpoint(url='{self.url}', active={self.is_active})>"

class WebhookDelivery(TimestampMixin, Base):
    __tablename__ = "webhook_deliveries"

    endpoint_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    event_type = Column(String(100), nullable=False)
    payload = Column(Text, nullable=False) # JSON string
    
    response_status = Column(Integer, nullable=True)
    response_body = Column(Text, nullable=True)
    attempts = Column(Integer, default=1, nullable=False)
    delivered = Column(Boolean, default=False, nullable=False)
