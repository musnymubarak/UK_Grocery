from pydantic import BaseModel, EmailStr
from uuid import UUID
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

class CustomerAddressBase(BaseModel):
    label: Optional[str] = "home"
    street: str
    city: str
    state: str
    postcode: str
    country: Optional[str] = "United Kingdom"
    lat: Optional[Decimal] = None
    lng: Optional[Decimal] = None
    is_default: Optional[bool] = False

class CustomerAddressCreate(CustomerAddressBase):
    pass

class CustomerAddressUpdate(CustomerAddressBase):
    pass

class CustomerAddressResponse(CustomerAddressBase):
    id: UUID
    customer_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CustomerBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None

class CustomerCreate(CustomerBase):
    password: str

class CustomerUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None

class CustomerResponse(CustomerBase):
    id: UUID
    organization_id: UUID
    is_active: bool
    membership_tier: str
    lifetime_value: Decimal
    discount_rate: Decimal
    created_at: datetime
    updated_at: datetime
    addresses: List[CustomerAddressResponse] = []

    class Config:
        from_attributes = True

class CustomerLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
