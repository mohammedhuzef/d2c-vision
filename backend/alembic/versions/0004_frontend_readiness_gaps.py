"""Frontend readiness gaps and money columns

Revision ID: 0004
Revises: 0003
Create Date: 2026-10-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add errors JSON column to research_runs
    with op.batch_alter_table("research_runs") as batch_op:
        batch_op.add_column(
            sa.Column(
                "errors",
                postgresql.JSONB(astext_type=sa.Text()).with_variant(sa.JSON(), "sqlite"),
                nullable=True,
            )
        )

    # 2. Add product_name column to competitors
    with op.batch_alter_table("competitors") as batch_op:
        batch_op.add_column(
            sa.Column(
                "product_name",
                sa.Text(),
                nullable=True,
            )
        )

    # 3. Ensure price_observed is Numeric(14, 2)
    with op.batch_alter_table("competitor_analyses") as batch_op:
        batch_op.alter_column(
            "price_observed",
            type_=sa.Numeric(precision=14, scale=2),
            existing_type=sa.Numeric(precision=14, scale=2),
            nullable=True,
        )


def downgrade() -> None:
    with op.batch_alter_table("competitors") as batch_op:
        batch_op.drop_column("product_name")

    with op.batch_alter_table("research_runs") as batch_op:
        batch_op.drop_column("errors")
