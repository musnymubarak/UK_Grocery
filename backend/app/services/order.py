"""
Order service - state machine and lifecycle for generic B2C orders.
"""
from uuid import UUID
from datetime import datetime, timezone
import random
import string
from typing import List, Optional
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import Request

from app.models.order import Order, OrderItem
from app.models.user import User
from app.models.customer import CustomerAddress
from app.schemas.order import OrderCreate, OrderUpdateStatus
from app.services.inventory import InventoryService
from app.services.coupon import CouponService
from app.services.rewards import RewardsService
from app.core.exceptions import NotFoundException, ValidationException

VALID_TRANSITIONS = {
    "placed":                ["confirmed", "picking", "substitution_pending", "ready_for_collection", "assigned_to_driver", "out_for_delivery", "delivered", "rejected", "cancelled"],
    "confirmed":             ["picking", "substitution_pending", "ready_for_collection", "assigned_to_driver", "out_for_delivery", "delivered", "cancelled"],
    "picking":               ["substitution_pending", "ready_for_collection", "assigned_to_driver", "out_for_delivery", "delivered", "cancelled"],
    "substitution_pending":  ["picking", "ready_for_collection", "assigned_to_driver", "out_for_delivery", "delivered", "cancelled"],
    "ready_for_collection":  ["assigned_to_driver", "out_for_delivery", "delivered", "cancelled"],
    "assigned_to_driver":    ["out_for_delivery", "delivered", "cancelled"],
    "out_for_delivery":      ["delivered", "delivery_failed", "cancelled"],
    "delivered":             ["refund_requested"],
    "rejected":              [],
    "delivery_failed":       ["refund_requested"],
    "refund_requested":      ["refunded"],
    "refunded":              [],
    "cancelled":             [],
}

# Backward compatibility mapping
STATUS_ALIASES = {
    "received": "placed",
    "packed": "confirmed",
    "on_delivery": "out_for_delivery"
}

class OrderService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.inventory_service = InventoryService(db)

    def _generate_order_number(self) -> str:
        prefix = "ORD"
        random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        return f"{prefix}-{random_suffix}"

    async def get_order(self, order_id: UUID, org_id: Optional[UUID] = None) -> Order:
        from sqlalchemy.orm import selectinload
        query = select(Order).options(
            selectinload(Order.items).selectinload(OrderItem.product)
        ).where(Order.id == order_id)
        if org_id:
            query = query.where(Order.organization_id == org_id)
        result = await self.db.execute(query)
        order = result.scalar_one_or_none()
        if not order:
            raise NotFoundException("Order not found")
        return order

    async def get_orders(self, org_id: UUID, store_id: Optional[UUID] = None, skip: int = 0, limit: int = 100) -> List[Order]:
        from sqlalchemy.orm import selectinload
        query = select(Order).options(selectinload(Order.items)).where(Order.organization_id == org_id)
        if store_id:
            query = query.where(Order.store_id == store_id)
        query = query.order_by(Order.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())
        
    async def get_assigned_orders(self, user_id: UUID, skip: int = 0, limit: int = 50) -> List[Order]:
        from sqlalchemy.orm import selectinload
        query = select(Order).options(selectinload(Order.items)).where(Order.assigned_to == user_id).order_by(Order.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create_order(self, org_id: UUID, store_id: UUID, customer_id: UUID, data: OrderCreate) -> Order:
        if not data.items:
            raise ValidationException("Order must have at least one item")

        # Handle delivery address
        delivery_instr = data.delivery_instructions or ""
        
        if data.delivery_address_id:
            db_addr = await self.db.get(CustomerAddress, data.delivery_address_id)
            if not db_addr or db_addr.customer_id != customer_id:
                raise ValidationException("Invalid delivery address")
            
            addr_str = f"Saved Address: {db_addr.street}, {db_addr.city}, {db_addr.postcode}"
            delivery_instr = f"{addr_str}\n{delivery_instr}".strip()
            
        elif data.delivery_address:
            addr_str = f"Manual Address: {data.delivery_address}"
            if data.delivery_postcode:
                addr_str += f" ({data.delivery_postcode})"
            delivery_instr = f"{addr_str}\n{delivery_instr}".strip()

        # Payment Status Logic
        pm = data.payment_method or "cod"
        ps = "pending"
        if pm == "online":
            ps = "paid" # Mock success

        # Create Order
        order = Order(
            organization_id=org_id,
            store_id=store_id,
            customer_id=customer_id,
            delivery_address_id=data.delivery_address_id,
            delivery_address=data.delivery_address,
            delivery_postcode=data.delivery_postcode,
            order_number=self._generate_order_number(),
            status="placed",
            payment_method=pm,
            payment_status=ps,
            notes=data.notes,
            delivery_instructions=delivery_instr,
            order_type=data.order_type,
            subtotal=Decimal("0.00"),
            delivery_fee=Decimal("0.00"),
            discount=Decimal("0.00"),
            service_fee=Decimal("0.50"),
            tip_amount=Decimal("0.00"),
        )
        self.db.add(order)
        await self.db.flush()

        # Add Items and Soft Reserve
        for item_data in data.items:
            from app.models.product import Product
            product = await self.db.get(Product, item_data.product_id)
            if not product:
                raise ValidationException(f"Product {item_data.product_id} not found")

            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                product_sku=product.sku,
                quantity=item_data.quantity,
                unit_price=product.selling_price,
                tax_amount=0, # Simplified
                total=product.selling_price * item_data.quantity
            )
            self.db.add(order_item)
            
            order.subtotal += order_item.total

            # Soft reserve from inventory
            await self.inventory_service.reserve_for_order(
                product_id=product.id,
                store_id=store_id,
                quantity=int(item_data.quantity)
            )

        # Apply Coupon
        if data.coupon_code:
            from app.services.coupon import CouponService
            coupon_service = CouponService(self.db)
            validation_resp = await coupon_service.validate_coupon(
                org_id=org_id,
                code=data.coupon_code,
                customer_id=customer_id,
                store_id=store_id,
                subtotal=order.subtotal,
                delivery_fee=order.delivery_fee
            )
            if not validation_resp.valid:
                raise ValidationException(validation_resp.message or "Invalid coupon")
                
            order.discount = validation_resp.discount_amount
            order.coupon_id = validation_resp.coupon_id
            order.coupon_code = data.coupon_code
            
            # Record redemption
            await coupon_service.record_redemption(validation_resp.coupon_id, customer_id, order.id)
            
        order.total = max(Decimal("0.00"), order.subtotal + order.delivery_fee + order.service_fee + order.tip_amount - order.discount)
        await self.db.flush()
        return await self.get_order(order.id)

    async def update_status(self, order_id: UUID, new_status: str, user: User) -> Order:
        order = await self.get_order(order_id)
        
        # Normalize status (backward compatibility)
        new_status = STATUS_ALIASES.get(new_status, new_status)
        current_status = STATUS_ALIASES.get(order.status, order.status)
        
        if new_status not in VALID_TRANSITIONS:
            raise ValidationException(f"Invalid status: {new_status}")
            
        if new_status not in VALID_TRANSITIONS.get(current_status, []):
            raise ValidationException(f"Cannot transition from {current_status} to {new_status}")

        old_status = order.status
        order.status = new_status
        order.updated_at = datetime.now(timezone.utc)

        # Timestamps and triggers
        if new_status == "confirmed":
            order.confirmed_at = datetime.now(timezone.utc)
        elif new_status == "picking":
            order.picked_at = datetime.now(timezone.utc)
        elif new_status == "out_for_delivery":
            order.dispatched_at = datetime.now(timezone.utc)
        working_statuses = ["confirmed", "picking", "substitution_pending", "ready_for_collection", "assigned_to_driver", "out_for_delivery", "delivered"]
        if old_status == "placed" and new_status in working_statuses:
            # HARD COMMIT. Deduct inventory via FOR UPDATE lock
            for item in order.items:
                await self.inventory_service.deduct_for_order(
                    product_id=item.product_id,
                    store_id=order.store_id,
                    quantity=int(item.quantity),
                    order_reference=order.order_number,
                    user_id=user.id
                )
                
        elif new_status == "cancelled":
            if old_status in working_statuses:
                # Restore stock fully since we hard-deducted (or were about to)
                for item in order.items:
                    await self.inventory_service.restore_for_cancelled_after_pack(
                        product_id=item.product_id,
                        store_id=order.store_id,
                        quantity=int(item.quantity),
                        order_reference=order.order_number,
                        user_id=user.id
                    )
            else:
                # Still in Received. Just release the soft-reservation
                for item in order.items:
                    await self.inventory_service.release_reservation(
                        product_id=item.product_id,
                        store_id=order.store_id,
                        quantity=int(item.quantity)
                    )

        elif new_status == "delivered":
            order.delivered_at = datetime.now(timezone.utc)
            if order.payment_method == "cod":
                order.payment_status = "paid"
                
            # Trigger loyalty tracking
            rewards_service = RewardsService(self.db)
            await rewards_service.log_order_spend(
                org_id=order.organization_id,
                customer_id=order.customer_id,
                store_id=order.store_id,
                amount=order.total
            )

        await self.db.flush()
        await self.db.refresh(order)
        return order

    async def assign_delivery(self, order_id: UUID, delivery_boy_id: UUID, current_user: User) -> Order:
        order = await self.get_order(order_id)
        
        db_user = await self.db.get(User, delivery_boy_id)
        if not db_user or db_user.role != "delivery_boy":
            raise ValidationException("Invalid delivery boy ID")
            
        if db_user.store_id and db_user.store_id != order.store_id:
            raise ValidationException("Delivery boy must belong to the same store")

        order.assigned_to = delivery_boy_id
        await self.db.flush()
        await self.db.refresh(order)
        return order
