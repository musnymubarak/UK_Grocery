"""phase_4_scale_hardening

Revision ID: d6545cd412a3
Revises: 17e7025c9862
Create Date: 2026-04-17 23:13:20.517860
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
"""phase_4_scale_hardening

Revision ID: d6545cd412a3
Revises: 17e7025c9862
Create Date: 2026-04-17 23:13:20.517860
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision: str = 'd6545cd412a3'
down_revision: Union[str, None] = '17e7025c9862'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Fix Orders table columns (Missing from auto-generation/startup)
    op.add_column('orders', sa.Column('promotion_discount', sa.Numeric(precision=10, scale=2), nullable=False, server_default="0.00"))
    op.add_column('orders', sa.Column('applied_promotions', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    
    # Tables are already created via startup create_all, so we skip them here.

def downgrade() -> None:
    op.drop_column('orders', 'applied_promotions')
    op.drop_column('orders', 'promotion_discount')

