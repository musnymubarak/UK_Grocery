"""
Customer model — B2C users who purchase products.
"""
from sqlalchemy import Column, String, ForeignKey, Boolean, Text, Numeric, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base, TimestampMixin

class Customer(TimestampMixin, Base):
    __tablename__ = "customers"

    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Membership/Offers info
    membership_tier = Column(String(50), default="standard", nullable=False) # standard, premium, vip
    lifetime_value = Column(Numeric(12, 2), default=0.00, nullable=False)
    discount_rate = Column(Numeric(5, 2), default=0.00, nullable=False)

    # shop.md extensions
    dob = Column(Date, nullable=True)
    wallet_balance = Column(Numeric(12, 2), default=0.00, nullable=False)
    referral_code = Column(String(20), unique=True, nullable=True, index=True)
    referred_by = Column(
        UUID(as_uuid=True),
        ForeignKey("customers.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    organization = relationship("Organization")
    addresses = relationship("CustomerAddress", back_populates="customer", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="customer")

    def __repr__(self):
        return f"<Customer(id={self.id}, email='{self.email}')>"


class CustomerAddress(TimestampMixin, Base):
    __tablename__ = "customer_addresses"

    customer_id = Column(
        UUID(as_uuid=True),
        ForeignKey("customers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    label = Column(String(50), default="home")  # home, work, other
    street = Column(Text, nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    postcode = Column(String(20), nullable=False, index=True)
    country = Column(String(100), nullable=False, default="United Kingdom")
    lat = Column(Numeric(10, 7), nullable=True)
    lng = Column(Numeric(10, 7), nullable=True)
    is_default = Column(Boolean, default=False, nullable=False)

    # Relationships
    customer = relationship("Customer", back_populates="addresses")

    def __repr__(self):
        return f"<CustomerAddress(id={self.id}, label='{self.label}')>"
