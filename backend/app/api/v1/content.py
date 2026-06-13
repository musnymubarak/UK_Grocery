"""
Storefront Content API — admin-editable marketing copy (key→string map).
"""
from typing import Dict
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.core.dependencies import require_role, get_org_context, require_capability
from app.core.cache import CacheService
from app.models.user import User
from app.services.content import get_content, save_content, CONTENT_CATALOGUE

router = APIRouter(prefix="/content", tags=["Storefront Content"])


class ContentSave(BaseModel):
    values: Dict[str, str]


@router.get("", dependencies=[Depends(require_capability("manage_settings"))])
async def get_content_admin(
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(["super_admin", "admin"])),
    db: AsyncSession = Depends(get_async_session),
):
    return {"groups": CONTENT_CATALOGUE, "values": await get_content(db, org_id)}


@router.put("", dependencies=[Depends(require_capability("manage_settings"))])
async def save_content_admin(
    data: ContentSave,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(["super_admin", "admin"])),
    db: AsyncSession = Depends(get_async_session),
):
    await save_content(db, org_id, data.values)
    await CacheService.invalidate_pattern("storefront:app_config*")
    return {"values": await get_content(db, org_id)}
