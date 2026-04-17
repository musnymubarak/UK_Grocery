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

        # 1. Revenue stats
        revenue_query = select(
            func.sum(Order.total).label("total_rev"),
            func.sum(select(Order.total).where(Order.created_at >= today_start, *filters).scalar_subquery()).label("today_rev"),
            func.sum(select(Order.total).where(Order.created_at >= week_start, *filters).scalar_subquery()).label("week_rev"),
        ).where(*filters)
        
        # 2. Order counts by status
        status_query = select(
            Order.status,
            func.count(Order.id)
        ).where(*filters).group_by(Order.status)
        
        # 3. Customer growth
        customer_query = select(func.count(Customer.id)).where(
            Customer.organization_id == org_id,
            Customer.created_at >= month_start
        )

        # Execute
        rev_res = await self.db.execute(revenue_query)
        rev_row = rev_res.one()
        
        status_res = await self.db.execute(status_query)
        status_counts = {row[0]: row[1] for row in status_res.all()}
        
        cust_res = await self.db.execute(customer_query)
        new_customers = cust_res.scalar() or 0

        # Top Products
        # Note: OrderItem doesn't have org_id directly, join with Order
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
        top_products = [{"name": row[0], "quantity": float(row[1])} for row in top_res.all()]

        return {
            "revenue": {
                "total": float(rev_row.total_rev or 0),
                "today": float(rev_row.today_rev or 0),
                "this_week": float(rev_row.week_rev or 0),
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
        # Using raw SQL for PostgreSQL date_trunc for performance
        stmt = text("""
            SELECT 
                DATE_TRUNC('day', created_at) as day,
                SUM(total) as revenue,
                COUNT(id) as order_count
            FROM orders
            WHERE organization_id = :org_id 
              AND (:store_id IS NULL OR store_id = :store_id)
              AND created_at >= NOW() - INTERVAL '1 day' * :days
            GROUP BY day
            ORDER BY day ASC
        """)
        
        result = await self.db.execute(stmt, {"org_id": org_id, "store_id": store_id, "days": days})
        return [
            {
                "date": row[0].strftime("%Y-%m-%d"),
                "revenue": float(row[1] or 0),
                "order_count": row[2]
            }
            for row in result.all()
        ]
