"""
Auth API routes — login, register, organization setup.
"""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user, require_role, get_org_context
from app.services.auth import AuthService
from app.services.audit import AuditService
from app.constants.audit_actions import AuditAction
from app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    UserCreate,
    UserUpdate,
    UserResponse,
    OrganizationCreate,
    OrganizationResponse,
)
from app.models.user import User
from app.models.organization import Organization
from app.core.exceptions import NotFoundException, ForbiddenException
from pydantic import BaseModel, EmailStr, Field

router = APIRouter(prefix="/auth", tags=["Authentication"])


class SetupRequest(BaseModel):
    org_name: str = Field(..., min_length=1)
    org_slug: str = Field(..., min_length=1, pattern="^[a-z0-9-]+$")
    admin_email: EmailStr
    admin_password: str = Field(..., min_length=6)
    admin_name: str = Field(..., min_length=1)


from app.core.rate_limiter import limiter

@router.post("/setup", summary="Bootstrap: Create organization + admin")
@limiter.limit("1/minute")
async def setup_organization(request: Request, data: SetupRequest, db: AsyncSession = Depends(get_db)):
    """One-time setup: create organization and initial admin user."""
    # Security: check if any organization already exists
    existing_org = await db.execute(select(Organization).limit(1))
    if existing_org.scalar_one_or_none():
        raise ForbiddenException("Organization already exists. Setup is locked.")

    service = AuthService(db)
    result = await service.setup_organization(
        name=data.org_name,
        slug=data.org_slug,
        admin_email=data.admin_email,
        admin_password=data.admin_password,
        admin_name=data.admin_name,
    )
    return {
        "organization": OrganizationResponse.model_validate(result["organization"]),
        "admin": UserResponse.model_validate(result["admin"]),
        "access_token": result["access_token"],
        "token_type": result["token_type"],
    }


@router.post("/login", response_model=TokenResponse, summary="Login")
@limiter.limit("5/minute")
async def login(data: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Authenticate and receive JWT token."""
    service = AuthService(db)
    result = await service.login(data, request=request)
    return result


@router.get("/me", response_model=UserResponse, summary="Current user")
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
):
    """Get current authenticated user."""
    return current_user


@router.post("/users", response_model=UserResponse, summary="Create user")
async def create_user(
    data: UserCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin"])),
    org_id: UUID = Depends(get_org_context),
):
    """Create a new user (admin only)."""
    service = AuthService(db)
    return await service.register_user(data, org_id, current_user=current_user, request=request)


@router.get("/users", response_model=List[UserResponse], summary="List users")
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin"])),
    org_id: UUID = Depends(get_org_context),
):
    """List all users in the organization (admin only)."""
    result = await db.execute(
        select(User).where(
            User.organization_id == org_id,
            User.is_deleted == False,
        ).order_by(User.created_at.desc())
    )
    return result.scalars().all()


@router.put("/users/{user_id}", response_model=UserResponse, summary="Update user")
async def update_user(
    user_id: UUID,
    data: UserUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin"])),
    org_id: UUID = Depends(get_org_context),
):
    """Update user details (admin only)."""
    result = await db.execute(
        select(User).where(
            User.id == user_id,
            User.organization_id == org_id,
            User.is_deleted == False,
        )
    )
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundException("User", user_id)

    update_data = data.model_dump(exclude_unset=True)
    
    old_value = {k: getattr(user, k) for k in update_data.keys() if hasattr(user, k) and k != "password"}
    old_role = user.role
    old_active = user.is_active
    
    for key, value in update_data.items():
        setattr(user, key, value)

    await db.flush()
    await db.refresh(user)
    
    new_value = {k: getattr(user, k) for k in update_data.keys() if hasattr(user, k) and k != "password"}
    
    audit = AuditService(db)
    await audit.log(
        action=AuditAction.USER_UPDATED,
        user=current_user,
        organization_id=org_id,
        entity_type="User",
        entity_id=user.id,
        old_value=old_value,
        new_value=new_value,
        request=request
    )
    
    if "role" in update_data and old_role != user.role:
        await audit.log(
            action=AuditAction.USER_ROLE_CHANGED,
            user=current_user,
            organization_id=org_id,
            entity_type="User",
            entity_id=user.id,
            old_value={"role": old_role},
            new_value={"role": user.role},
            request=request
        )
        
    if "is_active" in update_data and old_active != user.is_active:
        action = AuditAction.USER_REACTIVATED if user.is_active else AuditAction.USER_DEACTIVATED
        await audit.log(
            action=action,
            user=current_user,
            organization_id=org_id,
            entity_type="User",
            entity_id=user.id,
            request=request
        )

    return user
