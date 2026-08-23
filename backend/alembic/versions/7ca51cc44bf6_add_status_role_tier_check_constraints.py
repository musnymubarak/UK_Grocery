"""add CHECK constraints for Order.status, User.role, Customer.membership_tier

These were plain VARCHAR columns validated only in application code (the
order state machine, the staff-user Pydantic schema pattern). A raw UPDATE,
a bad migration, or a bug elsewhere could previously write any string into
them. Value sets mirror the authoritative source for each: VALID_TRANSITIONS
in app/services/order.py, the role pattern in app/schemas/auth.py, and
membership_tier's existing usage/docs — all cross-checked against live data
before writing this migration.

Revision ID: 7ca51cc44bf6
Revises: 90662da2c55a
Create Date: 2026-08-23 16:15:00.000000
"""
from typing import Sequence, Union
from alembic import op

revision: str = '7ca51cc44bf6'
down_revision: Union[str, None] = '90662da2c55a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_check_constraint(
        'check_order_status_valid',
        'orders',
        "status IN ('placed', 'confirmed', 'picking', 'substitution_pending', "
        "'ready_for_collection', 'assigned_to_driver', 'out_for_delivery', "
        "'delivered', 'rejected', 'delivery_failed', 'refund_requested', "
        "'refunded', 'cancelled')",
    )
    op.create_check_constraint(
        'check_user_role_valid',
        'users',
        "role IN ('admin', 'manager', 'cashier', 'delivery_boy')",
    )
    op.create_check_constraint(
        'check_customer_membership_tier_valid',
        'customers',
        "membership_tier IN ('standard', 'premium', 'vip')",
    )


def downgrade() -> None:
    op.drop_constraint('check_customer_membership_tier_valid', 'customers', type_='check')
    op.drop_constraint('check_user_role_valid', 'users', type_='check')
    op.drop_constraint('check_order_status_valid', 'orders', type_='check')
