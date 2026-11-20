from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Dict, List, Tuple


def _round_2dp(val: Decimal) -> Decimal:
    return val.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _round_4dp(val: Decimal) -> Decimal:
    return val.quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)


def build_report_payload(
    product_data: Dict[str, Any],
    version_data: Dict[str, Any],
    validation_run: Dict[str, Any],
    evidence_items: List[Dict[str, Any]],
) -> Tuple[Dict[str, Any], str]:
    """Pure function generating report content JSON and Markdown text deterministically.

    No floating point calculations, no I/O, no DB. Same input gives identical output.
    """
    p_name = product_data.get("name", "Unnamed Product")
    v_num = version_data.get("version_number", 1)
    v_id = str(version_data.get("id", ""))
    run_id = str(validation_run.get("id", ""))

    readiness = validation_run.get("readiness") or {}
    verdict = readiness.get("label") or validation_run.get("verdict") or "NOT_READY"
    raw_score = readiness.get("score")
    if raw_score is not None:
        score_dec = Decimal(str(raw_score))
    else:
        score_dec = Decimal("0.0")

    # Stage summary list
    raw_results = validation_run.get("stage_results") or validation_run.get("results") or []
    if isinstance(raw_results, dict):
        stage_results = [{"stage": k, **(v if isinstance(v, dict) else {})} for k, v in raw_results.items()]
    else:
        stage_results = [s for s in raw_results if isinstance(s, dict)]
    stage_table: List[Dict[str, Any]] = []
    for s in stage_results:
        s_score = s.get("score")
        stage_table.append(
            {
                "stage": s.get("stage"),
                "status": s.get("status"),
                "score": s_score if s_score is not None else None,
                "findings_count": len(s.get("findings") or []),
            }
        )

    # Unit economics
    fin_snapshot = validation_run.get("financial_snapshot") or {}
    selling_price = fin_snapshot.get("selling_price") or "0.00"
    variable_cost = fin_snapshot.get("variable_cost_per_unit") or "0.00"
    contribution = fin_snapshot.get("contribution_per_unit") or "0.00"
    margin = fin_snapshot.get("contribution_margin") or "0.0000"
    break_even = fin_snapshot.get("break_even_units") or 0

    financial_summary = {
        "selling_price": selling_price,
        "variable_cost_per_unit": variable_cost,
        "contribution_per_unit": contribution,
        "contribution_margin": margin,
        "break_even_units": break_even,
    }

    # Evidence quality summary
    ev_count = len(evidence_items)
    conf_sum = Decimal("0.00")
    source_url_count = 0
    counts_by_source: Dict[str, int] = {}

    for ev in evidence_items:
        s_type = ev.get("source_type", "other")
        counts_by_source[s_type] = counts_by_source.get(s_type, 0) + 1
        if ev.get("source_url"):
            source_url_count += 1
        raw_conf = ev.get("confidence")
        if raw_conf is not None:
            conf_sum += Decimal(str(raw_conf))

    if ev_count > 0:
        avg_conf = _round_4dp(conf_sum / Decimal(ev_count))
        share_url = _round_4dp(Decimal(source_url_count) / Decimal(ev_count))
    else:
        avg_conf = Decimal("0.0000")
        share_url = Decimal("0.0000")

    missing_stages: List[str] = []
    if ev_count < 2:
        missing_stages.append("competitor")

    evidence_quality = {
        "evidence_count": ev_count,
        "average_confidence": str(avg_conf),
        "share_with_source_url": str(share_url),
        "counts_by_source_type": counts_by_source,
        "stages_missing_evidence": missing_stages,
    }

    # Recommendations
    recommendations = validation_run.get("recommendations") or []

    # Executive summary
    if verdict == "READY":
        summary_text = f"{p_name} demonstrates viable unit economics and strong stage readiness across all validation dimensions."
    elif verdict == "READY_WITH_WARNINGS":
        summary_text = f"{p_name} demonstrates viable fundamentals with non-critical warnings that should be addressed prior to launch."
    elif verdict == "INSUFFICIENT_EVIDENCE":
        summary_text = f"{p_name} lacks sufficient market evidence to complete definitive validation."
    else:
        summary_text = f"{p_name} is currently not ready for launch due to blocking criteria or negative unit economics."

    content: Dict[str, Any] = {
        "product_name": p_name,
        "version_number": v_num,
        "version_id": v_id,
        "run_id": run_id,
        "verdict": verdict,
        "readiness_score": str(_round_2dp(score_dec)),
        "summary": summary_text,
        "stage_summaries": stage_table,
        "stage_table": stage_table,
        "financial_summary": financial_summary,
        "key_metrics": financial_summary,
        "recommendations": recommendations,
        "evidence_quality": evidence_quality,
        "generated_at": product_data.get("updated_at") or "",
    }

    # Markdown assembly
    md_lines = [
        f"# Launch-Readiness Report: {p_name} (v{v_num})",
        "",
        f"## Executive Verdict: {verdict} (Score: {_round_2dp(score_dec)}/100)",
        "",
        f"**Summary**: {summary_text}",
        "",
        "### Stage Summary Table",
        "| Stage | Status | Score | Findings |",
        "|---|---|---|---|",
    ]

    for s in stage_table:
        score_disp = f"{Decimal(str(s['score'])):.1f}" if s["score"] is not None else "N/A"
        md_lines.append(f"| {s['stage']} | {s['status']} | {score_disp} | {s['findings_count']} |")

    md_lines.extend(
        [
            "",
            "### Unit Economics & Financial Metrics",
            f"- **Selling Price**: ${selling_price}",
            f"- **Variable Cost / Unit**: ${variable_cost}",
            f"- **Contribution / Unit**: ${contribution}",
            f"- **Contribution Margin**: {margin}",
            f"- **Break-Even Units**: {break_even}",
            "",
            "### Evidence Quality Summary",
            f"- **Total Evidence Items**: {ev_count}",
            f"- **Average Confidence**: {avg_conf}",
            f"- **Verified URL Share**: {share_url}",
            "",
        ]
    )

    if recommendations:
        md_lines.extend(
            [
                "### Recommendations",
            ]
        )
        for rec in recommendations:
            if isinstance(rec, dict):
                prio = rec.get("priority", "medium")
                title = rec.get("title", "")
                desc = rec.get("description", "")
                md_lines.append(f"- **[{prio.upper()}] {title}**: {desc}")
            else:
                md_lines.append(f"- {rec}")
        md_lines.append("")

    markdown_text = "\n".join(md_lines)
    return content, markdown_text
