"""add home_sections (server-driven home layout)

Revision ID: c9a7e1b3f201
Revises: 755f643b088e
Create Date: 2026-06-10 12:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision: str = 'c9a7e1b3f201'
down_revision: Union[str, None] = '755f643b088e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'home_sections',
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column('store_id', sa.UUID(), nullable=True),
        sa.Column('section_type', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=True),
        sa.Column('subtitle', sa.String(length=500), nullable=True),
        sa.Column('position', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('starts_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('ends_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('platforms', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('audience', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('config', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['store_id'], ['stores.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_home_sections_organization_id'), 'home_sections', ['organization_id'], unique=False)
    op.create_index('ix_home_sections_org_store_position', 'home_sections', ['organization_id', 'store_id', 'position'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_home_sections_org_store_position', table_name='home_sections')
    op.drop_index(op.f('ix_home_sections_organization_id'), table_name='home_sections')
    op.drop_table('home_sections')
