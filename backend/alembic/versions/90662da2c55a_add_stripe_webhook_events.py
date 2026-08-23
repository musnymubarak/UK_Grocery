"""add stripe_webhook_events table for inbound webhook idempotency

Revision ID: 90662da2c55a
Revises: 2108b65b520f
Create Date: 2026-08-23 15:45:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '90662da2c55a'
down_revision: Union[str, None] = '2108b65b520f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'stripe_webhook_events',
        sa.Column('id', sa.String(length=255), primary_key=True),
        sa.Column('event_type', sa.String(length=100), nullable=False),
        sa.Column('received_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('stripe_webhook_events')
