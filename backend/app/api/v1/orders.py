"""
Order router - endpoints for managing orders (creation, status updates, assignment).
"""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.core.dependencies import get_current_user, get_current_customer, require_role, get_org_context, get_store_scope, enforce_store_access
from app.models.user import User
from app.models.customer import Customer
from app.schemas.order import OrderCreate, OrderResponse, OrderUpdateStatus, OrderAssign, PaginatedOrderResponse
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
    # Simplified: Ideally this needs to be a method in OrderService to get by customer_id
    from sqlalchemy import select
    from app.models.order import Order
    query = select(Order).where(Order.customer_id == current_customer.id).order_by(Order.created_at.desc())
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
    from app.models.order import Order
    from app.core.exceptions import NotFoundException

    query = select(Order).where(
        Order.id == order_id, 
        Order.customer_id == current_customer.id
    )
    result = await db.execute(query)
    order = result.scalar_one_or_none()
    
    if not order:
        raise NotFoundException("Order", order_id)
        
    return order


# ====================
# ADMIN / STAFF ROUTES
# ====================
@router.get("", response_model=List[OrderResponse])
async def list_orders(
    skip: int = 0,
    limit: int = 100,
    org_id: UUID = Depends(get_org_context),
    store_scope: getattr(UUID, 'Optional', UUID) = Depends(get_store_scope),
    current_user: User = Depends(require_role(["admin", "manager"])),
    db: AsyncSession = Depends(get_async_session)
):
    order_service = OrderService(db)
    return await order_service.get_orders(org_id=org_id, store_id=store_scope, skip=skip, limit=limit)

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order_details(
    order_id: UUID,
    org_id: UUID = Depends(get_org_context),
    store_scope: getattr(UUID, 'Optional', UUID) = Depends(get_store_scope),
    current_user: User = Depends(require_role(["admin", "manager", "delivery_boy"])),
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
    store_scope: getattr(UUID, 'Optional', UUID) = Depends(get_store_scope),
    current_user: User = Depends(require_role(["admin", "manager", "delivery_boy"])),
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
    store_scope: getattr(UUID, 'Optional', UUID) = Depends(get_store_scope),
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
