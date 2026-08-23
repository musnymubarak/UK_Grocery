"""
Webhooks API — register and manage outbound event subscriptions, plus the
inbound Stripe webhook receiver (a separate concern — see stripe_webhook below).
"""
import secrets
from typing import List, Optional, Any
from uuid import UUID
import stripe
import structlog
from fastapi import APIRouter, Depends, Query, Request, status, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.database import get_async_session
from app.core.dependencies import get_org_context, require_role, require_capability
from app.core.exceptions import NotFoundException
from app.models.webhook import WebhookEndpoint, WebhookDelivery, StripeWebhookEvent
from app.models.order import Order
from app.models.user import User

log = structlog.get_logger()

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

class WebhookCreate(BaseModel):
    url: str = Field(..., pattern="^https?://")
    events: List[str] = Field(..., min_length=1)
    description: Optional[str] = None

class WebhookResponse(BaseModel):
    id: UUID
    url: str
    events: List[str]
    is_active: bool
    description: Optional[str] = None
    created_at: Any # Using Any to avoid complex datetime serialization issues in this scratch file

    class Config:
        from_attributes = True

@router.post("", response_model=dict)
async def create_webhook(
    data: WebhookCreate,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_capability("manage_settings")),
    db: AsyncSession = Depends(get_async_session)
):
    """Register a new webhook endpoint."""
    from app.core.url_safety import assert_safe_webhook_url
    await assert_safe_webhook_url(data.url)

    endpoint = WebhookEndpoint(
        organization_id=org_id,
        url=data.url,
        events=data.events,
        description=data.description,
        secret=secrets.token_hex(24) # Shared secret for signing
    )
    db.add(endpoint)
    await db.flush()
    return {
        "id": endpoint.id,
        "url": endpoint.url,
        "secret": endpoint.secret,
        "events": endpoint.events,
        "status": "created"
    }

@router.get("", response_model=List[dict])
async def list_webhooks(
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_capability("manage_settings")),
    db: AsyncSession = Depends(get_async_session)
):
    """List all registered webhooks for the organization."""
    query = select(WebhookEndpoint).where(WebhookEndpoint.organization_id == org_id)
    result = await db.execute(query)
    return [
        {
            "id": e.id,
            "url": e.url,
            "events": e.events,
            "is_active": e.is_active,
            "description": e.description
        } for e in result.scalars().all()
    ]

@router.delete("/{webhook_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_capability("manage_settings")), Depends(require_capability("delete_records"))])
async def delete_webhook(
    webhook_id: UUID,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_capability("manage_settings")),
    db: AsyncSession = Depends(get_async_session)
):
    """Disable a webhook endpoint. Sets is_active=false; delivery history is preserved."""
    endpoint = await db.get(WebhookEndpoint, webhook_id)
    if not endpoint or endpoint.organization_id != org_id:
        raise NotFoundException("Webhook", webhook_id)
    endpoint.is_active = False
    await db.flush()
    return None


@router.get("/{webhook_id}/deliveries", response_model=List[dict])
async def get_webhook_deliveries(
    webhook_id: UUID,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_capability("manage_settings")),
    db: AsyncSession = Depends(get_async_session)
):
    """View recent delivery logs for a specific webhook."""
    endpoint = await db.get(WebhookEndpoint, webhook_id)
    if not endpoint or endpoint.organization_id != org_id:
        raise NotFoundException("Webhook", webhook_id)

    query = select(WebhookDelivery).where(
        WebhookDelivery.endpoint_id == webhook_id
    ).order_by(WebhookDelivery.created_at.desc()).limit(50)

    result = await db.execute(query)
    return [
        {
            "id": d.id,
            "event_type": d.event_type,
            "response_status": d.response_status,
            "delivered": d.delivered,
            "created_at": d.created_at
        } for d in result.scalars().all()
    ]


# ============================================================================
# Inbound Stripe webhook — a payment can change state *after* checkout
# (delayed payment methods, disputes, reversals). Order creation only ever
# checks Stripe once, synchronously, at that moment — this is the only path
# that finds out about anything that happens later. Deliberately has no staff
# auth dependency: Stripe can't send a JWT. Authenticated instead via
# Stripe-Signature verification against STRIPE_WEBHOOK_SECRET, never by
# trusting the payload alone.
# ============================================================================

@router.post("/stripe", summary="Stripe webhook receiver")
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_async_session),
):
    if not settings.STRIPE_WEBHOOK_SECRET:
        log.error("stripe_webhook.not_configured")
        raise HTTPException(status_code=500, detail="Webhook receiver not configured")

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.error.SignatureVerificationError) as e:
        log.warning("stripe_webhook.rejected", error=str(e))
        raise HTTPException(status_code=400, detail="Invalid signature")

    event_id = event["id"]
    event_type = event["type"]
    data = event["data"]["object"]

    # Idempotency: insert the event id *before* acting on it. Stripe redelivers
    # events it isn't sure arrived (timeout, network blip) — relying on "does
    # this change anything" (e.g. paid->paid) only protects plain status
    # writes; a future handler that does something non-idempotent (send an
    # email, credit a wallet) needs this instead. The unique constraint on
    # StripeWebhookEvent.id is what makes this race-safe: two near-simultaneous
    # deliveries of the same event can't both pass this check.
    db.add(StripeWebhookEvent(id=event_id, event_type=event_type))
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        log.info("stripe_webhook.duplicate_event_skipped", event_id=event_id, event_type=event_type)
        return {"received": True, "duplicate": True}

    if event_type == "payment_intent.succeeded":
        await _update_order_payment_status(db, data["id"], "paid")
    elif event_type == "payment_intent.payment_failed":
        await _update_order_payment_status(db, data["id"], "failed")
    elif event_type in ("charge.dispute.created", "charge.dispute.closed"):
        # No staff actor exists for this event, so it can't go through
        # AuditService.log (that table is scoped to staff-initiated actions —
        # see OrderService.customer_cancel / order_timeout_check for the same
        # rule). structlog is the visible, searchable record instead.
        log.warning(
            "stripe_webhook.dispute",
            event_type=event_type,
            payment_intent_id=data.get("payment_intent"),
            dispute_status=data.get("status"),
        )
    else:
        log.info("stripe_webhook.unhandled_event_type", event_type=event_type)

    return {"received": True}


async def _update_order_payment_status(db: AsyncSession, payment_intent_id: str, new_status: str):
    result = await db.execute(select(Order).where(Order.stripe_payment_intent_id == payment_intent_id))
    order = result.scalar_one_or_none()
    if not order:
        log.warning("stripe_webhook.no_matching_order", payment_intent_id=payment_intent_id)
        return
    if order.payment_status == new_status:
        return  # already up to date — makes retried/duplicate events a no-op
    old_status = order.payment_status
    order.payment_status = new_status
    await db.commit()
    log.info(
        "stripe_webhook.payment_status_updated",
        order_id=str(order.id), payment_intent_id=payment_intent_id,
        old_status=old_status, new_status=new_status,
    )
