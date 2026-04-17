"""
Analytics API — dashboard KPIs and reporting.
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.core.dependencies import get_org_context, get_store_scope, require_role
from app.services.analytics import AnalyticsService
from app.models.user import User

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard")
async def get_dashboard_summary(
    org_id: UUID = Depends(get_org_context),
    store_id: Optional[UUID] = Depends(get_store_scope),
    current_user: User = Depends(require_role(["admin", "manager"])),
    db: AsyncSession = Depends(get_async_session)
):
    """Get high-level KPIs for the admin dashboard."""
    service = AnalyticsService(db)
    return await service.get_dashboard_kpis(org_id, store_id)

@router.get("/revenue-chart")
async def get_revenue_chart(
    days: int = Query(30, ge=1, le=365),
    org_id: UUID = Depends(get_org_context),
    store_id: Optional[UUID] = Depends(get_store_scope),
    current_user: User = Depends(require_role(["admin", "manager"])),
    db: AsyncSession = Depends(get_async_session)
):
    """Get historical revenue data for chart rendering."""
    service = AnalyticsService(db)
    return await service.get_revenue_chart(org_id, store_id, days)
