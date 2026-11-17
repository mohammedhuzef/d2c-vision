"""Deterministic rule mappings for generating recommendations from stage findings.

Maps every emitted finding code (and finance issues) to recommendation builders.
"""

from decimal import Decimal
from typing import Any, Callable, List, Optional

from backend.app.services.finance import to_decimal
from backend.app.services.validation.base import Finding, Severity, StageResult
from backend.app.services.validation.recommendations.calculations import (
    break_even_after_change,
    cac_ceiling,
    max_cogs_for_target_margin,
    packaging_cost_ceiling,
    price_for_target_margin,
    price_gap_vs_band,
)
from backend.app.services.validation.recommendations.models import ActionType, RecommendationItem
from backend.app.services.validation.rules_config import (
    COMPETITOR_MIN_COUNT,
    COMPETITOR_MIN_EVIDENCE_PER_COMPETITOR,
    CUSTOMER_MIN_INTERVIEWS,
    CUSTOMER_STRONG_INTERVIEWS,
    FINANCIAL_BREAK_EVEN_WARN_UNITS,
    MARKETING_CAC_RATIO_FAIL,
    MARKETING_CAC_RATIO_WARN,
    PACKAGING_FAIL_FRACTION,
    PACKAGING_WARN_FRACTION,
    PRICING_TARGET_MARGIN_DEFAULT,
    get_recommendation_priority,
)


def _build_missing_input(
    finding: Finding,
    result: StageResult,
    assumptions: dict[str, Any],
) -> List[RecommendationItem]:
    priority = get_recommendation_priority(
        result.stage,
        result.status.value,
        finding.severity.value,
        finding.code,
    )
    return [
        RecommendationItem(
            code=finding.code,
            stage=result.stage,
            priority=priority,
            title=f"Provide required input for {finding.field or result.stage}",
            detail=finding.message,
            action_type=ActionType.PROVIDE_INPUT.value,
            target_field=finding.field,
            current_value=None,
            suggested_value=None,
            finding_codes=(finding.code,),
            evidence_ids=finding.evidence_ids,
            impact={},
        )
    ]


def _build_customer_interviews_insufficient(
    finding: Finding,
    result: StageResult,
    assumptions: dict[str, Any],
) -> List[RecommendationItem]:
    priority = get_recommendation_priority(
        result.stage,
        result.status.value,
        finding.severity.value,
        finding.code,
    )
    current = result.metrics.get("customer_interviews_count")
    return [
        RecommendationItem(
            code=finding.code,
            stage=result.stage,
            priority=priority,
            title="Conduct initial customer discovery interviews",
            detail=f"At least {CUSTOMER_MIN_INTERVIEWS} customer interviews are required to validate problem-solution fit.",
            action_type=ActionType.GATHER_EVIDENCE.value,
            target_field="customer.customer_interviews_count",
            current_value=str(current) if current is not None else "0",
            suggested_value=str(CUSTOMER_MIN_INTERVIEWS),
            finding_codes=(finding.code,),
            evidence_ids=finding.evidence_ids,
            impact={"target_interviews": CUSTOMER_MIN_INTERVIEWS, "metric": "customer_interviews_count"},
        )
    ]


def _build_customer_interviews_low(
    finding: Finding,
    result: StageResult,
    assumptions: dict[str, Any],
) -> List[RecommendationItem]:
    priority = get_recommendation_priority(
        result.stage,
        result.status.value,
        finding.severity.value,
        finding.code,
    )
    current = result.metrics.get("customer_interviews_count")
    return [
        RecommendationItem(
            code=finding.code,
            stage=result.stage,
            priority=priority,
            title="Expand customer discovery interviews",
            detail=f"Currently {current} interviews logged. Target {CUSTOMER_STRONG_INTERVIEWS}+ interviews to validate willingness to pay.",
            action_type=ActionType.GATHER_EVIDENCE.value,
            target_field="customer.customer_interviews_count",
            current_value=str(current) if current is not None else None,
            suggested_value=str(CUSTOMER_STRONG_INTERVIEWS),
            finding_codes=(finding.code,),
            evidence_ids=finding.evidence_ids,
            impact={"target_interviews": CUSTOMER_STRONG_INTERVIEWS, "metric": "customer_interviews_count"},
        )
    ]


def _build_competitors_insufficient(
    finding: Finding,
    result: StageResult,
    assumptions: dict[str, Any],
) -> List[RecommendationItem]:
    priority = get_recommendation_priority(
        result.stage,
        result.status.value,
        finding.severity.value,
        finding.code,
    )
    count = result.metrics.get("competitors_count")
    return [
        RecommendationItem(
            code=finding.code,
            stage=result.stage,
            priority=priority,
            title="Identify and benchmark additional competitors",
            detail=f"Found {count or 0} competitors. At least {COMPETITOR_MIN_COUNT} direct competitors are required.",
            action_type=ActionType.GATHER_EVIDENCE.value,
            target_field="competitors",
            current_value=str(count) if count is not None else "0",
            suggested_value=str(COMPETITOR_MIN_COUNT),
            finding_codes=(finding.code,),
            evidence_ids=finding.evidence_ids,
            impact={"min_competitor_count": COMPETITOR_MIN_COUNT, "metric": "competitors_count"},
        )
    ]


def _build_competitor_under_researched(
    finding: Finding,
    result: StageResult,
    assumptions: dict[str, Any],
) -> List[RecommendationItem]:
    priority = get_recommendation_priority(
        result.stage,
        result.status.value,
        finding.severity.value,
        finding.code,
    )
    return [
        RecommendationItem(
            code=finding.code,
            stage=result.stage,
            priority=priority,
            title="Collect verified competitor benchmark evidence",
            detail=finding.message,
            action_type=ActionType.GATHER_EVIDENCE.value,
            target_field="evidence",
            current_value=None,
            suggested_value=None,
            finding_codes=(finding.code,),
            evidence_ids=finding.evidence_ids,
            impact={"min_evidence_per_competitor": COMPETITOR_MIN_EVIDENCE_PER_COMPETITOR},
        )
    ]


def _build_undifferentiated_product(
    finding: Finding,
    result: StageResult,
    assumptions: dict[str, Any],
) -> List[RecommendationItem]:
    priority = get_recommendation_priority(
        result.stage,
        result.status.value,
        finding.severity.value,
        finding.code,
    )
    return [
        RecommendationItem(
            code=finding.code,
            stage=result.stage,
            priority=priority,
            title="Articulate clear competitive differentiation",
            detail="Specify how the product uniquely differentiates against competitors in design, materials, or performance.",
            action_type=ActionType.IMPROVE_DIFFERENTIATION.value,
            target_field="product.differentiation_vs_competitors",
            current_value=None,
            suggested_value=None,
            finding_codes=(finding.code,),
            evidence_ids=finding.evidence_ids,
            impact={},
        )
    ]


def _build_no_price_data(
    finding: Finding,
    result: StageResult,
    assumptions: dict[str, Any],
) -> List[RecommendationItem]:
    priority = get_recommendation_priority(
        result.stage,
        result.status.value,
        finding.severity.value,
        finding.code,
    )
    return [
        RecommendationItem(
            code=finding.code,
            stage=result.stage,
            priority=priority,
            title="Document competitor pricing data",
            detail="Collect observed pricing points for market benchmark competitors to evaluate pricing corridors.",
            action_type=ActionType.GATHER_EVIDENCE.value,
            target_field="competitors.price_observed",
            current_value=None,
            suggested_value=None,
            finding_codes=(finding.code,),
            evidence_ids=finding.evidence_ids,
            impact={},
        )
    ]


def _build_packaging_cost_high_or_excessive(
    finding: Finding,
    result: StageResult,
    assumptions: dict[str, Any],
) -> List[RecommendationItem]:
    priority = get_recommendation_priority(
        result.stage,
        result.status.value,
        finding.severity.value,
        finding.code,
    )
    pricing = assumptions.get("pricing") or {}
    selling_price = to_decimal(pricing.get("selling_price"))
    ceiling = packaging_cost_ceiling(selling_price)
    current_cost = result.metrics.get("packaging_cost")
    current_ratio = result.metrics.get("packaging_cost_ratio")

    return [
        RecommendationItem(
            code=finding.code,
            stage=result.stage,
            priority=priority,
            title="Reduce packaging unit cost",
            detail=(
                f"Packaging cost ({current_cost}) consumes {current_ratio:.2%} of selling price. "
                f"Target a cost ceiling of {ceiling}."
            ),
            action_type=ActionType.REDUCE_PACKAGING_COST.value,
            target_field="packaging.packaging_cost",
            current_value=str(current_cost) if current_cost is not None else None,
            suggested_value=str(ceiling) if ceiling is not None else None,
            finding_codes=(finding.code,),
            evidence_ids=finding.evidence_ids,
            impact={
                "packaging_cost_ceiling": str(ceiling) if ceiling is not None else None,
                "current_ratio": str(current_ratio) if current_ratio is not None else None,
                "metric": "packaging_cost_ceiling",
            },
        )
    ]


def _build_packaging_cost_mismatch(
    finding: Finding,
    result: StageResult,
    assumptions: dict[str, Any],
) -> List[RecommendationItem]:
    priority = get_recommendation_priority(
        result.stage,
        result.status.value,
        finding.severity.value,
        finding.code,
    )
    current_cost = result.metrics.get("packaging_cost")
    return [
        RecommendationItem(
            code=finding.code,
            stage=result.stage,
            priority=priority,
            title="Reconcile packaging cost discrepancy",
            detail="packaging.packaging_cost and costs.packaging_cost differ. Confirm authority value.",
            action_type=ActionType.REVIEW_ASSUMPTION.value,
            target_field="packaging.packaging_cost",
            current_value=str(current_cost) if current_cost is not None else None,
            suggested_value=str(current_cost) if current_cost is not None else None,
            finding_codes=(finding.code,),
            evidence_ids=finding.evidence_ids,
            impact={},
        )
    ]


def _build_price_below_market_band(
    finding: Finding,
    result: StageResult,
    assumptions: dict[str, Any],
) -> List[RecommendationItem]:
    priority = get_recommendation_priority(
        result.stage,
        result.status.value,
        finding.severity.value,
        finding.code,
    )
    band_min = result.metrics.get("competitor_price_min")
    band_max = result.metrics.get("competitor_price_max")
    selling_price = result.metrics.get("selling_price")
    gap = price_gap_vs_band(selling_price, band_min, band_max)

    return [
        RecommendationItem(
            code=finding.code,
            stage=result.stage,
            priority=priority,
            title="Adjust price closer to competitor market band",
            detail=f"Selling price ({selling_price}) is significantly below competitor minimum ({band_min}). Consider premium positioning.",
            action_type=ActionType.ADJUST_PRICE.value,
            target_field="pricing.selling_price",
            current_value=str(selling_price) if selling_price is not None else None,
            suggested_value=str(band_min) if band_min is not None else None,
            finding_codes=(finding.code,),
            evidence_ids=finding.evidence_ids,
            impact={
                "band_min": str(band_min) if band_min is not None else None,
                "gap_fraction": str(gap.get("gap_fraction")) if gap else None,
                "metric": "competitor_price_min",
            },
        )
    ]


def _build_price_above_market_band(
    finding: Finding,
    result: StageResult,
    assumptions: dict[str, Any],
) -> List[RecommendationItem]:
    priority = get_recommendation_priority(
        result.stage,
        result.status.value,
        finding.severity.value,
        finding.code,
    )
    band_min = result.metrics.get("competitor_price_min")
    band_max = result.metrics.get("competitor_price_max")
    selling_price = result.metrics.get("selling_price")
    gap = price_gap_vs_band(selling_price, band_min, band_max)

    return [
        RecommendationItem(
            code=finding.code,
            stage=result.stage,
            priority=priority,
            title="Review price premium against market band",
            detail=f"Selling price ({selling_price}) exceeds competitor maximum ({band_max}). Ensure strong differentiation justifies the premium.",
            action_type=ActionType.ADJUST_PRICE.value,
            target_field="pricing.selling_price",
            current_value=str(selling_price) if selling_price is not None else None,
            suggested_value=str(band_max) if band_max is not None else None,
            finding_codes=(finding.code,),
            evidence_ids=finding.evidence_ids,
            impact={
                "band_max": str(band_max) if band_max is not None else None,
                "gap_fraction": str(gap.get("gap_fraction")) if gap else None,
                "metric": "competitor_price_max",
            },
        )
    ]


def _build_no_competitor_band(
    finding: Finding,
    result: StageResult,
    assumptions: dict[str, Any],
) -> List[RecommendationItem]:
    priority = get_recommendation_priority(
        result.stage,
        result.status.value,
        finding.severity.value,
        finding.code,
    )
    return [
        RecommendationItem(
            code=finding.code,
            stage=result.stage,
            priority=priority,
            title="Benchmark competitor pricing",
            detail="Competitor price band is unavailable. Gather competitor prices to validate retail price positioning.",
            action_type=ActionType.GATHER_EVIDENCE.value,
            target_field="competitors.price_observed",
            current_value=None,
            suggested_value=None,
            finding_codes=(finding.code,),
            evidence_ids=finding.evidence_ids,
            impact={},
        )
    ]


def _build_margin_remediation(
    finding: Finding,
    result: StageResult,
    assumptions: dict[str, Any],
) -> List[RecommendationItem]:
    """Generates dual recommendations (price increase + cost reduction) linked with shared group key."""
    priority = get_recommendation_priority(
        result.stage,
        result.status.value,
        finding.severity.value,
        finding.code,
    )
    pricing = assumptions.get("pricing") or {}
    costs = assumptions.get("costs") or {}

    target_margin = to_decimal(pricing.get("target_margin_fraction")) or PRICING_TARGET_MARGIN_DEFAULT
    selling_price = to_decimal(pricing.get("selling_price"))
    cogs = to_decimal(costs.get("cogs_per_unit"))

    rec_price = price_for_target_margin(assumptions, target_margin)
    max_cogs = max_cogs_for_target_margin(assumptions, target_margin)

    group_id = f"margin_remediation_{result.stage}"
    recs: List[RecommendationItem] = []

    # 1. Price Adjustment Recommendation
    be_price = break_even_after_change(assumptions, {"selling_price": rec_price}) if rec_price else None
    recs.append(
        RecommendationItem(
            code=finding.code,
            stage=result.stage,
            priority=priority,
            title="Adjust retail selling price to achieve target margin",
            detail=f"Increase selling price to {rec_price} to achieve target margin of {target_margin:.0%}.",
            action_type=ActionType.ADJUST_PRICE.value,
            target_field="pricing.selling_price",
            current_value=str(selling_price) if selling_price is not None else None,
            suggested_value=str(rec_price) if rec_price is not None else None,
            finding_codes=(finding.code,),
            evidence_ids=finding.evidence_ids,
            impact={
                "group_id": group_id,
                "metric": "price_for_target_margin",
                "target_margin": str(target_margin),
                "suggested_price": str(rec_price) if rec_price else None,
                "break_even_after_change": str(be_price) if be_price is not None else None,
            },
        )
    )

    # 2. Cost Reduction Recommendation
    be_cogs = break_even_after_change(assumptions, {"cogs_per_unit": max_cogs}) if max_cogs else None
    recs.append(
        RecommendationItem(
            code=finding.code,
            stage=result.stage,
            priority=priority,
            title="Reduce COGS to achieve target margin",
            detail=f"Lower direct product cost (COGS) to {max_cogs} to achieve target margin of {target_margin:.0%}.",
            action_type=ActionType.REDUCE_COST.value,
            target_field="costs.cogs_per_unit",
            current_value=str(cogs) if cogs is not None else None,
            suggested_value=str(max_cogs) if max_cogs is not None else None,
            finding_codes=(finding.code,),
            evidence_ids=finding.evidence_ids,
            impact={
                "group_id": group_id,
                "metric": "max_cogs_for_target_margin",
                "target_margin": str(target_margin),
                "max_cogs": str(max_cogs) if max_cogs else None,
                "break_even_after_change": str(be_cogs) if be_cogs is not None else None,
            },
        )
    )

    return recs


def _build_financial_high_break_even(
    finding: Finding,
    result: StageResult,
    assumptions: dict[str, Any],
) -> List[RecommendationItem]:
    priority = get_recommendation_priority(
        result.stage,
        result.status.value,
        finding.severity.value,
        finding.code,
    )
    current_be = result.metrics.get("break_even_units")
    costs = assumptions.get("costs") or {}
    fixed_costs = to_decimal(costs.get("fixed_costs_total"))

    return [
        RecommendationItem(
            code=finding.code,
            stage=result.stage,
            priority=priority,
            title="Reduce fixed costs to lower break-even sales volume",
            detail=f"Break-even sales volume ({current_be}) exceeds threshold ceiling of {FINANCIAL_BREAK_EVEN_WARN_UNITS} units.",
            action_type=ActionType.REDUCE_COST.value,
            target_field="costs.fixed_costs_total",
            current_value=str(fixed_costs) if fixed_costs is not None else None,
            suggested_value=None,
            finding_codes=(finding.code,),
            evidence_ids=finding.evidence_ids,
            impact={
                "break_even_units": str(current_be) if current_be is not None else None,
                "break_even_ceiling": str(FINANCIAL_BREAK_EVEN_WARN_UNITS),
                "metric": "break_even_units",
            },
        )
    ]


def _build_marketing_cac_ratio_high_or_fails(
    finding: Finding,
    result: StageResult,
    assumptions: dict[str, Any],
) -> List[RecommendationItem]:
    priority = get_recommendation_priority(
        result.stage,
        result.status.value,
        finding.severity.value,
        finding.code,
    )
    contribution = result.metrics.get("contribution_per_unit")
    current_cac = result.metrics.get("expected_cac")
    ratio = result.metrics.get("cac_to_contribution_ratio")
    ceiling = cac_ceiling(contribution)

    return [
        RecommendationItem(
            code=finding.code,
            stage=result.stage,
            priority=priority,
            title="Optimize marketing channels to lower customer acquisition cost",
            detail=f"Expected CAC ({current_cac}) consumes high fraction of margin. Target CAC ceiling of {ceiling}.",
            action_type=ActionType.REVISE_CHANNEL_MIX.value,
            target_field="marketing.expected_cac",
            current_value=str(current_cac) if current_cac is not None else None,
            suggested_value=str(ceiling) if ceiling is not None else None,
            finding_codes=(finding.code,),
            evidence_ids=finding.evidence_ids,
            impact={
                "cac_ceiling": str(ceiling) if ceiling is not None else None,
                "cac_to_contribution_ratio": str(ratio) if ratio is not None else None,
                "metric": "cac_ceiling",
            },
        )
    ]


def _build_missing_upstream_or_negative_unit_economics(
    finding: Finding,
    result: StageResult,
    assumptions: dict[str, Any],
) -> List[RecommendationItem]:
    priority = get_recommendation_priority(
        result.stage,
        result.status.value,
        finding.severity.value,
        finding.code,
    )
    return [
        RecommendationItem(
            code=finding.code,
            stage=result.stage,
            priority=priority,
            title="Resolve upstream financial unit economics",
            detail="Marketing acquisition requires positive unit economics from the upstream financial stage.",
            action_type=ActionType.REVIEW_ASSUMPTION.value,
            target_field="pricing.selling_price",
            current_value=None,
            suggested_value=None,
            finding_codes=(finding.code,),
            evidence_ids=finding.evidence_ids,
            impact={},
        )
    ]


def _build_generic_assumption_review(
    finding: Finding,
    result: StageResult,
    assumptions: dict[str, Any],
) -> List[RecommendationItem]:
    priority = get_recommendation_priority(
        result.stage,
        result.status.value,
        finding.severity.value,
        finding.code,
    )
    return [
        RecommendationItem(
            code=finding.code,
            stage=result.stage,
            priority=priority,
            title=f"Review assumption: {finding.code}",
            detail=finding.message,
            action_type=ActionType.REVIEW_ASSUMPTION.value,
            target_field=finding.field,
            current_value=None,
            suggested_value=None,
            finding_codes=(finding.code,),
            evidence_ids=finding.evidence_ids,
            impact={},
        )
    ]


# Complete finding code mapping registry
RECOMMENDATION_RULES: dict[str, Callable[[Finding, StageResult, dict[str, Any]], List[RecommendationItem]]] = {
    # Generic & System
    "MISSING_INPUT": _build_missing_input,
    "STAGE_ERROR": _build_generic_assumption_review,

    # Customer
    "CUSTOMER_INTERVIEWS_INSUFFICIENT": _build_customer_interviews_insufficient,
    "CUSTOMER_INTERVIEWS_LOW": _build_customer_interviews_low,

    # Competitor
    "COMPETITORS_INSUFFICIENT": _build_competitors_insufficient,
    "COMPETITOR_EVIDENCE_MISSING": _build_competitor_under_researched,
    "COMPETITOR_UNDER_RESEARCHED": _build_competitor_under_researched,
    "UNDIFFERENTIATED_PRODUCT": _build_undifferentiated_product,
    "NO_PRICE_DATA": _build_no_price_data,

    # Product Packaging
    "PACKAGING_COST_HIGH": _build_packaging_cost_high_or_excessive,
    "PACKAGING_COST_EXCESSIVE": _build_packaging_cost_high_or_excessive,
    "PACKAGING_COST_MISMATCH": _build_packaging_cost_mismatch,

    # Pricing
    "PRICE_BELOW_MARKET_BAND": _build_price_below_market_band,
    "PRICE_ABOVE_MARKET_BAND": _build_price_above_market_band,
    "NO_COMPETITOR_BAND": _build_no_competitor_band,
    "PRICING_MARGIN_BELOW_TARGET": _build_margin_remediation,
    "PRICING_MARGIN_UNVIABLE": _build_margin_remediation,

    # Financial
    "FINANCIAL_MARGIN_BELOW_TARGET": _build_margin_remediation,
    "FINANCIAL_UNIT_ECONOMICS_NEGATIVE": _build_margin_remediation,
    "FINANCIAL_HIGH_BREAK_EVEN_VOLUME": _build_financial_high_break_even,

    # Finance Issues
    "NEGATIVE_PRICE": _build_generic_assumption_review,
    "NEGATIVE_COST": _build_generic_assumption_review,
    "NEGATIVE_MARGIN": _build_generic_assumption_review,
    "ZERO_PRICE": _build_generic_assumption_review,
    "MISSING_REQUIRED_INPUT": _build_missing_input,

    # Marketing
    "MARKETING_CAC_RATIO_HIGH": _build_marketing_cac_ratio_high_or_fails,
    "MARKETING_CAC_EXCEEDS_CONTRIBUTION": _build_marketing_cac_ratio_high_or_fails,
    "MISSING_UPSTREAM": _build_missing_upstream_or_negative_unit_economics,
    "NEGATIVE_UNIT_ECONOMICS": _build_missing_upstream_or_negative_unit_economics,
}

