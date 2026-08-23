"""
Middleware for adding production-grade security headers.
"""
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import settings

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware that adds production security headers to all responses.
    """
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Prevent browsers from sniffing MIME types
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        
        # Basic XSS protection (for older browsers)
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Referrer policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Permissions policy (restricts browser features)
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), interest-cohort=()"

        # Content Security Policy. Note this middleware only ever runs for
        # requests that reach FastAPI directly — the admin/storefront SPAs are
        # served by nginx as static files and never pass through here, so this
        # header has no effect on them at all; it only reaches plain /api/v1/*
        # JSON responses (which render no HTML/CSS, so a strict policy costs
        # nothing) and /docs, /redoc, /openapi.json (served directly by
        # FastAPI, and Swagger/ReDoc need a looser policy: they load their own
        # JS/CSS from a CDN and run an inline init script).
        connect_src = " ".join(["'self'"] + settings.cors_origins_list)
        is_docs_route = (
            request.url.path in ("/docs", "/redoc", "/openapi.json")
            or request.url.path.startswith("/docs/")
        )
        if is_docs_route:
            csp = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                "img-src 'self' data: https://fastapi.tiangolo.com; "
                f"connect-src {connect_src}"
            )
        else:
            csp = (
                "default-src 'self'; "
                "script-src 'self'; "
                "style-src 'self'; "
                "img-src 'self' data:; "
                f"connect-src {connect_src}"
            )
        response.headers["Content-Security-Policy"] = csp
        
        # HSTS (Production only)
        if not settings.DEBUG:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
            
        return response
