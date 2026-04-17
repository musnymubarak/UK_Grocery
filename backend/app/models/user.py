"""
User model — system users with role-based access.
"""
from sqlalchemy import Column, String, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base, TimestampMixin


class User(TimestampMixin, Base):
    __tablename__ = "users"

    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    store_id = Column(
        UUID(as_uuid=True),
        ForeignKey("stores.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="manager")  # admin, manager, delivery_boy
    phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    organization = relationship("Organization", back_populates="users")
    store = relationship("Store", back_populates="users")
    assigned_orders = relationship("Order", back_populates="delivery_boy", lazy="raise")

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}')>"
