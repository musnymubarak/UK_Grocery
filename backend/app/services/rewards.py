from uuid import UUID
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, desc
from sqlalchemy.orm import selectinload

from app.models.rewards import RewardsTier, CustomerMonthlySpend, RewardEvent
from app.schemas.rewards import RewardsTierCreate, RewardsTierUpdate
from app.services.coupon import CouponService
from app.schemas.coupon import CouponCreate
from app.core.exceptions import NotFoundException

class RewardsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # --- Tiers Management ---
    async def get_tiers(self, org_id: UUID) -> List[RewardsTier]:
        query = select(RewardsTier).where(RewardsTier.organization_id == org_id).order_by(RewardsTier.threshold_amount)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create_tier(self, org_id: UUID, data: RewardsTierCreate) -> RewardsTier:
        tier = RewardsTier(organization_id=org_id, **data.model_dump())
        self.db.add(tier)
        await self.db.flush()
        return tier

    async def update_tier(self, org_id: UUID, tier_id: UUID, data: RewardsTierUpdate) -> RewardsTier:
        tier = await self.db.get(RewardsTier, tier_id)
        if not tier or tier.organization_id != org_id:
            raise NotFoundException("Tier not found")

        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(tier, k, v)
        await self.db.flush()
        return tier

    async def delete_tier(self, org_id: UUID, tier_id: UUID):
        tier = await self.db.get(RewardsTier, tier_id)
        if tier and tier.organization_id == org_id:
            await self.db.delete(tier)
            await self.db.flush()

    # --- Core Logic ---
    async def log_order_spend(self, org_id: UUID, customer_id: UUID, store_id: UUID, amount: Decimal):
        """Called automatically when an order is successful."""
        now = datetime.now(timezone.utc)
        ym = f"{now.year}-{now.month:02d}"

        # 1. Update Spend
        query = select(CustomerMonthlySpend).where(
            CustomerMonthlySpend.customer_id == customer_id,
            CustomerMonthlySpend.store_id == store_id,
            CustomerMonthlySpend.year_month == ym
        )
        spend = (await self.db.execute(query)).scalar_one_or_none()

        old_spend = Decimal("0.00")
        if spend:
            old_spend = spend.spend_amount
            spend.spend_amount += amount
        else:
            spend = CustomerMonthlySpend(
                customer_id=customer_id,
                store_id=store_id,
                year_month=ym,
                spend_amount=amount
            )
            self.db.add(spend)
            
        await self.db.flush()

        # 2. Check for crossed tiers
        new_spend = spend.spend_amount
        
        # Get all global and store-specific tiers
        t_query = select(RewardsTier).where(
            RewardsTier.organization_id == org_id,
            RewardsTier.store_id.in_([store_id, None])
        ).order_by(desc(RewardsTier.threshold_amount))
        
        tiers = (await self.db.execute(t_query)).scalars().all()

        for tier in tiers:
            # If the new spend crosses the threshold but old didn't
            if new_spend >= tier.threshold_amount > old_spend:
                await self._issue_reward(org_id, customer_id, store_id, tier)

    async def _issue_reward(self, org_id: UUID, customer_id: UUID, store_id: UUID, tier: RewardsTier):
        """Generates a locked coupon for the user and logs the event."""
        # Create a unique code
        now_str = datetime.now().strftime("%y%m%d%H%M")
        code = f"RW-{customer_id.hex[:6].upper()}-{now_str}"

        valid_until = datetime.now(timezone.utc) + timedelta(days=tier.expiry_days)

        coupon_data = CouponCreate(
            code=code,
            discount_type=tier.reward_type,
            discount_value=tier.reward_value,
            max_redemptions=1,
            max_per_customer=1,
            valid_until=valid_until,
            issued_to_customer_id=customer_id,
            applicable_store_ids=[str(store_id)] if tier.store_id else None,
            source="rewards_system",
            is_active=True
        )

        coupon_service = CouponService(self.db)
        coupon = await coupon_service.create_coupon(org_id, coupon_data)

        event = RewardEvent(
            customer_id=customer_id,
            store_id=store_id,
            tier_id=tier.id,
            coupon_id=coupon.id
        )
        self.db.add(event)
        await self.db.flush()

    # --- Customer Access ---
    async def get_customer_progress(self, customer_id: UUID):
        now = datetime.now(timezone.utc)
        ym = f"{now.year}-{now.month:02d}"

        query = select(CustomerMonthlySpend).where(
            CustomerMonthlySpend.customer_id == customer_id,
            CustomerMonthlySpend.year_month == ym
        )
        spends = (await self.db.execute(query)).scalars().all()
        # Sum generic spend across all stores for UI simplicity if global tiers exist
        total_spend = sum(s.spend_amount for s in spends)

        # Get earned rewards
        ev_query = select(RewardEvent).options(selectinload(RewardEvent.tier)).where(
            RewardEvent.customer_id == customer_id
        ).order_by(desc(RewardEvent.created_at))
        events = (await self.db.execute(ev_query)).scalars().all()

        return {
            "current_month": ym,
            "total_spend": total_spend,
            "store_breakdown": spends,
            "events": events
        }
