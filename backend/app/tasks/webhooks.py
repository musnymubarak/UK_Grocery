"""
Celery tasks for outbound webhook delivery.
"""
import json
import logging
import httpx
import asyncio
from datetime import datetime, timezone
from app.core.celery_app import celery_app
from app.core.database import async_session_factory
from app.services.webhook import WebhookService

logger = logging.getLogger(__name__)

@celery_app.task(
    name="app.tasks.webhooks.send_webhook_event",
    bind=True,
    max_retries=3,
    default_retry_delay=60 # 1 minute
)
def send_webhook_event(self, endpoint_id: str, url: str, secret: str, event_type: str, payload: dict):
    """Sends a webhook event to a URL and records the delivery."""
    return asyncio.run(_send_webhook_event(self, endpoint_id, url, secret, event_type, payload))

async def _send_webhook_event(self, endpoint_id: str, url: str, secret: str, event_type: str, payload: dict):
    from app.models.webhook import WebhookDelivery
    
    payload_str = json.dumps(payload)
    signature = WebhookService.sign_payload(payload_str, secret)
    
    headers = {
        "Content-Type": "application/json",
        "X-Webhook-Event": event_type,
        "X-Webhook-Signature": signature,
        "User-Agent": "UK-Grocery-Webhook/1.1"
    }
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.post(url, content=payload_str, headers=headers)
            status_code = response.status_code
            resp_body = response.text[:1000] # Cap size
            delivered = 200 <= status_code < 300
        except Exception as e:
            logger.error(f"Webhook delivery failed to {url}: {str(e)}")
            status_code = 0
            resp_body = str(e)
            delivered = False

    async with async_session_factory() as db:
        delivery = WebhookDelivery(
            endpoint_id=endpoint_id,
            event_type=event_type,
            payload=payload_str,
            response_status=status_code,
            response_body=resp_body,
            delivered=delivered,
            attempts=self.request.retries + 1
        )
        db.add(delivery)
        await db.commit()

    if not delivered and self.request.retries < self.max_retries:
        raise self.retry()
