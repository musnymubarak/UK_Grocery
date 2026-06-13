"""
Promotions API — admin CRUD for cart-rule promotions (BOGO, quantity discounts, etc).
"""
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.core.database import get_async_session
from app.core.dependencies import get_org_context, require_role, require_capability
from app.services.promotion import PromotionService
from app.models.user import User

router = APIRouter(prefix="/promotions", tags=["Promotions"])

# Supported promotion types — must match what PromotionService.evaluate_cart understands
PROMOTION_TYPES = ("buy_x_get_y", "quantity_discount", "bundle_price")


class PromotionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    promotion_type: str = Field(..., pattern="^(buy_x_get_y|quantity_discount|bundle_price)$")
    config: Dict[str, Any]
    store_id: Optional[UUID] = None  # null = org-wide
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    is_active: bool = True


class PromotionUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    promotion_type: Optional[str] = Field(None, pattern="^(buy_x_get_y|quantity_discount|bundle_price)$")
    config: Optional[Dict[str, Any]] = None
    store_id: Optional[UUID] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    is_active: Optional[bool] = None


def _serialize(p) -> dict:
    return {
        "id": p.id,
        "organization_id": p.organization_id,
        "store_id": p.store_id,
        "name": p.name,
        "description": p.description,
        "promotion_type": p.promotion_type,
        "config": p.config,
        "starts_at": p.starts_at,
        "ends_at": p.ends_at,
        "is_active": p.is_active,
        "created_at": p.created_at,
        "updated_at": p.updated_at,
    }


@router.get("")
async def list_promotions(
    store_id: Optional[UUID] = Query(None, description="Filter to a store (also includes org-wide)"),
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_capability("manage_promotions")),
    db: AsyncSession = Depends(get_async_session),
):
    service = PromotionService(db)
    rows = await service.list_all(org_id=org_id, store_id=store_id)
    return [_serialize(p) for p in rows]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_promotion(
    data: PromotionCreate,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_capability("manage_promotions")),
    db: AsyncSession = Depends(get_async_session),
):
    service = PromotionService(db)
    promo = await service.create(org_id, data.model_dump())
    return _serialize(promo)


@router.put("/{promotion_id}")
async def update_promotion(
    promotion_id: UUID,
    data: PromotionUpdate,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_capability("manage_promotions")),
    db: AsyncSession = Depends(get_async_session),
):
    service = PromotionService(db)
    promo = await service.update(org_id, promotion_id, data.model_dump(exclude_unset=True))
    return _serialize(promo)


@router.delete("/{promotion_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_promotion(
    promotion_id: UUID,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_capability("manage_promotions")),
    db: AsyncSession = Depends(get_async_session),
):
    service = PromotionService(db)
    await service.delete(org_id, promotion_id)
    return None
