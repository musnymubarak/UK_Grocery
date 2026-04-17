"""
Webhooks API — register and manage outbound event subscriptions.
"""
import secrets
from typing import List, Optional, Any
from uuid import UUID
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.core.database import get_async_session
from app.core.dependencies import get_org_context, require_role
from app.models.webhook import WebhookEndpoint, WebhookDelivery
from app.models.user import User

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
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_async_session)
):
    """Register a new webhook endpoint."""
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
    current_user: User = Depends(require_role(["admin"])),
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

@router.get("/{webhook_id}/deliveries", response_model=List[dict])
async def get_webhook_deliveries(
    webhook_id: UUID,
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_async_session)
):
    """View recent delivery logs for a specific webhook."""
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
