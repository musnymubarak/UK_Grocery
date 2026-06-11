"""
Home Layout API — admin CRUD for server-driven home sections.

Public clients read the resolved layout from GET /storefront/home-layout
(see app/api/v1/storefront.py). Mutations here invalidate that public cache.
"""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.core.dependencies import require_role, get_org_context
from app.core.cache import CacheService
from app.models.user import User
from app.schemas.home_layout import (
    HomeSectionCreate,
    HomeSectionUpdate,
    HomeSectionResponse,
    ReorderRequest,
)
from app.services.home_layout import HomeLayoutService

router = APIRouter(prefix="/home-layout", tags=["Home Layout (CMS)"])


async def _invalidate_layout_cache():
    await CacheService.invalidate_pattern("storefront:home_layout:*")


@router.get("/sections", response_model=List[HomeSectionResponse])
async def list_sections(
    store_id: Optional[UUID] = None,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(["admin", "manager"])),
    db: AsyncSession = Depends(get_async_session),
):
    """Admin/manager: list home sections (all, including inactive) for management."""
    return await HomeLayoutService(db).list_sections(org_id, store_id)


@router.post("/sections", response_model=HomeSectionResponse, status_code=status.HTTP_201_CREATED)
async def create_section(
    data: HomeSectionCreate,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_async_session),
):
    section = await HomeLayoutService(db).create_section(org_id, data)
    await _invalidate_layout_cache()
    return section


@router.post("/sections/reorder", response_model=List[HomeSectionResponse])
async def reorder_sections(
    data: ReorderRequest,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_async_session),
):
    """Admin: set section order from an ordered list of ids (position = index)."""
    sections = await HomeLayoutService(db).reorder_sections(org_id, data.ordered_ids)
    await _invalidate_layout_cache()
    return sections


@router.get("/sections/{section_id}", response_model=HomeSectionResponse)
async def get_section(
    section_id: UUID,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(["admin", "manager"])),
    db: AsyncSession = Depends(get_async_session),
):
    return await HomeLayoutService(db).get_section(org_id, section_id)


@router.put("/sections/{section_id}", response_model=HomeSectionResponse)
async def update_section(
    section_id: UUID,
    data: HomeSectionUpdate,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_async_session),
):
    section = await HomeLayoutService(db).update_section(org_id, section_id, data)
    await _invalidate_layout_cache()
    return section


@router.delete("/sections/{section_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_section(
    section_id: UUID,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_async_session),
):
    await HomeLayoutService(db).delete_section(org_id, section_id)
    await _invalidate_layout_cache()
