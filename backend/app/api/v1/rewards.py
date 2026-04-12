from uuid import UUID
from typing import List, Any
from fastapi import APIRouter, Depends

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_async_session
from app.core.dependencies import get_current_user, require_role, get_org_context, get_current_customer
from app.models.user import User
from app.models.customer import Customer

from app.schemas.rewards import RewardsTierCreate, RewardsTierUpdate, RewardsTierResponse, RewardsProgressResponse
from app.services.rewards import RewardsService

router = APIRouter(prefix="/rewards", tags=["Rewards"])

# --- Admin Routes ---
@router.get("/tiers", response_model=List[RewardsTierResponse])
async def list_tiers(
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(["super_admin", "admin", "manager"])),
    db: AsyncSession = Depends(get_async_session)
):
    service = RewardsService(db)
    return await service.get_tiers(org_id)

@router.post("/tiers", response_model=RewardsTierResponse)
async def create_tier(
    data: RewardsTierCreate,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(["super_admin", "admin"])),
    db: AsyncSession = Depends(get_async_session)
):
    service = RewardsService(db)
    return await service.create_tier(org_id, data)

@router.put("/tiers/{tier_id}", response_model=RewardsTierResponse)
async def update_tier(
    tier_id: UUID,
    data: RewardsTierUpdate,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(["super_admin", "admin"])),
    db: AsyncSession = Depends(get_async_session)
):
    service = RewardsService(db)
    return await service.update_tier(org_id, tier_id, data)

@router.delete("/tiers/{tier_id}")
async def delete_tier(
    tier_id: UUID,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(["super_admin", "admin"])),
    db: AsyncSession = Depends(get_async_session)
):
    service = RewardsService(db)
    await service.delete_tier(org_id, tier_id)
    return {"status": "success"}


# --- Customer Routes ---
@router.get("/me/progress", response_model=RewardsProgressResponse)
async def get_my_progress(
    current_customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_async_session)
):
    service = RewardsService(db)
    return await service.get_customer_progress(current_customer.id)
