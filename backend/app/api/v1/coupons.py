from uuid import UUID
from typing import List
from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_async_session
from app.core.dependencies import get_current_user, require_role, get_org_context, get_current_customer
from app.models.user import User
from app.models.customer import Customer
from app.schemas.coupon import CouponCreate, CouponUpdate, CouponResponse, CouponValidateRequest, CouponValidateResponse
from app.services.coupon import CouponService

router = APIRouter(prefix="/coupons", tags=["Coupons"])

# Admin Routes
@router.get("", response_model=List[CouponResponse])
async def list_coupons(
    skip: int = 0,
    limit: int = 100,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(["super_admin", "admin", "manager"])),
    db: AsyncSession = Depends(get_async_session)
):
    service = CouponService(db)
    return await service.get_coupons(org_id, skip, limit)

@router.post("", response_model=CouponResponse)
async def create_coupon(
    data: CouponCreate,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(["super_admin", "admin", "manager"])),
    db: AsyncSession = Depends(get_async_session)
):
    service = CouponService(db)
    return await service.create_coupon(org_id, data)

@router.put("/{coupon_id}", response_model=CouponResponse)
async def update_coupon(
    coupon_id: UUID,
    data: CouponUpdate,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(["super_admin", "admin", "manager"])),
    db: AsyncSession = Depends(get_async_session)
):
    service = CouponService(db)
    return await service.update_coupon(org_id, coupon_id, data)

@router.delete("/{coupon_id}")
async def delete_coupon(
    coupon_id: UUID,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(["super_admin", "admin"])),
    db: AsyncSession = Depends(get_async_session)
):
    service = CouponService(db)
    await service.delete_coupon(org_id, coupon_id)
    return {"message": "Coupon deleted"}

# Customer Route
@router.post("/validate", response_model=CouponValidateResponse)
async def validate_coupon_for_checkout(
    data: CouponValidateRequest,
    current_customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_async_session)
):
    service = CouponService(db)
    return await service.validate_coupon(
        org_id=current_customer.organization_id,
        code=data.code,
        customer_id=current_customer.id,
        store_id=data.store_id,
        subtotal=data.subtotal,
        delivery_fee=data.delivery_fee
    )
