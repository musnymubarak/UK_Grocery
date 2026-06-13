"""
PurchaseOrderService — create POs with line items, manage status, and receive
goods (which feeds real stock via InventoryService.add_purchase).
"""
import random
import string
from uuid import UUID
from typing import List, Optional
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Request

from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem
from app.models.supplier import Supplier
from app.models.product import Product
from app.schemas.purchase_order import PurchaseOrderCreate, PurchaseOrderUpdate, ReceiveRequest
from app.schemas.inventory import PurchaseEntry
from app.services.inventory import InventoryService
from app.services.audit import AuditService
from app.core.exceptions import NotFoundException, ValidationException

VALID_STATUSES = {"draft", "sent", "partially_received", "received", "cancelled"}


def _gen_po_number() -> str:
    return "PO-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=8))


def _d(v) -> Decimal:
    return Decimal(str(v or 0))


class PurchaseOrderService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.audit = AuditService(db)

    def _decorate(self, po: PurchaseOrder) -> PurchaseOrder:
        po.supplier_name = po.supplier.name if po.supplier else None
        return po

    async def list_orders(self, org_id: UUID, supplier_id: Optional[UUID] = None, status: Optional[str] = None) -> List[PurchaseOrder]:
        q = select(PurchaseOrder).where(PurchaseOrder.organization_id == org_id, PurchaseOrder.is_deleted == False)
        if supplier_id:
            q = q.where(PurchaseOrder.supplier_id == supplier_id)
        if status:
            q = q.where(PurchaseOrder.status == status)
        q = q.order_by(PurchaseOrder.created_at.desc())
        result = await self.db.execute(q)
        return [self._decorate(po) for po in result.scalars().all()]

    async def get_order(self, org_id: UUID, po_id: UUID) -> PurchaseOrder:
        po = await self.db.get(PurchaseOrder, po_id)
        if not po or po.is_deleted or po.organization_id != org_id:
            raise NotFoundException("PurchaseOrder", po_id)
        return self._decorate(po)

    async def create_with_items(self, org_id: UUID, data: PurchaseOrderCreate, user, request: Request = None) -> PurchaseOrder:
        supplier = await self.db.get(Supplier, data.supplier_id)
        if not supplier or supplier.is_deleted or supplier.organization_id != org_id:
            raise NotFoundException("Supplier", data.supplier_id)

        po = PurchaseOrder(
            organization_id=org_id,
            supplier_id=data.supplier_id,
            store_id=data.store_id,
            po_number=_gen_po_number(),
            status="draft",
            expected_date=data.expected_date,
            notes=data.notes,
            created_by_user_id=user.id,
        )
        self.db.add(po)
        await self.db.flush()

        subtotal = Decimal("0.00")
        for line in data.items:
            product = await self.db.get(Product, line.product_id)
            if not product or product.is_deleted or product.organization_id != org_id:
                raise ValidationException(f"Product {line.product_id} not found")
            unit_cost = _d(line.unit_cost) if line.unit_cost is not None else _d(product.cost_price)
            line_total = unit_cost * line.quantity_ordered
            self.db.add(PurchaseOrderItem(
                purchase_order_id=po.id,
                product_id=product.id,
                product_name=product.name,
                product_sku=product.sku,
                quantity_ordered=line.quantity_ordered,
                quantity_received=0,
                unit_cost=unit_cost,
                total=line_total,
            ))
            subtotal += line_total

        po.subtotal = subtotal
        po.total = subtotal
        await self.db.flush()
        await self.db.refresh(po)
        await self.audit.log(action="purchase_order.created", user=user, organization_id=org_id, store_id=po.store_id,
                             entity_type="PurchaseOrder", entity_id=po.id,
                             new_value={"po_number": po.po_number, "total": float(po.total)}, request=request)
        po.supplier_name = supplier.name
        return po

    async def update(self, org_id: UUID, po_id: UUID, data: PurchaseOrderUpdate, user, request: Request = None) -> PurchaseOrder:
        po = await self.get_order(org_id, po_id)
        upd = data.model_dump(exclude_unset=True)
        new_status = upd.get("status")
        if new_status:
            if new_status not in VALID_STATUSES:
                raise ValidationException(f"Invalid status '{new_status}'")
            if new_status in ("partially_received", "received"):
                raise ValidationException("Use the receive action to mark stock received")
        for k, v in upd.items():
            setattr(po, k, v)
        await self.db.flush()
        await self.db.refresh(po)
        await self.audit.log(action="purchase_order.updated", user=user, organization_id=org_id,
                             entity_type="PurchaseOrder", entity_id=po.id, new_value=upd, request=request)
        return self._decorate(po)

    async def cancel(self, org_id: UUID, po_id: UUID, user, request: Request = None) -> PurchaseOrder:
        po = await self.get_order(org_id, po_id)
        if po.status == "received":
            raise ValidationException("Cannot cancel a fully received purchase order")
        po.status = "cancelled"
        await self.db.flush()
        await self.db.refresh(po)
        await self.audit.log(action="purchase_order.cancelled", user=user, organization_id=org_id,
                             entity_type="PurchaseOrder", entity_id=po.id, request=request)
        return self._decorate(po)

    async def delete(self, org_id: UUID, po_id: UUID, user, request: Request = None) -> None:
        po = await self.get_order(org_id, po_id)
        if po.status != "draft":
            raise ValidationException("Only draft purchase orders can be deleted")
        po.is_deleted = True
        await self.db.flush()
        await self.audit.log(action="purchase_order.deleted", user=user, organization_id=org_id,
                             entity_type="PurchaseOrder", entity_id=po.id, request=request)

    async def receive(self, org_id: UUID, po_id: UUID, data: ReceiveRequest, user, request: Request = None) -> PurchaseOrder:
        po = await self.get_order(org_id, po_id)
        if po.status in ("cancelled", "received"):
            raise ValidationException(f"Cannot receive a {po.status} purchase order")

        items_by_id = {item.id: item for item in po.items}
        inventory = InventoryService(self.db)

        for receipt in data.receipts:
            item = items_by_id.get(receipt.item_id)
            if not item:
                raise ValidationException(f"Line item {receipt.item_id} is not on this purchase order")
            remaining = item.quantity_ordered - item.quantity_received
            if receipt.quantity > remaining:
                raise ValidationException(
                    f"Receiving {receipt.quantity} exceeds remaining {remaining} for {item.product_name}"
                )
            await inventory.add_purchase(
                PurchaseEntry(
                    product_id=item.product_id,
                    store_id=po.store_id,
                    quantity=receipt.quantity,
                    reference=po.po_number,
                    notes=f"Goods-in for {po.po_number}",
                ),
                user=user, org_id=org_id, request=request,
            )
            item.quantity_received += receipt.quantity

        fully = all(it.quantity_received >= it.quantity_ordered for it in po.items)
        any_received = any(it.quantity_received > 0 for it in po.items)
        po.status = "received" if fully else ("partially_received" if any_received else po.status)
        await self.db.flush()
        await self.db.refresh(po)
        await self.audit.log(action="purchase_order.received", user=user, organization_id=org_id, store_id=po.store_id,
                             entity_type="PurchaseOrder", entity_id=po.id, new_value={"status": po.status}, request=request)
        return self._decorate(po)
