"""
Refresh token model — supports rotation and revocation.
"""
from sqlalchemy import Column, String, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base, TimestampMixin

class RefreshToken(TimestampMixin, Base):
    __tablename__ = "refresh_tokens"

    token_hash = Column(String(255), unique=True, nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_revoked = Column(Boolean, default=False, nullable=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    device_info = Column(Text, nullable=True)  # user-agent for audit
    replaced_by = Column(String(255), nullable=True)  # chain tracking

    def __repr__(self):
        return f"<RefreshToken(token_hash='{self.token_hash[:10]}...', is_revoked={self.is_revoked})>"
