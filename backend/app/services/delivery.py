from uuid import UUID
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from decimal import Decimal

from app.models.delivery_zone import DeliveryZone, PostcodeZoneMapping
from app.schemas.delivery_zone import DeliveryZoneCreate, DeliveryZoneUpdate, FeeCalculationRequest, FeeCalculationResponse
from app.core.exceptions import NotFoundException, ValidationException

class DeliveryZoneService:
    @staticmethod
    async def create_zone(db: AsyncSession, store_id: UUID, data: DeliveryZoneCreate) -> DeliveryZone:
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
        
        await db.commit()
        await db.refresh(zone)
        return zone

    @staticmethod
    async def get_zones(db: AsyncSession, store_id: UUID) -> List[DeliveryZone]:
        query = select(DeliveryZone).where(DeliveryZone.store_id == store_id)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def calculate_fee(db: AsyncSession, data: FeeCalculationRequest) -> FeeCalculationResponse:
        # First check explicit exact mapping mappings
        query = select(PostcodeZoneMapping).where(PostcodeZoneMapping.postcode == data.postcode)
        result = await db.execute(query)
        mapping = result.scalar_one_or_none()

        zone = None
        if mapping:
            zone = await db.get(DeliveryZone, mapping.zone_id)
            
        if not zone:
            # Check wildcard prefix matching if there was no explicit mapping
            # (e.g. prefix match like '400-*')
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
