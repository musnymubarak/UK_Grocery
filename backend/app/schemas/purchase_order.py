from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class POItemCreate(BaseModel):
    product_id: UUID
    quantity_ordered: int = Field(..., gt=0)
    unit_cost: Optional[Decimal] = None  # defaults to product.cost_price if omitted


class POItemResponse(BaseModel):
    id: UUID
    product_id: UUID
    product_name: str
    product_sku: Optional[str] = None
    quantity_ordered: int
    quantity_received: int
    unit_cost: Decimal
    total: Decimal
    model_config = ConfigDict(from_attributes=True)


class PurchaseOrderCreate(BaseModel):
    supplier_id: UUID
    store_id: UUID
    expected_date: Optional[datetime] = None
    notes: Optional[str] = None
    items: List[POItemCreate] = Field(..., min_length=1)


class PurchaseOrderUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    expected_date: Optional[datetime] = None


class ReceiptLine(BaseModel):
    item_id: UUID
    quantity: int = Field(..., gt=0)


class ReceiveRequest(BaseModel):
    receipts: List[ReceiptLine] = Field(..., min_length=1)


class PurchaseOrderResponse(BaseModel):
    id: UUID
    organization_id: UUID
    supplier_id: UUID
    supplier_name: Optional[str] = None
    store_id: UUID
    po_number: str
    status: str
    order_date: datetime
    expected_date: Optional[datetime] = None
    notes: Optional[str] = None
    subtotal: Decimal
    total: Decimal
    amount_paid: Decimal
    items: List[POItemResponse] = []
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
