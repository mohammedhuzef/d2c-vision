"""Centralized rules configuration and deterministic scoring for validation stages.

All thresholds and scoring parameters are defined here. Stage files must reference
these constants and must NOT contain inline numeric business thresholds.
"""

from decimal import Decimal
from typing import Dict, List, Optional, Set
from backend.app.services.validation.base import Finding, Status

# 1. Customer Discovery Thresholds
CUSTOMER_MIN_INTERVIEWS: int = 5
CUSTOMER_STRONG_INTERVIEWS: int = 10

# Aliases for backwards compatibility
CUSTOMER_MIN_INTERVIEWS_REQUIRED: int = CUSTOMER_MIN_INTERVIEWS
CUSTOMER_WARNING_INTERVIEWS_THRESHOLD: int = CUSTOMER_STRONG_INTERVIEWS
min_interviews: int = CUSTOMER_MIN_INTERVIEWS
strong_interviews: int = CUSTOMER_STRONG_INTERVIEWS

# 2. Competitor Landscape Thresholds
COMPETITOR_MIN_COUNT: int = 2
COMPETITOR_MIN_EVIDENCE_PER_COMPETITOR: int = 1
min_competitors: int = COMPETITOR_MIN_COUNT
min_evidence_per_competitor: int = COMPETITOR_MIN_EVIDENCE_PER_COMPETITOR

# 3. Product Packaging Thresholds
PACKAGING_WARN_FRACTION: Decimal = Decimal("0.15")
PACKAGING_FAIL_FRACTION: Decimal = Decimal("0.25")
warn_fraction: Decimal = PACKAGING_WARN_FRACTION
fail_fraction: Decimal = PACKAGING_FAIL_FRACTION

# Aliases
PACKAGING_RATIO_WARNING_THRESHOLD: Decimal = PACKAGING_WARN_FRACTION
PACKAGING_RATIO_FAILED_THRESHOLD: Decimal = PACKAGING_FAIL_FRACTION

# 4. Pricing Strategy Thresholds
PRICING_BELOW_BAND_WARN: Decimal = Decimal("0.20")
PRICING_ABOVE_BAND_WARN: Decimal = Decimal("0.15")
PRICING_FAIL_MARGIN: Decimal = Decimal("0.15")
PRICING_TARGET_MARGIN_DEFAULT: Decimal = Decimal("0.40")

below_band_warn: Decimal = PRICING_BELOW_BAND_WARN
above_band_warn: Decimal = PRICING_ABOVE_BAND_WARN
fail_margin: Decimal = PRICING_FAIL_MARGIN
target_margin: Decimal = PRICING_TARGET_MARGIN_DEFAULT

# Aliases
PRICING_BELOW_BAND_MIN_WARNING_PCT: Decimal = PRICING_BELOW_BAND_WARN
PRICING_ABOVE_BAND_MAX_WARNING_PCT: Decimal = PRICING_ABOVE_BAND_WARN
PRICING_MARGIN_FAILED_THRESHOLD: Decimal = PRICING_FAIL_MARGIN

# 5. Financial Unit Economics Thresholds
# Default break-even threshold: 2,500 units for an early-stage direct-to-consumer brand.
# Volumes beyond 2,500 units indicate elevated working capital and execution risk before profitability.
FINANCIAL_BREAK_EVEN_WARN_UNITS: int = 2500
FINANCIAL_BREAK_EVEN_WARNING_THRESHOLD: int = FINANCIAL_BREAK_EVEN_WARN_UNITS
break_even_warn_units: int = FINANCIAL_BREAK_EVEN_WARN_UNITS

# 6. Marketing Feasibility Thresholds
MARKETING_CAC_RATIO_WARN: Decimal = Decimal("0.60")
MARKETING_CAC_RATIO_FAIL: Decimal = Decimal("1.00")
cac_ratio_warn: Decimal = MARKETING_CAC_RATIO_WARN
cac_ratio_fail: Decimal = MARKETING_CAC_RATIO_FAIL

# Aliases
MARKETING_CAC_RATIO_WARNING_THRESHOLD: Decimal = MARKETING_CAC_RATIO_WARN
MARKETING_CAC_RATIO_FAILED_THRESHOLD: Decimal = MARKETING_CAC_RATIO_FAIL

# 7. Stage Weights & Critical Stages
STAGE_WEIGHTS: Dict[str, float] = {
    "customer": 0.15,
    "competitor": 0.15,
    "product_packaging": 0.15,
    "pricing": 0.20,
    "financial": 0.20,
    "marketing": 0.15,
}

STAGE_WEIGHTS_DECIMAL: Dict[str, Decimal] = {
    "customer": Decimal("0.15"),
    "competitor": Decimal("0.15"),
    "product_packaging": Decimal("0.15"),
    "pricing": Decimal("0.20"),
    "financial": Decimal("0.20"),
    "marketing": Decimal("0.15"),
}

DEFAULT_STAGE_WEIGHT_DECIMAL: Decimal = Decimal("0.15")

CRITICAL_STAGES: Set[str] = {"pricing", "financial"}

# Dependency Map for Validation Stages
# pricing depends on competitor (competitor price band)
# marketing depends on financial (contribution per unit)
STAGE_DEPENDENCIES: Dict[str, List[str]] = {
    "pricing": ["competitor"],
    "marketing": ["financial"],
}

DOWNSTREAM_DEPENDENCIES: Dict[str, List[str]] = {
    "competitor": ["pricing"],
    "financial": ["marketing"],
}

# Readiness Labels (Exact Strings)
READINESS_LABEL_READY: str = "READY"
READINESS_LABEL_READY_WITH_WARNINGS: str = "READY_WITH_WARNINGS"
READINESS_LABEL_NOT_READY: str = "NOT_READY"
READINESS_LABEL_INSUFFICIENT_EVIDENCE: str = "INSUFFICIENT_EVIDENCE"

# Readiness Score Cutoffs
READINESS_READY_MIN_SCORE: Decimal = Decimal("70.00")
READINESS_WARNING_MIN_SCORE: Decimal = Decimal("50.00")
READINESS_SCORE_CUTOFF_READY: Decimal = Decimal("70.00")

# Legacy thresholds (for backwards compatibility with compute_readiness)
READINESS_GO_THRESHOLD: float = 80.0
READINESS_CONDITIONS_THRESHOLD: float = 60.0

# 8. Deterministic Stage Scoring Configuration
# Deductions:
# - Warning findings subtract 25.00 points (1 warning drops a 100 base score to 75.00)
# - Critical findings subtract 30.00 points
# - FAILED stages are strictly capped at or below 40.00 points
SCORE_START: Decimal = Decimal("100.00")
WARNING_DEDUCTION: Decimal = Decimal("25.00")
CRITICAL_DEDUCTION: Decimal = Decimal("30.00")
FAILED_SCORE_CAP: Decimal = Decimal("40.00")
SCORE_MIN: Decimal = Decimal("0.00")


def score_from(status: Status, findings: List[Finding]) -> Optional[Decimal]:
    """
    Computes a deterministic score for a stage:
    - INSUFFICIENT_EVIDENCE or NOT_RUN -> None (null)
    - Starts at 100, subtracts fixed amounts per warning and critical finding
    - If status is FAILED, capped at or below 40.00
    """
    if status in (Status.INSUFFICIENT_EVIDENCE, Status.NOT_RUN):
        return None

    score = SCORE_START
    for f in findings:
        if f.severity == "warning":
            score -= WARNING_DEDUCTION
        elif f.severity == "critical":
            score -= CRITICAL_DEDUCTION

    if status == Status.FAILED:
        score = min(score, FAILED_SCORE_CAP)

    score = max(score, SCORE_MIN)
    return score.quantize(Decimal("0.01"))


# 9. Recommendation Engine Configuration
DECIMAL_ZERO: Decimal = Decimal("0")
DECIMAL_ONE: Decimal = Decimal("1")
DECIMAL_TWO_DP: Decimal = Decimal("0.01")
DECIMAL_FOUR_DP: Decimal = Decimal("0.0001")
DECIMAL_ONE_HUNDRED: Decimal = Decimal("100")

RECOMMENDATION_PRIORITIES: List[str] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
RECOMMENDATION_ACTION_TYPES: List[str] = [
    "PROVIDE_INPUT",
    "ADJUST_PRICE",
    "REDUCE_COST",
    "REDUCE_PACKAGING_COST",
    "GATHER_EVIDENCE",
    "IMPROVE_DIFFERENTIATION",
    "REVISE_CHANNEL_MIX",
    "REVIEW_ASSUMPTION",
]

RECOMMENDATION_RANK_FAILED_CRITICAL: int = 0
RECOMMENDATION_RANK_FAILED_NON_CRITICAL: int = 1
RECOMMENDATION_RANK_WARNING: int = 2
RECOMMENDATION_RANK_INSUFFICIENT_INPUT: int = 3
RECOMMENDATION_RANK_INFO: int = 4

# 10. What-If Simulation Configuration
ALLOWED_SIMULATION_OVERRIDE_FIELDS: Set[str] = {
    "selling_price",
    "cogs_per_unit",
    "unit_cogs",
    "packaging_cost",
    "shipping_cost_per_unit",
    "other_variable_cost_per_unit",
    "payment_fee_fraction",
    "payment_fee_fixed",
    "platform_fee_fraction",
    "fixed_costs_total",
    "expected_cac",
    "target_margin_fraction",
    "monthly_budget",
    "expected_conversion_rate_fraction",
}

