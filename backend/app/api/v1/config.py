from uuid import UUID
from typing import List
from fastapi import APIRouter, Depends

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_async_session
from app.core.dependencies import get_current_user, require_role, get_org_context
from app.models.user import User

from app.schemas.config import PlatformConfigCreate, PlatformConfigResponse, FeatureFlagCreate, FeatureFlagResponse
from app.services.config import ConfigService

router = APIRouter(prefix="/config", tags=["Configuration"])

# --- Platform Configs ---
@router.get("/settings", response_model=List[PlatformConfigResponse])
async def list_configs(
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(["super_admin", "admin"])),
    db: AsyncSession = Depends(get_async_session)
):
    service = ConfigService(db)
    return await service.get_all_configs(org_id)

@router.put("/settings", response_model=PlatformConfigResponse)
async def upsert_config(
    data: PlatformConfigCreate,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(["super_admin", "admin"])),
    db: AsyncSession = Depends(get_async_session)
):
    service = ConfigService(db)
    return await service.upsert_config(org_id, data)

# --- Feature Flags ---
@router.get("/flags", response_model=List[FeatureFlagResponse])
async def list_flags(
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(["super_admin", "admin"])),
    db: AsyncSession = Depends(get_async_session)
):
    service = ConfigService(db)
    return await service.get_all_flags(org_id)

@router.put("/flags", response_model=FeatureFlagResponse)
async def upsert_flag(
    data: FeatureFlagCreate,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(["super_admin", "admin"])),
    db: AsyncSession = Depends(get_async_session)
):
    service = ConfigService(db)
    return await service.upsert_flag(org_id, data)
