"""Application-level rate limiting using slowapi + Redis."""
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings

import logging

storage_uri = "memory://"
if settings.REDIS_URL:
    try:
        import redis
        client = redis.Redis.from_url(
            settings.REDIS_URL, 
            socket_connect_timeout=0.2, 
            socket_timeout=0.2
        )
        if client.ping():
            storage_uri = settings.REDIS_URL
    except Exception as e:
        logging.getLogger(__name__).warning(f"Redis offline, falling back to memory rate limiting: {e}")

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute"],
    storage_uri=storage_uri,
)
