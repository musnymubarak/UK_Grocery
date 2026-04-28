"""Refund service — request, approve, and reject granular refunds."""
from uuid import UUID
from decimal import Decimal
from typing import List, Optional, Dict
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.refund import Refund, RefundItem
from app.models.order import Order, OrderItem
from app.models.user import User
from app.services.wallet import WalletService
from app.core.exceptions import NotFoundException, ValidationException

class RefundService:
    # Industry standard: 72 hours after delivered_at
    REFUND_WINDOW_HOURS = 72

    def __init__(self, db: AsyncSession):
        self.db = db

    async def request_granular_refund(
        self, 
        customer_id: UUID, 
        order_id: UUID, 
        items_data: List[Dict], # List of {order_item_id, quantity, reason}
        destination: str = "wallet"
    ) -> Refund:
        """Customer requests a refund for specific items in a delivered order."""
        order = await self.db.get(Order, order_id)
        if not order or order.customer_id != customer_id:
            raise NotFoundException("Order", order_id)

        # Rule: Only delivered or failed delivery orders
        if order.status not in ("delivered", "delivery_failed"):
            raise ValidationException(
                f"Cannot request refund for order in '{order.status}' status. "
            )

        # Rule: 72-hour window check
        if order.delivered_at:
            now = datetime.now(timezone.utc)
            if (now - order.delivered_at) > timedelta(hours=self.REFUND_WINDOW_HOURS):
                raise ValidationException("Refund window has closed (72 hours exceeded)")

        # Create parent Refund
        refund = Refund(
            order_id=order_id,
            customer_id=customer_id,
            destination=destination,
            status="pending",
            total_amount=Decimal("0.00")
        )
        self.db.add(refund)
        await self.db.flush()

        for item_req in items_data:
            order_item_id = item_req["order_item_id"]
            qty = Decimal(str(item_req["quantity"]))
            reason = item_req["reason"]

            order_item = await self.db.get(OrderItem, order_item_id)
            if not order_item or order_item.order_id != order_id:
                raise ValidationException(f"Invalid order item ID: {order_item_id}")

            # Validation: Quantity must be valid
            remaining_qty = order_item.quantity - order_item.refunded_quantity
            if qty <= 0 or qty > remaining_qty:
                raise ValidationException(
                    f"Invalid quantity for {order_item.product_name}. Requested: {qty}, Available: {remaining_qty}"
                )

            # Amount calculation: logic uses effective_unit_price (captured post-discount at order time)
            # Fallback to unit_price if effective_unit_price is null (for legacy orders)
            base_price = order_item.effective_unit_price or order_item.unit_price
            refund_amount = (base_price * qty).quantize(Decimal("0.01"))

            refund_item = RefundItem(
                refund_id=refund.id,
                order_item_id=order_item_id,
                reason=reason,
                quantity=qty,
                amount=refund_amount,
                status="pending"
            )
            self.db.add(refund_item)

        await self.db.flush()
        return refund

    async def process_refund_item(
        self, 
        refund_item_id: UUID, 
        status: str, 
        admin_user: User, 
        admin_notes: str = None
    ) -> RefundItem:
        """Admin approves or rejects an individual refund item."""
        # 1. Atomic Locking: Lock the RefundItem and OrderItem
        refund_item = await self.db.get(RefundItem, refund_item_id)
        if not refund_item:
            raise NotFoundException("RefundItem", refund_item_id)

        if refund_item.status != "pending":
            raise ValidationException(f"Refund item is already '{refund_item.status}'")

        # Lock parent Refund and OrderItem
        query_order_item = select(OrderItem).where(OrderItem.id == refund_item.order_item_id).with_for_update()
        order_item_res = await self.db.execute(query_order_item)
        order_item = order_item_res.scalar_one()

        query_refund = select(Refund).where(Refund.id == refund_item.refund_id).with_for_update()
        refund_res = await self.db.execute(query_refund)
        parent_refund = refund_res.scalar_one()

        # 2. Update status
        refund_item.status = status
        refund_item.admin_notes = admin_notes

        if status == "approved":
            # Check remaining quantity (double-check after lock)
            remaining_qty = order_item.quantity - order_item.refunded_quantity
            if refund_item.quantity > remaining_qty:
                raise ValidationException("Approved quantity exceeds remaining OrderItem quantity")

            # Update OrderItem counter
            order_item.refunded_quantity += refund_item.quantity

            # 3. Branch Logic: Refund Output
            if parent_refund.destination == "wallet":
                wallet = WalletService(self.db)
                await wallet.credit(
                    customer_id=parent_refund.customer_id,
                    amount=refund_item.amount,
                    source="refund",
                    reference_id=refund_item.id,
                    notes=f"Refund for item in Order: {order_item.order_id}. Reason: {refund_item.reason}"
                )
            elif parent_refund.destination == "original_method":
                order = await self.db.get(Order, parent_refund.order_id)
                if order and order.stripe_charge_id:
                    from app.services.payment import PaymentService
                    payment_svc = PaymentService()
                    amount_pence = int(refund_item.amount * 100)
                    await payment_svc.create_refund(
                        charge_id=order.stripe_charge_id,
                        amount_pence=amount_pence,
                        metadata={"refund_item_id": str(refund_item.id)}
                    )
                else:
                    refund_item.requires_manual_review = True
                    import logging
                    logging.getLogger(__name__).warning(
                        f"No stripe_charge_id on order {parent_refund.order_id}"
                    )

        # 4. Recalculate Parent State
        await self._recalc_parent_refund(parent_refund)
        
        # 5. TODO: Hook for customer notification (approved/rejected)
        
        await self.db.flush()
        
        # 5. Fire Webhook
        from app.services.webhook import WebhookService
        webhook_svc = WebhookService(self.db)
        await webhook_svc.dispatch(
            org_id=parent_refund.organization_id,
            event=f"refund.item.{status}",
            payload={
                "refund_id": str(parent_refund.id),
                "refund_item_id": str(refund_item.id),
                "order_id": str(parent_refund.order_id),
                "status": status,
                "amount": float(refund_item.amount)
            }
        )
        
        return refund_item

    async def _recalc_parent_refund(self, refund: Refund):
        """Derive parent status and total_amount from children."""
        items = refund.items
        if not items:
            return

        # Status Logic Priority:
        # 1. Any Pending -> Pending
        # 2. All Approved -> Approved
        # 3. All Rejected -> Rejected
        # 4. Else -> Partially Approved
        statuses = [it.status for it in items]
        
        if "pending" in statuses:
            new_status = "pending"
        elif all(s == "approved" for s in statuses):
            new_status = "approved"
        elif all(s == "rejected" for s in statuses):
            new_status = "rejected"
        else:
            new_status = "partially_approved"

        refund.status = new_status

        # Calculate Approved Total
        approved_sum = sum(it.amount for it in items if it.status == "approved")
        
        # Delivery Fee Rule: IF AND ONLY IF all items in a delivery order are approved -> Add delivery_fee
        order = await self.db.get(Order, refund.order_id)
        if new_status == "approved" and order.order_type == "delivery":
            approved_sum += order.delivery_fee
            
            # Add service fee logic if the entire order is fully cancelled/refunded
            all_items_qty = sum(oi.quantity for oi in order.items)
            all_refunded_qty = sum(oi.refunded_quantity for oi in order.items)
            if all_refunded_qty >= all_items_qty:
                approved_sum += order.service_fee
            
        refund.total_amount = approved_sum

        # Sync Order Payment Status
        if approved_sum >= order.total:
            order.payment_status = "refunded"
        elif approved_sum > 0:
            order.payment_status = "partially_refunded"

    async def get_refunds_for_org(
        self, org_id: UUID, status_filter: str = None, skip: int = 0, limit: int = 50
    ) -> List[Refund]:
        """Admin: list all refund requests. Priority: pending first, then oldest."""
        from app.models.refund import RefundItem
        from sqlalchemy.orm import selectinload
        
        query = (
            select(Refund)
            .options(
                selectinload(Refund.items).selectinload(RefundItem.evidence)
            )
            .join(Order, Order.id == Refund.order_id)
            .where(Order.organization_id == org_id)
        )
        if status_filter:
            query = query.where(Refund.status == status_filter)
            if status_filter == "pending":
                query = query.order_by(Refund.created_at.asc())
            else:
                query = query.order_by(Refund.created_at.desc())
        else:
            from sqlalchemy import case
            status_order = case((Refund.status == "pending", 1), else_=2)
            query = query.order_by(status_order, Refund.created_at.desc())
            
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def trigger_automated_full_refund(self, order: Order, reason: str = "Order Cancelled") -> Refund:
        """System: Trigger a full refund for a cancelled/rejected order. Auto-approves everything."""
        # 1. Determine destination
        destination = "wallet" if order.payment_method == "wallet" else "original_method"
        
        # 2. Create Parent Refund (Auto-approved)
        refund = Refund(
            order_id=order.id,
            customer_id=order.customer_id,
            destination=destination,
            status="approved", # Start as approved
            total_amount=order.total, # Full order refund
            admin_notes=f"Automated system refund: {reason}"
        )
        self.db.add(refund)
        await self.db.flush()

        # 3. Create Approved RefundItems for all order items
        for item in order.items:
            refund_item = RefundItem(
                refund_id=refund.id,
                order_item_id=item.id,
                reason=reason,
                quantity=item.quantity,
                amount=item.total, # Item level total
                status="approved",
                admin_notes="Auto-approved by system cancellation"
            )
            self.db.add(refund_item)
            
            # Update Item counters
            item.refunded_quantity = item.quantity

        # 4. Handle Financial Output
        if destination == "wallet":
            wallet = WalletService(self.db)
            await wallet.credit(
                customer_id=order.customer_id,
                amount=order.total,
                source="refund",
                reference_id=refund.id,
                notes=f"Full Refund for Cancelled Order: {order.order_number}"
            )
        elif destination == "original_method":
            if order.stripe_charge_id:
                from app.services.payment import PaymentService
                payment_svc = PaymentService()
                amount_pence = int(refund.total_amount * 100)
                await payment_svc.create_refund(
                    charge_id=order.stripe_charge_id,
                    amount_pence=amount_pence,
                    metadata={"order_id": str(order.id)}
                )
            else:
                import logging
                logging.getLogger(__name__).warning(
                    f"No stripe_charge_id on order {order.id} for automated full refund"
                )

        # 5. Update Order Payment Status
        order.payment_status = "refunded"
        
        await self.db.flush()
        return refund
