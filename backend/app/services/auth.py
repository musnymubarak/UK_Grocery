"""
Authentication service — user registration, login, token management.
"""
from typing import Optional
from uuid import UUID

from fastapi import Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password, create_access_token
from app.core.exceptions import ConflictException, UnauthorizedException, NotFoundException
from app.models.user import User
from app.models.organization import Organization
from app.schemas.auth import UserCreate, LoginRequest
from app.services.audit import AuditService
from app.constants.audit_actions import AuditAction


from app.services.token import TokenService

class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.audit = AuditService(db)
        self.token_service = TokenService(db)

    async def register_user(
        self,
        data: UserCreate,
        organization_id: UUID,
        current_user: Optional[User] = None,
        request: Optional[Request] = None,
    ) -> User:
        """Register a new user within an organization."""
        result = await self.db.execute(
            select(User).where(User.email == data.email)
        )
        if result.scalar_one_or_none():
            raise ConflictException(f"User with email '{data.email}' already exists")

        user = User(
            email=data.email,
            hashed_password=hash_password(data.password),
            full_name=data.full_name,
            role=data.role,
            phone=data.phone,
            organization_id=organization_id,
            store_id=data.store_id,
        )
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)

        if current_user:
            await self.audit.log(
                action=AuditAction.USER_CREATED,
                user=current_user,
                organization_id=organization_id,
                entity_type="User",
                entity_id=user.id,
                new_value={"email": user.email, "role": user.role, "full_name": user.full_name},
                request=request
            )

        return user

    async def login(self, data: LoginRequest, request: Optional[Request] = None) -> dict:
        """Authenticate user and return JWT token pair."""
        result = await self.db.execute(
            select(User).where(
                User.email == data.email,
                User.is_deleted == False,
            )
        )
        user = result.scalar_one_or_none()

        if not user or not user.is_active or not verify_password(data.password, user.hashed_password):
            if user:
                await self.audit.log(
                    action=AuditAction.AUTH_LOGIN_FAILED,
                    user=user,
                    organization_id=user.organization_id,
                    notes=f"Attempted email: {data.email}",
                    request=request
                )
            raise UnauthorizedException("Invalid email or password")

        await self.audit.log(
            action=AuditAction.AUTH_LOGIN_SUCCESS,
            user=user,
            organization_id=user.organization_id,
            request=request
        )

        device_info = request.headers.get("user-agent") if request else None
        token_data = await self.token_service.issue_token_pair(
            user_id=user.id,
            device_info=device_info
        )
        token_data["user"] = user
        return token_data

    async def get_user_by_id(self, user_id: UUID) -> Optional[User]:
        """Get user by ID."""
        result = await self.db.execute(
            select(User).where(User.id == user_id, User.is_deleted == False)
        )
        return result.scalar_one_or_none()

    async def setup_organization(self, name: str, slug: str, admin_email: str, admin_password: str, admin_name: str, request: Optional[Request] = None) -> dict:
        """Create organization with initial admin user (bootstrap)."""
        result = await self.db.execute(
            select(Organization).where(Organization.slug == slug)
        )
        if result.scalar_one_or_none():
            raise ConflictException(f"Organization with slug '{slug}' already exists")

        org = Organization(name=name, slug=slug)
        self.db.add(org)
        await self.db.flush()
        await self.db.refresh(org)

        admin = User(
            email=admin_email,
            hashed_password=hash_password(admin_password),
            full_name=admin_name,
            role="admin",
            organization_id=org.id,
        )
        self.db.add(admin)
        await self.db.flush()
        await self.db.refresh(admin)

        device_info = request.headers.get("user-agent") if request else None
        token_data = await self.token_service.issue_token_pair(
            user_id=admin.id,
            device_info=device_info
        )

        return {
            "organization": org,
            "admin": admin,
            **token_data
        }
