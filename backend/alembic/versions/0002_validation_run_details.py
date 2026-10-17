"""Validation run details: triggered_by, status, readiness, input_fingerprint

Revision ID: 0002
Revises: 0001
Create Date: 2026-10-14 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Use batch_alter_table for SQLite compatibility alongside PostgreSQL
    with op.batch_alter_table("validation_runs") as batch_op:
        batch_op.add_column(sa.Column("triggered_by", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("status", sa.Text(), server_default="COMPLETED", nullable=False))
        batch_op.add_column(
            sa.Column(
                "readiness",
                postgresql.JSONB(astext_type=sa.Text()).with_variant(sa.JSON(), "sqlite"),
                nullable=True,
            )
        )
        batch_op.add_column(sa.Column("input_fingerprint", sa.String(length=64), nullable=True))
        batch_op.create_index("ix_validation_runs_input_fingerprint", ["input_fingerprint"])


def downgrade() -> None:
    with op.batch_alter_table("validation_runs") as batch_op:
        batch_op.drop_index("ix_validation_runs_input_fingerprint")
        batch_op.drop_column("input_fingerprint")
        batch_op.drop_column("readiness")
        batch_op.drop_column("status")
        batch_op.drop_column("triggered_by")
