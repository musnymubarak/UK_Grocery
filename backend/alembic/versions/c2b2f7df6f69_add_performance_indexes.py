"""add_performance_indexes

Revision ID: c2b2f7df6f69
Revises: 3ae55c30ff6f
Create Date: 2026-04-17 20:48:56.460871
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision: str = 'c2b2f7df6f69'
down_revision: Union[str, None] = '3ae55c30ff6f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # PERF-002: Add performance indexes on query-critical columns
    op.create_index('idx_orders_status_store', 'orders', ['store_id', 'status'])
    op.create_index('idx_orders_created', 'orders', ['created_at'])
    op.create_index('idx_spend_composite', 'customer_monthly_spends', ['customer_id', 'store_id', 'year_month'], unique=True)
    
    # Additional high-cardinality foreign keys and dates
    op.create_index('idx_order_items_product', 'order_items', ['product_id'])
    op.create_index('idx_coupon_redemptions_composite', 'coupon_redemptions', ['coupon_id', 'customer_id'])
    op.create_index('idx_audit_logs_created', 'audit_logs', ['created_at'])
    op.create_index('idx_customers_org', 'customers', ['organization_id'])

def downgrade() -> None:
    op.drop_index('idx_customers_org', table_name='customers')
    op.drop_index('idx_audit_logs_created', table_name='audit_logs')
    op.drop_index('idx_coupon_redemptions_composite', table_name='coupon_redemptions')
    op.drop_index('idx_order_items_product', table_name='order_items')
    
    op.drop_index('idx_spend_composite', table_name='customer_monthly_spends')
    op.drop_index('idx_orders_created', table_name='orders')
    op.drop_index('idx_orders_status_store', table_name='orders')
