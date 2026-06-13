"""
Storefront marketing-copy content map — admin-editable key→string values with
code-defined defaults. Stored as a PlatformConfig JSONB value (key
`storefront_content`); only values that differ from the default are persisted.
Mirrors app/services/rbac.py.
"""
from uuid import UUID
from typing import Dict, List

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.config import ConfigService
from app.schemas.config import PlatformConfigCreate

CONTENT_KEY = "storefront_content"

# Grouped catalogue surfaced in the admin editor. Defaults = current hardcoded copy.
CONTENT_CATALOGUE: List[dict] = [
    {"section": "branding", "label": "Branding", "fields": [
        {"key": "app.name", "label": "App name", "default": "Daily Grocer"},
        {"key": "app.tagline", "label": "Tagline", "default": "Fresh groceries delivered to your door"},
    ]},
    {"section": "landing", "label": "Landing page", "fields": [
        {"key": "landing.hero_title", "label": "Hero title", "default": "Local store to door"},
        {"key": "landing.hero_subtitle", "label": "Hero subtitle", "default": "From as little as 30 minutes"},
        {"key": "landing.hero_cta", "label": "Hero button", "default": "Search Local Stores"},
        {"key": "landing.feature_1_title", "label": "Feature 1 title", "default": "Fast Delivery"},
        {"key": "landing.feature_1_desc", "label": "Feature 1 text", "default": "Groceries delivered from your local shop in under an hour.", "multiline": True},
        {"key": "landing.feature_2_title", "label": "Feature 2 title", "default": "Support Local"},
        {"key": "landing.feature_2_desc", "label": "Feature 2 text", "default": "Shop directly from independent convenience stores in your area.", "multiline": True},
        {"key": "landing.feature_3_title", "label": "Feature 3 title", "default": "In-Store Prices"},
        {"key": "landing.feature_3_desc", "label": "Feature 3 text", "default": "Pay exactly what you would in-store, with fair delivery fees.", "multiline": True},
        {"key": "landing.section_title", "label": "Section title", "default": "Shop Everyday Essentials"},
    ]},
    {"section": "home", "label": "Home screen", "fields": [
        {"key": "home.rewards_label", "label": "Rewards label", "default": "daily grocer rewards"},
        {"key": "home.rewards_title", "label": "Rewards title", "default": "Get Rewards in a Snap!"},
        {"key": "home.rewards_cta", "label": "Rewards button", "default": "Find out more"},
        {"key": "home.free_delivery_title", "label": "Free-delivery card title", "default": "Free Delivery"},
        {"key": "home.free_delivery_threshold", "label": "Free-delivery threshold text", "default": "ON ALL ORDERS OVER £40"},
        {"key": "home.categories_title", "label": "Categories title", "default": "Categories"},
        {"key": "home.categories_subtitle", "label": "Categories subtitle", "default": "Browse fresh picks across the store"},
        {"key": "home.fallback_hero_title", "label": "Fallback hero title", "default": "Free Delivery Today!"},
        {"key": "home.fallback_hero_subtitle", "label": "Fallback hero subtitle", "default": "On all orders over £30. Stock up now.", "multiline": True},
        {"key": "home.fallback_hero_cta", "label": "Fallback hero button", "default": "Shop Now"},
    ]},
    {"section": "offers", "label": "Offers page", "fields": [
        {"key": "offers.header_title", "label": "Header title", "default": "Curated for You"},
        {"key": "offers.header_subtitle", "label": "Header subtitle", "default": "Discover limited-time promotions and your membership rewards.", "multiline": True},
        {"key": "offers.rewards_title", "label": "Rewards title", "default": "Your Rewards Progress"},
        {"key": "offers.rewards_subtitle", "label": "Rewards subtitle", "default": "Every purchase brings you closer to exclusive tiers.", "multiline": True},
        {"key": "offers.coupons_title", "label": "Coupons section title", "default": "Active Coupons"},
    ]},
    {"section": "navigation", "label": "Footer & navigation", "fields": [
        {"key": "layout.footer_company_name", "label": "Footer company name", "default": "DAILY GROCER"},
        {"key": "layout.footer_copyright", "label": "Footer copyright", "default": "© 2026 Daily Grocer Ltd. Registered in England & Wales.", "multiline": True},
        {"key": "layout.nav_stores", "label": "Bottom nav: Stores", "default": "Stores"},
        {"key": "layout.nav_menu", "label": "Bottom nav: Menu", "default": "Menu"},
        {"key": "layout.nav_orders", "label": "Bottom nav: Orders", "default": "Orders"},
        {"key": "layout.nav_account", "label": "Bottom nav: Account", "default": "Account"},
        {"key": "layout.nav_cart", "label": "Bottom nav: Cart", "default": "Cart"},
        {"key": "layout.search_placeholder", "label": "Search placeholder", "default": "Search for products..."},
        {"key": "layout.delivery_time_message", "label": "Delivery-time message", "default": "Delivery in 25 to 40 Mins"},
    ]},
    {"section": "messages", "label": "Customer messages", "fields": [
        {"key": "messages.store_closed", "label": "Store closed", "default": "Sorry, this store is currently closed and not accepting orders.", "multiline": True},
        {"key": "messages.store_out_of_range", "label": "Out of delivery range", "default": "Out of range"},
        {"key": "messages.order_rejected", "label": "Order rejected", "default": "This order was rejected. Please contact support.", "multiline": True},
        {"key": "messages.order_delivery_failed", "label": "Delivery failed", "default": "Delivery failed. Our team will contact you.", "multiline": True},
    ]},
]

DEFAULTS: Dict[str, str] = {f["key"]: f["default"] for g in CONTENT_CATALOGUE for f in g["fields"]}


async def get_content(db: AsyncSession, org_id: UUID) -> Dict[str, str]:
    """Defaults merged with stored overrides (only known keys, string values)."""
    cfg = await ConfigService(db).get_config_by_key(org_id, CONTENT_KEY)
    stored = (cfg.value if cfg and isinstance(cfg.value, dict) else {}) or {}
    merged = dict(DEFAULTS)
    for k, v in stored.items():
        if k in DEFAULTS and isinstance(v, str):
            merged[k] = v
    return merged


async def save_content(db: AsyncSession, org_id: UUID, values: Dict[str, str]) -> None:
    """Persist only values that are known keys and differ from the default."""
    overrides = {k: v for k, v in values.items() if k in DEFAULTS and isinstance(v, str) and v != DEFAULTS[k]}
    await ConfigService(db).upsert_config(
        org_id,
        PlatformConfigCreate(key=CONTENT_KEY, value=overrides, description="Storefront marketing copy overrides", setting_type="json"),
    )
