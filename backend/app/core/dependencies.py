"""
FastAPI dependencies for auth, RBAC, database sessions, and org context.
"""
from typing import List, Optional
from uuid import UUID

from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_async_session
from app.core.security import verify_token
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.models.user import User
from app.models.customer import Customer


async def get_db(session: AsyncSession = Depends(get_async_session)):
    """Get async database session."""
    return session


async def get_current_user(
    authorization: str = Header(..., description="Bearer <token>"),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract and validate JWT from Authorization header. Returns the User."""
    if not authorization.startswith("Bearer "):
        raise UnauthorizedException("Invalid authorization header format")

    token = authorization.split("Bearer ")[1]
    payload = verify_token(token)

    if payload is None:
        raise UnauthorizedException("Invalid or expired token")

    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedException("Token missing subject")

    result = await db.execute(
        select(User).where(User.id == user_id, User.is_deleted == False)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise UnauthorizedException("User not found or deactivated")

    return user

async def get_current_customer(
    authorization: str = Header(..., description="Bearer <token>"),
    db: AsyncSession = Depends(get_db),
) -> Customer:
    """Extract and validate JWT from Authorization header. Returns the Customer."""
    if not authorization.startswith("Bearer "):
        raise UnauthorizedException("Invalid authorization header format")

    token = authorization.split("Bearer ")[1]
    payload = verify_token(token)

    if payload is None:
        raise UnauthorizedException("Invalid or expired token")

    customer_id = payload.get("sub")
    if not customer_id:
        raise UnauthorizedException("Token missing subject")
        
    role = payload.get("role")
    if role != "customer":
        raise UnauthorizedException("Invalid token role")

    result = await db.execute(
        select(Customer).where(Customer.id == customer_id, Customer.is_active == True)
    )
    customer = result.scalar_one_or_none()

    if not customer:
        raise UnauthorizedException("Customer not found or deactivated")

    return customer


async def get_optional_customer(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> Optional[Customer]:
    """
    Like get_current_customer but never raises — returns None when there is no
    valid customer token. Used by public endpoints that personalize when a
    customer is logged in (e.g. audience-targeted home layout) but still serve
    anonymous visitors.
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        token = authorization.split("Bearer ")[1]
        payload = verify_token(token)
        if not payload or payload.get("role") != "customer":
            return None
        customer_id = payload.get("sub")
        if not customer_id:
            return None
        result = await db.execute(
            select(Customer).where(Customer.id == customer_id, Customer.is_active == True)
        )
        return result.scalar_one_or_none()
    except Exception:
        return None


def require_role(allowed_roles: List[str]):
    """Dependency factory: require the current user to have one of the listed roles."""

    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise ForbiddenException(
                f"Role '{current_user.role}' is not authorized. "
                f"Required: {', '.join(allowed_roles)}"
            )
        return current_user

    return role_checker


def require_capability(capability: str):
    """Dependency factory: require the current user's role to hold `capability`
    in the org's RBAC config (PlatformConfig key `rbac_capabilities`).

    super_admin / admin always pass — this mirrors the admin UI backstop and
    guarantees an admin can never lock themselves out of the tools that edit the
    capability map itself. All other roles are checked against their granted caps,
    so grants made in the admin role editor are now enforced server-side, not just
    hidden in the UI.
    """

    async def cap_checker(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_async_session),
    ) -> User:
        if current_user.role in ("super_admin", "admin"):
            return current_user
        if not current_user.organization_id:
            raise ForbiddenException("User is not associated with any organization")

        from app.services.rbac import get_rbac_config, caps_for_role

        config = await get_rbac_config(db, current_user.organization_id)
        caps, _ = caps_for_role(config, current_user.role)
        if capability not in caps:
            raise ForbiddenException(
                f"Role '{current_user.role}' lacks the required capability: {capability}"
            )
        return current_user

    return cap_checker


async def get_org_context(
    current_user: User = Depends(get_current_user),
) -> UUID:
    """Extract organization ID from the current user."""
    if not current_user.organization_id:
        raise ForbiddenException("User is not associated with any organization")
    return current_user.organization_id


async def get_store_scope(
    current_user: User = Depends(get_current_user),
) -> Optional[UUID]:
    """
    Store-scope dependency.
    - admin / super_admin → None (unrestricted, can access all stores)
    - manager / cashier   → user.store_id (restricted to their assigned store)
    Raises 403 if a scoped user has no store_id assigned.
    """
    if current_user.role in ("admin", "super_admin"):
        return None
    if not current_user.store_id:
        raise ForbiddenException(
            "No store assigned to your account. Contact an administrator."
        )
    return current_user.store_id


def enforce_store_access(
    target_store_id, user_store_scope: Optional[UUID]
):
    """
    Verify that the target store matches the user's scoped store.
    No-op for admins (user_store_scope is None).
    Raises 403 if the store IDs don't match.
    """
    if user_store_scope is not None:
        from uuid import UUID as UUIDType
        target = target_store_id if isinstance(target_store_id, UUIDType) else UUIDType(str(target_store_id))
        if target != user_store_scope:
            raise ForbiddenException(
                "Access denied: you can only access your assigned store."
            )
