"""Refund API — customer request + admin processing."""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.core.dependencies import get_current_customer, require_role, get_org_context
from app.models.customer import Customer
from app.models.user import User
from app.services.refund import RefundService
from app.schemas.refund import RefundRequest, RefundProcessRequest, RefundResponse

router = APIRouter(prefix="/refunds", tags=["Refunds"])

# Customer endpoint
@router.post("/request", response_model=RefundResponse)
async def request_refund(
    data: RefundRequest,
    current_customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_async_session)
):
    """Customer requests a refund for a delivered order."""
    service = RefundService(db)
    return await service.request_refund(current_customer.id, data.order_id, data.reason)

# Admin endpoints
@router.get("", response_model=List[RefundResponse])
async def list_refunds(
    status: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 50,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(["admin", "manager"])),
    db: AsyncSession = Depends(get_async_session)
):
    """Admin: list all refund requests."""
    service = RefundService(db)
    return await service.get_refunds_for_org(org_id, status_filter=status, skip=skip, limit=limit)

@router.post("/{refund_id}/process", response_model=RefundResponse)
async def process_refund(
    refund_id: UUID,
    data: RefundProcessRequest,
    current_user: User = Depends(require_role(["admin", "manager"])),
    db: AsyncSession = Depends(get_async_session)
):
    """Admin: approve or reject a refund request."""
    service = RefundService(db)
    return await service.process_refund(
        refund_id, data.status, current_user, data.admin_notes
    )
