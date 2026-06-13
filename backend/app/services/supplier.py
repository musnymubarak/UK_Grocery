"""
SupplierService + SupplierPaymentService — supplier directory and bills/payments.

A supplier's outstanding balance = sum(total of billable POs) - sum(payments),
where billable = POs in sent/partially_received/received (not draft/cancelled).
"""
from uuid import UUID
from typing import List
from decimal import Decimal
from datetime import datetime, timezone

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Request

from app.models.supplier import Supplier, SupplierPayment
from app.models.purchase_order import PurchaseOrder
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierPaymentCreate
from app.core.exceptions import NotFoundException
from app.services.audit import AuditService

BILLABLE_STATUSES = ("sent", "partially_received", "received")


def _d(v) -> Decimal:
    return Decimal(str(v or 0))


class SupplierService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.audit = AuditService(db)

    async def _billed(self, org_id: UUID, supplier_id: UUID) -> Decimal:
        v = (await self.db.execute(
            select(func.coalesce(func.sum(PurchaseOrder.total), 0)).where(
                PurchaseOrder.organization_id == org_id,
                PurchaseOrder.supplier_id == supplier_id,
                PurchaseOrder.is_deleted == False,
                PurchaseOrder.status.in_(BILLABLE_STATUSES),
            )
        )).scalar()
        return _d(v)

    async def _paid(self, org_id: UUID, supplier_id: UUID) -> Decimal:
        v = (await self.db.execute(
            select(func.coalesce(func.sum(SupplierPayment.amount), 0)).where(
                SupplierPayment.organization_id == org_id,
                SupplierPayment.supplier_id == supplier_id,
                SupplierPayment.is_deleted == False,
            )
        )).scalar()
        return _d(v)

    async def list_suppliers(self, org_id: UUID) -> List[Supplier]:
        result = await self.db.execute(
            select(Supplier).where(Supplier.organization_id == org_id, Supplier.is_deleted == False).order_by(Supplier.name)
        )
        suppliers = list(result.scalars().all())
        for s in suppliers:
            s.outstanding = await self._billed(org_id, s.id) - await self._paid(org_id, s.id)
        return suppliers

    async def get_supplier(self, org_id: UUID, supplier_id: UUID) -> Supplier:
        s = await self.db.get(Supplier, supplier_id)
        if not s or s.is_deleted or s.organization_id != org_id:
            raise NotFoundException("Supplier", supplier_id)
        s.outstanding = await self._billed(org_id, s.id) - await self._paid(org_id, s.id)
        return s

    async def create_supplier(self, org_id: UUID, data: SupplierCreate, user, request: Request = None) -> Supplier:
        s = Supplier(organization_id=org_id, **data.model_dump())
        self.db.add(s)
        await self.db.flush()
        await self.db.refresh(s)
        s.outstanding = Decimal("0.00")
        await self.audit.log(action="supplier.created", user=user, organization_id=org_id,
                             entity_type="Supplier", entity_id=s.id, new_value={"name": s.name}, request=request)
        return s

    async def update_supplier(self, org_id: UUID, supplier_id: UUID, data: SupplierUpdate, user, request: Request = None) -> Supplier:
        s = await self.get_supplier(org_id, supplier_id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(s, k, v)
        await self.db.flush()
        await self.db.refresh(s)
        s.outstanding = await self._billed(org_id, s.id) - await self._paid(org_id, s.id)
        await self.audit.log(action="supplier.updated", user=user, organization_id=org_id,
                             entity_type="Supplier", entity_id=s.id, request=request)
        return s

    async def delete_supplier(self, org_id: UUID, supplier_id: UUID, user, request: Request = None) -> None:
        s = await self.get_supplier(org_id, supplier_id)
        s.is_deleted = True
        await self.db.flush()
        await self.audit.log(action="supplier.deleted", user=user, organization_id=org_id,
                             entity_type="Supplier", entity_id=s.id, request=request)

    async def get_summary(self, org_id: UUID, supplier_id: UUID) -> dict:
        await self.get_supplier(org_id, supplier_id)  # validates ownership
        billed = await self._billed(org_id, supplier_id)
        paid = await self._paid(org_id, supplier_id)
        orders = (await self.db.execute(
            select(func.count()).where(
                PurchaseOrder.organization_id == org_id,
                PurchaseOrder.supplier_id == supplier_id,
                PurchaseOrder.is_deleted == False,
            )
        )).scalar() or 0
        return {
            "supplier_id": supplier_id,
            "total_orders": int(orders),
            "total_billed": billed,
            "total_paid": paid,
            "outstanding": billed - paid,
        }


class SupplierPaymentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.audit = AuditService(db)

    async def list_for_supplier(self, org_id: UUID, supplier_id: UUID) -> List[SupplierPayment]:
        result = await self.db.execute(
            select(SupplierPayment).where(
                SupplierPayment.organization_id == org_id,
                SupplierPayment.supplier_id == supplier_id,
                SupplierPayment.is_deleted == False,
            ).order_by(SupplierPayment.payment_date.desc())
        )
        return list(result.scalars().all())

    async def create(self, org_id: UUID, supplier_id: UUID, data: SupplierPaymentCreate, user, request: Request = None) -> SupplierPayment:
        supplier = await self.db.get(Supplier, supplier_id)
        if not supplier or supplier.is_deleted or supplier.organization_id != org_id:
            raise NotFoundException("Supplier", supplier_id)

        payload = data.model_dump(exclude_unset=True)
        payment_date = payload.pop("payment_date", None) or datetime.now(timezone.utc)
        payment = SupplierPayment(
            organization_id=org_id,
            supplier_id=supplier_id,
            created_by_user_id=user.id,
            payment_date=payment_date,
            **payload,
        )
        self.db.add(payment)
        await self.db.flush()

        if payment.purchase_order_id:
            po = await self.db.get(PurchaseOrder, payment.purchase_order_id)
            if po and po.organization_id == org_id:
                po.amount_paid = _d(po.amount_paid) + _d(payment.amount)

        await self.db.flush()
        await self.db.refresh(payment)
        await self.audit.log(action="supplier.payment_recorded", user=user, organization_id=org_id,
                             entity_type="SupplierPayment", entity_id=payment.id,
                             new_value={"amount": float(payment.amount)}, request=request)
        return payment

    async def delete(self, org_id: UUID, payment_id: UUID, user, request: Request = None) -> None:
        p = await self.db.get(SupplierPayment, payment_id)
        if not p or p.is_deleted or p.organization_id != org_id:
            raise NotFoundException("SupplierPayment", payment_id)
        p.is_deleted = True
        if p.purchase_order_id:
            po = await self.db.get(PurchaseOrder, p.purchase_order_id)
            if po and po.organization_id == org_id:
                po.amount_paid = max(Decimal("0.00"), _d(po.amount_paid) - _d(p.amount))
        await self.db.flush()
        await self.audit.log(action="supplier.payment_deleted", user=user, organization_id=org_id,
                             entity_type="SupplierPayment", entity_id=p.id, request=request)
