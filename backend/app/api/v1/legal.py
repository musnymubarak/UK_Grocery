"""
Legal Pages API (admin) — edit Privacy / Terms / Cookie bodies (markdown). The
public read is `GET /storefront/legal/{slug}` (see storefront.py).
"""
from typing import Any, Dict
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.core.dependencies import require_role, get_org_context, require_capability
from app.models.user import User
from app.services.legal import get_legal, save_legal_page, LEGAL_PAGES, SLUGS

router = APIRouter(prefix="/legal", tags=["Legal Pages"])


class LegalSave(BaseModel):
    title: str = ""
    body: str = ""


@router.get("")
async def get_legal_admin(
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_capability("manage_settings")),
    db: AsyncSession = Depends(get_async_session),
) -> Dict[str, Any]:
    return {"pages": LEGAL_PAGES, "values": await get_legal(db, org_id)}


@router.put("/{slug}")
async def save_legal_admin(
    slug: str,
    data: LegalSave,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_capability("manage_settings")),
    db: AsyncSession = Depends(get_async_session),
) -> Dict[str, Any]:
    if slug not in SLUGS:
        raise HTTPException(status_code=404, detail="Unknown legal page")
    return await save_legal_page(db, org_id, slug, data.title, data.body)
