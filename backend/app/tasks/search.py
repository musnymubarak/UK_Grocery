"""Search index maintenance tasks."""
from app.core.celery_app import celery_app
from app.core.database import async_session_factory
from sqlalchemy import text
import asyncio

@celery_app.task(name="app.tasks.search.rebuild_search_index")
def rebuild_search_index():
    """Rebuild the product search_vector column. Runs nightly."""
    asyncio.run(_rebuild())

async def _rebuild():
    async with async_session_factory() as db:
        await db.execute(text("""
            UPDATE products SET search_vector = 
                to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(sku, ''))
        """))
        await db.commit()
