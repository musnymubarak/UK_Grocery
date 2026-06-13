"""
RBAC capability map — a lightweight, admin-editable layer over the existing role
strings. Stored as a PlatformConfig JSONB value (key `rbac_capabilities`).
Enforced primarily in the admin UI; backend `require_role` checks remain as a
backstop.
"""
from uuid import UUID
from typing import Tuple, List, Dict

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.config import ConfigService
from app.schemas.config import PlatformConfigCreate

RBAC_KEY = "rbac_capabilities"

# Curated capability catalogue surfaced in the admin role editor.
CAPABILITIES = [
    {"key": "view_cost", "label": "View cost & margins"},
    {"key": "export_data", "label": "Export data (CSV)"},
    {"key": "delete_records", "label": "Delete records"},
    {"key": "manage_users", "label": "Manage staff users"},
    {"key": "manage_settings", "label": "Manage settings & integrations"},
    {"key": "manage_catalog", "label": "Manage products & categories"},
    {"key": "manage_promotions", "label": "Manage coupons & promotions"},
    {"key": "manage_procurement", "label": "Manage suppliers & purchase orders"},
    {"key": "view_reports", "label": "View reports & analytics"},
]
ALL_CAPS = [c["key"] for c in CAPABILITIES]

DEFAULT_CONFIG: Dict[str, dict] = {
    "super_admin": {"capabilities": ALL_CAPS, "hidden_pages": []},
    "admin": {"capabilities": ALL_CAPS, "hidden_pages": []},
    "manager": {"capabilities": ["view_cost", "export_data", "manage_catalog", "manage_promotions", "manage_procurement", "view_reports"], "hidden_pages": []},
    "cashier": {"capabilities": ["view_reports"], "hidden_pages": []},
    "delivery_boy": {"capabilities": [], "hidden_pages": []},
}


async def get_rbac_config(db: AsyncSession, org_id: UUID) -> Dict[str, dict]:
    """Stored map merged over defaults (stored entries override per role)."""
    cfg = await ConfigService(db).get_config_by_key(org_id, RBAC_KEY)
    stored = (cfg.value if cfg and isinstance(cfg.value, dict) else {}) or {}
    merged: Dict[str, dict] = {role: dict(default) for role, default in DEFAULT_CONFIG.items()}
    for role, val in stored.items():
        if isinstance(val, dict):
            base = merged.get(role, {"capabilities": [], "hidden_pages": []})
            merged[role] = {
                "capabilities": val.get("capabilities", base.get("capabilities", [])),
                "hidden_pages": val.get("hidden_pages", base.get("hidden_pages", [])),
            }
    return merged


async def save_rbac_config(db: AsyncSession, org_id: UUID, data: Dict[str, dict]) -> None:
    await ConfigService(db).upsert_config(
        org_id,
        PlatformConfigCreate(key=RBAC_KEY, value=data, description="Role capability map", setting_type="json"),
    )


def caps_for_role(config: Dict[str, dict], role: str) -> Tuple[List[str], List[str]]:
    entry = config.get(role) or DEFAULT_CONFIG.get(role) or {"capabilities": [], "hidden_pages": []}
    return list(entry.get("capabilities", [])), list(entry.get("hidden_pages", []))
