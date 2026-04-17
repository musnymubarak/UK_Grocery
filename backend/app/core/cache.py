"""
Redis caching service and decorators.
"""
import functools
import json
import logging
from typing import Any, Optional, Union, Callable

from app.core.config import settings
from app.core.redis import get_redis

logger = logging.getLogger(__name__)

# Pre-flight check to fail fast if Redis is offline locally
_initial_redis_state = False
if settings.REDIS_URL:
    try:
        import redis
        client = redis.Redis.from_url(
            settings.REDIS_URL, 
            socket_connect_timeout=0.2, 
            socket_timeout=0.2
        )
        if client.ping():
            _initial_redis_state = True
    except Exception as e:
        logger.warning(f"Redis offline, disabling caching to prevent delays: {e}")

class CacheService:
    """
    Service for interacting with Redis cache.
    Handles JSON serialization/deserialization.
    """
    _redis_available = _initial_redis_state

    @staticmethod
    async def get(key: str) -> Optional[Any]:
        """Retrieve and deserialize a value from cache."""
        if not CacheService._redis_available:
            return None
        try:
            redis = await get_redis()
            data = await redis.get(key)
            if data:
                return json.loads(data)
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {str(e)}")
            if "Connect call failed" in str(e) or "Timeout" in str(e):
                CacheService._redis_available = False
        return None

    @staticmethod
    async def set(key: str, value: Any, ttl: int = 300) -> bool:
        """Serialize and store a value in cache with TTL."""
        if not CacheService._redis_available:
            return False
        try:
            redis = await get_redis()
            data = json.dumps(value)
            await redis.set(key, data, ex=ttl)
            return True
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {str(e)}")
            if "Connect call failed" in str(e) or "Timeout" in str(e):
                CacheService._redis_available = False
            return False

    @staticmethod
    async def delete(key: str) -> bool:
        """Remove a key from cache."""
        if not CacheService._redis_available:
            return False
        try:
            redis = await get_redis()
            await redis.delete(key)
            return True
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {str(e)}")
            if "Connect call failed" in str(e) or "Timeout" in str(e):
                CacheService._redis_available = False
            return False

    @staticmethod
    async def invalidate_pattern(pattern: str) -> int:
        """Invalidate all keys matching a pattern (e.g. 'store_123:*')."""
        if not CacheService._redis_available:
            return 0
        try:
            redis = await get_redis()
            keys = await redis.keys(pattern)
            if keys:
                await redis.delete(*keys)
                return len(keys)
        except Exception as e:
            logger.error(f"Cache invalidate_pattern error for pattern {pattern}: {str(e)}")
            if "Connect call failed" in str(e) or "Timeout" in str(e):
                CacheService._redis_available = False
        return 0

def cached(key_template: str, ttl: int = 300):
    """
    Decorator for caching async function results.
    key_template can include function arguments, e.g. "products:{store_id}:{category_id}"
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Create a dict of all arguments for the key template
            # (Limitation: only works for kwargs or named args we can inspect)
            # Simplified version: use formatting on kwargs
            try:
                # Merge args and kwargs into a single dict for mapping
                import inspect
                sig = inspect.signature(func)
                bound_args = sig.bind(*args, **kwargs)
                bound_args.apply_defaults()
                
                cache_key = key_template.format(**bound_args.arguments)
            except Exception:
                # Fallback to function name and simple string of args if template fails
                cache_key = f"{func.__name__}:{str(args)}:{str(kwargs)}"

            # Try to get from cache
            cached_val = await CacheService.get(cache_key)
            if cached_val is not None:
                return cached_val

            # Execute function
            result = await func(*args, **kwargs)

            # Store in cache
            if result is not None:
                await CacheService.set(cache_key, result, ttl)

            return result
        return wrapper
    return decorator
