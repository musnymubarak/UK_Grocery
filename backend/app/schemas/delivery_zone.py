from pydantic import BaseModel, ConfigDict
from uuid import UUID
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

class DeliveryZoneBase(BaseModel):
    name: str
    base_fee: Decimal = Decimal("0.00")
    per_km_fee: Decimal = Decimal("0.00")
    min_order_for_free_delivery: Decimal = Decimal("50.00")
    is_active: bool = True
    postcode_patterns: List[str] = []

class DeliveryZoneCreate(DeliveryZoneBase):
    pass

class DeliveryZoneUpdate(BaseModel):
    name: Optional[str] = None
    base_fee: Optional[Decimal] = None
    per_km_fee: Optional[Decimal] = None
    min_order_for_free_delivery: Optional[Decimal] = None
    is_active: Optional[bool] = None
    postcode_patterns: Optional[List[str]] = None

class DeliveryZoneResponse(DeliveryZoneBase):
    id: UUID
    store_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class FeeCalculationRequest(BaseModel):
    postcode: str
    store_id: UUID
    order_total: Decimal

class FeeCalculationResponse(BaseModel):
    deliverable: bool
    fee: Decimal
    zone_name: Optional[str] = None
