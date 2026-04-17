import asyncio
import os
import sys
from uuid import UUID

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_async_session, engine
from app.services.analytics import AnalyticsService
from sqlalchemy import select
from app.models.organization import Organization

async def verify():
    print("Testing Analytics Service...")
    async for db in get_async_session():
        # Get an org ID to test with
        res = await db.execute(select(Organization).limit(1))
        org = res.scalar()
        if not org:
            print("No organization found in DB. Please ensure DB is seeded.")
            return

        service = AnalyticsService(db)
        
        print(f"Testing get_dashboard_kpis for Org: {org.id}")
        try:
            kpis = await service.get_dashboard_kpis(org.id)
            print("KPIS SUCCESS:", kpis)
        except Exception as e:
            print("KPIS FAILED:", str(e))
            import traceback
            traceback.print_exc()

        print(f"Testing get_revenue_chart for Org: {org.id}")
        try:
            chart = await service.get_revenue_chart(org.id, days=7)
            print("CHART SUCCESS, items:", len(chart))
        except Exception as e:
            print("CHART FAILED:", str(e))
            import traceback
            traceback.print_exc()
        
        break # Only need one session

if __name__ == "__main__":
    asyncio.run(verify())
