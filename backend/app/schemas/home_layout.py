"""
Schemas for the server-driven home layout.

Two faces:
- Admin (raw): HomeSectionCreate/Update/Response — the editable section row.
- Client (resolved): the public /storefront/home-layout endpoint returns plain
  dicts (products/categories embedded) for cache-friendliness, so there is no
  strict response_model there; see app/api/v1/storefront.py.
"""
from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID
from typing import Optional, List, Literal
from datetime import datetime


ActionType = Literal["category", "product", "search", "offers", "url", "none"]

# Section types the backend knows how to resolve. Clients may ignore unknown ones.
SECTION_TYPES = (
    "hero_slider",
    "banner_strip",
    "product_carousel",
    "category_grid",
    "promo_grid",
)


class SectionAction(BaseModel):
    """Typed, client-agnostic deep link for a banner/slide tap."""
    type: ActionType = "none"
    value: Optional[str] = None
    label: Optional[str] = None


class SectionItem(BaseModel):
    """A slide/card inside a hero_slider / banner_strip / promo_grid section."""
    image_url: Optional[str] = None
    title: Optional[str] = None
    subtitle: Optional[str] = None
    badge: Optional[str] = None
    action: Optional[SectionAction] = None


class HomeSectionBase(BaseModel):
    section_type: str
    title: Optional[str] = None
    subtitle: Optional[str] = None
    position: Optional[int] = 0
    is_active: Optional[bool] = True
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    platforms: Optional[List[str]] = None
    audience: Optional[dict] = None
    config: Optional[dict] = Field(default_factory=dict)
    store_id: Optional[UUID] = None


class HomeSectionCreate(HomeSectionBase):
    pass


class HomeSectionUpdate(BaseModel):
    section_type: Optional[str] = None
    title: Optional[str] = None
    subtitle: Optional[str] = None
    position: Optional[int] = None
    is_active: Optional[bool] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    platforms: Optional[List[str]] = None
    audience: Optional[dict] = None
    config: Optional[dict] = None
    store_id: Optional[UUID] = None


class HomeSectionResponse(HomeSectionBase):
    id: UUID
    organization_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReorderRequest(BaseModel):
    ordered_ids: List[UUID]
