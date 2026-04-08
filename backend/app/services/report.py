"""
Report service — order analytics, inventory valuation, performance metrics.
"""
from datetime import datetime, timedelta
from typing import Optional, List
from uuid import UUID

from sqlalchemy import select, func, and_, case, cast, String
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.inventory import Inventory
from app.models.user import User
from app.models.store import Store
from app.models.category import Category
from app.models.stock_movement import StockMovement


class ReportService:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _build_date_filters(self, date_from: Optional[datetime], date_to: Optional[datetime], col):
        filters = []
        if date_from:
            filters.append(col >= date_from)
        if date_to:
            if date_to.hour == 0 and date_to.minute == 0 and date_to.second == 0:
                dt = date_to + timedelta(days=1)
                filters.append(col < dt)
            else:
                filters.append(col <= date_to)
        return filters

    async def get_sales_summary(
        self,
        org_id: UUID,
        store_id: Optional[UUID] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> dict:
        base_filters = []
        if store_id:
            base_filters.append(Order.store_id == store_id)

        date_filters = self._build_date_filters(date_from, date_to, Order.created_at)
        all_filters = base_filters + date_filters

        # 1. Main Totals (Delivered Orders)
        q_totals = (
            select(
                func.count(Order.id).label("total_sales"),
                func.coalesce(func.sum(Order.total), 0).label("total_revenue"),
                # We don't have tax at Order level explicitly mapped like Sale, we sum from items or assume 0 for this demo
                func.coalesce(func.sum(Order.discount), 0).label("total_discount"),
            )
            .join(Store, Store.id == Order.store_id)
            .where(*all_filters, Store.organization_id == org_id, Order.status == "delivered")
        )
        
        q_items = (
            select(func.coalesce(func.sum(OrderItem.quantity), 0).label("total_items"))
            .join(Order, Order.id == OrderItem.order_id)
            .join(Store, Store.id == Order.store_id)
            .where(*all_filters, Store.organization_id == org_id, Order.status == "delivered")
        )

        res_totals = await self.db.execute(q_totals)
        row_totals = res_totals.one()
        total_sales = row_totals.total_sales or 0
        total_revenue = float(row_totals.total_revenue)

        res_items = await self.db.execute(q_items)
        total_items = res_items.scalar() or 0

        # 2. Cancellations/Refunds
        q_refunds = (
            select(
                func.count(Order.id).label("refund_count"),
                func.coalesce(func.sum(Order.total), 0).label("refund_amount")
            )
            .join(Store, Store.id == Order.store_id)
            .where(*all_filters, Store.organization_id == org_id, Order.status == "cancelled")
        )
        res_refunds = await self.db.execute(q_refunds)
        row_refunds = res_refunds.one()

        # 3. Payment Methods
        q_payment = (
            select(
                Order.payment_method,
                func.coalesce(func.sum(Order.total), 0).label("amount"),
                func.count(Order.id).label("count")
            )
            .join(Store, Store.id == Order.store_id)
            .where(*all_filters, Store.organization_id == org_id, Order.status == "delivered")
            .group_by(Order.payment_method)
        )
        res_payment = await self.db.execute(q_payment)
        payment_methods = [
            {"method": row.payment_method, "amount": float(row.amount), "count": row.count}
            for row in res_payment.all()
        ]

        # 4. Hourly Heatmap
        q_heatmap = (
            select(
                func.extract('isodow', Order.created_at).label('day'),
                func.extract('hour', Order.created_at).label('hour'),
                func.count(Order.id).label('sales')
            )
            .join(Store, Store.id == Order.store_id)
            .where(*all_filters, Store.organization_id == org_id, Order.status == "delivered")
            .group_by('day', 'hour')
        )
        res_heatmap = await self.db.execute(q_heatmap)
        hourly_heatmap = [
            {"day": int(row.day), "hour": int(row.hour), "sales": row.sales}
            for row in res_heatmap.all()
        ]

        # 5. Trend line (Daily)
        q_trend = (
            select(
                func.date_trunc('day', Order.created_at).label('date'),
                func.coalesce(func.sum(Order.total), 0).label('revenue'),
                func.count(Order.id).label('transactions')
            )
            .join(Store, Store.id == Order.store_id)
            .where(*all_filters, Store.organization_id == org_id, Order.status == "delivered")
            .group_by('date')
            .order_by('date')
        )
        res_trend = await self.db.execute(q_trend)
        trend_line = [
            {
                "date": row.date.strftime("%Y-%m-%d"), 
                "revenue": float(row.revenue), 
                "transactions": row.transactions
            }
            for row in res_trend.all()
        ]

        busiest_hour = max(hourly_heatmap, key=lambda x: x["sales"])["hour"] if hourly_heatmap else None

        return {
            "total_sales": total_sales,
            "total_revenue": total_revenue,
            "total_tax": 0.0, # Removed tax logic for simplicity
            "total_discount": float(row_totals.total_discount),
            "total_items": total_items,
            "average_sale": total_revenue / total_sales if total_sales > 0 else 0,
            "average_items": total_items / total_sales if total_sales > 0 else 0,
            "total_refunds_count": row_refunds.refund_count,
            "total_refunds_amount": float(row_refunds.refund_amount),
            "busiest_hour": busiest_hour,
            "paymentMethods": payment_methods,
            "hourlyHeatmap": hourly_heatmap,
            "trendLine": trend_line,
            # We don't have preorders, returning zeros for compatibility if frontend expects it, or just drop
            "po_active_count": 0,
            "po_active_deposits": 0.0,
            "po_active_total": 0.0,
            "po_completed_count": 0,
        }

    async def get_product_performance(
        self,
        org_id: UUID,
        store_id: Optional[UUID] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        limit: int = 20,
    ) -> dict:
        base_filters = [Order.status == "delivered"]
        if store_id:
            base_filters.append(Order.store_id == store_id)

        date_filters = self._build_date_filters(date_from, date_to, Order.created_at)
        all_filters = base_filters + date_filters

        # 1. Top Products
        q_top = (
            select(
                OrderItem.product_id,
                OrderItem.product_name,
                Product.category_id,
                Category.name.label("category_name"),
                OrderItem.product_sku,
                func.sum(OrderItem.quantity).label("total_quantity"),
                func.sum(OrderItem.total).label("total_revenue"),
                func.avg(OrderItem.unit_price).label("avg_price"),
                func.avg(Product.cost_price).label("avg_cost")
            )
            .join(Order, Order.id == OrderItem.order_id)
            .join(Store, Store.id == Order.store_id)
            .outerjoin(Product, Product.id == OrderItem.product_id)
            .outerjoin(Category, Category.id == Product.category_id)
            .where(*all_filters, Store.organization_id == org_id)
            .group_by(OrderItem.product_id, OrderItem.product_name, OrderItem.product_sku, Product.category_id, Category.name)
            .order_by(func.sum(OrderItem.total).desc())
            .limit(limit)
        )
        res_top = await self.db.execute(q_top)
        top_products = []
        for row in res_top.all():
            rev = float(row.total_revenue)
            cost = float(row.avg_cost or 0)
            avg_price = float(row.avg_price or 0)
            margin = ((avg_price - cost) / avg_price * 100) if avg_price > 0 else 0

            top_products.append({
                "product_id": str(row.product_id) if row.product_id else None,
                "product_name": row.product_name,
                "product_sku": row.product_sku,
                "category_name": row.category_name or "Uncategorized",
                "total_quantity": row.total_quantity,
                "total_revenue": rev,
                "avg_price": avg_price,
                "margin_percent": margin
            })

        # 2. Category Breakdown
        q_cat = (
            select(
                func.coalesce(Category.name, "Uncategorized").label("category_name"),
                func.sum(OrderItem.total).label("revenue")
            )
            .join(Order, Order.id == OrderItem.order_id)
            .join(Store, Store.id == Order.store_id)
            .outerjoin(Product, Product.id == OrderItem.product_id)
            .outerjoin(Category, Category.id == Product.category_id)
            .where(*all_filters, Store.organization_id == org_id)
            .group_by(Category.name)
        )
        res_cat = await self.db.execute(q_cat)
        category_breakdown = [
            {"name": row.category_name, "value": float(row.revenue)}
            for row in res_cat.all()
        ]

        # 3. Slow Movers
        subq_active = (
            select(OrderItem.product_id)
            .join(Order, Order.id == OrderItem.order_id)
            .join(Store, Store.id == Order.store_id)
            .where(*all_filters, Store.organization_id == org_id)
        )

        q_slow = (
            select(
                Product.id,
                Product.name,
                Category.name.label("category_name"),
                func.coalesce(func.sum(Inventory.quantity), 0).label("current_stock")
            )
            .outerjoin(Category, Category.id == Product.category_id)
            .outerjoin(Inventory, Inventory.product_id == Product.id)
            .where(
                Product.organization_id == org_id,
                Product.is_deleted == False,
                ~Product.id.in_(subq_active)
            )
        )
        if store_id:
            q_slow = q_slow.where(Inventory.store_id == store_id)
            
        q_slow = q_slow.group_by(Product.id, Product.name, Category.name).having(func.sum(Inventory.quantity) > 0).limit(20)
        
        res_slow = await self.db.execute(q_slow)
        slow_movers = [
            {
                "product_id": str(row.id),
                "product_name": row.name,
                "category_name": row.category_name or "Uncategorized",
                "current_stock": row.current_stock,
                "days_since_sale": -1 
            }
            for row in res_slow.all()
        ]

        return {
            "topProducts": top_products,
            "categoryBreakdown": category_breakdown,
            "slowMovers": slow_movers
        }

    async def get_cashier_performance(
        self,
        org_id: UUID,
        store_id: Optional[UUID] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> List[dict]:
        # Rename conceptually to get_delivery_performance but keep frontend compat
        base_filters = []
        if store_id:
            base_filters.append(Order.store_id == store_id)

        date_filters = self._build_date_filters(date_from, date_to, Order.created_at)
        all_filters = base_filters + date_filters

        q = (
            select(
                User.id.label("user_id"),
                User.full_name,
                Store.name.label("store_name"),
                func.sum(
                    case((Order.status == "delivered", 1), else_=0)
                ).label("total_sales"),
                func.sum(
                    case((Order.status == "delivered", Order.total), else_=0)
                ).label("total_revenue"),
                func.sum(
                    case((Order.status == "cancelled", 1), else_=0)
                ).label("total_refunds"),
                func.sum(
                    case((Order.status == "cancelled", Order.total), else_=0)
                ).label("refund_amount"),
            )
            .join(Order, Order.assigned_to == User.id)
            .join(Store, Store.id == Order.store_id)
            .where(*all_filters, Store.organization_id == org_id)
            .group_by(User.id, User.full_name, Store.name)
            .order_by(func.sum(case((Order.status == "delivered", Order.total), else_=0)).desc())
        )
        
        result = await self.db.execute(q)
        return [
            {
                "user_id": str(row.user_id),
                "cashier_name": row.full_name,
                "store_name": row.store_name,
                "total_sales": row.total_sales or 0,
                "total_revenue": float(row.total_revenue or 0),
                "total_refunds": row.total_refunds or 0,
                "refund_amount": float(row.refund_amount or 0),
                "avg_sale": float(row.total_revenue / row.total_sales) if (row.total_sales or 0) > 0 else 0,
                "refund_rate": float(row.total_refunds / (row.total_sales + row.total_refunds) * 100) if (row.total_sales or 0) > 0 else 0
            }
            for row in result.all()
        ]

    async def get_inventory_valuation(
        self, 
        org_id: UUID, 
        store_id: Optional[UUID] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> dict:
        q_val = (
            select(
                func.sum(Inventory.quantity * Product.cost_price).label("total_cost"),
                func.sum(Inventory.quantity * Product.selling_price).label("total_retail"),
                func.sum(Inventory.quantity).label("total_units"),
            )
            .join(Product, Product.id == Inventory.product_id)
            .where(Product.organization_id == org_id, Product.is_deleted == False)
        )

        if store_id:
            q_val = q_val.where(Inventory.store_id == store_id)

        res_val = await self.db.execute(q_val)
        row_val = res_val.one()

        total_cost = float(row_val.total_cost or 0)
        total_retail = float(row_val.total_retail or 0)
        
        # Low Stock
        q_low = (
            select(
                Product.id,
                Product.name,
                Product.low_stock_threshold,
                Inventory.quantity,
                Inventory.reserved_quantity
            )
            .join(Inventory, Inventory.product_id == Product.id)
            .where(
                Product.organization_id == org_id, 
                Product.is_deleted == False, 
                (Inventory.quantity - Inventory.reserved_quantity) <= Product.low_stock_threshold
            )
        )
        if store_id:
            q_low = q_low.where(Inventory.store_id == store_id)
        
        res_low = await self.db.execute(q_low)
        low_stock_alerts = [
            {
                "product_id": str(r.id), 
                "name": r.name, 
                "threshold": r.low_stock_threshold, 
                "quantity": r.quantity - r.reserved_quantity
            }
            for r in res_low.all()
        ]

        # Stock movements
        date_filters = self._build_date_filters(date_from, date_to, StockMovement.created_at)
        q_mov = (
            select(
                StockMovement.movement_type,
                func.sum(StockMovement.quantity).label("qty")
            )
            .join(Store, Store.id == StockMovement.store_id)
            .where(*date_filters, Store.organization_id == org_id)
            .group_by(StockMovement.movement_type)
        )
        if store_id:
            q_mov = q_mov.where(StockMovement.store_id == store_id)
            
        res_mov = await self.db.execute(q_mov)
        stock_movements = [{"type": r.movement_type, "quantity": r.qty} for r in res_mov.all()]

        # Inventory Table
        q_table = (
            select(
                Product.id,
                Product.name,
                Category.name.label("category_name"),
                Store.name.label("store_name"),
                Inventory.quantity,
                Product.cost_price,
                Product.selling_price
            )
            .join(Inventory, Inventory.product_id == Product.id)
            .join(Store, Store.id == Inventory.store_id)
            .outerjoin(Category, Category.id == Product.category_id)
            .where(Product.organization_id == org_id, Product.is_deleted == False)
        )
        if store_id:
            q_table = q_table.where(Inventory.store_id == store_id)
            
        res_table = await self.db.execute(q_table.limit(100))
        inventory_table = [
            {
                "product": r.name,
                "category": r.category_name or "Uncategorized",
                "store": r.store_name,
                "stock": r.quantity,
                "cost": float(r.cost_price),
                "retail": float(r.selling_price),
                "stock_value": float(r.quantity * r.cost_price),
                "retail_value": float(r.quantity * r.selling_price),
                "margin": float(((r.selling_price - r.cost_price) / r.selling_price * 100) if r.selling_price > 0 else 0)
            }
            for r in res_table.all()
        ]

        return {
            "summary": {
                "total_units": row_val.total_units or 0,
                "total_cost_value": total_cost,
                "total_retail_value": total_retail,
                "potential_profit": total_retail - total_cost,
            },
            "lowStockAlerts": low_stock_alerts,
            "stockMovements": stock_movements,
            "inventoryTable": inventory_table
        }
