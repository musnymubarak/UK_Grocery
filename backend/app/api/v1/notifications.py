"""Notification API — customer inbox endpoints."""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

from app.core.database import get_async_session
from app.core.dependencies import get_current_customer
from app.models.customer import Customer
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
