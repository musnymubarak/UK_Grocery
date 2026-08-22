"""
Drivers API — availability management + admin onboarding.
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr, Field

from app.core.database import get_async_session
from app.core.dependencies import get_current_user, require_role, get_org_context, get_store_scope
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
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(["admin", "manager"])),
    store_scope: Optional[UUID] = Depends(get_store_scope),
    db: AsyncSession = Depends(get_async_session)
):
    """Admin/manager lists online and available drivers. A manager only ever sees their own store."""
    effective_store_id = store_scope if store_scope is not None else store_id
    service = DriverService(db)
    return await service.get_available_drivers(org_id, effective_store_id)


@router.get("")
async def list_drivers(
    store_id: Optional[UUID] = Query(None, description="Optional filter to a specific store"),
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(["admin", "manager"])),
    store_scope: Optional[UUID] = Depends(get_store_scope),
    db: AsyncSession = Depends(get_async_session)
):
    """Admin lists ALL delivery drivers in the organization; a manager only sees their own store's."""
    effective_store_id = store_scope if store_scope is not None else store_id
    service = DriverService(db)
    return await service.list_drivers(org_id=org_id, store_id=effective_store_id)


@router.post("")
async def create_driver(
    data: DriverCreate,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(["admin", "manager"])),
    store_scope: Optional[UUID] = Depends(get_store_scope),
    db: AsyncSession = Depends(get_async_session)
):
    """Admin/manager creates a new delivery driver. A manager can only create one for their own store."""
    effective_store_id = store_scope if store_scope is not None else data.store_id
    service = DriverService(db)
    return await service.create_driver(
        org_id=org_id,
        email=str(data.email),
        password=data.password,
        full_name=data.full_name,
        phone=data.phone,
        store_id=effective_store_id,
        vehicle_type=data.vehicle_type,
    )


@router.put("/{driver_id}")
async def update_driver(
    driver_id: UUID,
    data: DriverUpdate,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(["admin", "manager"])),
    store_scope: Optional[UUID] = Depends(get_store_scope),
    db: AsyncSession = Depends(get_async_session)
):
    """Admin edits a driver's name, phone, store, vehicle, or active flag.
    A manager may only edit drivers already in their own store, and cannot move one to another store."""
    service = DriverService(db)
    return await service.update_driver(
        org_id=org_id,
        user_id=driver_id,
        full_name=data.full_name,
        phone=data.phone,
        store_id=data.store_id,
        vehicle_type=data.vehicle_type,
        is_active=data.is_active,
        store_scope=store_scope,
    )
