"""GDPR retention tasks."""
import asyncio

import structlog

from app.core.celery_app import celery_app
from app.core.database import async_session_factory

log = structlog.get_logger()


@celery_app.task(name="app.tasks.gdpr.redact_expired_order_addresses")
def redact_expired_order_addresses():
    """Scrub delivery-address text from anonymized customers' orders once the
    tax/legal retention window (GDPRService.ORDER_ADDRESS_RETENTION_YEARS) has
    elapsed since the order was placed. Runs daily — anonymize_customer already
    redacts orders that are already past retention at request time; this catches
    the ones that cross the threshold later.
    """
    asyncio.run(_redact_expired_order_addresses())


async def _redact_expired_order_addresses():
    from app.services.gdpr import GDPRService

    async with async_session_factory() as db:
        service = GDPRService(db)
        count = await service.redact_expired_order_addresses()
        await db.commit()
        if count:
            log.info("gdpr.order_addresses_redacted", count=count)
        return {"redacted": count}
