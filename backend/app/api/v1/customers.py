"""
Customer router - routes for B2C registration, auth, and profile management.
Also contains routes for admin to manage customers.
"""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.core.dependencies import get_current_user, require_role, get_org_context, get_current_customer
from app.core.security import create_access_token
from app.core.exceptions import UnauthorizedException
from app.models.user import User
from app.models.customer import Customer, CustomerAddress
from app.schemas.customer import (
    CustomerCreate, CustomerResponse, CustomerUpdate, 
    CustomerAddressCreate, CustomerAddressResponse,
    CustomerLogin, Token
)
from app.services.customer import CustomerService

router = APIRouter(prefix="/customers", tags=["Customers"])

# ====================
# ADMIN/STAFF ROUTES
# ====================
@router.get("", response_model=List[CustomerResponse])
async def list_customers(
    skip: int = 0,
    limit: int = 100,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(["admin", "manager"])),
    db: AsyncSession = Depends(get_async_session)
):
    return await CustomerService.get_customers(db, org_id=org_id, skip=skip, limit=limit)

# ====================
# B2C CUSTOMER ROUTES
# ====================
@router.post("/register", response_model=CustomerResponse)
async def register_customer(
    data: CustomerCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Register a new customer account (public — no auth required)."""
    from sqlalchemy import select as sa_select
    from app.models.organization import Organization
    # Auto-detect the default (first) organization for single-org deployment
    result = await db.execute(sa_select(Organization).limit(1))
    org = result.scalar_one_or_none()
    if not org:
        from app.core.exceptions import ValidationException
        raise ValidationException("System is not set up yet. Please contact admin.")
    return await CustomerService.create_customer(db, org_id=org.id, data=data)

@router.post("/login", response_model=Token)
async def login_customer(
    data: CustomerLogin,
    db: AsyncSession = Depends(get_async_session)
):
    """Authenticate customer and return JWT."""
    customer = await CustomerService.authenticate_customer(db, data.email, data.password)
    if not customer:
        raise UnauthorizedException("Incorrect email or password")
        
    access_token = create_access_token(
        data={"sub": str(customer.id), "role": "customer", "org_id": str(customer.organization_id)}
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=CustomerResponse)
async def get_my_profile(
    current_customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_async_session)
):
    """Get current customer profile."""
    # Refresh to load addresses
    return await CustomerService.get_customer(db, current_customer.id)

@router.put("/me", response_model=CustomerResponse)
async def update_my_profile(
    data: CustomerUpdate,
    current_customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_async_session)
):
    """Update current customer profile."""
    return await CustomerService.update_customer(db, current_customer.id, data)

@router.post("/me/addresses", response_model=CustomerAddressResponse)
async def add_my_address(
    data: CustomerAddressCreate,
    current_customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_async_session)
):
    return await CustomerService.add_address(db, current_customer.id, data)

@router.delete("/me/addresses/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_my_address(
    address_id: UUID,
    current_customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_async_session)
):
    # Security: make sure address belongs to customer. Handled by generic remove or checking customer_id
    address = await db.get(CustomerAddress, address_id)
    if address and address.customer_id == current_customer.id:
        await CustomerService.remove_address(db, address_id)

@router.put("/me/addresses/{address_id}/default", response_model=CustomerAddressResponse)
async def set_my_default_address(
    address_id: UUID,
    current_customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_async_session)
):
    """Set a specific address as default for the current customer."""
    return await CustomerService.set_default_address(db, current_customer.id, address_id)
