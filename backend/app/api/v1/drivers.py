"""
Drivers API — availability management.
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_async_session
from app.core.dependencies import get_current_user, require_role
from app.services.driver import DriverService
from app.models.user import User

router = APIRouter(prefix="/drivers", tags=["Drivers"])

class AvailabilityUpdate(BaseModel):
    is_available: bool

@router.post("/me/availability")
async def update_my_availability(
    data: AvailabilityUpdate,
    current_user: User = Depends(require_role(["delivery_boy"])),
    db: AsyncSession = Depends(get_async_session)
):
    """Driver toggles their own availability."""
    service = DriverService(db)
    return await service.toggle_availability(current_user.id, data.is_available)

@router.get("/available")
async def list_available_drivers(
    store_id: Optional[UUID] = Query(None),
    current_user: User = Depends(require_role(["admin", "manager"])),
    db: AsyncSession = Depends(get_async_session)
):
    """Admin lists online and available drivers."""
    service = DriverService(db)
    return await service.get_available_drivers(store_id)
