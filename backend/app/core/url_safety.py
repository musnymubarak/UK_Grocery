"""SSRF protection for outbound webhook URLs."""
import asyncio
import ipaddress
from urllib.parse import urlparse

from app.core.exceptions import ValidationException


async def assert_safe_webhook_url(url: str) -> None:
    """Reject webhook URLs that resolve to private/internal/loopback
    addresses. Without this, a capable-but-compromised staff account could
    register a webhook pointed at internal infrastructure (e.g. a cloud
    metadata endpoint) and have the backend make outbound requests to it.
    """
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise ValidationException("Webhook URL must be http:// or https://")
    hostname = parsed.hostname
    if not hostname:
        raise ValidationException("Webhook URL has no hostname")

    try:
        loop = asyncio.get_event_loop()
        infos = await loop.getaddrinfo(hostname, None)
    except Exception as e:
        raise ValidationException(f"Could not resolve webhook host {hostname!r}: {e}")

    for info in infos:
        ip_str = info[4][0]
        try:
            ip = ipaddress.ip_address(ip_str)
        except ValueError:
            continue
        if (
            ip.is_private or ip.is_loopback or ip.is_link_local
            or ip.is_reserved or ip.is_multicast or ip.is_unspecified
        ):
            raise ValidationException(
                f"Webhook URL resolves to a disallowed address ({ip_str}) — "
                "internal, private, and loopback destinations are not permitted"
            )
