from pydantic import BaseModel, ConfigDict
from uuid import UUID
from typing import Optional, List
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
    unit_price: Decimal
    tax_amount: Decimal
    total: Decimal
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class OrderBase(BaseModel):
    customer_id: UUID
    delivery_address_id: Optional[UUID] = None
    payment_method: str = "cod"
    notes: Optional[str] = None
    delivery_instructions: Optional[str] = None

class OrderCreate(OrderBase):
    items: List[OrderItemCreate]

class OrderUpdateStatus(BaseModel):
    status: str # received, packed, on_delivery, delivered, cancelled

class OrderAssign(BaseModel):
    delivery_boy_id: UUID

class OrderResponse(OrderBase):
    id: UUID
    organization_id: UUID
    store_id: UUID
    assigned_to: Optional[UUID] = None
    order_number: str
    status: str
    subtotal: Decimal
    delivery_fee: Decimal
    discount: Decimal
    total: Decimal
    payment_status: str
    estimated_delivery_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = []

    model_config = ConfigDict(from_attributes=True)

class PaginatedOrderResponse(BaseModel):
    items: List[OrderResponse]
    total: int
    page: int
    size: int
