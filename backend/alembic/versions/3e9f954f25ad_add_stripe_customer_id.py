"""add stripe_customer_id

Revision ID: 3e9f954f25ad
Revises: d4e8a1c6b720
Create Date: 2026-06-29 13:45:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision: str = '3e9f954f25ad'
down_revision: Union[str, None] = 'd4e8a1c6b720'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.add_column('customers', sa.Column('stripe_customer_id', sa.String(length=255), nullable=True))
    op.create_index(op.f('ix_customers_stripe_customer_id'), 'customers', ['stripe_customer_id'], unique=False)

def downgrade() -> None:
    op.drop_index(op.f('ix_customers_stripe_customer_id'), table_name='customers')
    op.drop_column('customers', 'stripe_customer_id')
