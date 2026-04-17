"""
Redis caching service and decorators.
"""
import functools
import json
import logging
from typing import Any, Optional, Union, Callable

from app.core.redis import get_redis

logger = logging.getLogger(__name__)

class CacheService:
    """
    Service for interacting with Redis cache.
    Handles JSON serialization/deserialization.
    """
    @staticmethod
    async def get(key: str) -> Optional[Any]:
        """Retrieve and deserialize a value from cache."""
        try:
            redis = await get_redis()
            data = await redis.get(key)
            if data:
                return json.loads(data)
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {str(e)}")
        return None

    @staticmethod
    async def set(key: str, value: Any, ttl: int = 300) -> bool:
        """Serialize and store a value in cache with TTL."""
        try:
            redis = await get_redis()
            data = json.dumps(value)
            await redis.set(key, data, ex=ttl)
            return True
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {str(e)}")
            return False

    @staticmethod
    async def delete(key: str) -> bool:
        """Remove a key from cache."""
        try:
            redis = await get_redis()
            await redis.delete(key)
            return True
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {str(e)}")
            return False

    @staticmethod
    async def invalidate_pattern(pattern: str) -> int:
        """Invalidate all keys matching a pattern (e.g. 'store_123:*')."""
        try:
            redis = await get_redis()
            keys = await redis.keys(pattern)
            if keys:
                await redis.delete(*keys)
                return len(keys)
        except Exception as e:
            logger.error(f"Cache invalidate_pattern error for pattern {pattern}: {str(e)}")
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
