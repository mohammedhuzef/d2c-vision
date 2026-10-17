"""Rule table mapping every canonical finding code to recommendation builders.

Pure functions: Takes finding, stage context/assumptions/stage_result, returns List[Recommendation].
Zero DB access, zero network calls, Decimal only.
"""

from decimal import Decimal
from typing import Any, Callable, Dict, List, Optional
import uuid

from backend.app.services.finance import (
    from_assumptions,
    fraction_to_str,
    money_to_str,
)
from backend.app.services.validation.base import Finding, StageResult
from backend.app.services.validation import rules_config
from backend.app.services.validation.recommendations.models import ActionType, Priority, Recommendation
from backend.app.services.validation.recommendations.calculations import (
    calculate_cac_ceiling,
    calculate_competitor_price_gap,
    calculate_max_unit_cost,
    calculate_packaging_cost_ceiling,
    calculate_price_for_target_margin,
)


def _gen_rec_id(stage: str, code: str, field_name: Optional[str] = None, variant: str = "") -> uuid.UUID:
    """Deterministic UUID generation from stable string tokens."""
    seed = f"{stage}:{code}:{field_name or ''}:{variant}"
    return uuid.uuid5(uuid.NAMESPACE_DNS, seed)


# ---------------------------------------------------------------------------
# Individual Recommendation Builders
# ---------------------------------------------------------------------------

def build_missing_input_recommendations(
    finding: Finding,
    stage_result: StageResult,
    assumptions: Any,
) -> List[Recommendation]:
    """Builds PROVIDE_INPUT recommendation for missing fields without guessing numbers."""
    field_name = finding.field or "input"
    readable_field = field_name.replace("_", " ").title()

    priority = (
        Priority.CRITICAL
        if stage_result.stage in rules_config.CRITICAL_STAGES
        else Priority.HIGH
    )

    rec = Recommendation(
        id=_gen_rec_id(stage_result.stage, "MISSING_INPUT", field_name),
        code="RECOMMEND_PROVIDE_INPUT",
        stage=stage_result.stage,
        priority=priority,
        title=f"Provide {readable_field}",
        detail=f"Supply a valid value for '{field_name}' to enable complete stage validation.",
        action_type=ActionType.PROVIDE_INPUT,
        target_field=field_name,
        current_value=None,
        suggested_value=None,
        finding_codes=[str(finding.code)],
        evidence_ids=finding.evidence_ids,
        impact={"required_for_validation": True, "field": field_name},
    )
    return [rec]


def build_customer_interviews_insufficient(
    finding: Finding,
    stage_result: StageResult,
    assumptions: Any,
) -> List[Recommendation]:
    interviews = getattr(getattr(assumptions, "customer", None), "customer_interviews_count", None)
    rec = Recommendation(
        id=_gen_rec_id(stage_result.stage, finding.code, "customer.customer_interviews_count"),
        code="RECOMMEND_CONDUCT_INTERVIEWS",
        stage=stage_result.stage,
        priority=Priority.HIGH,
        title="Conduct Additional Customer Interviews",
        detail=f"Conduct at least {rules_config.CUSTOMER_MIN_INTERVIEWS} customer interviews to validate demand hypothesis.",
        action_type=ActionType.GATHER_EVIDENCE,
        target_field="customer.customer_interviews_count",
        current_value=str(interviews) if interviews is not None else None,
        suggested_value=str(rules_config.CUSTOMER_MIN_INTERVIEWS),
        finding_codes=[str(finding.code)],
        evidence_ids=finding.evidence_ids,
        impact={"min_interviews_required": rules_config.CUSTOMER_MIN_INTERVIEWS},
    )
    return [rec]


def build_customer_interviews_low(
    finding: Finding,
    stage_result: StageResult,
    assumptions: Any,
) -> List[Recommendation]:
    interviews = getattr(getattr(assumptions, "customer", None), "customer_interviews_count", None)
    rec = Recommendation(
        id=_gen_rec_id(stage_result.stage, finding.code, "customer.customer_interviews_count"),
        code="RECOMMEND_EXPAND_INTERVIEWS",
        stage=stage_result.stage,
        priority=Priority.MEDIUM,
        title="Expand Customer Interview Sample",
        detail=f"Interview at least {rules_config.CUSTOMER_STRONG_INTERVIEWS} prospective buyers for high-confidence validation.",
        action_type=ActionType.GATHER_EVIDENCE,
        target_field="customer.customer_interviews_count",
        current_value=str(interviews) if interviews is not None else None,
        suggested_value=str(rules_config.CUSTOMER_STRONG_INTERVIEWS),
        finding_codes=[str(finding.code)],
        evidence_ids=finding.evidence_ids,
        impact={"strong_interviews_target": rules_config.CUSTOMER_STRONG_INTERVIEWS},
    )
    return [rec]


def build_customer_wtp_weak(
    finding: Finding,
    stage_result: StageResult,
    assumptions: Any,
) -> List[Recommendation]:
    rec = Recommendation(
        id=_gen_rec_id(stage_result.stage, finding.code, "customer.willingness_to_pay_signal"),
        code="RECOMMEND_STRENGTHEN_WTP",
        stage=stage_result.stage,
        priority=Priority.MEDIUM,
        title="Validate Willingness to Pay",
        detail="Prospect signals show weak payment willingness. Refine the problem statement and test pricing during discovery calls.",
        action_type=ActionType.REVIEW_ASSUMPTION,
        target_field="customer.willingness_to_pay_signal",
        current_value="weak",
        suggested_value="strong",
        finding_codes=[str(finding.code)],
        evidence_ids=finding.evidence_ids,
        impact={"risk": "low_willingness_to_pay"},
    )
    return [rec]


def build_competitor_count_deficient(
    finding: Finding,
    stage_result: StageResult,
    assumptions: Any,
) -> List[Recommendation]:
    count = stage_result.metrics.get("competitors_count", 0)
    rec = Recommendation(
        id=_gen_rec_id(stage_result.stage, finding.code),
        code="RECOMMEND_ADD_COMPETITORS",
        stage=stage_result.stage,
        priority=Priority.HIGH,
        title="Add Direct Competitors to Analysis",
        detail=f"Identify at least {rules_config.COMPETITOR_MIN_COUNT} competitors to benchmark product and pricing strategy.",
        action_type=ActionType.GATHER_EVIDENCE,
        target_field=None,
        current_value=str(count),
        suggested_value=str(rules_config.COMPETITOR_MIN_COUNT),
        finding_codes=[str(finding.code)],
        evidence_ids=finding.evidence_ids,
        impact={"min_competitors_required": rules_config.COMPETITOR_MIN_COUNT},
    )
    return [rec]


def build_competitor_evidence_deficient(
    finding: Finding,
    stage_result: StageResult,
    assumptions: Any,
) -> List[Recommendation]:
    rec = Recommendation(
        id=_gen_rec_id(stage_result.stage, finding.code),
        code="RECOMMEND_RESEARCH_COMPETITORS",
        stage=stage_result.stage,
        priority=Priority.HIGH,
        title="Gather Competitor Research Evidence",
        detail="Attach research notes, screenshots, or website links for all competitors.",
        action_type=ActionType.GATHER_EVIDENCE,
        target_field=None,
        current_value=None,
        suggested_value=None,
        finding_codes=[str(finding.code)],
        evidence_ids=finding.evidence_ids,
        impact={"min_evidence_per_competitor": rules_config.COMPETITOR_MIN_EVIDENCE_PER_COMPETITOR},
    )
    return [rec]


def build_undifferentiated_product(
    finding: Finding,
    stage_result: StageResult,
    assumptions: Any,
) -> List[Recommendation]:
    rec = Recommendation(
        id=_gen_rec_id(stage_result.stage, finding.code, "product.differentiation_vs_competitors"),
        code="RECOMMEND_IMPROVE_DIFFERENTIATION",
        stage=stage_result.stage,
        priority=Priority.MEDIUM,
        title="Define Competitive Differentiation",
        detail="Articulate a distinct unique value proposition that separates your product from existing market alternatives.",
        action_type=ActionType.IMPROVE_DIFFERENTIATION,
        target_field="product.differentiation_vs_competitors",
        current_value=None,
        suggested_value=None,
        finding_codes=[str(finding.code)],
        evidence_ids=finding.evidence_ids,
        impact={"differentiated": False},
    )
    return [rec]


def build_no_price_data(
    finding: Finding,
    stage_result: StageResult,
    assumptions: Any,
) -> List[Recommendation]:
    rec = Recommendation(
        id=_gen_rec_id(stage_result.stage, finding.code),
        code="RECOMMEND_COLLECT_COMPETITOR_PRICES",
        stage=stage_result.stage,
        priority=Priority.MEDIUM,
        title="Collect Competitor Price Data",
        detail="Record observed prices for competitors to build a reliable market price band.",
        action_type=ActionType.GATHER_EVIDENCE,
        target_field=None,
        current_value=None,
        suggested_value=None,
        finding_codes=[str(finding.code)],
        evidence_ids=finding.evidence_ids,
        impact={"price_band_available": False},
    )
    return [rec]


def build_packaging_cost_recommendation(
    finding: Finding,
    stage_result: StageResult,
    assumptions: Any,
) -> List[Recommendation]:
    fin_inputs = from_assumptions(assumptions)
    sp = fin_inputs.selling_price
    cur_pkg = fin_inputs.packaging_cost

    ceiling_res = calculate_packaging_cost_ceiling(sp)
    suggested_val = None
    impact = {}
    if ceiling_res:
        ceiling_dec, impact = ceiling_res
        suggested_val = money_to_str(ceiling_dec)

    priority = (
        Priority.CRITICAL
        if finding.code == "PACKAGING_COST_EXCESSIVE"
        else Priority.MEDIUM
    )

    rec = Recommendation(
        id=_gen_rec_id(stage_result.stage, finding.code, "packaging.packaging_cost"),
        code="RECOMMEND_REDUCE_PACKAGING_COST",
        stage=stage_result.stage,
        priority=priority,
        title="Reduce Packaging Cost per Unit",
        detail="Packaging represents an excessive fraction of selling price. Negotiate vendor rates or optimize materials.",
        action_type=ActionType.REDUCE_PACKAGING_COST,
        target_field="packaging.packaging_cost",
        current_value=money_to_str(cur_pkg),
        suggested_value=suggested_val,
        finding_codes=[str(finding.code)],
        evidence_ids=finding.evidence_ids,
        impact=impact,
    )
    return [rec]


def build_price_market_band_recommendation(
    finding: Finding,
    stage_result: StageResult,
    assumptions: Any,
) -> List[Recommendation]:
    fin_inputs = from_assumptions(assumptions)
    sp = fin_inputs.selling_price

    comp_min_str = stage_result.metrics.get("competitor_price_min")
    comp_max_str = stage_result.metrics.get("competitor_price_max")
    comp_min = Decimal(str(comp_min_str)) if comp_min_str else None
    comp_max = Decimal(str(comp_max_str)) if comp_max_str else None

    gap_res = calculate_competitor_price_gap(sp, comp_min, comp_max)
    suggested_val = None
    impact = {}
    if gap_res:
        suggested_dec, impact = gap_res
        suggested_val = money_to_str(suggested_dec)

    title = (
        "Adjust Price to Match Market Band"
        if finding.code == "PRICE_ABOVE_MARKET_BAND"
        else "Increase Price to Competitor Minimum"
    )

    rec = Recommendation(
        id=_gen_rec_id(stage_result.stage, finding.code, "pricing.selling_price"),
        code="RECOMMEND_ADJUST_PRICE_BAND",
        stage=stage_result.stage,
        priority=Priority.MEDIUM,
        title=title,
        detail=finding.message,
        action_type=ActionType.ADJUST_PRICE,
        target_field="pricing.selling_price",
        current_value=money_to_str(sp),
        suggested_value=suggested_val,
        finding_codes=[str(finding.code)],
        evidence_ids=finding.evidence_ids,
        impact=impact,
    )
    return [rec]


def build_no_competitor_band(
    finding: Finding,
    stage_result: StageResult,
    assumptions: Any,
) -> List[Recommendation]:
    rec = Recommendation(
        id=_gen_rec_id(stage_result.stage, finding.code),
        code="RECOMMEND_BENCHMARK_PRICES",
        stage=stage_result.stage,
        priority=Priority.LOW,
        title="Benchmark Against Competitor Prices",
        detail="Competitor price band is unavailable. Gather market price points to benchmark willingness to pay.",
        action_type=ActionType.GATHER_EVIDENCE,
        target_field=None,
        current_value=None,
        suggested_value=None,
        finding_codes=[str(finding.code)],
        evidence_ids=finding.evidence_ids,
        impact={"price_band_available": False},
    )
    return [rec]


def build_margin_alternatives(
    finding: Finding,
    stage_result: StageResult,
    assumptions: Any,
) -> List[Recommendation]:
    """
    Builds alternative recommendations (Adjust Price vs Reduce Cost) linked by a shared alternative_group_id.
    """
    fin_inputs = from_assumptions(assumptions)
    pricing = getattr(assumptions, "pricing", None) if not isinstance(assumptions, dict) else assumptions.get("pricing")
    target_margin = getattr(pricing, "target_margin_fraction", None) if pricing and not isinstance(pricing, dict) else (pricing.get("target_margin_fraction") if isinstance(pricing, dict) else None)
    if target_margin is not None:
        target_margin = Decimal(str(target_margin))
    else:
        target_margin = rules_config.PRICING_TARGET_MARGIN_DEFAULT

    priority = (
        Priority.CRITICAL
        if finding.code in ("PRICING_MARGIN_UNVIABLE", "FINANCIAL_UNIT_ECONOMICS_NEGATIVE")
        else Priority.HIGH
    )

    group_id = str(_gen_rec_id(stage_result.stage, finding.code, "margin_alternative_group"))
    recs: List[Recommendation] = []

    # Alternative A: Adjust Price
    price_res = calculate_price_for_target_margin(assumptions, target_margin)
    if price_res:
        sug_price, impact_price = price_res
        impact_price["alternative_group_id"] = group_id
        impact_price["alternative_type"] = "adjust_price"
        recs.append(
            Recommendation(
                id=_gen_rec_id(stage_result.stage, finding.code, "pricing.selling_price", "price_alt"),
                code="RECOMMEND_ADJUST_PRICE_MARGIN",
                stage=stage_result.stage,
                priority=priority,
                title="Increase Selling Price to Achieve Target Margin",
                detail=f"Raise selling price to ${sug_price:.2f} to hit the {target_margin * Decimal('100'):.0f}% target margin.",
                action_type=ActionType.ADJUST_PRICE,
                target_field="pricing.selling_price",
                current_value=money_to_str(fin_inputs.selling_price),
                suggested_value=money_to_str(sug_price),
                finding_codes=[str(finding.code)],
                evidence_ids=finding.evidence_ids,
                impact=impact_price,
            )
        )

    # Alternative B: Reduce Unit COGS
    cost_res = calculate_max_unit_cost(assumptions, target_margin)
    if cost_res:
        max_cogs, impact_cost = cost_res
        impact_cost["alternative_group_id"] = group_id
        impact_cost["alternative_type"] = "reduce_cost"
        recs.append(
            Recommendation(
                id=_gen_rec_id(stage_result.stage, finding.code, "costs.cogs_per_unit", "cost_alt"),
                code="RECOMMEND_REDUCE_COGS_MARGIN",
                stage=stage_result.stage,
                priority=priority,
                title="Reduce Manufacturing Cost per Unit",
                detail=f"Lower unit COGS to ${max_cogs:.2f} or below to hit the {target_margin * Decimal('100'):.0f}% target margin.",
                action_type=ActionType.REDUCE_COST,
                target_field="costs.cogs_per_unit",
                current_value=money_to_str(fin_inputs.cogs_per_unit),
                suggested_value=money_to_str(max_cogs),
                finding_codes=[str(finding.code)],
                evidence_ids=finding.evidence_ids,
                impact=impact_cost,
            )
        )

    # Fallback if neither calculation could complete due to missing inputs
    if not recs:
        recs.append(
            Recommendation(
                id=_gen_rec_id(stage_result.stage, finding.code, "pricing.selling_price", "fallback"),
                code="RECOMMEND_REVIEW_UNIT_ECONOMICS",
                stage=stage_result.stage,
                priority=priority,
                title="Review Unit Economics and Margins",
                detail=finding.message,
                action_type=ActionType.REVIEW_ASSUMPTION,
                target_field="pricing.selling_price",
                current_value=money_to_str(fin_inputs.selling_price),
                suggested_value=None,
                finding_codes=[str(finding.code)],
                evidence_ids=finding.evidence_ids,
                impact={"target_margin_fraction": fraction_to_str(target_margin)},
            )
        )

    return recs


def build_financial_break_even_volume(
    finding: Finding,
    stage_result: StageResult,
    assumptions: Any,
) -> List[Recommendation]:
    fin_inputs = from_assumptions(assumptions)
    be_units = stage_result.metrics.get("break_even_units")
    rec = Recommendation(
        id=_gen_rec_id(stage_result.stage, finding.code, "costs.fixed_costs_total"),
        code="RECOMMEND_LOWER_BREAK_EVEN",
        stage=stage_result.stage,
        priority=Priority.MEDIUM,
        title="Reduce Fixed Overhead to Lower Break-Even Volume",
        detail=f"Break-even volume ({be_units} units) exceeds sustainable threshold ({rules_config.FINANCIAL_BREAK_EVEN_WARN_UNITS}). Reduce fixed costs or boost unit margin.",
        action_type=ActionType.REDUCE_COST,
        target_field="costs.fixed_costs_total",
        current_value=money_to_str(fin_inputs.fixed_costs_total),
        suggested_value=None,
        finding_codes=[str(finding.code)],
        evidence_ids=finding.evidence_ids,
        impact={"warn_units_threshold": rules_config.FINANCIAL_BREAK_EVEN_WARN_UNITS, "current_break_even": be_units},
    )
    return [rec]


def build_finance_issue_negative_cost(
    finding: Finding,
    stage_result: StageResult,
    assumptions: Any,
) -> List[Recommendation]:
    field_name = finding.field or "cost"
    rec = Recommendation(
        id=_gen_rec_id(stage_result.stage, "NEGATIVE_COST", field_name),
        code="RECOMMEND_CORRECT_NEGATIVE_COST",
        stage=stage_result.stage,
        priority=Priority.CRITICAL,
        title=f"Correct Negative {field_name.replace('_', ' ').title()}",
        detail=f"'{field_name}' is negative ({finding.message}). Cost assumptions must be non-negative.",
        action_type=ActionType.REVIEW_ASSUMPTION,
        target_field=field_name,
        current_value=None,
        suggested_value="0.00",
        finding_codes=[str(finding.code)],
        evidence_ids=finding.evidence_ids,
        impact={"error": "negative_cost"},
    )
    return [rec]


def build_finance_issue_invalid_fraction(
    finding: Finding,
    stage_result: StageResult,
    assumptions: Any,
) -> List[Recommendation]:
    field_name = finding.field or "fraction"
    rec = Recommendation(
        id=_gen_rec_id(stage_result.stage, "INVALID_FRACTION", field_name),
        code="RECOMMEND_CORRECT_FRACTION",
        stage=stage_result.stage,
        priority=Priority.CRITICAL,
        title=f"Correct {field_name.replace('_', ' ').title()} Range",
        detail=f"'{field_name}' must be between 0.00 and 1.00 (0% to 100%).",
        action_type=ActionType.REVIEW_ASSUMPTION,
        target_field=field_name,
        current_value=None,
        suggested_value="0.02",
        finding_codes=[str(finding.code)],
        evidence_ids=finding.evidence_ids,
        impact={"valid_range": "0.00_to_1.00"},
    )
    return [rec]


def build_finance_issue_invalid_number(
    finding: Finding,
    stage_result: StageResult,
    assumptions: Any,
) -> List[Recommendation]:
    field_name = finding.field or "number"
    rec = Recommendation(
        id=_gen_rec_id(stage_result.stage, "INVALID_NUMBER", field_name),
        code="RECOMMEND_CORRECT_NUMERIC_VALUE",
        stage=stage_result.stage,
        priority=Priority.CRITICAL,
        title=f"Correct Non-Numeric or Infinite {field_name.replace('_', ' ').title()}",
        detail=f"'{field_name}' is not a valid finite number. Enter a valid Decimal value.",
        action_type=ActionType.REVIEW_ASSUMPTION,
        target_field=field_name,
        current_value=None,
        suggested_value=None,
        finding_codes=[str(finding.code)],
        evidence_ids=finding.evidence_ids,
        impact={"error": "invalid_number"},
    )
    return [rec]


def build_finance_issue_non_positive_price(
    finding: Finding,
    stage_result: StageResult,
    assumptions: Any,
) -> List[Recommendation]:
    rec = Recommendation(
        id=_gen_rec_id(stage_result.stage, "NON_POSITIVE_PRICE", "pricing.selling_price"),
        code="RECOMMEND_SET_POSITIVE_PRICE",
        stage=stage_result.stage,
        priority=Priority.CRITICAL,
        title="Set Positive Selling Price",
        detail="Selling price must be greater than zero to evaluate unit economics.",
        action_type=ActionType.PROVIDE_INPUT,
        target_field="pricing.selling_price",
        current_value=None,
        suggested_value=None,
        finding_codes=[str(finding.code)],
        evidence_ids=finding.evidence_ids,
        impact={"error": "non_positive_price"},
    )
    return [rec]


def build_marketing_cac_recommendations(
    finding: Finding,
    stage_result: StageResult,
    assumptions: Any,
) -> List[Recommendation]:
    fin_inputs = from_assumptions(assumptions)
    mkt = getattr(assumptions, "marketing", None) if not isinstance(assumptions, dict) else assumptions.get("marketing")
    cac_raw = getattr(mkt, "expected_cac", None) if mkt and not isinstance(mkt, dict) else (mkt.get("expected_cac") if isinstance(mkt, dict) else None)
    cac = Decimal(str(cac_raw)) if cac_raw is not None else None

    # Upstream contribution
    cpu_str = stage_result.metrics.get("contribution_per_unit")
    cpu = Decimal(str(cpu_str)) if cpu_str is not None else None

    ceiling_res = calculate_cac_ceiling(cpu)
    suggested_val = None
    impact = {}
    if ceiling_res:
        ceiling_dec, impact = ceiling_res
        suggested_val = money_to_str(ceiling_dec)

    priority = (
        Priority.CRITICAL
        if finding.code in ("MARKETING_CAC_EXCEEDS_CONTRIBUTION", "NEGATIVE_UNIT_ECONOMICS")
        else Priority.MEDIUM
    )

    rec = Recommendation(
        id=_gen_rec_id(stage_result.stage, finding.code, "marketing.expected_cac"),
        code="RECOMMEND_REDUCE_CAC",
        stage=stage_result.stage,
        priority=priority,
        title="Lower CAC or Rebalance Acquisition Channels",
        detail="Customer acquisition cost is unsustainable relative to unit contribution. Lower paid acquisition cost or diversify into organic channels.",
        action_type=ActionType.REVISE_CHANNEL_MIX,
        target_field="marketing.expected_cac",
        current_value=money_to_str(cac),
        suggested_value=suggested_val,
        finding_codes=[str(finding.code)],
        evidence_ids=finding.evidence_ids,
        impact=impact,
    )
    return [rec]


def build_missing_upstream_recommendation(
    finding: Finding,
    stage_result: StageResult,
    assumptions: Any,
) -> List[Recommendation]:
    rec = Recommendation(
        id=_gen_rec_id(stage_result.stage, "MISSING_UPSTREAM"),
        code="RECOMMEND_RESOLVE_UPSTREAM_STAGE",
        stage=stage_result.stage,
        priority=Priority.HIGH,
        title="Complete Upstream Stage Prerequisites",
        detail="This stage depends on outputs from an upstream stage that has not completed successfully.",
        action_type=ActionType.PROVIDE_INPUT,
        target_field=finding.field,
        current_value=None,
        suggested_value=None,
        finding_codes=[str(finding.code)],
        evidence_ids=finding.evidence_ids,
        impact={"blocking_upstream": True},
    )
    return [rec]


def build_stage_error_recommendation(
    finding: Finding,
    stage_result: StageResult,
    assumptions: Any,
) -> List[Recommendation]:
    rec = Recommendation(
        id=_gen_rec_id(stage_result.stage, "STAGE_ERROR"),
        code="RECOMMEND_RESOLVE_STAGE_ERROR",
        stage=stage_result.stage,
        priority=Priority.CRITICAL,
        title="Resolve Stage Execution Error",
        detail=f"Stage '{stage_result.stage}' encountered an error: {finding.message}. Review assumptions and retry.",
        action_type=ActionType.REVIEW_ASSUMPTION,
        target_field=None,
        current_value=None,
        suggested_value=None,
        finding_codes=[str(finding.code)],
        evidence_ids=finding.evidence_ids,
        impact={"error": True},
    )
    return [rec]


# ---------------------------------------------------------------------------
# Comprehensive Rule Mapping Table
# ---------------------------------------------------------------------------

RECOMMENDATION_RULE_TABLE: Dict[str, Callable[[Finding, StageResult, Any], List[Recommendation]]] = {
    # 1. Missing Input & Upstream
    "MISSING_INPUT": build_missing_input_recommendations,
    "MISSING_UPSTREAM": build_missing_upstream_recommendation,
    "MISSING_UPSTREAM:financial.contribution_per_unit": build_missing_upstream_recommendation,

    # 2. Customer Stage
    "CUSTOMER_INTERVIEWS_INSUFFICIENT": build_customer_interviews_insufficient,
    "CUSTOMER_INTERVIEWS_LOW": build_customer_interviews_low,
    "CUSTOMER_WTP_WEAK": build_customer_wtp_weak,

    # 3. Competitor Stage
    "COMPETITOR_COUNT_DEFICIENT": build_competitor_count_deficient,
    "COMPETITOR_EVIDENCE_DEFICIENT": build_competitor_evidence_deficient,
    "UNDIFFERENTIATED_PRODUCT": build_undifferentiated_product,
    "NO_PRICE_DATA": build_no_price_data,

    # 4. Product Packaging Stage
    "PACKAGING_COST_EXCESSIVE": build_packaging_cost_recommendation,
    "PACKAGING_COST_ELEVATED": build_packaging_cost_recommendation,

    # 5. Pricing Stage
    "PRICE_BELOW_MARKET_BAND": build_price_market_band_recommendation,
    "PRICE_ABOVE_MARKET_BAND": build_price_market_band_recommendation,
    "NO_COMPETITOR_BAND": build_no_competitor_band,
    "PRICING_MARGIN_UNVIABLE": build_margin_alternatives,
    "PRICING_MARGIN_BELOW_TARGET": build_margin_alternatives,

    # 6. Financial Stage & Issues
    "FINANCIAL_UNIT_ECONOMICS_NEGATIVE": build_margin_alternatives,
    "NEGATIVE_CONTRIBUTION": build_margin_alternatives,
    "ZERO_CONTRIBUTION": build_margin_alternatives,
    "FINANCIAL_MARGIN_BELOW_TARGET": build_margin_alternatives,
    "FINANCIAL_MARGIN_UNVIABLE": build_margin_alternatives,
    "FINANCIAL_HIGH_BREAK_EVEN_VOLUME": build_financial_break_even_volume,
    "FINANCIAL_BREAK_EVEN_EXCESSIVE": build_financial_break_even_volume,
    "FINANCIAL_BREAK_EVEN_ELEVATED": build_financial_break_even_volume,
    "NEGATIVE_COST": build_finance_issue_negative_cost,
    "NON_POSITIVE_PRICE": build_finance_issue_non_positive_price,
    "INVALID_FRACTION": build_finance_issue_invalid_fraction,
    "INVALID_NUMBER": build_finance_issue_invalid_number,

    # 7. Marketing Stage
    "NEGATIVE_UNIT_ECONOMICS": build_marketing_cac_recommendations,
    "MARKETING_CAC_EXCEEDS_CONTRIBUTION": build_marketing_cac_recommendations,
    "MARKETING_CAC_RATIO_HIGH": build_marketing_cac_recommendations,

    # 8. Orchestrator
    "STAGE_ERROR": build_stage_error_recommendation,
}
