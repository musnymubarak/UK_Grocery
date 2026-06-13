"""
Announcement Bar API — admin-controlled promo strip for storefront + mobile.
GET/PUT the full config (admin); the public view is folded into
`GET /storefront/app-config` as `announcement` (schedule-gated).
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
from app.services.announcement import get_announcement, save_announcement

router = APIRouter(prefix="/announcement", tags=["Announcement Bar"])


class AnnouncementSave(BaseModel):
    enabled: bool = False
    message: str = ""
    link_url: str = ""
    link_label: str = ""
    variant: str = "info"
    dismissible: bool = True
    starts_at: Optional[str] = None
    ends_at: Optional[str] = None


@router.get("", dependencies=[Depends(require_capability("manage_settings"))])
async def get_announcement_admin(
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(["super_admin", "admin"])),
    db: AsyncSession = Depends(get_async_session),
) -> Dict[str, Any]:
    return await get_announcement(db, org_id)


@router.put("", dependencies=[Depends(require_capability("manage_settings"))])
async def save_announcement_admin(
    data: AnnouncementSave,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(["super_admin", "admin"])),
    db: AsyncSession = Depends(get_async_session),
) -> Dict[str, Any]:
    saved = await save_announcement(db, org_id, data.model_dump())
    await CacheService.invalidate_pattern("storefront:app_config*")
    return saved
