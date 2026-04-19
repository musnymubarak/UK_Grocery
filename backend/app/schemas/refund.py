from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

class RefundItemRequest(BaseModel):
    order_item_id: UUID
    quantity: Decimal
    reason: str = Field(..., min_length=5, max_length=500)

class RefundRequest(BaseModel):
    order_id: UUID
    items: List[RefundItemRequest]
    destination: str = "wallet"

class RefundProcessItemRequest(BaseModel):
    status: str = Field(..., pattern="^(approved|rejected)$")
    admin_notes: Optional[str] = None

class RefundItemResponse(BaseModel):
    id: UUID
    refund_id: UUID
    order_item_id: UUID
    reason: str
    quantity: Decimal
    amount: Decimal
    status: str
    admin_notes: Optional[str] = None
    requires_manual_review: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class RefundResponse(BaseModel):
    id: UUID
    order_id: UUID
    customer_id: UUID
    total_amount: Decimal
    destination: str
    status: str
    admin_notes: Optional[str] = None
    processed_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    items: List[RefundItemResponse] = []

    model_config = ConfigDict(from_attributes=True)

class PaginatedRefundResponse(BaseModel):
    items: List[RefundResponse]
    total: int
    page: int
    size: int
