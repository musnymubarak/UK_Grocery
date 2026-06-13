"""
Purchase Orders API — create POs, manage status, receive goods (admin/manager).
"""
from uuid import UUID
from typing import List, Optional
from fastapi import APIRouter, Depends, Request

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_async_session
from app.core.dependencies import require_role, get_org_context
from app.models.user import User
from app.schemas.purchase_order import (
    PurchaseOrderCreate, PurchaseOrderUpdate, PurchaseOrderResponse, ReceiveRequest,
)
from app.services.purchase_order import PurchaseOrderService

router = APIRouter(prefix="/purchase-orders", tags=["Purchase Orders"])

ROLES = ["super_admin", "admin", "manager"]


@router.get("", response_model=List[PurchaseOrderResponse])
async def list_purchase_orders(
    supplier_id: Optional[UUID] = None,
    status: Optional[str] = None,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(ROLES)),
    db: AsyncSession = Depends(get_async_session),
):
    return await PurchaseOrderService(db).list_orders(org_id, supplier_id, status)


@router.post("", response_model=PurchaseOrderResponse, status_code=201)
async def create_purchase_order(
    data: PurchaseOrderCreate, request: Request,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(ROLES)),
    db: AsyncSession = Depends(get_async_session),
):
    return await PurchaseOrderService(db).create_with_items(org_id, data, current_user, request)


@router.get("/{po_id}", response_model=PurchaseOrderResponse)
async def get_purchase_order(
    po_id: UUID,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(ROLES)),
    db: AsyncSession = Depends(get_async_session),
):
    return await PurchaseOrderService(db).get_order(org_id, po_id)


@router.put("/{po_id}", response_model=PurchaseOrderResponse)
async def update_purchase_order(
    po_id: UUID, data: PurchaseOrderUpdate, request: Request,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(ROLES)),
    db: AsyncSession = Depends(get_async_session),
):
    return await PurchaseOrderService(db).update(org_id, po_id, data, current_user, request)


@router.post("/{po_id}/receive", response_model=PurchaseOrderResponse)
async def receive_purchase_order(
    po_id: UUID, data: ReceiveRequest, request: Request,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(ROLES)),
    db: AsyncSession = Depends(get_async_session),
):
    return await PurchaseOrderService(db).receive(org_id, po_id, data, current_user, request)


@router.post("/{po_id}/cancel", response_model=PurchaseOrderResponse)
async def cancel_purchase_order(
    po_id: UUID, request: Request,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(ROLES)),
    db: AsyncSession = Depends(get_async_session),
):
    return await PurchaseOrderService(db).cancel(org_id, po_id, current_user, request)


@router.delete("/{po_id}", status_code=204)
async def delete_purchase_order(
    po_id: UUID, request: Request,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(ROLES)),
    db: AsyncSession = Depends(get_async_session),
):
    await PurchaseOrderService(db).delete(org_id, po_id, current_user, request)
