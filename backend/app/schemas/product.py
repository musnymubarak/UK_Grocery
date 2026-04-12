"""
Pydantic schemas for products and categories.
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field


# --- Category ---
class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    parent_id: Optional[UUID] = None
    sort_order: int = 0


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    parent_id: Optional[UUID] = None
    sort_order: Optional[int] = None


class CategoryResponse(BaseModel):
    id: UUID
    organization_id: UUID
    name: str
    description: Optional[str] = None
    parent_id: Optional[UUID] = None
    sort_order: int
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Product ---
class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    sku: Optional[str] = None  # auto-generated if not provided
    barcode: Optional[str] = None
    category_id: Optional[UUID] = None
    cost_price: Decimal = Field(default=Decimal("0"), ge=0)
    selling_price: Decimal = Field(default=Decimal("0"), ge=0)
    tax_rate: Decimal = Field(default=Decimal("0"), ge=0, le=100)
    unit: str = "pcs"
    low_stock_threshold: int = Field(default=10, ge=0)
    image_url: Optional[str] = None
    store_id: Optional[UUID] = None  # store to initialize stock for
    initial_stock: int = Field(default=0, ge=0)  # initial quantity

    # shop.md extensions
    member_price: Optional[Decimal] = Field(None, ge=0)
    promo_price: Optional[Decimal] = Field(None, ge=0)
    promo_start: Optional[datetime] = None
    promo_end: Optional[datetime] = None
    is_age_restricted: bool = False
    age_restriction_type: Optional[str] = None
    allergens: Optional[List[str]] = None
    nutritional_info: Optional[dict] = None
    weight_unit: Optional[str] = None
    calories_per_100g: Optional[Decimal] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    barcode: Optional[str] = None
    category_id: Optional[UUID] = None
    cost_price: Optional[Decimal] = Field(None, ge=0)
    selling_price: Optional[Decimal] = Field(None, ge=0)
    tax_rate: Optional[Decimal] = Field(None, ge=0, le=100)
    unit: Optional[str] = None
    low_stock_threshold: Optional[int] = Field(None, ge=0)
    image_url: Optional[str] = None

    # shop.md extensions
    member_price: Optional[Decimal] = Field(None, ge=0)
    promo_price: Optional[Decimal] = Field(None, ge=0)
    promo_start: Optional[datetime] = None
    promo_end: Optional[datetime] = None
    is_age_restricted: Optional[bool] = None
    age_restriction_type: Optional[str] = None
    allergens: Optional[List[str]] = None
    nutritional_info: Optional[dict] = None
    weight_unit: Optional[str] = None
    calories_per_100g: Optional[Decimal] = None


class ProductResponse(BaseModel):
    id: UUID
    organization_id: UUID
    category_id: Optional[UUID] = None
    name: str
    description: Optional[str] = None
    sku: str
    barcode: Optional[str] = None
    qr_code_data: Optional[str] = None
    cost_price: Decimal
    selling_price: Decimal
    tax_rate: Decimal
    unit: str
    low_stock_threshold: int
    image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    # shop.md extensions
    member_price: Optional[Decimal] = None
    promo_price: Optional[Decimal] = None
    promo_start: Optional[datetime] = None
    promo_end: Optional[datetime] = None
    is_age_restricted: bool
    age_restriction_type: Optional[str] = None
    allergens: Optional[List[str]] = None
    nutritional_info: Optional[dict] = None
    weight_unit: Optional[str] = None
    calories_per_100g: Optional[Decimal] = None

    model_config = {"from_attributes": True}


class ProductWithStockResponse(ProductResponse):
    """Product response including stock info for a specific store."""
    stock_quantity: int = 0
    is_low_stock: bool = False
