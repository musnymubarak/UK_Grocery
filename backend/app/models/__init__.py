"""
All SQLAlchemy models — import here for Alembic auto-migration discovery.
"""
from app.models.organization import Organization
from app.models.store import Store
from app.models.user import User
from app.models.customer import Customer, CustomerAddress
from app.models.category import Category
from app.models.product import Product
from app.models.inventory import Inventory
from app.models.order import Order, OrderItem, OrderStatusHistory
from app.models.delivery_zone import DeliveryZone, PostcodeZoneMapping
from app.models.stock_movement import StockMovement
from app.models.audit import AuditLog
from app.models.coupon import Coupon, CouponRedemption
from app.models.config import PlatformConfig, FeatureFlag
from app.models.rewards import RewardsTier, CustomerMonthlySpend, RewardEvent
from app.models.wallet import WalletTransaction
from app.models.refund import Refund
from app.models.notification import Notification
from app.models.review import Review
from app.models.banner import Banner
from app.models.refresh_token import RefreshToken
from app.models.driver import DriverProfile
from app.models.promotion import Promotion
from app.models.webhook import WebhookEndpoint, WebhookDelivery
from app.models.refund_evidence import RefundEvidence

__all__ = [
    "Organization",
    "Store",
    "User",
    "Customer",
    "CustomerAddress",
    "Category",
    "Product",
    "Inventory",
    "Order",
    "OrderItem",
    "OrderStatusHistory",
    "DeliveryZone",
    "PostcodeZoneMapping",
    "StockMovement",
    "AuditLog",
    "Coupon",
    "CouponRedemption",
    "PlatformConfig",
    "FeatureFlag",
    "RewardsTier",
    "CustomerMonthlySpend",
    "RewardEvent",
    "WalletTransaction",
    "Refund",
    "Notification",
    "Review",
    "Banner",
    "RefreshToken",
    "DriverProfile",
    "Promotion",
    "WebhookEndpoint",
    "WebhookDelivery",
    "RefundEvidence",
]
