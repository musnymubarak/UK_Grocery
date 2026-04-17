from uuid import UUID
from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.core.dependencies import get_current_user, require_role, get_store_scope, enforce_store_access
from app.models.user import User
from app.schemas.delivery_zone import DeliveryZoneCreate, DeliveryZoneResponse, DeliveryZoneUpdate, FeeCalculationRequest, FeeCalculationResponse
from app.services.delivery import DeliveryZoneService

router = APIRouter(prefix="", tags=["Delivery Zones"])

@router.get("/delivery-zones", response_model=List[DeliveryZoneResponse])
async def list_zones(
    store_id: UUID,
    store_scope: Optional[UUID] = Depends(get_store_scope),
    current_user: User = Depends(require_role(["admin", "manager"])),
    db: AsyncSession = Depends(get_async_session)
):
    if store_scope:
        enforce_store_access(store_id, store_scope)
    return await DeliveryZoneService.get_zones(db, store_id)

@router.post("/delivery-zones", response_model=DeliveryZoneResponse)
async def create_zone(
    store_id: UUID,
    data: DeliveryZoneCreate,
    store_scope: Optional[UUID] = Depends(get_store_scope),
    current_user: User = Depends(require_role(["admin", "manager"])),
    db: AsyncSession = Depends(get_async_session)
):
    if store_scope:
        enforce_store_access(store_id, store_scope)
    return await DeliveryZoneService.create_zone(db, store_id, data)

@router.post("/delivery/calculate-fee", response_model=FeeCalculationResponse)
async def calculate_fee(
    data: FeeCalculationRequest,
    db: AsyncSession = Depends(get_async_session)
):
    # This route is public for the B2C shop
    return await DeliveryZoneService.calculate_fee(db, data)
