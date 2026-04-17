"""
Banner API — admin endpoints for homepage promo management.
"""
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.core.dependencies import require_role, get_org_context
from app.models.user import User
from app.models.banner import Banner
from app.schemas.banner import BannerCreate, BannerUpdate, BannerResponse
from app.core.exceptions import NotFoundException

router = APIRouter(prefix="/banners", tags=["Banners (CMS)"])

@router.post("", response_model=BannerResponse, status_code=status.HTTP_201_CREATED)
async def create_banner(
    data: BannerCreate,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_async_session)
):
    """Admin: create a new promo banner."""
    banner = Banner(
        organization_id=org_id,
        **data.model_dump()
    )
    db.add(banner)
    await db.flush()
    await db.refresh(banner)
    return banner

@router.get("", response_model=List[BannerResponse])
async def list_banners_admin(
    org_id: UUID = Depends(get_org_context),
    store_id: Optional[UUID] = None,
    current_user: User = Depends(require_role(["admin", "manager"])),
    db: AsyncSession = Depends(get_async_session)
):
    """Admin: list all banners for management."""
    query = select(Banner).where(Banner.organization_id == org_id)
    if store_id:
        query = query.where(Banner.store_id == store_id)
    query = query.order_by(Banner.position)
    result = await db.execute(query)
    return list(result.scalars().all())

@router.get("/{banner_id}", response_model=BannerResponse)
async def get_banner(
    banner_id: UUID,
    current_user: User = Depends(require_role(["admin", "manager"])),
    db: AsyncSession = Depends(get_async_session)
):
    banner = await db.get(Banner, banner_id)
    if not banner:
        raise NotFoundException("Banner", banner_id)
    return banner

@router.put("/{banner_id}", response_model=BannerResponse)
async def update_banner(
    banner_id: UUID,
    data: BannerUpdate,
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_async_session)
):
    banner = await db.get(Banner, banner_id)
    if not banner:
        raise NotFoundException("Banner", banner_id)
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(banner, key, value)
    
    await db.flush()
    await db.refresh(banner)
    return banner

@router.delete("/{banner_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_banner(
    banner_id: UUID,
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_async_session)
):
    banner = await db.get(Banner, banner_id)
    if not banner:
        raise NotFoundException("Banner", banner_id)
    await db.delete(banner)
    await db.flush()
