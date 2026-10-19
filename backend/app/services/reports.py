from decimal import Decimal
import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from backend.app.core.errors import BadStateError, NotFoundError
from backend.app.models.product import Product
from backend.app.models.version import ProductVersion
from backend.app.models.validation import ValidationRun, ValidationResult
from backend.app.models.recommendation import Recommendation
from backend.app.models.report import Report
from backend.app.models.evidence import ResearchEvidence
from backend.app.services.versioning import compare_versions


def generate_launch_report(product_id: uuid.UUID, db: Session) -> Report:
    """
    Generates a launch readiness report (structured JSON + Markdown)
    for the latest validated product version.
    Raises BadStateError if validation has not been run.
    """
    product = db.get(Product, product_id)
    if not product:
        raise NotFoundError(f"Product with id '{product_id}' not found")

    # Fetch latest validation run for the current product version
    latest_run = db.scalar(
        select(ValidationRun)
        .join(ProductVersion, ValidationRun.version_id == ProductVersion.id)
        .where(
            ValidationRun.product_id == product_id,
            ProductVersion.version_number == product.current_version,
        )
        .order_by(desc(ValidationRun.created_at), desc(ValidationRun.started_at))
        .limit(1)
    )
    if not latest_run:
        raise BadStateError(
            message="Validation must be run on the latest product version before generating a launch readiness report.",
            details=[{"field": "product_id", "issue": "run_validation_first"}],
        )

    version = db.get(ProductVersion, latest_run.version_id)
    if not version:
        raise NotFoundError("Version for validation run not found")

    # Stage summaries / stage table
    stage_summaries = []
    financial_metrics: Dict[str, Any] = {}
    risks = []
    for r in latest_run.results:
        summary_item = {
            "stage": r.stage,
            "status": r.status,
            "score": json.loads(f"{r.score:.2f}") if r.score is not None else None,
            "findings_count": len(r.findings or []),
            "metrics": r.metrics or {},
        }
        stage_summaries.append(summary_item)
        if r.stage == "financial":
            financial_metrics = r.metrics or {}
        for f in (r.findings or []):
            risks.append({
                "stage": r.stage,
                "code": f.get("code", ""),
                "severity": f.get("severity", "warning"),
                "message": f.get("message", ""),
                "field": f.get("field"),
            })

    # Recommendations
    recs = list(
        db.scalars(
            select(Recommendation)
            .where(Recommendation.product_id == product_id, Recommendation.version_id == version.id)
            .order_by(desc(Recommendation.created_at))
        ).all()
    )
    rec_list = [
        {
            "priority": rec.priority,
            "stage": rec.stage,
            "title": rec.title,
            "detail": rec.detail,
            "evidence_ids": [str(eid) for eid in (rec.evidence_ids or [])],
        }
        for rec in recs
    ]

    # Next steps
    next_steps = []
    if rec_list:
        next_steps = [r["title"] for r in rec_list[:5]]
    else:
        next_steps = ["Proceed with product launch preparations."]

    # Evidence quality and citations
    evidence_items = list(
        db.scalars(
            select(ResearchEvidence).where(ResearchEvidence.product_id == product_id)
        ).all()
    )
    citations = [
        {
            "id": str(e.id),
            "source_type": e.source_type,
            "source_url": e.source_url,
            "title": e.title,
            "excerpt": e.excerpt,
        }
        for e in evidence_items
    ]

    evidence_count = len(evidence_items)
    if evidence_count > 0:
        confidences = [e.confidence for e in evidence_items if e.confidence is not None]
        avg_conf = (sum(confidences) / Decimal(str(len(confidences)))) if confidences else Decimal("0.0000")
        average_confidence = f"{avg_conf:.4f}"

        with_url = sum(1 for e in evidence_items if e.source_url and e.source_url.strip())
        share_url = Decimal(str(with_url)) / Decimal(str(evidence_count))
        share_with_source_url = f"{share_url:.4f}"

        counts_by_source_type: Dict[str, int] = {}
        for e in evidence_items:
            st = e.source_type or "other"
            counts_by_source_type[st] = counts_by_source_type.get(st, 0) + 1

        stages_missing_evidence = [
            r.stage
            for r in latest_run.results
            if r.status == "INSUFFICIENT_EVIDENCE"
            or any("EVIDENCE" in f.get("code", "") or "DEFICIENT" in f.get("code", "") for f in (r.findings or []))
        ]
    else:
        average_confidence = "0.0000"
        share_with_source_url = "0.0000"
        counts_by_source_type = {}
        stages_missing_evidence = [
            r.stage
            for r in latest_run.results
            if r.status == "INSUFFICIENT_EVIDENCE"
            or any("EVIDENCE" in f.get("code", "") or "DEFICIENT" in f.get("code", "") for f in (r.findings or []))
        ]

    evidence_quality = {
        "evidence_count": evidence_count,
        "average_confidence": average_confidence,
        "share_with_source_url": share_with_source_url,
        "counts_by_source_type": counts_by_source_type,
        "stages_missing_evidence": stages_missing_evidence,
    }

    # Version comparison if > 1
    version_comparison = None
    if version.version_number > 1:
        prev_version = db.scalar(
            select(ProductVersion).where(
                ProductVersion.product_id == product_id,
                ProductVersion.version_number == version.version_number - 1,
            )
        )
        if prev_version:
            comp_resp = compare_versions(product_id, prev_version, version, db)
            version_comparison = comp_resp.model_dump(mode="json")

    now_utc = datetime.now(timezone.utc)
    generated_at_str = now_utc.isoformat()

    # Structured JSON content
    content_json: Dict[str, Any] = {
        "product_id": str(product.id),
        "product_name": product.name,
        "version_number": version.version_number,
        "readiness_score": json.loads(f"{latest_run.readiness_score:.2f}") if latest_run.readiness_score is not None else None,
        "verdict": latest_run.verdict,
        "stage_table": stage_summaries,
        "stage_summaries": stage_summaries,
        "key_metrics": financial_metrics,
        "financial_metrics": financial_metrics,
        "risks": risks,
        "recommendations": rec_list,
        "next_steps": next_steps,
        "evidence_quality": evidence_quality,
        "evidence_citations": citations,
        "version_comparison": version_comparison,
        "generated_at": generated_at_str,
    }

    # Markdown generation
    md_lines: List[str] = [
        f"# Launch-Readiness Report: {product.name}",
        f"**Version**: {version.version_number} | **Generated**: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
        "",
        f"## Executive Verdict: `{latest_run.verdict}`",
        f"**Readiness Score**: **{Decimal(str(latest_run.readiness_score or '0.0')):.1f} / 100**",
        "",
        "### Validation Stage Summary Table",
        "| Stage | Status | Score | Findings Count |",
        "|---|---|---|---|",
    ]

    for s in stage_summaries:
        score_str = f"{s['score']:.1f}" if s["score"] is not None else "N/A"
        md_lines.append(f"| {s['stage']} | `{s['status']}` | {score_str} | {s['findings_count']} |")

    md_lines.extend([
        "",
        "### Key Unit Economics & Financial Metrics",
    ])
    if financial_metrics:
        sp_val = Decimal(str(financial_metrics.get("selling_price") or "0.00"))
        vc_val = Decimal(str(financial_metrics.get("variable_cost_per_unit") or "0.00"))
        cpu_val = Decimal(str(financial_metrics.get("contribution_per_unit") or "0.00"))
        cm_val = Decimal(str(financial_metrics.get("contribution_margin") or "0.0000")) * Decimal("100")
        md_lines.extend([
            f"- **Selling Price**: ${sp_val:.2f}",
            f"- **Variable Cost Per Unit**: ${vc_val:.2f}",
            f"- **Contribution Per Unit**: ${cpu_val:.2f}",
            f"- **Contribution Margin**: {cm_val:.1f}%",
            f"- **Break-Even Volume**: {financial_metrics.get('break_even_units', 'N/A')} units",
        ])
    else:
        md_lines.append("_Financial metrics could not be calculated due to missing cost inputs._")

    md_lines.extend([
        "",
        "### Actionable Recommendations",
    ])
    if rec_list:
        for r in rec_list:
            cit_note = f" (Evidence: {', '.join(r['evidence_ids'])})" if r['evidence_ids'] else ""
            md_lines.append(f"- **[{r['priority'].upper()}] {r['title']}** ({r['stage']}): {r['detail']}{cit_note}")
    else:
        md_lines.append("No blocking issues or warnings detected. Product meets current launch criteria.")

    md_lines.extend([
        "",
        "### Evidence Citations",
    ])
    if citations:
        for c in citations[:5]:
            url_str = f" - [{c['source_url']}]({c['source_url']})" if c['source_url'] else ""
            md_lines.append(f"- `[{c['id'][:8]}]` **{c['title']}** ({c['source_type']}){url_str}: \"_{c['excerpt']}_\"")
    else:
        md_lines.append("No research evidence items recorded yet.")

    if version_comparison:
        md_lines.extend([
            "",
            f"### Version Comparison (v{version.version_number - 1} -> v{version.version_number})",
            "Key metric differences between versions:",
        ])
        for st_name, st_delta in version_comparison.get("stages", {}).items():
            deltas = st_delta.get("metric_deltas", {})
            if deltas:
                md_lines.append(f"- **{st_name}**:")
                for m_name, d_val in deltas.items():
                    md_lines.append(f"  - `{m_name}`: {d_val.get('before')} -> {d_val.get('after')} (delta: {d_val.get('delta', 'N/A')})")

    markdown_text = "\n".join(md_lines) + "\n"

    # Persist report
    report_id = uuid.uuid4()
    report = Report(
        id=report_id,
        product_id=product.id,
        version_id=version.id,
        format="json_markdown",
        content=content_json,
        markdown=markdown_text,
        generated_at=datetime.now(timezone.utc),
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report
