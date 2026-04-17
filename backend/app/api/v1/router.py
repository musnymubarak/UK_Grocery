"""
API v1 router — aggregates all feature routers.
"""
from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.stores import router as store_router
from app.api.v1.products import router as product_router
from app.api.v1.categories import router as category_router
from app.api.v1.inventory import router as inventory_router
from app.api.v1.reports import router as report_router
from app.api.v1.audit import router as audit_router
from app.api.v1.customers import router as customer_router
from app.api.v1.orders import router as order_router
from app.api.v1.delivery_zones import router as delivery_zones_router
from app.api.v1.storefront import router as storefront_router
from app.api.v1.coupons import router as coupon_router
from app.api.v1.config import router as config_router
from app.api.v1.rewards import router as rewards_router
from app.api.v1.wallet import router as wallet_router
from app.api.v1.refunds import router as refund_router

api_router = APIRouter()

from sqlalchemy import text
from app.core.database import get_async_session
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

# Health check
@api_router.get("/health", tags=["Health"])
async def health_check(db: AsyncSession = Depends(get_async_session)):
    checks = {"service": "UK Grocery API"}
    overall = "healthy"

    # Check DB
    try:
        await db.execute(text("SELECT 1"))
        checks["database"] = "healthy"
    except Exception:
        checks["database"] = "unhealthy"
        overall = "degraded"

    # Check Redis
    try:
        from app.core.redis import get_redis
        r = await get_redis()
        await r.ping()
        checks["redis"] = "healthy"
    except Exception:
        checks["redis"] = "unhealthy"
        overall = "degraded"

    checks["status"] = overall
    return checks

# Public storefront (no auth required)
api_router.include_router(storefront_router)

# Admin/staff feature routers
api_router.include_router(auth_router)
api_router.include_router(store_router)
api_router.include_router(product_router)
api_router.include_router(category_router)
api_router.include_router(inventory_router)
api_router.include_router(report_router)
api_router.include_router(audit_router)
api_router.include_router(customer_router)
api_router.include_router(order_router)
api_router.include_router(delivery_zones_router)
api_router.include_router(coupon_router)
api_router.include_router(config_router)
api_router.include_router(rewards_router)
api_router.include_router(wallet_router)
api_router.include_router(refund_router)
