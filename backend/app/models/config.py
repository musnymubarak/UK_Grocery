from sqlalchemy import Column, String, Text, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base, TimestampMixin

class PlatformConfig(TimestampMixin, Base):
    __tablename__ = "platform_configs"

    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    key = Column(String(100), nullable=False, unique=True, index=True)
    value = Column(JSONB, nullable=False)
    description = Column(Text, nullable=True)
    setting_type = Column(String(50), default="string") # boolean, number, string, json

    def __repr__(self):
        return f"<PlatformConfig(key='{self.key}')>"


class FeatureFlag(TimestampMixin, Base):
    __tablename__ = "feature_flags"

    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    key = Column(String(100), nullable=False, unique=True, index=True)
    is_enabled = Column(Boolean, default=False, nullable=False)
    description = Column(Text, nullable=True)

    def __repr__(self):
        return f"<FeatureFlag(key='{self.key}', enabled={self.is_enabled})>"
