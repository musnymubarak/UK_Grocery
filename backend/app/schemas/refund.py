from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

class RefundRequest(BaseModel):
    order_id: UUID
    reason: str = Field(..., min_length=10, max_length=1000)

class RefundProcessRequest(BaseModel):
    status: str = Field(..., pattern="^(approved|rejected)$")
    admin_notes: Optional[str] = None

class RefundResponse(BaseModel):
    id: UUID
    order_id: UUID
    customer_id: UUID
    amount: Decimal
    reason: str
    status: str
    admin_notes: Optional[str] = None
    processed_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
