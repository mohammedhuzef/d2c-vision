"""Add projects table for D2C product concepts and feasibility persistence

Revision ID: 0002
Revises: 0001
Create Date: 2026-11-23 12:00:00.000000

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
    op.create_table(
        "projects",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("target_market", sa.String(length=100), nullable=True),
        sa.Column("selling_price", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("mfg_cost", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("moq", sa.Integer(), nullable=False, server_default="500"),
        sa.Column("marketing_budget", sa.Float(), nullable=False, server_default="50000.0"),
        sa.Column("margin", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("ingredients", sa.Text(), nullable=True),
        sa.Column("target_audience", sa.Text(), nullable=True),
        sa.Column("image", sa.String(length=500), nullable=False, server_default="/images/cat-beverages.jpg"),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="In Progress"),
        sa.Column("viability_score", sa.Integer(), nullable=False, server_default="50"),
        sa.Column("viability_grade", sa.String(length=50), nullable=True),
        sa.Column(
            "report",
            postgresql.JSONB(astext_type=sa.Text()).with_variant(sa.JSON(), "sqlite"),
            nullable=True,
        ),
        sa.Column("user_id", sa.String(length=100), nullable=False, server_default="default_user"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_projects_name", "projects", ["name"])
    op.create_index("ix_projects_category", "projects", ["category"])
    op.create_index("ix_projects_status", "projects", ["status"])
    op.create_index("ix_projects_user_id", "projects", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_projects_user_id", table_name="projects")
    op.drop_index("ix_projects_status", table_name="projects")
    op.drop_index("ix_projects_category", table_name="projects")
    op.drop_index("ix_projects_name", table_name="projects")
    op.drop_table("projects")
