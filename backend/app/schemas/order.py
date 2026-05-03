from pydantic import BaseModel, ConfigDict
from uuid import UUID
from typing import Optional, List
from .customer import CustomerResponse
from datetime import datetime
from decimal import Decimal

class OrderItemBase(BaseModel):
    product_id: UUID
    quantity: Decimal

class OrderItemCreate(OrderItemBase):
    pass

class OrderItemResponse(OrderItemBase):
    id: UUID
    order_id: UUID
    product_name: str
    product_sku: Optional[str] = None
    product_image_url: Optional[str] = None
    unit_price: Decimal = Decimal("0.00")
    tax_amount: Decimal = Decimal("0.00")
    total: Decimal = Decimal("0.00")
    created_at: datetime
    updated_at: datetime
    is_substituted: bool = False
    substituted_product_id: Optional[UUID] = None

    model_config = ConfigDict(from_attributes=True)

class OrderBase(BaseModel):
    customer_id: Optional[UUID] = None
    delivery_address_id: Optional[UUID] = None
    delivery_address: Optional[str] = None
    delivery_postcode: Optional[str] = None
    order_type: str = "delivery"
    payment_method: str = "cod"
    notes: Optional[str] = None
    delivery_instructions: Optional[str] = None
    scheduled_delivery_start: Optional[datetime] = None
    scheduled_delivery_end: Optional[datetime] = None

class OrderCreate(OrderBase):
    items: List[OrderItemCreate]
    coupon_code: Optional[str] = None

class OrderUpdateStatus(BaseModel):
    status: str # placed, confirmed, picking, substitution_pending, ready_for_collection, assigned_to_driver, out_for_delivery, delivered, rejected, delivery_failed, refund_requested, refunded, cancelled

class OrderAssign(BaseModel):
    delivery_boy_id: UUID

class OrderResponse(OrderBase):
    id: UUID
    organization_id: UUID
    store_id: UUID
    assigned_to: Optional[UUID] = None
    order_number: str
    status: str
    delivery_fee: Decimal
    discount: Decimal
    promotion_discount: Decimal = Decimal("0.00")
    applied_promotions: Optional[List[dict]] = None
    total: Decimal
    payment_status: str
    estimated_delivery_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    refund_status: Optional[str] = None
    
    # shop.md extensions
    service_fee: Decimal = Decimal("0.00")
    tip_amount: Decimal = Decimal("0.00")
    coupon_code: Optional[str] = None
    confirmed_at: Optional[datetime] = None
    picked_at: Optional[datetime] = None
    dispatched_at: Optional[datetime] = None
    cancel_window_expires_at: Optional[datetime] = None
    rejected_reason: Optional[str] = None
    items: List[OrderItemResponse] = []
    customer: Optional[CustomerResponse] = None

    model_config = ConfigDict(from_attributes=True)

class SubstitutionRejection(BaseModel):
    order_item_id: UUID
    quantity: Decimal
    notes: Optional[str] = None

class PaginatedOrderResponse(BaseModel):
    items: List[OrderResponse]
    total: int
    page: int
    size: int
