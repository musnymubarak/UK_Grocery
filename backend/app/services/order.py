"""
Order service - state machine and lifecycle for generic B2C orders.
"""
from uuid import UUID
from datetime import datetime, timezone
import random
import string
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import Request

from app.models.order import Order, OrderItem
from app.models.user import User
from app.schemas.order import OrderCreate, OrderUpdateStatus
from app.services.inventory import InventoryService
from app.core.exceptions import NotFoundException, ValidationException

VALID_TRANSITIONS = {
    "received":    ["packed", "cancelled"],
    "packed":      ["on_delivery", "cancelled"],
    "on_delivery": ["delivered"],
    "delivered":   [],
    "cancelled":   []
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
        order = await self.db.get(Order, order_id)
        if not order or (org_id and order.organization_id != org_id):
            raise NotFoundException("Order not found")
        return order

    async def get_orders(self, org_id: UUID, store_id: Optional[UUID] = None, skip: int = 0, limit: int = 100) -> List[Order]:
        query = select(Order).where(Order.organization_id == org_id)
        if store_id:
            query = query.where(Order.store_id == store_id)
        query = query.order_by(Order.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())
        
    async def get_assigned_orders(self, user_id: UUID, skip: int = 0, limit: int = 50) -> List[Order]:
        query = select(Order).where(Order.assigned_to == user_id).order_by(Order.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create_order(self, org_id: UUID, store_id: UUID, customer_id: UUID, data: OrderCreate) -> Order:
        if not data.items:
            raise ValidationException("Order must have at least one item")

        # Create Order
        order = Order(
            organization_id=org_id,
            store_id=store_id,
            customer_id=customer_id,
            delivery_address_id=data.delivery_address_id,
            order_number=self._generate_order_number(),
            status="received",
            payment_method=data.payment_method,
            notes=data.notes,
            delivery_instructions=data.delivery_instructions
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
            
        order.total = order.subtotal + order.delivery_fee - order.discount
        await self.db.flush()
        await self.db.refresh(order)
        return order

    async def update_status(self, order_id: UUID, new_status: str, user: User) -> Order:
        order = await self.get_order(order_id)
        
        if new_status not in VALID_TRANSITIONS:
            raise ValidationException(f"Invalid status: {new_status}")
            
        if new_status not in VALID_TRANSITIONS.get(order.status, []):
            raise ValidationException(f"Cannot transition from {order.status} to {new_status}")

        old_status = order.status
        order.status = new_status
        order.updated_at = datetime.now(timezone.utc)

        # Triggers
        if new_status == "packed":
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
            if old_status == "packed" or old_status == "on_delivery":
                # Restore stock fully since we hard-deducted
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
