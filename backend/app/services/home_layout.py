"""
HomeLayoutService — admin CRUD over home sections + public "resolve to renderable
JSON" for the storefront/mobile clients.

Resolution rules per section_type:
- hero_slider / banner_strip / promo_grid : pass `config.items` (slides) through
- product_carousel                        : resolve `config.source` into live products
- category_grid                           : resolve `config.category_ids` into live categories
- unknown                                 : pass config through (clients ignore unknown types)

Per-section resolution is wrapped in try/except so one broken section drops out
of the layout instead of failing the whole page (graceful degradation).
"""
import logging
from datetime import datetime, timezone
from uuid import UUID
from typing import List, Optional

from sqlalchemy import select, or_, literal
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.home_section import HomeSection
from app.models.product import Product
from app.models.category import Category
from app.models.inventory import Inventory
from app.core.exceptions import NotFoundException

logger = logging.getLogger(__name__)


class HomeLayoutService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ---------------------------------------------------------------- admin CRUD
    async def list_sections(self, org_id: UUID, store_id: Optional[UUID] = None) -> List[HomeSection]:
        query = select(HomeSection).where(
            HomeSection.organization_id == org_id,
            HomeSection.is_deleted == False,
        )
        if store_id:
            query = query.where(HomeSection.store_id == store_id)
        query = query.order_by(HomeSection.position)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_section(self, org_id: UUID, section_id: UUID) -> HomeSection:
        section = await self.db.get(HomeSection, section_id)
        if not section or section.is_deleted or section.organization_id != org_id:
            raise NotFoundException("HomeSection", section_id)
        return section

    async def create_section(self, org_id: UUID, data) -> HomeSection:
        section = HomeSection(organization_id=org_id, **data.model_dump(exclude_unset=True))
        self.db.add(section)
        await self.db.flush()
        await self.db.refresh(section)
        return section

    async def update_section(self, org_id: UUID, section_id: UUID, data) -> HomeSection:
        section = await self.get_section(org_id, section_id)
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(section, key, value)
        await self.db.flush()
        await self.db.refresh(section)
        return section

    async def delete_section(self, org_id: UUID, section_id: UUID) -> None:
        section = await self.get_section(org_id, section_id)
        section.is_deleted = True  # soft delete
        await self.db.flush()

    async def reorder_sections(self, org_id: UUID, ordered_ids: List[UUID]) -> List[HomeSection]:
        for index, section_id in enumerate(ordered_ids):
            section = await self.db.get(HomeSection, section_id)
            if section and not section.is_deleted and section.organization_id == org_id:
                section.position = index
        await self.db.flush()
        return await self.list_sections(org_id)

    # ------------------------------------------------------------- public resolve
    async def get_published_layout(
        self,
        org_id: UUID,
        store_id: Optional[UUID] = None,
        platform: str = "web",
        customer=None,
    ) -> dict:
        now = datetime.now(timezone.utc)

        query = select(HomeSection).where(
            HomeSection.organization_id == org_id,
            HomeSection.is_deleted == False,
            HomeSection.is_active == True,
            (HomeSection.starts_at == None) | (HomeSection.starts_at <= now),
            (HomeSection.ends_at == None) | (HomeSection.ends_at >= now),
        )
        if store_id:
            # global sections + this store's sections
            query = query.where(or_(HomeSection.store_id == store_id, HomeSection.store_id == None))
        else:
            # no store selected => global only
            query = query.where(HomeSection.store_id == None)
        query = query.order_by(HomeSection.position)

        result = await self.db.execute(query)
        sections = list(result.scalars().all())

        resolved: list = []
        for section in sections:
            if not self._matches_platform(section, platform):
                continue
            if not self._matches_audience(section, customer):
                continue
            try:
                rendered = await self._resolve_section(section, org_id, store_id)
                if rendered is not None:
                    resolved.append(rendered)
            except Exception as exc:  # one bad section must not break the page
                logger.warning("home_layout.section_resolve_failed id=%s err=%s", section.id, exc)
                continue

        return {"sections": resolved}

    # --------------------------------------------------------------- targeting
    @staticmethod
    def _matches_platform(section: HomeSection, platform: str) -> bool:
        platforms = section.platforms or []
        if not platforms:
            return True
        return platform in platforms

    @staticmethod
    def _matches_audience(section: HomeSection, customer) -> bool:
        audience = section.audience or {}
        auth = audience.get("auth")  # "any" | "guest" | "customer"
        if auth == "guest" and customer is not None:
            return False
        if auth == "customer" and customer is None:
            return False
        tiers = audience.get("tiers")
        if tiers:
            if customer is None:
                return False
            if getattr(customer, "tier", None) not in tiers:
                return False
        return True

    # --------------------------------------------------------------- resolution
    async def _resolve_section(self, section: HomeSection, org_id: UUID, store_id: Optional[UUID]) -> Optional[dict]:
        config = dict(section.config or {})
        base = {
            "id": str(section.id),
            "type": section.section_type,
            "title": section.title,
            "subtitle": section.subtitle,
        }
        section_type = section.section_type

        if section_type in ("hero_slider", "banner_strip", "promo_grid"):
            base["config"] = {
                "autoplay": config.get("autoplay", True),
                "interval_ms": config.get("interval_ms", 5000),
                "aspect_ratio": config.get("aspect_ratio"),
                "columns": config.get("columns"),
                "items": config.get("items") or [],
            }
        elif section_type == "product_carousel":
            items = await self._resolve_products(config.get("source") or {}, org_id, store_id)
            base["config"] = {
                "source": config.get("source"),
                "see_all": config.get("see_all"),
                "items": items,
            }
        elif section_type == "category_grid":
            items = await self._resolve_categories(config.get("category_ids"), org_id)
            base["config"] = {
                "columns": config.get("columns", 4),
                "items": items,
            }
        else:
            base["config"] = config  # unknown type: pass through, clients ignore

        return base

    async def _resolve_products(self, source: dict, org_id: UUID, store_id: Optional[UUID]) -> list:
        # Lazy import avoids a circular import (storefront imports this service).
        from app.api.v1.storefront import serialize_product

        source = source or {}
        source_type = source.get("type", "latest")
        value = source.get("value")
        try:
            limit = int(source.get("limit") or 10)
        except (TypeError, ValueError):
            limit = 10
        limit = max(1, min(limit, 30))
        now = datetime.now(timezone.utc)

        if store_id:
            query = (
                select(Product, Inventory.quantity)
                .where(Product.organization_id == org_id, Product.is_deleted == False)
                .join(Inventory, (Inventory.product_id == Product.id) & (Inventory.store_id == store_id))
            )
        else:
            query = select(Product, literal(0)).where(
                Product.organization_id == org_id,
                Product.is_deleted == False,
            )

        if source_type == "category" and value:
            child_res = await self.db.execute(select(Category.id).where(Category.parent_id == value))
            child_ids = [r for (r,) in child_res.all()]
            query = query.where(Product.category_id.in_([value] + child_ids))
        elif source_type == "ids" and value:
            id_list = value if isinstance(value, list) else [v.strip() for v in str(value).split(",") if v.strip()]
            query = query.where(Product.id.in_(id_list))
        elif source_type == "offers":
            query = query.where(
                Product.promo_price != None,
                (Product.promo_start == None) | (Product.promo_start <= now),
                (Product.promo_end == None) | (Product.promo_end >= now),
            )
        elif source_type == "search" and value:
            query = query.where(Product.name.ilike(f"%{value}%"))
        # "latest" / unknown => no extra filter

        query = query.order_by(Product.name).limit(limit)
        result = await self.db.execute(query)
        return [serialize_product(product, qty) for product, qty in result.all()]

    async def _resolve_categories(self, category_ids, org_id: UUID) -> list:
        query = select(Category).where(
            Category.organization_id == org_id,
            Category.is_deleted == False,
        )
        if category_ids:
            query = query.where(Category.id.in_(category_ids))
        else:
            query = query.where(Category.parent_id == None)  # top-level
        query = query.order_by(Category.name)
        result = await self.db.execute(query)
        return [
            {
                "id": str(c.id),
                "name": c.name,
                "image_url": getattr(c, "image_url", None),
                "parent_id": str(c.parent_id) if c.parent_id else None,
            }
            for c in result.scalars().all()
        ]
