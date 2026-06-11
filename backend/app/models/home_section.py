"""
HomeSection model — server-driven home layout.

Each row is one ordered "section" of the customer home screen (hero slider,
banner strip, product carousel, category grid, promo grid, ...). Clients render
the section types they know and ignore the rest, so new content is pure data —
no app release required. See app/services/home_layout.py for resolution.
"""
from sqlalchemy import Column, String, ForeignKey, Boolean, Integer, DateTime, text, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.core.database import Base, TimestampMixin


class HomeSection(TimestampMixin, Base):
    __tablename__ = "home_sections"

    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # null store_id => global section shown for every store
    store_id = Column(UUID(as_uuid=True), ForeignKey("stores.id", ondelete="CASCADE"), nullable=True)

    # hero_slider | banner_strip | product_carousel | category_grid | promo_grid
    section_type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=True)
    subtitle = Column(String(500), nullable=True)
    position = Column(Integer, default=0, nullable=False)  # ascending render order

    # scheduling
    is_active = Column(Boolean, default=True, nullable=False)
    starts_at = Column(DateTime(timezone=True), nullable=True)
    ends_at = Column(DateTime(timezone=True), nullable=True)

    # targeting (null => no restriction)
    platforms = Column(JSONB, nullable=True)   # e.g. ["web", "ios", "android"]
    audience = Column(JSONB, nullable=True)    # e.g. {"auth": "any|guest|customer", "tiers": ["premium"]}

    # type-specific payload (slides / source query / columns) — see home_layout service
    config = Column(JSONB, nullable=False, default=dict, server_default=text("'{}'::jsonb"))

    __table_args__ = (
        Index("ix_home_sections_org_store_position", "organization_id", "store_id", "position"),
    )

    def __repr__(self):
        return f"<HomeSection(type='{self.section_type}', position={self.position}, active={self.is_active})>"
