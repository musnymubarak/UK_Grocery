"""pos to grocery transformation

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-04-08 15:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Drop old tables safely
    op.drop_table('sale_items')
    op.drop_table('sales')
    op.drop_table('preorder_items')
    op.drop_table('preorders')
    op.drop_table('sync_logs')
    
    # We shouldn't do complex data preservation here as the user instructed to drop historical data.

    # 2. Create new tables
    op.create_table(
        'customers',
        sa.Column('id', sa.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('organization_id', sa.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('membership_tier', sa.String(length=50), server_default='standard', nullable=False),
        sa.Column('lifetime_value', sa.Numeric(precision=12, scale=2), server_default='0.00', nullable=False),
        sa.Column('discount_rate', sa.Numeric(precision=5, scale=2), server_default='0.00', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    op.create_index('idx_customers_org_id', 'customers', ['organization_id'], unique=False)
    op.create_index('idx_customers_email', 'customers', ['email'], unique=False)

    op.create_table(
        'customer_addresses',
        sa.Column('id', sa.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('customer_id', sa.UUID(as_uuid=True), nullable=False),
        sa.Column('label', sa.String(length=50), server_default='home', nullable=True),
        sa.Column('street', sa.Text(), nullable=False),
        sa.Column('city', sa.String(length=100), nullable=False),
        sa.Column('state', sa.String(length=100), nullable=False),
        sa.Column('postcode', sa.String(length=20), nullable=False),
        sa.Column('country', sa.String(length=100), server_default='United Kingdom', nullable=False),
        sa.Column('lat', sa.Numeric(precision=10, scale=7), nullable=True),
        sa.Column('lng', sa.Numeric(precision=10, scale=7), nullable=True),
        sa.Column('is_default', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_cust_addresses_cust_id', 'customer_addresses', ['customer_id'], unique=False)
    op.create_index('idx_cust_addresses_postcode', 'customer_addresses', ['postcode'], unique=False)

    op.create_table(
        'delivery_zones',
        sa.Column('id', sa.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('store_id', sa.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('base_fee', sa.Numeric(precision=10, scale=2), server_default='0.00', nullable=False),
        sa.Column('per_km_fee', sa.Numeric(precision=10, scale=2), server_default='0.00', nullable=False),
        sa.Column('min_order_for_free_delivery', sa.Numeric(precision=10, scale=2), server_default='50.00', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('postcode_patterns', postgresql.ARRAY(sa.String()), server_default='{}', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['store_id'], ['stores.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_delivery_zones_store_id', 'delivery_zones', ['store_id'], unique=False)

    op.create_table(
        'postcode_zone_mappings',
        sa.Column('postcode', sa.String(length=20), nullable=False),
        sa.Column('zone_id', sa.UUID(as_uuid=True), nullable=False),
        sa.Column('id', sa.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['zone_id'], ['delivery_zones.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('postcode', 'id')
    )
    op.create_index('idx_pzm_postcode', 'postcode_zone_mappings', ['postcode'], unique=False)

    op.create_table(
        'orders',
        sa.Column('id', sa.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('organization_id', sa.UUID(as_uuid=True), nullable=False),
        sa.Column('store_id', sa.UUID(as_uuid=True), nullable=False),
        sa.Column('customer_id', sa.UUID(as_uuid=True), nullable=False),
        sa.Column('delivery_address_id', sa.UUID(as_uuid=True), nullable=True),
        sa.Column('assigned_to', sa.UUID(as_uuid=True), nullable=True),
        sa.Column('order_number', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=20), server_default='received', nullable=False),
        sa.Column('subtotal', sa.Numeric(precision=12, scale=2), server_default='0.00', nullable=False),
        sa.Column('delivery_fee', sa.Numeric(precision=10, scale=2), server_default='0.00', nullable=False),
        sa.Column('discount', sa.Numeric(precision=10, scale=2), server_default='0.00', nullable=False),
        sa.Column('total', sa.Numeric(precision=12, scale=2), server_default='0.00', nullable=False),
        sa.Column('payment_method', sa.String(length=20), server_default='cod', nullable=False),
        sa.Column('payment_status', sa.String(length=20), server_default='pending', nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('delivery_instructions', sa.Text(), nullable=True),
        sa.Column('estimated_delivery_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('delivered_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['store_id'], ['stores.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['delivery_address_id'], ['customer_addresses.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['assigned_to'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('order_number')
    )
    op.create_index('idx_orders_org_id', 'orders', ['organization_id'], unique=False)
    op.create_index('idx_orders_store_id', 'orders', ['store_id'], unique=False)
    op.create_index('idx_orders_customer_id', 'orders', ['customer_id'], unique=False)
    op.create_index('idx_orders_assigned_to', 'orders', ['assigned_to'], unique=False)

    op.create_table(
        'order_items',
        sa.Column('id', sa.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('order_id', sa.UUID(as_uuid=True), nullable=False),
        sa.Column('product_id', sa.UUID(as_uuid=True), nullable=False),
        sa.Column('product_name', sa.String(length=255), nullable=False),
        sa.Column('product_sku', sa.String(length=100), nullable=True),
        sa.Column('quantity', sa.Numeric(precision=10, scale=3), nullable=False),
        sa.Column('unit_price', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('tax_amount', sa.Numeric(precision=12, scale=2), server_default='0.00', nullable=False),
        sa.Column('total', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_order_items_order_id', 'order_items', ['order_id'], unique=False)

def downgrade() -> None:
    op.drop_table('order_items')
    op.drop_table('orders')
    op.drop_table('postcode_zone_mappings')
    op.drop_table('delivery_zones')
    op.drop_table('customer_addresses')
    op.drop_table('customers')
