"""
Drivers API — availability management + admin onboarding.
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr, Field

from app.core.database import get_async_session
from app.core.dependencies import get_current_user, require_role, get_org_context
from app.services.driver import DriverService
from app.models.user import User

router = APIRouter(prefix="/drivers", tags=["Drivers"])


class AvailabilityUpdate(BaseModel):
    is_available: bool


class DriverCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=1, max_length=255)
    phone: Optional[str] = None
    store_id: Optional[UUID] = None
    vehicle_type: Optional[str] = None  # e.g. "bike", "car", "van"


class DriverUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    phone: Optional[str] = None
    store_id: Optional[UUID] = None
    vehicle_type: Optional[str] = None
    is_active: Optional[bool] = None


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


@router.get("")
async def list_drivers(
    store_id: Optional[UUID] = Query(None, description="Optional filter to a specific store"),
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(["admin", "manager"])),
    db: AsyncSession = Depends(get_async_session)
):
    """Admin lists ALL delivery drivers in the organization (active and inactive)."""
    service = DriverService(db)
    return await service.list_drivers(org_id=org_id, store_id=store_id)


@router.post("")
async def create_driver(
    data: DriverCreate,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(["admin", "manager"])),
    db: AsyncSession = Depends(get_async_session)
):
    """Admin creates a new delivery driver (user + driver profile in one transaction)."""
    service = DriverService(db)
    return await service.create_driver(
        org_id=org_id,
        email=str(data.email),
        password=data.password,
        full_name=data.full_name,
        phone=data.phone,
        store_id=data.store_id,
        vehicle_type=data.vehicle_type,
    )


@router.put("/{driver_id}")
async def update_driver(
    driver_id: UUID,
    data: DriverUpdate,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(["admin", "manager"])),
    db: AsyncSession = Depends(get_async_session)
):
    """Admin edits a driver's name, phone, store, vehicle, or active flag."""
    service = DriverService(db)
    return await service.update_driver(
        org_id=org_id,
        user_id=driver_id,
        full_name=data.full_name,
        phone=data.phone,
        store_id=data.store_id,
        vehicle_type=data.vehicle_type,
        is_active=data.is_active,
    )
