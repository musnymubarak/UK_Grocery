"""
Announcement bar — a single admin-controlled promo strip shown at the top of the
storefront + mobile app. Stored as a PlatformConfig JSONB value (key
`announcement_bar`).

The admin endpoint returns the full config (enabled flag + schedule); the public
`active_announcement` returns it only when enabled, non-empty, and within the
optional schedule window. Mirrors app/services/content.py.
"""
import hashlib
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.config import ConfigService
from app.schemas.config import PlatformConfigCreate

ANNOUNCEMENT_KEY = "announcement_bar"

VARIANTS = {"info", "success", "warning", "promo"}

# Defaults = disabled, empty. `variant` maps to a colour scheme client-side.
DEFAULTS: Dict[str, Any] = {
    "enabled": False,
    "message": "",
    "link_url": "",
    "link_label": "",
    "variant": "info",        # info | success | warning | promo
    "dismissible": True,
    "starts_at": None,        # ISO-8601 string or None
    "ends_at": None,          # ISO-8601 string or None
}


def _as_utc(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _parse_dt(value: Any) -> Optional[datetime]:
    if not value or not isinstance(value, str):
        return None
    try:
        return _as_utc(datetime.fromisoformat(value.replace("Z", "+00:00")))
    except ValueError:
        return None


def _merged(stored: Dict[str, Any]) -> Dict[str, Any]:
    out = dict(DEFAULTS)
    for k in DEFAULTS:
        if k in stored and stored[k] is not None:
            out[k] = stored[k]
    out["enabled"] = bool(out["enabled"])
    out["dismissible"] = bool(out["dismissible"])
    out["message"] = str(out["message"] or "")
    out["link_url"] = str(out["link_url"] or "")
    out["link_label"] = str(out["link_label"] or "")
    if out.get("variant") not in VARIANTS:
        out["variant"] = "info"
    # schedule fields stay as raw strings/None
    out["starts_at"] = stored.get("starts_at") if isinstance(stored.get("starts_at"), str) else None
    out["ends_at"] = stored.get("ends_at") if isinstance(stored.get("ends_at"), str) else None
    return out


async def get_announcement(db: AsyncSession, org_id: UUID) -> Dict[str, Any]:
    """Full stored config (defaults merged) — admin view."""
    cfg = await ConfigService(db).get_config_by_key(org_id, ANNOUNCEMENT_KEY)
    stored = (cfg.value if cfg and isinstance(cfg.value, dict) else {}) or {}
    return _merged(stored)


async def save_announcement(db: AsyncSession, org_id: UUID, data: Dict[str, Any]) -> Dict[str, Any]:
    merged = _merged(data)
    await ConfigService(db).upsert_config(
        org_id,
        PlatformConfigCreate(
            key=ANNOUNCEMENT_KEY,
            value=merged,
            description="Storefront announcement bar",
            setting_type="json",
        ),
    )
    return merged


async def active_announcement(
    db: AsyncSession, org_id: UUID, now: Optional[datetime] = None
) -> Optional[Dict[str, Any]]:
    """Public view: the bar, but only if enabled, has a message, and is within
    its optional [starts_at, ends_at] window. None otherwise."""
    a = await get_announcement(db, org_id)
    if not a["enabled"] or not a["message"].strip():
        return None

    now = now or datetime.now(timezone.utc)
    starts = _parse_dt(a["starts_at"])
    ends = _parse_dt(a["ends_at"])
    if starts and starts > now:
        return None
    if ends and ends < now:
        return None

    # Stable per-content key so a dismissed user re-sees a *changed* message.
    key = hashlib.sha1(
        f"{a['message']}|{a['variant']}|{a['link_url']}|{a['link_label']}".encode()
    ).hexdigest()[:10]
    return {
        "key": key,
        "message": a["message"],
        "link_url": a["link_url"],
        "link_label": a["link_label"],
        "variant": a["variant"],
        "dismissible": a["dismissible"],
    }
