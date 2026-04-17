"""
Webhook service — dispatch events to registered endpoints.
"""
import hmac
import hashlib
import json
import logging
from uuid import UUID
from typing import Any, Dict, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.webhook import WebhookEndpoint

logger = logging.getLogger(__name__)

class WebhookService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_endpoints(self, org_id: UUID, event_type: str) -> List[WebhookEndpoint]:
        """Get active endpoints subscribed to a specific event."""
        query = select(WebhookEndpoint).where(
            WebhookEndpoint.organization_id == org_id,
            WebhookEndpoint.is_active == True,
            WebhookEndpoint.events.any(event_type)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def dispatch(self, org_id: UUID, event_type: str, payload: Dict[str, Any]):
        """Dispatch an event asynchronously via Celery."""
        endpoints = await self.get_endpoints(org_id, event_type)
        if not endpoints:
            return

        from app.tasks.webhooks import send_webhook_event
        
        for endpoint in endpoints:
            send_webhook_event.delay(
                str(endpoint.id),
                endpoint.url,
                endpoint.secret,
                event_type,
                payload
            )

    @staticmethod
    def sign_payload(payload_str: str, secret: str) -> str:
        """Create a HMAC-SHA256 signature for the payload."""
        return hmac.new(
            secret.encode(),
            payload_str.encode(),
            hashlib.sha256
        ).hexdigest()
