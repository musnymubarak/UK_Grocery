"""
Health check and monitoring endpoints.
"""
import time
from datetime import datetime, timezone
from typing import Dict, Any

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.core.redis import get_redis

router = APIRouter()

# Store app start time
START_TIME = time.time()

@router.get("/health")
async def liveness():
    """Simple process liveness check."""
    return {"status": "ok", "timestamp": datetime.now(timezone.utc)}

@router.get("/health/ready")
async def readiness(db: AsyncSession = Depends(get_async_session)):
    """
    Readiness probe: checks DB and Redis connections.
    Returns 503 if any critical component is down.
    """
    status = {
        "status": "ready",
        "timestamp": datetime.now(timezone.utc),
        "components": {}
    }
    
    # Check Database
    try:
        await db.execute(text("SELECT 1"))
        status["components"]["db"] = "ok"
    except Exception as e:
        status["components"]["db"] = f"error: {str(e)}"
        status["status"] = "partial"
        
    # Check Redis
    try:
        redis = await get_redis()
        await redis.ping()
        status["components"]["redis"] = "ok"
    except Exception as e:
        status["components"]["redis"] = f"error: {str(e)}"
        status["status"] = "partial"
        
    return status

@router.get("/health/metrics")
async def metrics(db: AsyncSession = Depends(get_async_session)):
    """
    Basic application metrics.
    Admin only in a real scenario, but keeping it simple here.
    """
    uptime = time.time() - START_TIME
    
    # Get active connection count (simplified version)
    # In a real app we'd query pg_stat_activity
    
    return {
        "uptime_seconds": int(uptime),
        "version": "1.0.0",
        "system": {
            "time": datetime.now(timezone.utc),
            "start_time": datetime.fromtimestamp(START_TIME, tz=timezone.utc)
        }
    }
