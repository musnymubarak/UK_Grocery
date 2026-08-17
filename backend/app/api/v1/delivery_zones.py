import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List, Optional

logger = logging.getLogger(__name__)

from app.core.database import get_async_session
from app.core.dependencies import get_current_user, require_role, get_org_context, get_store_scope, enforce_store_access
from app.models.user import User
from app.models.store import Store
from app.models.delivery_zone import DeliveryZone
from app.schemas.delivery_zone import DeliveryZoneCreate, DeliveryZoneResponse, DeliveryZoneUpdate, FeeCalculationRequest, FeeCalculationResponse
from app.services.delivery import DeliveryZoneService

router = APIRouter(prefix="", tags=["Delivery Zones"])

@router.get("/delivery-zones", response_model=List[DeliveryZoneResponse])
async def list_zones(
    store_id: UUID,
    org_id: UUID = Depends(get_org_context),
    store_scope: Optional[UUID] = Depends(get_store_scope),
    current_user: User = Depends(require_role(["admin", "manager"])),
    db: AsyncSession = Depends(get_async_session)
):
    if store_scope:
        enforce_store_access(store_id, store_scope)
    return await DeliveryZoneService.get_zones(db, store_id, org_id=org_id)

@router.post("/delivery-zones", response_model=DeliveryZoneResponse)
async def create_zone(
    store_id: UUID,
    data: DeliveryZoneCreate,
    org_id: UUID = Depends(get_org_context),
    store_scope: Optional[UUID] = Depends(get_store_scope),
    current_user: User = Depends(require_role(["admin", "manager"])),
    db: AsyncSession = Depends(get_async_session)
):
    if store_scope:
        enforce_store_access(store_id, store_scope)
    return await DeliveryZoneService.create_zone(db, store_id, data, org_id=org_id)

@router.put("/delivery-zones/{zone_id}", response_model=DeliveryZoneResponse)
async def update_zone(
    zone_id: UUID,
    data: DeliveryZoneUpdate,
    org_id: UUID = Depends(get_org_context),
    store_scope: Optional[UUID] = Depends(get_store_scope),
    current_user: User = Depends(require_role(["admin", "manager"])),
    db: AsyncSession = Depends(get_async_session)
):
    if store_scope:
        z = await db.get(DeliveryZone, zone_id)
        if z:
            enforce_store_access(z.store_id, store_scope)
    return await DeliveryZoneService.update_zone(db, zone_id, data, org_id=org_id)


@router.delete("/delivery-zones/{zone_id}", status_code=204)
async def delete_zone(
    zone_id: UUID,
    org_id: UUID = Depends(get_org_context),
    store_scope: Optional[UUID] = Depends(get_store_scope),
    current_user: User = Depends(require_role(["admin", "manager"])),
    db: AsyncSession = Depends(get_async_session)
):
    if store_scope:
        z = await db.get(DeliveryZone, zone_id)
        if z:
            enforce_store_access(z.store_id, store_scope)
    await DeliveryZoneService.delete_zone(db, zone_id, org_id=org_id)


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
    
    from app.services.distance import geocode_postcode, get_driving_distance_miles, get_delivery_fee, DistanceServiceUnavailable

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
    except DistanceServiceUnavailable as e:
        logger.error(
            f"Distance pricing unavailable for store {store_id}, postcode {postcode!r}: {e}. "
            "Falling back to postcode/zone matching."
        )
        from app.schemas.delivery_zone import FeeCalculationRequest
        zone_resp = await DeliveryZoneService.calculate_fee(
            db, FeeCalculationRequest(store_id=store_id, postcode=postcode, order_total=0)
        )
        return {
            "deliverable": zone_resp.deliverable,
            "distance_miles": None,
            "delivery_fee": float(zone_resp.fee),
            "message": (
                f"Estimated via delivery zone ({zone_resp.zone_name})" if zone_resp.deliverable
                else "This postcode is outside our delivery area."
            ),
        }
