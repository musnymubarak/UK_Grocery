from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List, Optional

from app.core.database import get_async_session
from app.core.dependencies import get_current_user, require_role, get_store_scope, enforce_store_access
from app.models.user import User
from app.models.store import Store
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

@router.post("/delivery/calculate-distance-fee")
async def calculate_distance_fee(
    store_id: UUID,
    postcode: str,
    db: AsyncSession = Depends(get_async_session),
):
    """Public endpoint: calculate delivery fee based on distance."""
    result = await db.execute(select(Store).where(Store.id == store_id))
    store = result.scalar_one_or_none()
    
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
        
    if not store.lat or not store.lng:
        # Fallback if store coords are missing
        return {
            "deliverable": True,
            "distance_miles": 2.0,
            "delivery_fee": 2.99,
            "message": "Store coordinates not set, using default fee."
        }
    
    from app.services.distance import geocode_postcode, get_driving_distance_miles, get_delivery_fee
    
    try:
        cust_lat, cust_lng = await geocode_postcode(postcode)
        distance = await get_driving_distance_miles(
            float(store.lat), float(store.lng),
            cust_lat, cust_lng
        )
        fee = get_delivery_fee(distance)
        
        return {
            "deliverable": fee is not None,
            "distance_miles": round(distance, 2),
            "delivery_fee": float(fee) if fee else 0,
            "message": None if fee else f"Sorry, delivery is not available beyond 5 miles. Distance: {round(distance, 2)} mi"
        }
    except Exception as e:
        return {
            "deliverable": True,
            "distance_miles": 0,
            "delivery_fee": 1.99,
            "message": "Could not calculate exact distance, using base fee."
        }
