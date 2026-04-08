"""
Category management API routes.
"""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user, require_role, get_org_context
from app.models.user import User
from app.models.category import Category
from app.repositories.base import BaseRepository
from app.schemas.product import CategoryCreate, CategoryUpdate, CategoryResponse
from app.core.exceptions import NotFoundException

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=list[CategoryResponse], summary="List categories")
async def list_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org_id: UUID = Depends(get_org_context),
):
    """List all categories in the organization."""
    repo = BaseRepository(Category, db)
    return await repo.get_all(filters={"organization_id": org_id}, limit=500)


@router.post("", response_model=CategoryResponse, summary="Create category")
async def create_category(
    data: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"])),
    org_id: UUID = Depends(get_org_context),
):
    """Create a new category (admin/manager only)."""
    repo = BaseRepository(Category, db)
    cat_data = data.model_dump()
    cat_data["organization_id"] = org_id
    return await repo.create(cat_data)


@router.put("/{category_id}", response_model=CategoryResponse, summary="Update category")
async def update_category(
    category_id: UUID,
    data: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"])),
    org_id: UUID = Depends(get_org_context),
):
    """Update category (admin/manager only)."""
    repo = BaseRepository(Category, db)
    cat = await repo.get_by_id(category_id)
    if not cat or cat.organization_id != org_id:
        raise NotFoundException("Category", category_id)
    return await repo.update(category_id, data.model_dump(exclude_unset=True))


@router.delete("/{category_id}", summary="Delete category")
async def delete_category(
    category_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"])),
    org_id: UUID = Depends(get_org_context),
):
    """Soft delete category (admin/manager only)."""
    repo = BaseRepository(Category, db)
    cat = await repo.get_by_id(category_id)
    if not cat or cat.organization_id != org_id:
        raise NotFoundException("Category", category_id)
    await repo.soft_delete(category_id)
    return {"message": "Category deleted", "success": True}
