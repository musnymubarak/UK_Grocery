"""
Report API routes.
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user, require_role, get_org_context, get_store_scope, enforce_store_access
from app.services.report import ReportService
from app.models.user import User

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/sales-summary", summary="Sales summary")
async def sales_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"])),
    org_id: UUID = Depends(get_org_context),
    store_scope: Optional[UUID] = Depends(get_store_scope),
    store_id: Optional[UUID] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
):
    """Aggregate sales summary for org or store."""
    if store_scope:
        store_id = store_scope
    service = ReportService(db)
    return await service.get_sales_summary(org_id, store_id, date_from, date_to)


@router.get("/product-performance", summary="Product performance")
async def product_performance(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"])),
    org_id: UUID = Depends(get_org_context),
    store_scope: Optional[UUID] = Depends(get_store_scope),
    store_id: Optional[UUID] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    limit: int = Query(20, ge=1, le=100),
):
    """Top products by revenue and category breakdown."""
    if store_scope:
        store_id = store_scope
    service = ReportService(db)
    return await service.get_product_performance(org_id, store_id, date_from, date_to, limit)


@router.get("/cashier-performance", summary="Cashier performance")
async def cashier_performance(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"])),
    org_id: UUID = Depends(get_org_context),
    store_scope: Optional[UUID] = Depends(get_store_scope),
    store_id: Optional[UUID] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
):
    """Cashier sales performance."""
    if store_scope:
        store_id = store_scope
    service = ReportService(db)
    return await service.get_cashier_performance(org_id, store_id, date_from, date_to)


@router.get("/inventory-valuation", summary="Inventory valuation")
async def inventory_valuation(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"])),
    org_id: UUID = Depends(get_org_context),
    store_scope: Optional[UUID] = Depends(get_store_scope),
    store_id: Optional[UUID] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
):
    """Inventory value and stock movements."""
    if store_scope:
        store_id = store_scope
    service = ReportService(db)
    return await service.get_inventory_valuation(org_id, store_id, date_from, date_to)
