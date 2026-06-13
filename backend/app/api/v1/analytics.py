"""
Analytics API — dashboard KPIs and reporting.
"""
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.core.dependencies import get_org_context, get_store_scope, require_role, require_capability
from app.services.analytics import AnalyticsService
from app.models.user import User
from app.models.order import Order
from app.models.refund import Refund
from app.models.driver import DriverProfile
from app.models.inventory import Inventory
from app.models.product import Product

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard")
async def get_dashboard_summary(
    store_id: Optional[UUID] = Query(None, description="Filter by store (admin override)"),
    org_id: UUID = Depends(get_org_context),
    store_scope: Optional[UUID] = Depends(get_store_scope),
    current_user: User = Depends(require_capability("view_reports")),
    db: AsyncSession = Depends(get_async_session)
):
    """Get high-level KPIs for the admin dashboard."""
    effective_store_id = store_scope if store_scope is not None else store_id
    service = AnalyticsService(db)
    return await service.get_dashboard_kpis(org_id, effective_store_id)

@router.get("/revenue-chart")
async def get_revenue_chart(
    days: int = Query(30, ge=1, le=365),
    store_id: Optional[UUID] = Query(None, description="Filter by store (admin override)"),
    org_id: UUID = Depends(get_org_context),
    store_scope: Optional[UUID] = Depends(get_store_scope),
    current_user: User = Depends(require_capability("view_reports")),
    db: AsyncSession = Depends(get_async_session)
):
    """Get historical revenue data for chart rendering."""
    effective_store_id = store_scope if store_scope is not None else store_id
    service = AnalyticsService(db)
    return await service.get_revenue_chart(org_id, effective_store_id, days)


@router.get("/alerts")
async def get_urgent_alerts(
    store_id: Optional[UUID] = Query(None, description="Filter alerts by store (admin override)"),
    late_after_minutes: int = Query(30, ge=1, le=240, description="Threshold for 'late orders'"),
    low_stock_threshold: int = Query(5, ge=0, le=100, description="Quantity below this counts as low stock"),
    org_id: UUID = Depends(get_org_context),
    store_scope: Optional[UUID] = Depends(get_store_scope),
    current_user: User = Depends(require_capability("view_reports")),
    db: AsyncSession = Depends(get_async_session),
):
    """Counts that drive the dashboard's 'urgent actions' panel."""
    effective_store_id = store_scope if store_scope is not None else store_id
    late_cutoff = datetime.now(timezone.utc) - timedelta(minutes=late_after_minutes)

    def order_q():
        q = select(func.count(Order.id)).where(
            Order.organization_id == org_id,
            Order.is_deleted == False,
        )
        if effective_store_id:
            q = q.where(Order.store_id == effective_store_id)
        return q

    pending_action = (await db.execute(
        order_q().where(Order.status.in_(("placed", "confirmed", "picking", "ready_for_collection")))
    )).scalar() or 0

    out_for_delivery = (await db.execute(
        order_q().where(Order.status == "out_for_delivery")
    )).scalar() or 0

    substitution_pending = (await db.execute(
        order_q().where(Order.status == "substitution_pending")
    )).scalar() or 0

    late_orders = (await db.execute(
        order_q().where(Order.status == "placed", Order.created_at < late_cutoff)
    )).scalar() or 0

    failed_payments = (await db.execute(
        order_q().where(Order.payment_status == "failed")
    )).scalar() or 0

    pending_refunds = (await db.execute(
        select(func.count(Refund.id)).where(
            Refund.organization_id == org_id,
            Refund.status == "pending",
            Refund.is_deleted == False,
        )
    )).scalar() or 0

    drivers_q = (
        select(func.count(DriverProfile.id))
        .join(User, User.id == DriverProfile.user_id)
        .where(
            User.organization_id == org_id,
            DriverProfile.is_online == True,
            DriverProfile.is_available == True,
        )
    )
    if effective_store_id:
        drivers_q = drivers_q.where(User.store_id == effective_store_id)
    available_drivers = (await db.execute(drivers_q)).scalar() or 0

    inv_q = (
        select(
            func.count(func.distinct(Inventory.id)).filter(Inventory.quantity == 0).label("oos"),
            func.count(func.distinct(Inventory.id)).filter(and_(Inventory.quantity > 0, Inventory.quantity < low_stock_threshold)).label("low"),
        )
        .join(Product, Product.id == Inventory.product_id)
        .where(Product.organization_id == org_id, Product.is_deleted == False)
    )
    if effective_store_id:
        inv_q = inv_q.where(Inventory.store_id == effective_store_id)
    oos, low = (await db.execute(inv_q)).one()

    return {
        "orders": {
            "pending_action": pending_action,
            "late": late_orders,
            "out_for_delivery": out_for_delivery,
            "substitution_pending": substitution_pending,
            "failed_payments": failed_payments,
        },
        "refunds": {"pending": pending_refunds},
        "drivers": {"available": available_drivers},
        "inventory": {
            "out_of_stock_skus": int(oos or 0),
            "low_stock_skus": int(low or 0),
        },
        "_thresholds": {
            "late_after_minutes": late_after_minutes,
            "low_stock_threshold": low_stock_threshold,
        },
    }
