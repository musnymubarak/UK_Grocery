"""
Customer router - routes for B2C registration, auth, and profile management.
Also contains routes for admin to manage customers.
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, status, Request, Body
from app.core.rate_limiter import limiter
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.core.dependencies import get_current_user, require_role, get_org_context, get_current_customer
from app.core.security import create_access_token
from app.core.exceptions import UnauthorizedException, NotFoundException
from app.models.user import User
from app.models.customer import Customer, CustomerAddress
from app.schemas.customer import (
    CustomerCreate, CustomerResponse, CustomerUpdate, 
    CustomerAddressCreate, CustomerAddressResponse,
    CustomerLogin, Token, GoogleLogin, AppleLogin
)
import httpx
from jose import jwt
from app.schemas.referral import ApplyReferralRequest, ReferralResponse, ReferralCodeResponse
from app.schemas.auth import RefreshRequest, LogoutRequest
from app.services.customer import CustomerService
from app.services.token import TokenService
from app.core.config import settings
from google.oauth2 import id_token
from google.auth.transport import requests

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
@limiter.limit("3/minute")
async def register_customer(
    request: Request,
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
@limiter.limit("5/minute")
async def login_customer(
    request: Request,
    data: CustomerLogin,
    db: AsyncSession = Depends(get_async_session)
):
    """Authenticate customer and return JWT pair."""
    customer = await CustomerService.authenticate_customer(db, data.email, data.password)
    if not customer:
        raise UnauthorizedException("Incorrect email or password")
        
    token_service = TokenService(db)
    device_info = request.headers.get("user-agent")
    return await token_service.issue_token_pair(
        customer_id=customer.id,
        device_info=device_info
    )

@router.post("/google", response_model=Token)
async def google_login_customer(
    request: Request,
    data: GoogleLogin,
    db: AsyncSession = Depends(get_async_session)
):
    """Authenticate customer via Google ID Token."""
    try:
        # Verify the token
        # Verify signature/issuer/expiry (no single-audience enforcement here)
        id_info = id_token.verify_oauth2_token(
            data.id_token,
            requests.Request(),
        )
        # Accept any of the configured client IDs (web + iOS + Android) — comma-separated in GOOGLE_CLIENT_ID
        allowed_auds = [a.strip() for a in settings.GOOGLE_CLIENT_ID.split(",") if a.strip()]
        if allowed_auds and id_info.get("aud") not in allowed_auds:
            raise ValueError("Unrecognized Google client ID (audience mismatch)")
        
        email = id_info['email']
        name = id_info.get('name', email.split('@')[0])
        
        # Check if customer exists
        from app.services.customer import CustomerService
        customer = await CustomerService.get_customer_by_email(db, email)
        
        if not customer:
            # Create new customer
            from app.models.organization import Organization
            from sqlalchemy import select as sa_select
            result = await db.execute(sa_select(Organization).limit(1))
            org = result.scalar_one_or_none()
            
            from app.schemas.customer import CustomerCreate
            import secrets
            import string
            
            # Generate a secure random password for OAuth users (though they use Google to log in)
            random_pw = ''.join(secrets.choice(string.ascii_letters + string.digits) for i in range(20))
            
            new_customer_data = CustomerCreate(
                email=email,
                full_name=name,
                password=random_pw
            )
            customer = await CustomerService.create_customer(db, org_id=org.id, data=new_customer_data)
        
        token_service = TokenService(db)
        device_info = request.headers.get("user-agent")
        return await token_service.issue_token_pair(
            customer_id=customer.id,
            device_info=device_info
        )
        
    except ValueError:
        # Invalid token
        raise UnauthorizedException("Invalid Google token")

@router.post("/apple", response_model=Token)
async def apple_login_customer(
    request: Request,
    data: AppleLogin,
    db: AsyncSession = Depends(get_async_session)
):
    """Authenticate customer via Apple Identity Token."""
    try:
        # Fetch Apple's public keys
        async with httpx.AsyncClient() as client:
            resp = await client.get("https://appleid.apple.com/auth/keys")
            jwks = resp.json()
            
        unverified_header = jwt.get_unverified_header(data.identity_token)
        kid = unverified_header.get('kid')
        
        rsa_key = next((key for key in jwks['keys'] if key['kid'] == kid), None)
        if not rsa_key:
            raise ValueError("Invalid Apple token signature")
            
        # Verify the token
        payload = jwt.decode(
            data.identity_token,
            rsa_key,
            algorithms=['RS256'],
            audience="uk.co.dailygrocer",
            issuer='https://appleid.apple.com'
        )
        
        # Apple payload uses "sub" as the unique user id, and typically includes "email"
        email = payload.get("email") or data.email
        if not email:
            raise ValueError("Email not provided by Apple or client")
            
        name = data.full_name or email.split('@')[0]
        
        # Check if customer exists
        from app.services.customer import CustomerService
        customer = await CustomerService.get_customer_by_email(db, email)
        
        if not customer:
            # Create new customer
            from app.models.organization import Organization
            from sqlalchemy import select as sa_select
            result = await db.execute(sa_select(Organization).limit(1))
            org = result.scalar_one_or_none()
            
            from app.schemas.customer import CustomerCreate
            import secrets
            import string
            
            random_pw = ''.join(secrets.choice(string.ascii_letters + string.digits) for i in range(20))
            
            new_customer_data = CustomerCreate(
                email=email,
                full_name=name,
                password=random_pw
            )
            customer = await CustomerService.create_customer(db, org_id=org.id, data=new_customer_data)
        
        token_service = TokenService(db)
        device_info = request.headers.get("user-agent")
        return await token_service.issue_token_pair(
            customer_id=customer.id,
            device_info=device_info
        )
        
    except Exception as e:
        raise UnauthorizedException(f"Invalid Apple token: {str(e)}")


@router.post("/refresh", summary="Rotate customer refresh token")
async def refresh_customer_token(data: RefreshRequest, request: Request, db: AsyncSession = Depends(get_async_session)):
    """Issue a new access token and refresh token for customer."""
    service = TokenService(db)
    device_info = request.headers.get("user-agent")
    return await service.rotate_token(data.refresh_token, device_info=device_info)


@router.post("/logout", summary="Revoke customer refresh token")
async def logout_customer(
    data: Optional[LogoutRequest] = Body(default=None),
    db: AsyncSession = Depends(get_async_session),
):
    """Revoke the given customer refresh token if supplied; otherwise no-op success."""
    if data and data.refresh_token:
        service = TokenService(db)
        await service.revoke_token(data.refresh_token)
        await db.commit()
    return {"status": "ok"}

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

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT, summary="Delete customer account")
async def delete_my_account(
    current_customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_async_session),
):
    """Permanently delete the current customer's account and all associated data."""
    await CustomerService.delete_customer(db, current_customer.id)
    await db.commit()


@router.get("/me/referral-code", response_model=ReferralCodeResponse)
async def get_my_referral_code(
    current_customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_async_session)
):
    """Get or generate the customer's unique referral code."""
    from app.services.referral import ReferralService
    from app.schemas.referral import ReferralCodeResponse
    service = ReferralService(db)
    code = await service.ensure_referral_code(current_customer.id)
    return ReferralCodeResponse(referral_code=code)


@router.post("/me/apply-referral", response_model=ReferralResponse)
async def apply_referral_code(
    data: ApplyReferralRequest,
    current_customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_async_session)
):
    """Apply a friend's referral code to get a wallet bonus."""
    from app.services.referral import ReferralService
    from app.schemas.referral import ApplyReferralRequest, ReferralResponse
    service = ReferralService(db)
    result = await service.apply_referral(current_customer.id, data.referral_code)
    return ReferralResponse(**result)


# ====================
# ADMIN: single customer (must come AFTER all /me literals so FastAPI matches them first)
# ====================
@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer_by_id(
    customer_id: UUID,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_role(["admin", "manager"])),
    db: AsyncSession = Depends(get_async_session),
):
    """Get a single customer's profile + addresses + wallet balance (admin only)."""
    customer = await CustomerService.get_customer(db, customer_id)
    if customer.organization_id != org_id:
        raise NotFoundException("Customer not found")
    return customer
