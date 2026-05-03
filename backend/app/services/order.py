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
            selectinload(Order.items).selectinload(OrderItem.product),
            selectinload(Order.customer)
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
        query = select(Order).options(
            selectinload(Order.items).selectinload(OrderItem.product),
            selectinload(Order.customer)
        ).where(Order.organization_id == org_id)
        if store_id:
            query = query.where(Order.store_id == store_id)
        query = query.order_by(Order.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())
        
    async def get_assigned_orders(self, user_id: UUID, skip: int = 0, limit: int = 50) -> List[Order]:
        from sqlalchemy.orm import selectinload
        query = select(Order).options(
            selectinload(Order.items).selectinload(OrderItem.product),
            selectinload(Order.customer)
        ).where(Order.assigned_to == user_id).order_by(Order.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create_order(self, org_id: UUID, store_id: UUID, customer_id: UUID, data: OrderCreate) -> Order:
        if not data.items:
            raise ValidationException("Order must have at least one item")

        # Age Restriction Validation
        from app.models.product import Product
        has_age_restricted = False
        for item_data in data.items:
            product = await self.db.get(Product, item_data.product_id)
            if product and product.is_age_restricted:
                has_age_restricted = True
                break
        
        if has_age_restricted and not data.age_confirmed:
            raise ValidationException("Age confirmation is required for restricted items.")

        # Handle delivery address
        delivery_instr = data.delivery_instructions or ""
        captured_postcode = data.delivery_postcode
        
        if data.delivery_address_id:
            db_addr = await self.db.get(CustomerAddress, data.delivery_address_id)
            if not db_addr or db_addr.customer_id != customer_id:
                raise ValidationException("Invalid delivery address")
            
            captured_postcode = db_addr.postcode
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
            delivery_postcode=captured_postcode,
            order_number=self._generate_order_number(),
            status="placed",
            payment_method=pm,
            payment_status=ps,
            notes=data.notes,
            delivery_instructions=delivery_instr,
            scheduled_delivery_start=data.scheduled_delivery_start,
            scheduled_delivery_end=data.scheduled_delivery_end,
            order_type=data.order_type,
            delivery_fee=Decimal("0.00"),
            discount=Decimal("0.00"),
            service_fee=Decimal("0.00"),
            tip_amount=Decimal("0.00"),
        )
        self.db.add(order)
        await self.db.flush()

        # Set initial cancel window (10 mins) and log status
        from datetime import timedelta
        order.cancel_window_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
        
        from app.models.order import OrderStatusHistory
        history = OrderStatusHistory(
            order_id=order.id,
            from_status=None,
            to_status="placed",
            changed_by_type="customer",
            changed_by_id=customer_id,
        )
        self.db.add(history)
        await self.db.flush()

        # Calculate initial delivery fee
        if order.order_type == "delivery" and order.delivery_postcode:
            from app.services.delivery import DeliveryZoneService
            from app.schemas.delivery_zone import FeeCalculationRequest
            fee_req = FeeCalculationRequest(
                store_id=store_id,
                postcode=order.delivery_postcode,
                order_total=Decimal("0.00"),
            )
            fee_resp = await DeliveryZoneService.calculate_fee(self.db, fee_req)
            if not fee_resp.deliverable:
                raise ValidationException(f"Delivery to postcode '{order.delivery_postcode}' is not available for this store")
            order.delivery_fee = fee_resp.fee

        # Add Items and Soft Reserve
        subtotal = Decimal("0.00")
        promo_items = []
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
                effective_unit_price=product.selling_price, # Initialized to full price; will be adjusted if distributed discounts are added
                tax_amount=0, # Simplified
                total=product.selling_price * item_data.quantity
            )
            self.db.add(order_item)
            
            subtotal += order_item.total
            
            # Prepare for promo evaluation
            promo_items.append({
                "product_id": product.id,
                "quantity": item_data.quantity,
                "price": product.selling_price
            })

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
                subtotal=subtotal,
                delivery_fee=order.delivery_fee
            )
            if not validation_resp.valid:
                raise ValidationException(validation_resp.message or "Invalid coupon")
                
            order.discount = validation_resp.discount_amount
            order.coupon_id = validation_resp.coupon_id
            order.coupon_code = data.coupon_code
            
            # Record redemption
            await coupon_service.record_redemption(validation_resp.coupon_id, customer_id, order.id)
            
        # Recalculate delivery fee with real subtotal (for free delivery threshold)
        if order.order_type == "delivery" and order.delivery_postcode:
            from app.schemas.delivery_zone import FeeCalculationRequest
            from app.services.delivery import DeliveryZoneService
            fee_req = FeeCalculationRequest(
                store_id=store_id,
                postcode=order.delivery_postcode,
                order_total=subtotal,
            )
            fee_resp = await DeliveryZoneService.calculate_fee(self.db, fee_req)
            order.delivery_fee = fee_resp.fee

            # Membership discount: premium/vip customers get free delivery
            from app.models.customer import Customer
            customer = await self.db.get(Customer, customer_id)
            if customer and customer.membership_tier in ("premium", "vip"):
                order.delivery_fee = Decimal("0.00")
            
            # Apply Store Surge Multiplier if active
            from app.models.store import Store
            store = await self.db.get(Store, store_id)
            if store and store.is_surge_active and store.surge_multiplier > 1.0:
                order.delivery_fee = (order.delivery_fee * store.surge_multiplier).quantize(Decimal("0.01"))

        # 5. Promotions (New in Phase 4)
        from app.services.promotion import PromotionService
        promo_service = PromotionService(self.db)
        
        applied_promos = await promo_service.evaluate_cart(promo_items, order.organization_id, order.store_id)
        promotion_discount = Decimal(str(sum(p["discount_amount"] for p in applied_promos)))
        
        order.promotion_discount = promotion_discount
        order.applied_promotions = [
            {"promotion_id": str(p["promotion_id"]), "name": p["name"], "amount": float(p["discount_amount"])} 
            for p in applied_promos
        ]

        order.total = max(Decimal("0.00"), subtotal + order.delivery_fee + order.service_fee + order.tip_amount - order.discount - promotion_discount)
        await self.db.flush()
        
        # 7. Fire Webhook (New in Phase 4)
        from app.services.webhook import WebhookService
        await WebhookService(self.db).dispatch(
            org_id=order.organization_id,
            event_type="order.placed",
            payload={
                "order_id": str(order.id),
                "order_number": order.order_number,
                "status": "placed",
                "customer_id": str(order.customer_id)
            }
        )
        
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

        # Log status transition
        from app.models.order import OrderStatusHistory
        history = OrderStatusHistory(
            order_id=order.id,
            from_status=old_status,
            to_status=new_status,
            changed_by_type="staff",
            changed_by_id=user.id,
        )
        self.db.add(history)

        # Send in-app notification to customer
        try:
            from app.services.notification import NotificationService
            notif_service = NotificationService(self.db)
            
            STATUS_MESSAGES = {
                "confirmed": ("Order Confirmed ✅", "Your order {num} has been accepted and is being prepared."),
                "picking": ("Order Being Picked 🛒", "Your order {num} is being picked from the shelves."),
                "ready_for_collection": ("Ready for Collection 📦", "Your order {num} is ready! Head to the store."),
                "out_for_delivery": ("On Its Way! 🚗", "Your order {num} is out for delivery."),
                "delivered": ("Delivered! 🎉", "Your order {num} has been delivered. Enjoy!"),
                "rejected": ("Order Rejected ❌", "Sorry, your order {num} could not be fulfilled."),
                "cancelled": ("Order Cancelled", "Your order {num} has been cancelled."),
            }
            
            if new_status in STATUS_MESSAGES:
                title, body = STATUS_MESSAGES[new_status]
                await notif_service.send(
                    customer_id=order.customer_id,
                    title=title,
                    body=body.format(num=order.order_number),
                    notification_type="order_update",
                    reference_id=order.id,
                )
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Failed to send notification: {e}")

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
            
            # AUTOMATED REFUND: If order is paid and now cancelled/rejected, refund the total
            if order.payment_status == "paid":
                from app.services.refund import RefundService
                refund_service = RefundService(self.db)
                await refund_service.trigger_automated_full_refund(order, reason=f"System {new_status}")

        elif new_status == "delivered":
            order.delivered_at = datetime.now(timezone.utc)
            if order.payment_method == "cod":
                order.payment_status = "paid"
                

            
            # Credit referrer on first delivered order
            from app.services.referral import ReferralService
            referral_service = ReferralService(self.db)
            await referral_service.credit_referrer_on_first_order(order.customer_id, order.id)
                
            # Increment driver delivery count
            if order.assigned_to:
                from app.services.driver import DriverService
                driver_service = DriverService(self.db)
                await driver_service.increment_deliveries(order.assigned_to)

            # Trigger loyalty tracking background task
            try:
                from app.tasks.rewards import process_delivered_order_rewards
                process_delivered_order_rewards.delay(
                    str(order.organization_id),
                    str(order.customer_id),
                    str(order.store_id),
                    str(order.total)
                )
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Failed to queue process_delivered_order_rewards: {e}")

        # Fire Webhook (New in Phase 4)
        from app.services.webhook import WebhookService
        await WebhookService(self.db).dispatch(
            org_id=order.organization_id,
            event_type=f"order.{new_status}",
            payload={
                "order_id": str(order.id),
                "order_number": order.order_number,
                "status": new_status,
                "customer_id": str(order.customer_id)
            }
        )

        await self.db.flush()
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
        return order

    async def customer_cancel(self, order_id: UUID, customer_id: UUID) -> Order:
        """Customer self-cancellation — only within the cancel window."""
        order = await self.get_order(order_id)
        
        if order.customer_id != customer_id:
            raise ValidationException("You can only cancel your own orders")
        
        if order.status != "placed":
            raise ValidationException(
                f"Cannot cancel order in '{order.status}' status. "
                "Only orders in 'placed' status can be cancelled."
            )
        
        now = datetime.now(timezone.utc)
        if order.cancel_window_expires_at and now > order.cancel_window_expires_at:
            raise ValidationException(
                "Cancellation window has expired. "
                "Please contact support or request a refund after delivery."
            )
        
        order.status = "cancelled"
        order.updated_at = now
        
        # Release soft-reserved inventory
        for item in order.items:
            await self.inventory_service.release_reservation(
                product_id=item.product_id,
                store_id=order.store_id,
                quantity=int(item.quantity)
            )
        
        # Log status history
        from app.models.order import OrderStatusHistory
        history = OrderStatusHistory(
            order_id=order.id,
            from_status="placed",
            to_status="cancelled",
            changed_by_type="customer",
            changed_by_id=customer_id,
            notes="Customer self-cancelled within cancellation window",
        )
        self.db.add(history)
        
        # AUTOMATED REFUND: If order is paid and now cancelled, refund the total
        if order.payment_status == "paid":
            from app.services.refund import RefundService
            refund_service = RefundService(self.db)
            await refund_service.trigger_automated_full_refund(order, reason="Customer Self-Cancellation")
        
        await self.db.flush()
        return order
