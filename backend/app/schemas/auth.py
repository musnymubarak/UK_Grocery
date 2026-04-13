"""
Pydantic schemas for authentication and user management.
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field
from decimal import Decimal


# --- Auth ---
class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


# --- User ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=1, max_length=255)
    role: str = Field(default="cashier", pattern="^(admin|manager|cashier)$")
    phone: Optional[str] = None
    store_id: Optional[UUID] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    role: Optional[str] = Field(None, pattern="^(admin|manager|cashier)$")
    phone: Optional[str] = None
    store_id: Optional[UUID] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: str
    phone: Optional[str] = None
    organization_id: UUID
    store_id: Optional[UUID] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Organization ---
class OrganizationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=100, pattern="^[a-z0-9-]+$")
    description: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None


class OrganizationResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    description: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Store ---
class StoreCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    code: str = Field(..., min_length=1, max_length=50)
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None

    # shop.md extensions
    slug: Optional[str] = None
    store_type: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    lat: Optional[Decimal] = None
    lng: Optional[Decimal] = None
    opening_hours: Optional[dict] = None
    default_delivery_fee: Decimal = Decimal("1.99")
    free_delivery_threshold: Decimal = Decimal("30.00")
    min_order_value: Decimal = Decimal("10.00")
    avg_prep_time_min: int = 15
    is_open: bool = True


class StoreUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None

    # shop.md extensions
    slug: Optional[str] = None
    store_type: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    lat: Optional[Decimal] = None
    lng: Optional[Decimal] = None
    opening_hours: Optional[dict] = None
    default_delivery_fee: Optional[Decimal] = None
    free_delivery_threshold: Optional[Decimal] = None
    min_order_value: Optional[Decimal] = None
    avg_prep_time_min: Optional[int] = None
    is_open: Optional[bool] = None
    temporarily_closed_reason: Optional[str] = None


class StoreResponse(BaseModel):
    id: UUID
    organization_id: UUID
    name: str
    code: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: bool
    created_at: datetime

    # shop.md extensions
    slug: Optional[str] = None
    store_type: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    lat: Optional[Decimal] = None
    lng: Optional[Decimal] = None
    opening_hours: Optional[dict] = None
    default_delivery_fee: Decimal
    free_delivery_threshold: Decimal
    min_order_value: Decimal
    avg_prep_time_min: int
    is_open: bool
    temporarily_closed_reason: Optional[str] = None

    model_config = {"from_attributes": True}


# Resolve forward reference
TokenResponse.model_rebuild()
