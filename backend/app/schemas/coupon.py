from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from decimal import Decimal

# Base model with shared fields
class CouponBase(BaseModel):
    code: str = Field(..., max_length=50, description="Unique promo code")
    discount_type: str = Field(..., description="flat_discount, percentage_discount, free_delivery")
    discount_value: Decimal = Field(..., ge=0, description="Amount or Percentage")
    minimum_order_value: Optional[Decimal] = Field(None, ge=0)
    max_redemptions: Optional[int] = Field(None, ge=1)
    max_per_customer: int = Field(1, ge=1)
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    applicable_store_ids: Optional[List[str]] = None
    applicable_category_ids: Optional[List[str]] = None
    is_first_order_only: bool = False
    is_combinable: bool = False
    issued_to_customer_id: Optional[UUID] = None
    source: str = "manual"
    is_active: bool = True

class CouponCreate(CouponBase):
    pass

class CouponUpdate(BaseModel):
    discount_value: Optional[Decimal] = None
    minimum_order_value: Optional[Decimal] = None
    max_redemptions: Optional[int] = None
    max_per_customer: Optional[int] = None
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    applicable_store_ids: Optional[List[str]] = None
    applicable_category_ids: Optional[List[str]] = None
    is_first_order_only: Optional[bool] = None
    is_combinable: Optional[bool] = None
    is_active: Optional[bool] = None

class CouponResponse(CouponBase):
    id: UUID
    organization_id: UUID
    current_redemptions: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CouponValidateRequest(BaseModel):
    code: str
    store_id: UUID
    subtotal: Decimal
    delivery_fee: Decimal

class CouponValidateResponse(BaseModel):
    valid: bool
    coupon_id: Optional[UUID] = None
    discount_amount: Decimal = Decimal("0.00")
    discount_type: Optional[str] = None
    message: Optional[str] = None
