"""
Webhook models for outbound event integration, plus inbound Stripe event tracking.
"""
from sqlalchemy import Column, String, Boolean, Text, Integer, ForeignKey, DateTime, text
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from app.core.database import Base, TimestampMixin

class WebhookEndpoint(TimestampMixin, Base):
    __tablename__ = "webhook_endpoints"

    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
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

    endpoint_id = Column(
        UUID(as_uuid=True),
        ForeignKey("webhook_endpoints.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    event_type = Column(String(100), nullable=False)
    payload = Column(Text, nullable=False) # JSON string
    
    response_status = Column(Integer, nullable=True)
    response_body = Column(Text, nullable=True)
    attempts = Column(Integer, default=1, nullable=False)
    delivered = Column(Boolean, default=False, nullable=False)


class StripeWebhookEvent(Base):
    """Records every processed inbound Stripe event ID, so a redelivered event
    (Stripe retries on timeout/network failure) is recognized and skipped
    instead of reprocessed. Deliberately doesn't use TimestampMixin: the
    primary key is Stripe's own event id (already globally unique, not a
    generated UUID), and this is an append-only dedup log, not a
    soft-deletable business entity.
    """
    __tablename__ = "stripe_webhook_events"

    id = Column(String(255), primary_key=True)  # Stripe's event id, e.g. "evt_..."
    event_type = Column(String(100), nullable=False)
    received_at = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
