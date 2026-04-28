"""
Order router - endpoints for managing orders (creation, status updates, assignment).
"""
from typing import List, Optional
import traceback
from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.core.dependencies import get_current_user, get_current_customer, require_role, get_org_context, get_store_scope, enforce_store_access
from app.models.user import User
from app.models.customer import Customer
from app.schemas.order import OrderCreate, OrderResponse, OrderUpdateStatus, OrderAssign, PaginatedOrderResponse, SubstitutionRejection
from app.services.order import OrderService

router = APIRouter(prefix="/orders", tags=["Orders"])

# ====================
# CUSTOMER B2C ROUTES
# ====================
@router.post("/checkout", response_model=OrderResponse)
async def checkout_order(
    store_id: UUID,  # Assume the frontend determines the closest store
    data: OrderCreate,
    current_customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_async_session)
):
    """Customer creates a new order."""
    order_service = OrderService(db)
    return await order_service.create_order(
        org_id=current_customer.organization_id, 
        store_id=store_id, 
        customer_id=current_customer.id, 
        data=data
    )

@router.get("/me", response_model=List[OrderResponse])
async def my_orders(
    current_customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_async_session)
):
    """List customer's orders."""
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    from app.models.order import Order, OrderItem
    query = select(Order).options(
        selectinload(Order.items).selectinload(OrderItem.product)
    ).where(Order.customer_id == current_customer.id).order_by(Order.created_at.desc())
    result = await db.execute(query)
    return list(result.scalars().all())

@router.get("/me/{order_id}", response_model=OrderResponse)
async def get_my_order(
    order_id: UUID,
    current_customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_async_session)
):
    """Get details of a specific order for the logged-in customer."""
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    from app.models.order import Order, OrderItem
    from app.core.exceptions import NotFoundException

    query = select(Order).options(
        selectinload(Order.items).selectinload(OrderItem.product)
    ).where(
        Order.id == order_id, 
        Order.customer_id == current_customer.id
    )
    result = await db.execute(query)
    order = result.scalar_one_or_none()
    
    if not order:
        raise NotFoundException("Order", order_id)
        
    return order


@router.post("/me/{order_id}/cancel", response_model=OrderResponse)
async def cancel_my_order(
    order_id: UUID,
    current_customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_async_session)
):
    """Customer cancels their own order (within cancellation window)."""
    order_service = OrderService(db)
    return await order_service.customer_cancel(order_id, current_customer.id)


@router.post("/{order_id}/reject-substitutions", response_model=OrderResponse)
async def reject_substitutions_at_door(
    order_id: UUID,
    rejections: List[SubstitutionRejection],
    current_user: User = Depends(require_role(["delivery_boy", "admin", "manager"])),
    db: AsyncSession = Depends(get_async_session)
):
    """Driver records substitutions rejected at the door. Auto-approved refund."""
    order_service = OrderService(db)
    order = await order_service.get_order(order_id)
    
    if current_user.role == "delivery_boy" and order.assigned_to != current_user.id:
        from app.core.exceptions import ForbiddenException
        raise ForbiddenException("You are not assigned to this order")
        
    if order.status not in ["out_for_delivery", "delivered"]:
        from app.core.exceptions import ValidationException
        raise ValidationException("Order must be out for delivery or delivered to reject substitutions at door")
        
    from app.services.refund import RefundService
    refund_service = RefundService(db)
    
    # Validation
    for r in rejections:
        item = next((i for i in order.items if str(i.id) == str(r.order_item_id)), None)
        if not item:
            from app.core.exceptions import ValidationException
            raise ValidationException(f"Item {r.order_item_id} not found in order")
        if not item.is_substituted:
            from app.core.exceptions import ValidationException
            raise ValidationException(f"Item {item.product_name} was not substituted")
    
    from decimal import Decimal
    from app.models.refund import Refund, RefundItem
    
    # Create auto-approved refund
    parent_refund = Refund(
        organization_id=order.organization_id,
        store_id=order.store_id,
        customer_id=order.customer_id,
        order_id=order.id,
        status="approved",
        destination="original_method",
        total_amount=Decimal("0.00")
    )
    db.add(parent_refund)
    await db.flush()
    
    for r in rejections:
        item = next((i for i in order.items if str(i.id) == str(r.order_item_id)))
        amount = item.effective_unit_price * r.quantity
        
        refund_item = RefundItem(
            refund_id=parent_refund.id,
            order_item_id=item.id,
            quantity=r.quantity,
            amount=amount,
            reason="substitution_rejected",
            status="approved",
            customer_notes=r.notes,
            requires_manual_review=False
        )
        db.add(refund_item)
        
        await refund_service.process_refund_item(
            parent_refund=parent_refund,
            refund_item=refund_item,
            status="approved",
            user=current_user
        )
        
    return await order_service.get_order(order_id)

# ====================
# ADMIN / STAFF ROUTES
# ====================
@router.get("", response_model=List[OrderResponse])
async def list_orders(
    skip: int = 0,
    limit: int = 100,
    org_id: UUID = Depends(get_org_context),
    store_scope: Optional[UUID] = Depends(get_store_scope),
    current_user: User = Depends(require_role(["admin", "manager", "cashier"])),
    db: AsyncSession = Depends(get_async_session)
):
    order_service = OrderService(db)
    return await order_service.get_orders(org_id=org_id, store_id=store_scope, skip=skip, limit=limit)

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order_details(
    order_id: UUID,
    org_id: UUID = Depends(get_org_context),
    store_scope: Optional[UUID] = Depends(get_store_scope),
    current_user: User = Depends(require_role(["admin", "manager", "delivery_boy", "cashier"])),
    db: AsyncSession = Depends(get_async_session)
):
    order_service = OrderService(db)
    order = await order_service.get_order(order_id, org_id)
    if store_scope:
        enforce_store_access(order.store_id, store_scope)
    return order

@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: UUID,
    data: OrderUpdateStatus,
    org_id: UUID = Depends(get_org_context),
    store_scope: Optional[UUID] = Depends(get_store_scope),
    current_user: User = Depends(require_role(["admin", "manager", "delivery_boy", "cashier"])),
    db: AsyncSession = Depends(get_async_session)
):
    order_service = OrderService(db)
    order = await order_service.get_order(order_id, org_id)
    if store_scope:
        enforce_store_access(order.store_id, store_scope)
        
    # Security: delivery_boy can only transition to 'delivered'
    if current_user.role == "delivery_boy":
        from app.core.exceptions import ValidationException
        if data.status != "delivered" or order.assigned_to != current_user.id:
            raise ValidationException("Unauthorized status transition for delivery boy")
            
    return await order_service.update_status(order_id, data.status, current_user)

@router.patch("/{order_id}/assign", response_model=OrderResponse)
async def assign_order(
    order_id: UUID,
    data: OrderAssign,
    org_id: UUID = Depends(get_org_context),
    store_scope: Optional[UUID] = Depends(get_store_scope),
    current_user: User = Depends(require_role(["admin", "manager"])),
    db: AsyncSession = Depends(get_async_session)
):
    order_service = OrderService(db)
    order = await order_service.get_order(order_id, org_id)
    if store_scope:
        enforce_store_access(order.store_id, store_scope)
        
    return await order_service.assign_delivery(order_id, data.delivery_boy_id, current_user)


# ====================
# DELIVERY BOY ROUTES
# ====================
@router.get("/delivery/my-orders", response_model=List[OrderResponse])
async def my_deliveries(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(require_role(["delivery_boy"])),
    db: AsyncSession = Depends(get_async_session)
):
    order_service = OrderService(db)
    return await order_service.get_assigned_orders(current_user.id, skip, limit)
