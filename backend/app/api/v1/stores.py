"""
Store management API routes.
"""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user, require_role, get_org_context, get_store_scope
from app.models.user import User
from app.models.store import Store
from app.repositories.base import BaseRepository
from app.schemas.auth import StoreCreate, StoreUpdate, StoreResponse
from app.core.exceptions import NotFoundException

router = APIRouter(prefix="/stores", tags=["Stores"])


@router.get("", response_model=list[StoreResponse], summary="List stores")
async def list_stores(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org_id: UUID = Depends(get_org_context),
    store_scope: Optional[UUID] = Depends(get_store_scope),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """List all stores in the organization."""
    repo = BaseRepository(Store, db)
    filters = {"organization_id": org_id}
    if store_scope:
        filters["id"] = store_scope
    stores = await repo.get_all(
        filters=filters, skip=skip, limit=limit
    )
    return stores


@router.post("", response_model=StoreResponse, summary="Create store")
async def create_store(
    data: StoreCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin"])),
    org_id: UUID = Depends(get_org_context),
):
    """Create a new store (admin only)."""
    repo = BaseRepository(Store, db)
    store_data = data.model_dump()
    store_data["organization_id"] = org_id
    return await repo.create(store_data)


@router.get("/{store_id}", response_model=StoreResponse, summary="Get store")
async def get_store(
    store_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org_id: UUID = Depends(get_org_context),
):
    """Get store by ID."""
    repo = BaseRepository(Store, db)
    store = await repo.get_by_id(store_id)
    if not store or store.organization_id != org_id:
        raise NotFoundException("Store", store_id)
    return store


@router.put("/{store_id}", response_model=StoreResponse, summary="Update store")
async def update_store(
    store_id: UUID,
    data: StoreUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"])),
    org_id: UUID = Depends(get_org_context),
):
    """Update store (admin/manager only)."""
    repo = BaseRepository(Store, db)
    store = await repo.get_by_id(store_id)
    if not store or store.organization_id != org_id:
        raise NotFoundException("Store", store_id)
    return await repo.update(store_id, data.model_dump(exclude_unset=True))


@router.delete("/{store_id}", summary="Delete store")
async def delete_store(
    store_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin"])),
    org_id: UUID = Depends(get_org_context),
):
    """Soft delete store (admin only)."""
    repo = BaseRepository(Store, db)
    store = await repo.get_by_id(store_id)
    if not store or store.organization_id != org_id:
        raise NotFoundException("Store", store_id)
    await repo.soft_delete(store_id)
    return {"message": "Store deleted", "success": True}
