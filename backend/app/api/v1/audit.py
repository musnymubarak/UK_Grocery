"""
Audit Log API routes.
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user, require_role, get_org_context, get_store_scope, enforce_store_access
from app.services.audit import AuditService
from app.models.user import User
from app.schemas.audit import AuditLogResponse

router = APIRouter(prefix="/audit", tags=["Audit"])


@router.get("", summary="List audit logs")
async def list_audit_logs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"])),
    org_id: UUID = Depends(get_org_context),
    store_scope: Optional[UUID] = Depends(get_store_scope),
    store_id: Optional[UUID] = Query(None, description="Filter by store"),
    user_id: Optional[UUID] = Query(None, description="Filter by user"),
    action: Optional[str] = Query(None, description="Filter by action"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    entity_id: Optional[UUID] = Query(None, description="Filter by entity ID"),
    start_date: Optional[datetime] = Query(None, description="Start date"),
    end_date: Optional[datetime] = Query(None, description="End date"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
):
    """List audit logs (admin/manager only). Managers can only see their stores."""
    # Ensure they don't bypass store scope
    effective_store = store_id
    if current_user.role == "manager":
        effective_store = current_user.store_id

    service = AuditService(db)
    logs, total = await service.list_logs(
        organization_id=org_id,
        store_id=effective_store,
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit,
    )
    
    return {
        "items": [AuditLogResponse.model_validate(log) for log in logs],
        "total": total,
        "page": skip // limit + 1,
        "page_size": limit,
        "pages": (total + limit - 1) // limit,
    }


@router.get("/export", summary="Export audit logs to CSV")
async def export_audit_logs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "manager"])),
    org_id: UUID = Depends(get_org_context),
    store_id: Optional[UUID] = Query(None, description="Filter by store"),
    start_date: Optional[datetime] = Query(None, description="Start date"),
    end_date: Optional[datetime] = Query(None, description="End date"),
):
    """Export audit logs to CSV (admin/manager only)."""
    effective_store = store_id
    if current_user.role == "manager":
        effective_store = current_user.store_id

    service = AuditService(db)
    csv_data = await service.export_csv(
        organization_id=org_id,
        store_id=effective_store,
        start_date=start_date,
        end_date=end_date,
    )
    
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=audit_logs_{datetime.now().strftime('%Y%m%d%H%M%S')}.csv"}
    )
