"""Refund API — customer request + admin processing."""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, Request, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.core.dependencies import get_current_customer, require_role, get_org_context, get_store_scope
from app.core.rate_limiter import limiter
from app.models.customer import Customer
from app.models.user import User
from app.services.refund import RefundService
from app.schemas.refund import RefundRequest, RefundProcessItemRequest, RefundResponse, RefundItemResponse

router = APIRouter(prefix="/refunds", tags=["Refunds"])

# Customer endpoint
@router.post("/request", response_model=RefundResponse)
@limiter.limit("3/hour")
async def request_refund(
    request: Request,
    data: RefundRequest,
    current_customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_async_session)
):
    """Customer requests a granular refund for specific order items."""
    service = RefundService(db)
    # items inside data are List[RefundItemRequest] which are dict-like
    items = [it.model_dump() for it in data.items]
    return await service.request_granular_refund(
        current_customer.id, 
        data.order_id, 
        items, 
        destination=data.destination
    )

@router.post("/{refund_item_id}/evidence")
@limiter.limit("5/hour")
async def upload_refund_evidence(
    request: Request,
    refund_item_id: UUID,
    file: UploadFile = File(...),
    current_customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_async_session)
):
    """Customer uploads evidence (photo) for a refund item."""
    from sqlalchemy import select
    from app.models.refund import Refund, RefundItem
    from app.models.refund_evidence import RefundEvidence
    from app.core.exceptions import NotFoundException
    from app.services.uploads import save_image_upload

    # Ownership check: the refund item must belong to a refund owned by the
    # calling customer — previously any authenticated customer could attach
    # evidence to any refund item by guessing/learning its UUID.
    row = (await db.execute(
        select(RefundItem, Refund.customer_id)
        .join(Refund, Refund.id == RefundItem.refund_id)
        .where(RefundItem.id == refund_item_id)
    )).first()
    if not row or row[1] != current_customer.id:
        raise NotFoundException("RefundItem", refund_item_id)

    # Validated content-type allowlist + a server-generated filename (UUID +
    # a sanitized extension) — the client's filename is never used to build a
    # filesystem path, which is what previously allowed path traversal.
    file_url = await save_image_upload(file, subdir="refunds")

    evidence = RefundEvidence(
        refund_item_id=refund_item_id,
        file_url=file_url,
        mime_type=file.content_type,
        uploaded_by_customer_id=current_customer.id
    )
    db.add(evidence)
    await db.commit()

    return {"status": "success", "file_url": file_url}

@router.get("/me", response_model=List[RefundResponse])
async def get_my_refunds(
    current_customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_async_session)
):
    """Get all refund requests for the logged in customer."""
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    from app.models.refund import Refund, RefundItem
    
    query = select(Refund).options(
        selectinload(Refund.items).selectinload(RefundItem.evidence)
    ).where(Refund.customer_id == current_customer.id).order_by(Refund.created_at.desc())
    
    result = await db.execute(query)
    return list(result.scalars().all())

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

@router.post("/{refund_id}/items/{item_id}/process", response_model=RefundItemResponse)
async def process_refund_item(
    refund_id: UUID,
    item_id: UUID,
    data: RefundProcessItemRequest,
    store_scope: Optional[UUID] = Depends(get_store_scope),
    current_user: User = Depends(require_role(["admin", "manager"])),
    db: AsyncSession = Depends(get_async_session)
):
    """Admin: approve or reject an individual refund item.

    Managers/cashiers are restricted to their own assigned store — a refund
    belonging to a different store in the same organization is rejected.
    Admins are unrestricted.
    """
    service = RefundService(db)
    return await service.process_refund_item(
        refund_id, item_id, data.status, current_user, data.admin_notes, store_scope=store_scope
    )
