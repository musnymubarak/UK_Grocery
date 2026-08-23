"""change Order/Refund parent FKs from CASCADE to RESTRICT

Orders and Refunds are financial records that must never be hard-deleted just
because their parent organization/store/customer row was. CASCADE meant a real
DELETE on one of those tables (bypassing the app's soft-delete convention)
would silently destroy every order and refund beneath it. RESTRICT blocks that
delete instead, matching the pattern already used on OrderItem.product_id.

Revision ID: 639c14b9f1e0
Revises: e7f8a9b0c1d2
Create Date: 2026-08-23 15:00:00.000000
"""
from typing import Sequence, Union
from alembic import op

revision: str = '639c14b9f1e0'
down_revision: Union[str, None] = 'e7f8a9b0c1d2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# (table, column, constraint_name, referenced_table)
FK_CHANGES = [
    ("orders", "organization_id", "orders_organization_id_fkey", "organizations"),
    ("orders", "store_id", "orders_store_id_fkey", "stores"),
    ("orders", "customer_id", "orders_customer_id_fkey", "customers"),
    ("refunds", "organization_id", "refunds_organization_id_fkey", "organizations"),
    ("refunds", "store_id", "refunds_store_id_fkey", "stores"),
    ("refunds", "order_id", "refunds_order_id_fkey", "orders"),
    ("refunds", "customer_id", "refunds_customer_id_fkey", "customers"),
]


def upgrade() -> None:
    for table, column, constraint, ref_table in FK_CHANGES:
        op.drop_constraint(constraint, table, type_='foreignkey')
        op.create_foreign_key(constraint, table, ref_table, [column], ['id'], ondelete='RESTRICT')


def downgrade() -> None:
    for table, column, constraint, ref_table in FK_CHANGES:
        op.drop_constraint(constraint, table, type_='foreignkey')
        op.create_foreign_key(constraint, table, ref_table, [column], ['id'], ondelete='CASCADE')
