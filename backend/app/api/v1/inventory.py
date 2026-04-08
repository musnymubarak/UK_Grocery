"""
Inventory management API routes.
"""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user, require_role, get_org_context, get_store_scope, enforce_store_access
from app.services.inventory import InventoryService
from app.models.user import User
from app.schemas.inventory import (
    StockAdjustment,
    StockTransfer,
    PurchaseEntry,
    InventoryResponse,
    StockMovementResponse,
)

router = APIRouter(prefix="/inventory", tags=["Inventory"])


@router.get("/{store_id}", summary="Store inventory")
async def get_store_inventory(
    store_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org_id: UUID = Depends(get_org_context),
    store_scope: UUID = Depends(get_store_scope),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    """Get all inventory for a specific store."""
    enforce_store_access(store_id, store_scope)
    service = InventoryService(db)
    return await service.get_store_inventory(store_id, org_id, skip, limit)


@router.post("/adjust", summary="Adjust stock")
async def adjust_stock(
    data: StockAdjustment,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"])),
    org_id: UUID = Depends(get_org_context),
    store_scope: UUID = Depends(get_store_scope),
):
    """Adjust stock quantity (admin/manager only)."""
    enforce_store_access(data.store_id, store_scope)
    service = InventoryService(db)
    inv = await service.adjust_stock(data, current_user, org_id, request=request)
    return {
        "message": "Stock adjusted successfully",
        "product_id": str(data.product_id),
        "new_quantity": inv.quantity,
    }


@router.post("/transfer", summary="Transfer stock")
async def transfer_stock(
    data: StockTransfer,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"])),
    org_id: UUID = Depends(get_org_context),
    store_scope: UUID = Depends(get_store_scope),
):
    """Transfer stock between stores (admin/manager only)."""
    enforce_store_access(data.from_store_id, store_scope)
    service = InventoryService(db)
    result = await service.transfer_stock(data, current_user, org_id, request=request)
    return {"message": "Stock transferred successfully", **result}


@router.post("/purchase", summary="Add purchase")
async def add_purchase(
    data: PurchaseEntry,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"])),
    org_id: UUID = Depends(get_org_context),
    store_scope: UUID = Depends(get_store_scope),
):
    """Record a purchase entry (admin/manager only)."""
    enforce_store_access(data.store_id, store_scope)
    service = InventoryService(db)
    inv = await service.add_purchase(data, current_user, org_id, request=request)
    return {
        "message": "Purchase recorded successfully",
        "product_id": str(data.product_id),
        "new_quantity": inv.quantity,
    }


@router.get("/{store_id}/movements", summary="Stock movements")
async def get_stock_movements(
    store_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    store_scope: UUID = Depends(get_store_scope),
    product_id: Optional[UUID] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    """Get stock movement history for a store."""
    enforce_store_access(store_id, store_scope)
    service = InventoryService(db)
    movements = await service.get_movements(store_id, product_id, skip, limit)
    return [StockMovementResponse.model_validate(m) for m in movements]
