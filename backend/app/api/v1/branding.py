"""
Branding API — admin-editable brand name, logo, and palette for storefront +
mobile. GET/PUT the full config (admin); the public view is folded into
`GET /storefront/app-config` as `branding`.
"""
from typing import Any, Dict, Optional
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.core.dependencies import require_role, get_org_context, require_capability
from app.core.cache import CacheService
from app.models.user import User
from app.services.branding import get_branding, save_branding

router = APIRouter(prefix="/branding", tags=["Branding"])


class BrandingColors(BaseModel):
    primary: str = "#001d3d"
    action: str = "#e6203a"
    accent: str = "#0056b3"


class BrandingSave(BaseModel):
    app_name: str = "Daily Grocer"
    logo_url: str = ""
    colors: Optional[BrandingColors] = None


@router.get("")
async def get_branding_admin(
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_capability("manage_settings")),
    db: AsyncSession = Depends(get_async_session),
) -> Dict[str, Any]:
    return await get_branding(db, org_id)


@router.put("")
async def save_branding_admin(
    data: BrandingSave,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_capability("manage_settings")),
    db: AsyncSession = Depends(get_async_session),
) -> Dict[str, Any]:
    saved = await save_branding(db, org_id, data.model_dump())
    await CacheService.invalidate_pattern("storefront:app_config*")
    return saved
