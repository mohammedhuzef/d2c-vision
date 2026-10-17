"""Initial schema for LaunchTwin AI

Revision ID: 0001
Revises: 
Create Date: 2026-10-13 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. products table
    op.create_table(
        "products",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", sa.String(length=100), nullable=True),
        sa.Column("target_market", sa.Text(), nullable=True),
        sa.Column("current_version", sa.Integer(), server_default="1", nullable=False),
        sa.Column("status", sa.String(length=50), server_default="draft", nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    # 2. product_versions table
    op.create_table(
        "product_versions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("version_number", sa.Integer(), nullable=False),
        sa.Column("assumptions", postgresql.JSONB(astext_type=sa.Text()).with_variant(sa.JSON(), "sqlite"), nullable=False),
        sa.Column("change_summary", postgresql.JSONB(astext_type=sa.Text()).with_variant(sa.JSON(), "sqlite"), nullable=False),
        sa.Column("created_by", sa.Text(), nullable=True),
        sa.CheckConstraint("version_number >= 1", name="ck_product_versions_version_number_positive"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("product_id", "version_number", name="uq_product_version_number"),
    )
    op.create_index("ix_product_versions_product_id", "product_versions", ["product_id"])

    # 3. competitors table
    op.create_table(
        "competitors",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("website_url", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_competitors_product_id", "competitors", ["product_id"])
    op.create_index("uq_competitor_product_lower_name", "competitors", ["product_id", sa.text("lower(name)")], unique=True)

    # 4. research_evidence table
    op.create_table(
        "research_evidence",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("competitor_id", sa.Uuid(), nullable=True),
        sa.Column("content_hash", sa.String(length=64), nullable=False),
        sa.Column("source_type", sa.String(length=50), nullable=False),
        sa.Column("source_url", sa.Text(), nullable=True),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("excerpt", sa.Text(), nullable=False),
        sa.Column("retrieved_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("confidence", sa.Numeric(precision=3, scale=2), nullable=True),
        sa.Column("data", postgresql.JSONB(astext_type=sa.Text()).with_variant(sa.JSON(), "sqlite"), nullable=True),
        sa.CheckConstraint("confidence >= 0 AND confidence <= 1", name="ck_research_evidence_confidence"),
        sa.CheckConstraint(
            "source_type IN ('website', 'review', 'pricing_page', 'social', 'manual', 'other')",
            name="ck_research_evidence_source_type",
        ),
        sa.ForeignKeyConstraint(["competitor_id"], ["competitors.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("product_id", "content_hash", name="uq_research_evidence_product_content_hash"),
    )
    op.create_index("ix_research_evidence_product_id", "research_evidence", ["product_id"])
    op.create_index("ix_research_evidence_competitor_id", "research_evidence", ["competitor_id"])
    op.create_index("ix_research_evidence_content_hash", "research_evidence", ["content_hash"])

    # 4b. research_runs table
    op.create_table(
        "research_runs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("status", sa.String(length=50), server_default="completed", nullable=False),
        sa.Column("evidence_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("provider", sa.Text(), server_default="mock", nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_research_runs_product_id", "research_runs", ["product_id"])

    # 5. competitor_analyses table
    op.create_table(
        "competitor_analyses",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("competitor_id", sa.Uuid(), nullable=True),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("strengths", postgresql.JSONB(astext_type=sa.Text()).with_variant(sa.JSON(), "sqlite"), nullable=False),
        sa.Column("weaknesses", postgresql.JSONB(astext_type=sa.Text()).with_variant(sa.JSON(), "sqlite"), nullable=False),
        sa.Column("price_observed", sa.Numeric(precision=14, scale=2), nullable=True),
        sa.Column("evidence_ids", postgresql.ARRAY(sa.Uuid()).with_variant(sa.JSON(), "sqlite"), nullable=False),
        sa.Column("produced_by", sa.Text(), server_default="mock", nullable=False),
        sa.ForeignKeyConstraint(["competitor_id"], ["competitors.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_competitor_analyses_product_id", "competitor_analyses", ["product_id"])
    op.create_index("ix_competitor_analyses_competitor_id", "competitor_analyses", ["competitor_id"])

    # 6. validation_runs table
    op.create_table(
        "validation_runs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("version_id", sa.Uuid(), nullable=False),
        sa.Column("trigger", sa.Text(), nullable=False),
        sa.Column("stages_run", postgresql.ARRAY(sa.Text()).with_variant(sa.JSON(), "sqlite"), nullable=False),
        sa.Column("readiness_score", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column("verdict", sa.Text(), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["version_id"], ["product_versions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_validation_runs_product_id", "validation_runs", ["product_id"])
    op.create_index("ix_validation_runs_version_id", "validation_runs", ["version_id"])

    # 7. validation_results table
    op.create_table(
        "validation_results",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("run_id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("version_id", sa.Uuid(), nullable=False),
        sa.Column("stage", sa.Text(), nullable=False),
        sa.Column("status", sa.Text(), nullable=False),
        sa.Column("score", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column("metrics", postgresql.JSONB(astext_type=sa.Text()).with_variant(sa.JSON(), "sqlite"), nullable=False),
        sa.Column("findings", postgresql.JSONB(astext_type=sa.Text()).with_variant(sa.JSON(), "sqlite"), nullable=False),
        sa.Column("inputs_used", postgresql.JSONB(astext_type=sa.Text()).with_variant(sa.JSON(), "sqlite"), nullable=False),
        sa.Column("upstream", postgresql.JSONB(astext_type=sa.Text()).with_variant(sa.JSON(), "sqlite"), nullable=False),
        sa.Column("carried_forward_from", sa.Uuid(), nullable=True),
        sa.ForeignKeyConstraint(["carried_forward_from"], ["validation_results.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["run_id"], ["validation_runs.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["version_id"], ["product_versions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_validation_results_run_id", "validation_results", ["run_id"])
    op.create_index("ix_validation_results_product_id", "validation_results", ["product_id"])
    op.create_index("ix_validation_results_version_id", "validation_results", ["version_id"])
    op.create_index("ix_validation_results_carried_forward_from", "validation_results", ["carried_forward_from"])

    # 8. recommendations table
    op.create_table(
        "recommendations",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("version_id", sa.Uuid(), nullable=False),
        sa.Column("stage", sa.Text(), nullable=False),
        sa.Column("priority", sa.Text(), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("detail", sa.Text(), nullable=False),
        sa.Column("evidence_ids", postgresql.ARRAY(sa.Uuid()).with_variant(sa.JSON(), "sqlite"), nullable=False),
        sa.CheckConstraint("priority IN ('high', 'medium', 'low')", name="ck_recommendations_priority"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["version_id"], ["product_versions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_recommendations_product_id", "recommendations", ["product_id"])
    op.create_index("ix_recommendations_version_id", "recommendations", ["version_id"])

    # 9. impact_events table
    op.create_table(
        "impact_events",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("from_version", sa.Integer(), nullable=False),
        sa.Column("to_version", sa.Integer(), nullable=False),
        sa.Column("changed_fields", postgresql.ARRAY(sa.Text()).with_variant(sa.JSON(), "sqlite"), nullable=False),
        sa.Column("affected_stages", postgresql.ARRAY(sa.Text()).with_variant(sa.JSON(), "sqlite"), nullable=False),
        sa.Column("rerun_run_id", sa.Uuid(), nullable=True),
        sa.Column("before", postgresql.JSONB(astext_type=sa.Text()).with_variant(sa.JSON(), "sqlite"), nullable=False),
        sa.Column("after", postgresql.JSONB(astext_type=sa.Text()).with_variant(sa.JSON(), "sqlite"), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["rerun_run_id"], ["validation_runs.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_impact_events_product_id", "impact_events", ["product_id"])
    op.create_index("ix_impact_events_rerun_run_id", "impact_events", ["rerun_run_id"])

    # 10. reports table
    op.create_table(
        "reports",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("version_id", sa.Uuid(), nullable=False),
        sa.Column("format", sa.String(length=50), nullable=False),
        sa.Column("content", postgresql.JSONB(astext_type=sa.Text()).with_variant(sa.JSON(), "sqlite"), nullable=False),
        sa.Column("markdown", sa.Text(), nullable=False),
        sa.Column("generated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["version_id"], ["product_versions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_reports_product_id", "reports", ["product_id"])
    op.create_index("ix_reports_version_id", "reports", ["version_id"])

    # 11. Immutability trigger on product_versions
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute(
            """
            CREATE OR REPLACE FUNCTION reject_product_versions_mutation()
            RETURNS TRIGGER AS $$
            BEGIN
                RAISE EXCEPTION 'product_versions rows are immutable and cannot be updated or deleted';
            END;
            $$ LANGUAGE plpgsql;

            CREATE TRIGGER trg_immutable_product_versions
            BEFORE UPDATE OR DELETE ON product_versions
            FOR EACH ROW EXECUTE FUNCTION reject_product_versions_mutation();
            """
        )
    elif bind.dialect.name == "sqlite":
        op.execute(
            """
            CREATE TRIGGER IF NOT EXISTS trg_immutable_product_versions_update
            BEFORE UPDATE ON product_versions
            BEGIN
                SELECT RAISE(ABORT, 'product_versions rows are immutable and cannot be updated');
            END;
            """
        )
        op.execute(
            """
            CREATE TRIGGER IF NOT EXISTS trg_immutable_product_versions_delete
            BEFORE DELETE ON product_versions
            BEGIN
                SELECT RAISE(ABORT, 'product_versions rows are immutable and cannot be deleted');
            END;
            """
        )


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("DROP TRIGGER IF EXISTS trg_immutable_product_versions ON product_versions;")
        op.execute("DROP FUNCTION IF EXISTS reject_product_versions_mutation();")
    elif bind.dialect.name == "sqlite":
        op.execute("DROP TRIGGER IF EXISTS trg_immutable_product_versions_update;")
        op.execute("DROP TRIGGER IF EXISTS trg_immutable_product_versions_delete;")

    op.drop_table("reports")
    op.drop_table("impact_events")
    op.drop_table("recommendations")
    op.drop_table("validation_results")
    op.drop_table("validation_runs")
    op.drop_table("competitor_analyses")
    op.drop_table("research_runs")
    op.drop_table("research_evidence")
    op.drop_table("competitors")
    op.drop_table("product_versions")
    op.drop_table("products")
