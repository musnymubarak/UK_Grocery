"""add missing FK constraints on webhook tables

WebhookEndpoint.organization_id and WebhookDelivery.endpoint_id were plain UUID
columns with no foreign key at all — the only tenant/parent references in the
schema without one. Nothing stopped either from pointing at a row that doesn't
exist, and a deleted endpoint would leave its delivery history silently
orphaned. RESTRICT (not CASCADE) to match the rest of the schema's stance on
keeping historical records rather than cascade-deleting them.

Revision ID: 2108b65b520f
Revises: 639c14b9f1e0
Create Date: 2026-08-23 15:20:00.000000
"""
from typing import Sequence, Union
from alembic import op

revision: str = '2108b65b520f'
down_revision: Union[str, None] = '639c14b9f1e0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_foreign_key(
        'webhook_endpoints_organization_id_fkey',
        'webhook_endpoints', 'organizations',
        ['organization_id'], ['id'],
        ondelete='RESTRICT',
    )
    op.create_foreign_key(
        'webhook_deliveries_endpoint_id_fkey',
        'webhook_deliveries', 'webhook_endpoints',
        ['endpoint_id'], ['id'],
        ondelete='RESTRICT',
    )


def downgrade() -> None:
    op.drop_constraint('webhook_deliveries_endpoint_id_fkey', 'webhook_deliveries', type_='foreignkey')
    op.drop_constraint('webhook_endpoints_organization_id_fkey', 'webhook_endpoints', type_='foreignkey')
