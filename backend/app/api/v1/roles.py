"""
Roles & Permissions API — admin-editable capability map (UI-capability RBAC).
"""
from typing import Dict, List
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.core.dependencies import require_role, get_org_context, require_capability
from app.models.user import User
from app.services.rbac import get_rbac_config, save_rbac_config, CAPABILITIES

router = APIRouter(prefix="/roles", tags=["Roles & Permissions"])


class RoleEntry(BaseModel):
    capabilities: List[str] = []
    hidden_pages: List[str] = []


class RolesConfig(BaseModel):
    roles: Dict[str, RoleEntry]


@router.get("")
async def get_roles(
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_capability("manage_users")),
    db: AsyncSession = Depends(get_async_session),
):
    return {"capabilities": CAPABILITIES, "roles": await get_rbac_config(db, org_id)}


@router.put("")
async def save_roles(
    data: RolesConfig,
    org_id: UUID = Depends(get_org_context),
    current_user: User = Depends(require_capability("manage_users")),
    db: AsyncSession = Depends(get_async_session),
):
    payload = {r: {"capabilities": e.capabilities, "hidden_pages": e.hidden_pages} for r, e in data.roles.items()}
    await save_rbac_config(db, org_id, payload)
    return {"roles": payload}
