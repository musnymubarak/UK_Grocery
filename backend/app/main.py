"""
UK Grocery Backend — FastAPI Application Entry Point
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
import os
from datetime import datetime

from app.core.config import settings
from app.core.database import engine, Base
from app.core.logging_config import setup_logging
from app.core.middleware import RequestTracingMiddleware
from app.core.security_headers import SecurityHeadersMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

# Import all models so Base.metadata knows every table
import app.models  # noqa: F401

# Initialize structured logging early
setup_logging()
logger = logging.getLogger(__name__)


from app.core.redis import get_redis, close_redis

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle: startup and shutdown."""
    if settings.DEBUG:
        logger.info("DEBUG mode: Creating database tables if not present...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables ready.")
    else:
        logger.info("Production mode: Skipping create_all (use Alembic migrations)")
    
    await get_redis()  # warm up connection
    logger.info("Redis connected.")
    yield
    await close_redis()
    await engine.dispose()


def create_app() -> FastAPI:
    """Application factory."""
    application = FastAPI(
        title="UK Grocery API",
        version=settings.APP_VERSION,
        description="Multi-location online grocery platform",
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        openapi_url="/openapi.json" if settings.DEBUG else None,
        lifespan=lifespan,
    )

    # Middlewares (In reverse order of execution)
    application.add_middleware(SecurityHeadersMiddleware)
    application.add_middleware(RequestTracingMiddleware)
    application.add_middleware(
        TrustedHostMiddleware, 
        allowed_hosts=[host.strip() for host in settings.ALLOWED_HOSTS.split(",")]
    )
    application.add_middleware(GZipMiddleware, minimum_size=500)

    # CORS
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routers
    application.include_router(api_router, prefix="/api/v1")

    # Rate limiting
    from app.core.rate_limiter import limiter
    from slowapi import _rate_limit_exceeded_handler
    from slowapi.errors import RateLimitExceeded
    application.state.limiter = limiter
    application.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # Ensure uploads directory exists
    if not os.path.exists(settings.UPLOAD_DIR):
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    if settings.DEBUG:
        # Dev only: serve uploads from FastAPI. In production, nginx handles /uploads/
        application.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

    return application


app = create_app()
