"""
Legal pages CMS — admin-editable Privacy / Terms / Cookie page bodies (markdown).
Stored as a PlatformConfig JSONB value (key `legal_pages`). A page with an empty
body means "not customised" — clients fall back to their built-in hardcoded page,
so nothing breaks until an admin actually writes copy. Mirrors content.py.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.config import ConfigService
from app.schemas.config import PlatformConfigCreate

LEGAL_KEY = "legal_pages"

# Catalogue of editable pages. `default_title` shows in the admin + as the page
# heading; bodies default to "" (→ client renders its hardcoded fallback).
LEGAL_PAGES: List[dict] = [
    {"slug": "privacy", "label": "Privacy Policy", "default_title": "Privacy Policy"},
    {"slug": "terms", "label": "Terms of Service", "default_title": "Terms of Service"},
    {"slug": "cookies", "label": "Cookie Policy", "default_title": "Cookie Policy"},
]

SLUGS = {p["slug"] for p in LEGAL_PAGES}
_TITLE = {p["slug"]: p["default_title"] for p in LEGAL_PAGES}


def _empty_page(slug: str) -> Dict[str, Any]:
    return {"title": _TITLE.get(slug, slug.title()), "body": "", "updated_at": None}


def _merged(stored: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    out: Dict[str, Dict[str, Any]] = {}
    for slug in SLUGS:
        page = _empty_page(slug)
        sp = stored.get(slug) if isinstance(stored, dict) else None
        if isinstance(sp, dict):
            if isinstance(sp.get("title"), str) and sp["title"].strip():
                page["title"] = sp["title"].strip()
            if isinstance(sp.get("body"), str):
                page["body"] = sp["body"]
            if isinstance(sp.get("updated_at"), str):
                page["updated_at"] = sp["updated_at"]
        out[slug] = page
    return out


async def get_legal(db: AsyncSession, org_id: UUID) -> Dict[str, Dict[str, Any]]:
    cfg = await ConfigService(db).get_config_by_key(org_id, LEGAL_KEY)
    stored = (cfg.value if cfg and isinstance(cfg.value, dict) else {}) or {}
    return _merged(stored)


async def get_legal_page(db: AsyncSession, org_id: UUID, slug: str) -> Optional[Dict[str, Any]]:
    if slug not in SLUGS:
        return None
    pages = await get_legal(db, org_id)
    return {"slug": slug, **pages[slug]}


async def save_legal_page(db: AsyncSession, org_id: UUID, slug: str, title: str, body: str) -> Dict[str, Any]:
    """Upsert one page. Stamps updated_at server-side. No-op-safe for unknown slugs."""
    if slug not in SLUGS:
        raise ValueError(f"Unknown legal page: {slug}")
    pages = await get_legal(db, org_id)
    pages[slug] = {
        "title": (title or _TITLE[slug]).strip(),
        "body": body or "",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await ConfigService(db).upsert_config(
        org_id,
        PlatformConfigCreate(key=LEGAL_KEY, value=pages, description="Legal page bodies (markdown)", setting_type="json"),
    )
    return {"slug": slug, **pages[slug]}
