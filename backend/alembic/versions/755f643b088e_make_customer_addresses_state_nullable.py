"""make customer_addresses.state nullable

UK addresses don't always have a state/county; the API schema declared
state as Optional but the DB column was NOT NULL, causing 500 errors on
addresses posted without one.

Revision ID: 755f643b088e
Revises: 9262882f5de6
Create Date: 2026-05-24 05:19:10.513433
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '755f643b088e'
down_revision: Union[str, None] = '9262882f5de6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        'customer_addresses',
        'state',
        existing_type=sa.String(length=100),
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        'customer_addresses',
        'state',
        existing_type=sa.String(length=100),
        nullable=False,
    )
