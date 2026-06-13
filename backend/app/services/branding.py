"""
Branding & theme — admin-editable brand name, logo, and core palette. Stored as a
PlatformConfig JSONB value (key `branding`); clients recolor live from it (the
storefront overrides CSS variables, mobile seeds its ColorScheme). Mirrors
app/services/content.py.
"""
import re
from typing import Any, Dict
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.config import ConfigService
from app.schemas.config import PlatformConfigCreate

BRANDING_KEY = "branding"

_HEX = re.compile(r"^#[0-9a-fA-F]{6}$")

# Defaults = the current hardcoded brand. `colors` are the three palette anchors
# that actually drive both clients:
#   primary = navy brand colour, action = call-to-action red, accent = link blue.
DEFAULTS: Dict[str, Any] = {
    "app_name": "Daily Grocer",
    "logo_url": "",  # empty → clients use their bundled logo asset
    "colors": {
        "primary": "#001d3d",
        "action": "#e6203a",
        "accent": "#0056b3",
    },
}

COLOR_KEYS = tuple(DEFAULTS["colors"].keys())


def _merged(stored: Dict[str, Any]) -> Dict[str, Any]:
    out = {
        "app_name": DEFAULTS["app_name"],
        "logo_url": DEFAULTS["logo_url"],
        "colors": dict(DEFAULTS["colors"]),
    }
    if isinstance(stored.get("app_name"), str) and stored["app_name"].strip():
        out["app_name"] = stored["app_name"].strip()
    if isinstance(stored.get("logo_url"), str):
        out["logo_url"] = stored["logo_url"].strip()
    sc = stored.get("colors")
    if isinstance(sc, dict):
        for k in COLOR_KEYS:
            v = sc.get(k)
            if isinstance(v, str) and _HEX.match(v):
                out["colors"][k] = v.lower()
    return out


async def get_branding(db: AsyncSession, org_id: UUID) -> Dict[str, Any]:
    cfg = await ConfigService(db).get_config_by_key(org_id, BRANDING_KEY)
    stored = (cfg.value if cfg and isinstance(cfg.value, dict) else {}) or {}
    return _merged(stored)


async def save_branding(db: AsyncSession, org_id: UUID, data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate + persist. Invalid hex colours fall back to the default for that
    slot, so a bad value can never brick the clients."""
    merged = _merged(data)
    await ConfigService(db).upsert_config(
        org_id,
        PlatformConfigCreate(
            key=BRANDING_KEY,
            value=merged,
            description="Brand name, logo, and palette",
            setting_type="json",
        ),
    )
    return merged
