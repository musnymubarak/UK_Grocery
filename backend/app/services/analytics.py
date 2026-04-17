"""
Analytics service — aggregated queries for the admin dashboard.
"""
from uuid import UUID
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional
from sqlalchemy import select, func, text, desc
from sqlalchemy.ext.asyncio import AsyncSession
from decimal import Decimal

from app.models.order import Order
from app.models.customer import Customer
from app.models.product import Product

class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_dashboard_kpis(self, org_id: UUID, store_id: Optional[UUID] = None) -> Dict:
        """Get summary KPIs for the dashboard."""
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=7)
        month_start = today_start - timedelta(days=30)

        # Base filters
        filters = [Order.organization_id == org_id]
        if store_id:
            filters.append(Order.store_id == store_id)

        # 1. Total Revenue (All time)
        total_rev_q = select(func.sum(Order.total)).where(*filters)
        total_rev = (await self.db.execute(total_rev_q)).scalar() or 0

        # 2. Today's Revenue
        today_rev_q = select(func.sum(Order.total)).where(Order.created_at >= today_start, *filters)
        today_rev = (await self.db.execute(today_rev_q)).scalar() or 0

        # 3. Weekly Revenue
        week_rev_q = select(func.sum(Order.total)).where(Order.created_at >= week_start, *filters)
        week_rev = (await self.db.execute(week_rev_q)).scalar() or 0
        
        # 4. Order counts by status
        status_query = select(
            Order.status,
            func.count(Order.id)
        ).where(*filters).group_by(Order.status)
        status_res = await self.db.execute(status_query)
        status_counts = {row[0]: row[1] for row in status_res.all()}
        
        # 5. Customer growth (last 30 days)
        customer_query = select(func.count(Customer.id)).where(
            Customer.organization_id == org_id,
            Customer.created_at >= month_start
        )
        cust_res = await self.db.execute(customer_query)
        new_customers = cust_res.scalar() or 0

        # 6. Top Products
        from app.models.order import OrderItem
        top_products_query = (
            select(
                OrderItem.product_name,
                func.sum(OrderItem.quantity).label("total_qty")
            )
            .join(Order, Order.id == OrderItem.order_id)
            .where(*filters)
            .group_by(OrderItem.product_name)
            .order_by(desc("total_qty"))
            .limit(5)
        )
        top_res = await self.db.execute(top_products_query)
        top_products = [
            {"name": row[0], "quantity": float(row[1])} 
            for row in top_res.all()
        ]

        return {
            "revenue": {
                "total": float(total_rev),
                "today": float(today_rev),
                "this_week": float(week_rev),
            },
            "orders": {
                "total": sum(status_counts.values()),
                "by_status": status_counts,
                "pending": status_counts.get("placed", 0) + status_counts.get("confirmed", 0)
            },
            "customers": {
                "new_last_30d": new_customers
            },
            "top_products": top_products
        }

    async def get_revenue_chart(self, org_id: UUID, store_id: Optional[UUID] = None, days: int = 30) -> List[Dict]:
        """Get daily revenue for charts."""
        # Using raw SQL for PostgreSQL date_trunc for performance.
        # Added explicit casting for the optional store_id to avoid AmbiguousParameterError.
        stmt = text("""
            SELECT 
                DATE_TRUNC('day', created_at) as day,
                SUM(total) as revenue,
                COUNT(id) as order_count
            FROM orders
            WHERE organization_id = :org_id 
              AND (CAST(:store_id AS UUID) IS NULL OR store_id = :store_id)
              AND created_at >= NOW() - INTERVAL '1 day' * :days
            GROUP BY day
            ORDER BY day ASC
        """)
        
        result = await self.db.execute(stmt, {"org_id": org_id, "store_id": store_id, "days": days})
        
        chart_data = []
        for row in result.all():
            if row[0]: # Ensure day is not null
                chart_data.append({
                    "date": row[0].strftime("%Y-%m-%d"),
                    "revenue": float(row[1] or 0),
                    "order_count": int(row[2])
                })
        
        return chart_data
