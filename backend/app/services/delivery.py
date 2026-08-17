from uuid import UUID
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from decimal import Decimal

import logging

from app.models.delivery_zone import DeliveryZone, PostcodeZoneMapping
from app.schemas.delivery_zone import DeliveryZoneCreate, DeliveryZoneUpdate, FeeCalculationRequest, FeeCalculationResponse
from app.core.exceptions import NotFoundException, ValidationException

logger = logging.getLogger(__name__)

class DeliveryZoneService:
    @staticmethod
    async def _verify_store_in_org(db: AsyncSession, store_id: UUID, org_id: Optional[UUID]):
        """Every zone-CRUD method below trusted a client-supplied store_id with
        no check that it belongs to the caller's own organization — fine for
        managers/cashiers (already store-scoped elsewhere) but a real gap for
        admins, who have no equivalent check at all. Skipped when org_id is
        None, which only happens on the public read-only fee-calculation path
        (calculate_fee below), which has no auth context to check against."""
        if org_id is None:
            return
        from app.models.store import Store
        store = await db.get(Store, store_id)
        if not store or store.organization_id != org_id:
            raise NotFoundException("Store", store_id)

    @staticmethod
    async def create_zone(db: AsyncSession, store_id: UUID, data: DeliveryZoneCreate, org_id: Optional[UUID] = None) -> DeliveryZone:
        await DeliveryZoneService._verify_store_in_org(db, store_id, org_id)
        zone = DeliveryZone(
            store_id=store_id,
            name=data.name,
            base_fee=data.base_fee,
            per_km_fee=data.per_km_fee,
            min_order_for_free_delivery=data.min_order_for_free_delivery,
            is_active=data.is_active,
            postcode_patterns=data.postcode_patterns
        )
        db.add(zone)
        await db.flush()

        # Update mappings
        for pattern in data.postcode_patterns:
            mapping = PostcodeZoneMapping(postcode=pattern, zone_id=zone.id)
            db.add(mapping)
        
        await db.flush()
        await db.refresh(zone)
        return zone

    @staticmethod
    async def get_zones(db: AsyncSession, store_id: UUID, org_id: Optional[UUID] = None) -> List[DeliveryZone]:
        await DeliveryZoneService._verify_store_in_org(db, store_id, org_id)
        query = select(DeliveryZone).where(
            DeliveryZone.store_id == store_id,
            DeliveryZone.is_deleted == False,
        )
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def update_zone(db: AsyncSession, zone_id: UUID, data: DeliveryZoneUpdate, org_id: Optional[UUID] = None) -> DeliveryZone:
        zone = await db.get(DeliveryZone, zone_id)
        if not zone or zone.is_deleted:
            raise NotFoundException("DeliveryZone", zone_id)
        await DeliveryZoneService._verify_store_in_org(db, zone.store_id, org_id)
        upd = data.model_dump(exclude_unset=True)
        patterns = upd.pop("postcode_patterns", None)
        for k, v in upd.items():
            setattr(zone, k, v)
        if patterns is not None:
            zone.postcode_patterns = patterns
            existing = await db.execute(select(PostcodeZoneMapping).where(PostcodeZoneMapping.zone_id == zone.id))
            for m in existing.scalars().all():
                await db.delete(m)
            await db.flush()
            for p in patterns:
                db.add(PostcodeZoneMapping(postcode=p, zone_id=zone.id))
        await db.flush()
        await db.refresh(zone)
        return zone

    @staticmethod
    async def delete_zone(db: AsyncSession, zone_id: UUID, org_id: Optional[UUID] = None) -> DeliveryZone:
        zone = await db.get(DeliveryZone, zone_id)
        if not zone or zone.is_deleted:
            raise NotFoundException("DeliveryZone", zone_id)
        await DeliveryZoneService._verify_store_in_org(db, zone.store_id, org_id)
        zone.is_deleted = True
        zone.is_active = False
        existing = await db.execute(select(PostcodeZoneMapping).where(PostcodeZoneMapping.zone_id == zone.id))
        for m in existing.scalars().all():
            await db.delete(m)
        await db.flush()
        return zone

    @staticmethod
    async def calculate_fee(db: AsyncSession, data: FeeCalculationRequest) -> FeeCalculationResponse:
        from app.models.store import Store
        from app.services.distance import geocode_postcode, get_driving_distance_miles, get_delivery_fee, DistanceServiceUnavailable

        # Prefer distance-based calculation if store has coordinates
        store = await db.get(Store, data.store_id)
        if store and store.lat and store.lng:
            try:
                cust_lat, cust_lng = await geocode_postcode(data.postcode)
                distance = await get_driving_distance_miles(
                    float(store.lat), float(store.lng),
                    cust_lat, cust_lng
                )
                fee = get_delivery_fee(distance)

                if fee is not None:
                    # Check for free delivery threshold from store model
                    if store.free_delivery_threshold > 0 and data.order_total >= store.free_delivery_threshold:
                        fee = Decimal("0.00")

                    return FeeCalculationResponse(
                        deliverable=True,
                        fee=fee,
                        zone_name=f"Distance ({round(distance, 1)} mi)"
                    )
                else:
                    return FeeCalculationResponse(deliverable=False, fee=Decimal("0.00"), zone_name="Too far")
            except DistanceServiceUnavailable as e:
                logger.error(
                    f"Distance pricing unavailable for store {store.id}, postcode {data.postcode!r}: {e}. "
                    "Falling back to postcode/zone matching."
                )
                # Fall through to the zone-based logic below — a real calculation,
                # not a fabricated number.

        # Original Zone-based logic
        # First check explicit exact mapping mappings
        query = select(PostcodeZoneMapping).where(PostcodeZoneMapping.postcode == data.postcode)
        result = await db.execute(query)
        mapping = result.scalar_one_or_none()

        zone = None
        if mapping:
            zone = await db.get(DeliveryZone, mapping.zone_id)
            
        if not zone:
            # Check wildcard prefix matching if there was no explicit mapping
            zones = await DeliveryZoneService.get_zones(db, data.store_id)
            for z in zones:
                if not z.is_active:
                    continue
                for pattern in z.postcode_patterns:
                    if pattern == data.postcode or (pattern.endswith("*") and data.postcode.startswith(pattern[:-1])):
                        zone = z
                        break
                if zone:
                    break

        if not zone or not zone.is_active or zone.store_id != data.store_id:
            return FeeCalculationResponse(deliverable=False, fee=Decimal("0.00"))

        fee = Decimal("0.00") if data.order_total >= zone.min_order_for_free_delivery else zone.base_fee
        return FeeCalculationResponse(
            deliverable=True, 
            fee=fee,
            zone_name=zone.name
        )
