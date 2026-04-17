"""
Middleware for request tracing and security headers.
"""
import time
import uuid
import logging
from contextvars import ContextVar
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

# Context variable to store the request ID for the current task/request
request_id_var: ContextVar[str] = ContextVar("request_id", default="")

class RequestTracingMiddleware(BaseHTTPMiddleware):
    """
    Middleware that:
    1. Generates/extracts X-Request-ID
    2. Stores it in a context variable for logging
    3. Attaches it to response headers
    4. Logs request completion with duration
    """
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        # Get request ID from header or generate new one
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request_id_var.set(request_id)
        
        try:
            response = await call_next(request)
        except Exception as e:
            # Ensure we log the error with the request ID before re-raising
            process_time = (time.time() - start_time) * 1000
            logger.error(
                f"Unhandled exception: {str(e)}",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": process_time,
                }
            )
            raise
        
        process_time = (time.time() - start_time) * 1000
        
        # Set request ID in response header
        response.headers["X-Request-ID"] = request_id
        
        # Log request summary
        logger.info(
            f"{request.method} {request.url.path} - {response.status_code} ({process_time:.2f}ms)",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": process_time,
            }
        )
        
        return response

def get_request_id() -> str:
    """Helper to get current request ID in other parts of the app."""
    return request_id_var.get()
