"""Notification API — customer inbox endpoints + admin compose/broadcast."""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime

from app.core.database import get_async_session
from app.core.dependencies import get_current_customer, get_org_context, require_role
from app.core.exceptions import NotFoundException
from app.models.customer import Customer
from app.models.user import User
from app.services.notification import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications"])

class NotificationResponse(BaseModel):
    id: UUID
    title: str
    body: str
    notification_type: str
    reference_id: Optional[UUID] = None
    is_read: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

@router.get("/me", response_model=List[NotificationResponse])
async def get_my_notifications(
    unread_only: bool = Query(False),
    skip: int = 0, limit: int = 30,
    current_customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_async_session)
):
    service = NotificationService(db)
    return await service.get_inbox(current_customer.id, unread_only, skip, limit)

@router.get("/me/count")
async def get_unread_count(
    current_customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_async_session)
):
    service = NotificationService(db)
    count = await service.get_unread_count(current_customer.id)
    return {"unread_count": count}

@router.post("/me/{notification_id}/read")
async def mark_notification_read(
    notification_id: UUID,
    current_customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_async_session)
):
    service = NotificationService(db)
    await service.mark_as_read(notification_id, current_customer.id)
    return {"status": "ok"}

@router.post("/me/read-all")
async def mark_all_read(
    current_customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_async_session)
):
    service = NotificationService(db)
    count = await service.mark_all_read(current_customer.id)
    return {"marked_read": count}


# ====================
# ADMIN: send / broadcast / audit
# (must come AFTER all /me literals so FastAPI matches them first)
# ====================
class AdminSendNotification(BaseModel):
    customer_id: UUID
    title: str = Field(..., min_length=1, max_length=255)
    body: str = Field(..., min_length=1)
    notification_type: str = Field(default="promo", pattern="^(order_update|promo|reward|refund|system)$")
    reference_id: Optional[UUID] = None


class AdminBroadcast(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    body: str = Field(..., min_length=1)
    notification_type: str = Field(default="promo", pattern="^(order_update|promo|reward|refund|system)$")
    active_only: bool = True


@router.post("/send")
async def admin_send_notification(
    data: AdminSendNotification,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(["admin", "manager"])),
    db: AsyncSession = Depends(get_async_session),
):
    """Send a notification to one customer."""
    customer = await db.get(Customer, data.customer_id)
    if not customer or customer.organization_id != org_id:
        raise NotFoundException("Customer not found")
    service = NotificationService(db)
    notif = await service.send(
        customer_id=data.customer_id,
        title=data.title,
        body=data.body,
        notification_type=data.notification_type,
        reference_id=data.reference_id,
    )
    return {"id": notif.id, "status": "sent"}


@router.post("/broadcast")
async def admin_broadcast(
    data: AdminBroadcast,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(["admin", "manager"])),
    db: AsyncSession = Depends(get_async_session),
):
    """Send the same notification to every customer in the org."""
    service = NotificationService(db)
    count = await service.broadcast_to_org(
        org_id=org_id,
        title=data.title,
        body=data.body,
        notification_type=data.notification_type,
        active_only=data.active_only,
    )
    return {"recipients": count}


@router.get("/recent")
async def admin_list_recent(
    limit: int = Query(50, ge=1, le=200),
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(["admin", "manager"])),
    db: AsyncSession = Depends(get_async_session),
):
    """Recent notifications across all customers in the org (admin audit view)."""
    service = NotificationService(db)
    return await service.list_recent(org_id=org_id, limit=limit)
