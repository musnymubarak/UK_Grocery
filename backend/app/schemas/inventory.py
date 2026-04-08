"""
Pydantic schemas for inventory and stock movements.
"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field


# --- Inventory ---
class InventoryResponse(BaseModel):
    id: UUID
    product_id: UUID
    store_id: UUID
    quantity: int
    reserved_quantity: int
    available_quantity: int
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class StockAdjustment(BaseModel):
    product_id: UUID
    store_id: UUID
    quantity: int = Field(..., description="Positive to add, negative to subtract")
    reason: str = Field(..., min_length=1)
    notes: Optional[str] = None


class StockTransfer(BaseModel):
    product_id: UUID
    from_store_id: UUID
    to_store_id: UUID
    quantity: int = Field(..., gt=0)
    notes: Optional[str] = None


class PurchaseEntry(BaseModel):
    product_id: UUID
    store_id: UUID
    quantity: int = Field(..., gt=0)
    reference: Optional[str] = None
    notes: Optional[str] = None


# --- Stock Movement ---
class StockMovementResponse(BaseModel):
    id: UUID
    product_id: UUID
    store_id: UUID
    from_store_id: Optional[UUID] = None
    quantity: int
    movement_type: str
    reference: Optional[str] = None
    notes: Optional[str] = None
    performed_by: Optional[UUID] = None
    created_at: datetime

    model_config = {"from_attributes": True}
