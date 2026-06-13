"""
Suppliers API — supplier directory + bills/payments (admin/manager).
"""
from uuid import UUID
from typing import List
from fastapi import APIRouter, Depends, Request

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_async_session
from app.core.dependencies import require_role, get_org_context, require_capability
from app.models.user import User
from app.schemas.supplier import (
    SupplierCreate, SupplierUpdate, SupplierResponse, SupplierSummary,
    SupplierPaymentCreate, SupplierPaymentResponse,
)
from app.services.supplier import SupplierService, SupplierPaymentService

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])

ROLES = ["super_admin", "admin", "manager"]


@router.get("", response_model=List[SupplierResponse])
async def list_suppliers(
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_capability("manage_procurement")),
    db: AsyncSession = Depends(get_async_session),
):
    return await SupplierService(db).list_suppliers(org_id)


@router.post("", response_model=SupplierResponse, status_code=201)
async def create_supplier(
    data: SupplierCreate, request: Request,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_capability("manage_procurement")),
    db: AsyncSession = Depends(get_async_session),
):
    return await SupplierService(db).create_supplier(org_id, data, current_user, request)


@router.get("/{supplier_id}", response_model=SupplierResponse)
async def get_supplier(
    supplier_id: UUID,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_capability("manage_procurement")),
    db: AsyncSession = Depends(get_async_session),
):
    return await SupplierService(db).get_supplier(org_id, supplier_id)


@router.put("/{supplier_id}", response_model=SupplierResponse)
async def update_supplier(
    supplier_id: UUID, data: SupplierUpdate, request: Request,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_capability("manage_procurement")),
    db: AsyncSession = Depends(get_async_session),
):
    return await SupplierService(db).update_supplier(org_id, supplier_id, data, current_user, request)


@router.delete("/{supplier_id}", status_code=204)
async def delete_supplier(
    supplier_id: UUID, request: Request,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_capability("manage_procurement")),
    db: AsyncSession = Depends(get_async_session),
):
    await SupplierService(db).delete_supplier(org_id, supplier_id, current_user, request)


@router.get("/{supplier_id}/summary", response_model=SupplierSummary)
async def supplier_summary(
    supplier_id: UUID,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_capability("manage_procurement")),
    db: AsyncSession = Depends(get_async_session),
):
    return await SupplierService(db).get_summary(org_id, supplier_id)


@router.get("/{supplier_id}/payments", response_model=List[SupplierPaymentResponse])
async def list_payments(
    supplier_id: UUID,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_capability("manage_procurement")),
    db: AsyncSession = Depends(get_async_session),
):
    return await SupplierPaymentService(db).list_for_supplier(org_id, supplier_id)


@router.post("/{supplier_id}/payments", response_model=SupplierPaymentResponse, status_code=201)
async def create_payment(
    supplier_id: UUID, data: SupplierPaymentCreate, request: Request,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_capability("manage_procurement")),
    db: AsyncSession = Depends(get_async_session),
):
    return await SupplierPaymentService(db).create(org_id, supplier_id, data, current_user, request)
