from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from decimal import Decimal

class RewardsTierCreate(BaseModel):
    name: str
    threshold_amount: Decimal
    reward_type: str
    reward_value: Decimal
    expiry_days: int = 30
    store_id: Optional[UUID] = None

class RewardsTierUpdate(BaseModel):
    name: Optional[str] = None
    threshold_amount: Optional[Decimal] = None
    reward_type: Optional[str] = None
    reward_value: Optional[Decimal] = None
    expiry_days: Optional[int] = None

class RewardsTierResponse(BaseModel):
    id: UUID
    organization_id: UUID
    name: str
    threshold_amount: Decimal
    reward_type: str
    reward_value: Decimal
    expiry_days: int
    store_id: Optional[UUID] = None

    model_config = ConfigDict(from_attributes=True)


class CustomerMonthlySpendResponse(BaseModel):
    id: UUID
    customer_id: UUID
    store_id: UUID
    year_month: str
    spend_amount: Decimal

    model_config = ConfigDict(from_attributes=True)


class RewardEventResponse(BaseModel):
    id: UUID
    customer_id: UUID
    store_id: Optional[UUID] = None
    tier_id: UUID
    coupon_id: Optional[UUID] = None
    created_at: datetime
    
    tier: Optional[RewardsTierResponse] = None

    model_config = ConfigDict(from_attributes=True)
