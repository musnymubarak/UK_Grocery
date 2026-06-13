from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID
from typing import Optional
from datetime import datetime
from decimal import Decimal


class SupplierBase(BaseModel):
    name: str
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    payment_terms: Optional[str] = None
    lead_time_days: Optional[int] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = True


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    payment_terms: Optional[str] = None
    lead_time_days: Optional[int] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class SupplierResponse(SupplierBase):
    id: UUID
    organization_id: UUID
    outstanding: Decimal = Decimal("0.00")
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class SupplierSummary(BaseModel):
    supplier_id: UUID
    total_orders: int
    total_billed: Decimal
    total_paid: Decimal
    outstanding: Decimal


class SupplierPaymentCreate(BaseModel):
    amount: Decimal = Field(..., gt=0)
    purchase_order_id: Optional[UUID] = None
    method: Optional[str] = None
    reference: Optional[str] = None
    notes: Optional[str] = None
    payment_date: Optional[datetime] = None


class SupplierPaymentResponse(BaseModel):
    id: UUID
    supplier_id: UUID
    purchase_order_id: Optional[UUID] = None
    amount: Decimal
    payment_date: datetime
    method: Optional[str] = None
    reference: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
