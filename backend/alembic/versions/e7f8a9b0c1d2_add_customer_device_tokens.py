"""add customer device tokens for push notifications

Revision ID: e7f8a9b0c1d2
Revises: cf5777792362
Create Date: 2026-08-18 12:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'e7f8a9b0c1d2'
down_revision: Union[str, None] = '3e9f954f25ad'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'customer_device_tokens',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('customer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('customers.id', ondelete='CASCADE'), nullable=False),
        sa.Column('fcm_token', sa.String(length=512), nullable=False),
        sa.Column('platform', sa.String(length=20), nullable=False, server_default='android'),
        sa.Column('device_id', sa.String(length=255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
    )
    op.create_index('ix_customer_device_tokens_customer_id', 'customer_device_tokens', ['customer_id'])
    op.create_index('ix_customer_device_tokens_fcm_token', 'customer_device_tokens', ['fcm_token'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_customer_device_tokens_fcm_token', table_name='customer_device_tokens')
    op.drop_index('ix_customer_device_tokens_customer_id', table_name='customer_device_tokens')
    op.drop_table('customer_device_tokens')
