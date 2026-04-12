from uuid import UUID
from datetime import datetime, timezone
from typing import List, Optional
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.coupon import Coupon, CouponRedemption
from app.models.order import Order
from app.schemas.coupon import CouponCreate, CouponUpdate, CouponValidateResponse
from app.core.exceptions import NotFoundException, ValidationException

class CouponService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_coupons(self, org_id: UUID, skip: int = 0, limit: int = 100) -> List[Coupon]:
        query = select(Coupon).where(Coupon.organization_id == org_id).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_coupon_by_code(self, org_id: UUID, code: str) -> Optional[Coupon]:
        query = select(Coupon).where(
            Coupon.organization_id == org_id,
            func.lower(Coupon.code) == code.lower()
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def create_coupon(self, org_id: UUID, data: CouponCreate) -> Coupon:
        # Check if code exists
        existing = await self.get_coupon_by_code(org_id, data.code)
        if existing:
            raise ValidationException(f"Coupon code '{data.code}' already exists")
            
        coupon = Coupon(organization_id=org_id, **data.model_dump())
        self.db.add(coupon)
        await self.db.flush()
        await self.db.refresh(coupon)
        return coupon

    async def update_coupon(self, org_id: UUID, coupon_id: UUID, data: CouponUpdate) -> Coupon:
        coupon = await self.db.get(Coupon, coupon_id)
        if not coupon or coupon.organization_id != org_id:
            raise NotFoundException("Coupon not found")

        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(coupon, key, value)
            
        await self.db.flush()
        await self.db.refresh(coupon)
        return coupon

    async def delete_coupon(self, org_id: UUID, coupon_id: UUID):
        coupon = await self.db.get(Coupon, coupon_id)
        if not coupon or coupon.organization_id != org_id:
            raise NotFoundException("Coupon not found")
        await self.db.delete(coupon)
        await self.db.flush()

    async def validate_coupon(
        self, 
        org_id: UUID, 
        code: str, 
        customer_id: UUID, 
        store_id: UUID, 
        subtotal: Decimal,
        delivery_fee: Decimal
    ) -> CouponValidateResponse:
        """
        9-Step Validation Logic for checkout
        """
        coupon = await self.get_coupon_by_code(org_id, code)
        now = datetime.now(timezone.utc)

        # 1. Exists & Active
        if not coupon or not coupon.is_active:
            return CouponValidateResponse(valid=False, message="Invalid or inactive coupon code")

        # 2. Within Date Bounds
        if coupon.valid_from and now < coupon.valid_from:
            return CouponValidateResponse(valid=False, message="Coupon is not valid yet")
        if coupon.valid_until and now > coupon.valid_until:
            return CouponValidateResponse(valid=False, message="Coupon has expired")

        # 3. Max Redemptions (Global)
        if coupon.max_redemptions and coupon.current_redemptions >= coupon.max_redemptions:
            return CouponValidateResponse(valid=False, message="Coupon usage limit reached")

        # 4. Customer Usage Limit
        q_usage = select(func.count(CouponRedemption.id)).where(
            CouponRedemption.coupon_id == coupon.id,
            CouponRedemption.customer_id == customer_id
        )
        usage_count = (await self.db.execute(q_usage)).scalar() or 0
        if usage_count >= coupon.max_per_customer:
            return CouponValidateResponse(valid=False, message=f"You have already used this coupon the limit of {coupon.max_per_customer} times")

        # 5. First Order Only
        if coupon.is_first_order_only:
            q_orders = select(func.count(Order.id)).where(
                Order.customer_id == customer_id,
                Order.status != "cancelled"
            )
            order_count = (await self.db.execute(q_orders)).scalar() or 0
            if order_count > 0:
                return CouponValidateResponse(valid=False, message="This coupon is only valid for your first order")

        # 6. Minimum Order Value
        if coupon.minimum_order_value and subtotal < coupon.minimum_order_value:
            return CouponValidateResponse(valid=False, message=f"Minimum order of £{coupon.minimum_order_value:.2f} required")

        # 7. Applicable Stores
        if coupon.applicable_store_ids and str(store_id) not in coupon.applicable_store_ids:
            return CouponValidateResponse(valid=False, message="This coupon is not valid at the selected store")

        # 8. Issued To specific customer
        if coupon.issued_to_customer_id and coupon.issued_to_customer_id != customer_id:
            return CouponValidateResponse(valid=False, message="This coupon is tied to another account")

        # Calculate Discount Amount
        discount_amount = Decimal("0.00")
        if coupon.discount_type == "flat_discount":
            discount_amount = min(subtotal, coupon.discount_value) # don't discount below 0
        elif coupon.discount_type == "percentage_discount":
            discount_amount = subtotal * (coupon.discount_value / Decimal("100.00"))
        elif coupon.discount_type == "free_delivery":
            discount_amount = delivery_fee

        return CouponValidateResponse(
            valid=True,
            coupon_id=coupon.id,
            discount_amount=discount_amount.quantize(Decimal("0.01")),
            discount_type=coupon.discount_type
        )
        
    async def record_redemption(self, coupon_id: UUID, customer_id: UUID, order_id: UUID):
        coupon = await self.db.get(Coupon, coupon_id)
        if coupon:
            redemption = CouponRedemption(
                coupon_id=coupon_id,
                customer_id=customer_id,
                order_id=order_id
            )
            self.db.add(redemption)
            coupon.current_redemptions += 1
            await self.db.flush()
