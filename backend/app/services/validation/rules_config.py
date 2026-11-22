"""Centralized business rules and thresholds for LaunchTwin AI validation.

Every threshold, score penalty, cap, weight, and cutoff in the FROZEN RULES
lives exclusively in this module. No business-number literals may appear elsewhere.
"""

from decimal import Decimal
from typing import Optional

# --- 1. Stage Order & Weights ---
STAGE_ORDER: tuple[str, ...] = (
    "customer",
    "competitor",
    "product_packaging",
    "pricing",
    "financial",
    "marketing",
)

CRITICAL_STAGES: frozenset[str] = frozenset({"pricing", "financial"})

STAGE_WEIGHTS: dict[str, Decimal] = {
    "customer": Decimal("0.15"),
    "competitor": Decimal("0.15"),
    "product_packaging": Decimal("0.10"),
    "pricing": Decimal("0.20"),
    "financial": Decimal("0.25"),
    "marketing": Decimal("0.15"),
}

# --- 2. Customer Validation Thresholds ---
CUSTOMER_MIN_INTERVIEWS: int = 5
"""Fewer than 5 customer interviews yields INSUFFICIENT_EVIDENCE."""

CUSTOMER_STRONG_INTERVIEWS: int = 10
"""5 to 9 interviews yields WARNING; 10 or more yields PASSED."""

# --- 3. Competitor Validation Thresholds ---
COMPETITOR_MIN_COUNT: int = 2
"""At least 2 competitors required, else INSUFFICIENT_EVIDENCE."""

COMPETITOR_MIN_EVIDENCE_PER_COMPETITOR: int = 1
"""Each competitor must have at least 1 verified evidence item."""

TRUSTED_EVIDENCE_SOURCE_TYPES: frozenset[str] = frozenset(
    {"website", "review", "pricing_page", "social", "manual", "ai", "ingest"}
)
"""Evidence source types permitted for real founder validation."""

DEMO_EVIDENCE_SOURCE_TYPES: frozenset[str] = frozenset({"sample_seed", "mock"})
"""Evidence source types reserved strictly for seed demo data and mock fallbacks."""

# --- 4. Packaging Validation Thresholds ---
PACKAGING_WARN_FRACTION: Decimal = Decimal("0.15")
"""packaging_cost / selling_price > 0.15 yields WARNING."""

PACKAGING_FAIL_FRACTION: Decimal = Decimal("0.25")
"""packaging_cost / selling_price > 0.25 yields FAILED (strict)."""

# --- 5. Pricing Validation Thresholds ---
PRICING_BELOW_BAND_WARN: Decimal = Decimal("0.20")
"""Price > 20% below competitor minimum yields WARNING."""

PRICING_ABOVE_BAND_WARN: Decimal = Decimal("0.15")
"""Price > 15% above competitor maximum yields WARNING."""

PRICING_FAIL_MARGIN: Decimal = Decimal("0.15")
"""Contribution margin < 0.15 yields FAILED."""

PRICING_TARGET_MARGIN_DEFAULT: Decimal = Decimal("0.40")
"""Default target margin fraction when not specified; margin < target yields WARNING."""

# --- 6. Financial Validation Thresholds ---
FINANCIAL_BREAK_EVEN_WARN_UNITS: int = 2500
"""Break-even sales volume > 2500 units yields WARNING."""

# --- 7. Marketing Validation Thresholds ---
MARKETING_CAC_RATIO_WARN: Decimal = Decimal("0.60")
"""expected_cac / contribution_per_unit > 0.60 yields WARNING."""

MARKETING_CAC_RATIO_FAIL: Decimal = Decimal("1.00")
"""expected_cac / contribution_per_unit > 1.00 yields FAILED (strict)."""

# --- 8. Deterministic Scoring Deductions & Caps ---
BASE_SCORE: Decimal = Decimal("100.00")
"""Starting base score for any evaluated stage."""

WARNING_DEDUCTION: Decimal = Decimal("25.00")
"""Deduction per warning finding."""

CRITICAL_DEDUCTION: Decimal = Decimal("30.00")
"""Deduction per critical finding."""

FAILED_CAP: Decimal = Decimal("40.00")
"""Upper score ceiling for any FAILED stage."""

MIN_SCORE: Decimal = Decimal("0.00")
"""Lower score floor (scores cannot be negative)."""

# --- 9. Overall Readiness Verdict Precedence & Score Cutoffs ---
READINESS_LABEL_READY: str = "READY"
READINESS_LABEL_READY_WITH_WARNINGS: str = "READY_WITH_WARNINGS"
READINESS_LABEL_NOT_READY: str = "NOT_READY"
READINESS_LABEL_INSUFFICIENT_EVIDENCE: str = "INSUFFICIENT_EVIDENCE"

READINESS_LABELS: tuple[str, ...] = (
    READINESS_LABEL_READY,
    READINESS_LABEL_READY_WITH_WARNINGS,
    READINESS_LABEL_NOT_READY,
    READINESS_LABEL_INSUFFICIENT_EVIDENCE,
)

READINESS_SCORE_CUTOFF_READY: Decimal = Decimal("70.00")
"""Overall weighted score >= 70.00 required for READY verdict."""

READINESS_WARNING_MIN_SCORE: Decimal = Decimal("50.00")
"""Overall weighted score < 50.00 yields NOT_READY."""

# --- 10. Default Financial Constants ---
DEFAULT_PAYMENT_FEE_FRACTION: Decimal = Decimal("0.02")
DEFAULT_PAYMENT_FEE_FIXED: Decimal = Decimal("0.00")
DEFAULT_PLATFORM_FEE_FRACTION: Decimal = Decimal("0.00")
DEFAULT_OTHER_VARIABLE_COST: Decimal = Decimal("0.00")
DEFAULT_CURRENCY: str = "INR"

# Currency symbols and abbreviations to standard ISO code mappings
CURRENCY_SYMBOL_MAP: dict[str, str] = {
    "₹": "INR",
    "RS": "INR",
    "RS.": "INR",
    "INR": "INR",
    "RUPEES": "INR",
    "$": "USD",
    "USD": "USD",
    "US$": "USD",
    "€": "EUR",
    "EUR": "EUR",
    "£": "GBP",
    "GBP": "GBP",
}


def normalize_currency(val: Optional[str]) -> Optional[str]:
    """Normalizes currency symbols, spellings, and abbreviations to standard ISO codes.

    Returns the standard uppercase ISO code (e.g. 'INR', 'USD', 'EUR', 'GBP')
    or None if the currency is unspecified or unknown.
    """
    if not val:
        return None
    cleaned = str(val).strip().upper()
    return CURRENCY_SYMBOL_MAP.get(cleaned)

# --- 11. Recommendation Priorities & Mapping ---
RECOMMENDATION_PRIORITY_CRITICAL: str = "CRITICAL"
RECOMMENDATION_PRIORITY_HIGH: str = "HIGH"
RECOMMENDATION_PRIORITY_MEDIUM: str = "MEDIUM"
RECOMMENDATION_PRIORITY_LOW: str = "LOW"

RECOMMENDATION_PRIORITIES: tuple[str, ...] = (
    RECOMMENDATION_PRIORITY_CRITICAL,
    RECOMMENDATION_PRIORITY_HIGH,
    RECOMMENDATION_PRIORITY_MEDIUM,
    RECOMMENDATION_PRIORITY_LOW,
)

RECOMMENDATION_PRIORITY_RANK: dict[str, int] = {
    RECOMMENDATION_PRIORITY_CRITICAL: 0,
    RECOMMENDATION_PRIORITY_HIGH: 1,
    RECOMMENDATION_PRIORITY_MEDIUM: 2,
    RECOMMENDATION_PRIORITY_LOW: 3,
}


def get_recommendation_priority(
    stage: str,
    stage_status: str,
    finding_severity: str,
    finding_code: str,
) -> str:
    """Computes recommendation priority according to FROZEN RULES:

    - FAILED finding on a critical stage -> CRITICAL
    - Other FAILED stage, or MISSING_INPUT on a critical stage -> HIGH
    - WARNING -> MEDIUM
    - Info or other missing inputs -> LOW
    """
    is_critical_stage = stage in CRITICAL_STAGES
    is_failed = stage_status == "FAILED" or finding_severity == "critical"
    is_missing_input = finding_code == "MISSING_INPUT"

    if is_critical_stage and is_failed and not is_missing_input:
        return RECOMMENDATION_PRIORITY_CRITICAL
    if (not is_critical_stage and is_failed and not is_missing_input) or (is_critical_stage and is_missing_input):
        return RECOMMENDATION_PRIORITY_HIGH
    if finding_severity == "warning" or stage_status == "WARNING":
        return RECOMMENDATION_PRIORITY_MEDIUM
    return RECOMMENDATION_PRIORITY_LOW


# --- 12. Influencer Matching & Analytics Constants ---
INFLUENCER_WEIGHT_CATEGORY: Decimal = Decimal("0.35")
INFLUENCER_WEIGHT_ECONOMICS: Decimal = Decimal("0.25")
INFLUENCER_WEIGHT_ENGAGEMENT: Decimal = Decimal("0.20")
INFLUENCER_WEIGHT_AUDIENCE: Decimal = Decimal("0.20")

# Illustrative assumptions, not measured empirical data:
INFLUENCER_CTR_FACTOR: Decimal = Decimal("0.05")
"""Assumed 5% click rate from engagements (illustrative assumption, not measured empirical data)."""

INFLUENCER_CONVERSION_RATE: Decimal = Decimal("0.02")
"""Assumed 2% conversion rate from clicks (illustrative assumption, not measured empirical data)."""
INFLUENCER_VIABLE_CAC_MULTIPLIER: Decimal = Decimal("1.25")
INFLUENCER_HIGH_CAC_MULTIPLIER: Decimal = Decimal("1.75")

INFLUENCER_CATEGORY_FIT_EXACT: int = 85
INFLUENCER_CATEGORY_FIT_PARTIAL: int = 70
INFLUENCER_CATEGORY_FIT_OVERLAP: int = 65
INFLUENCER_CATEGORY_FIT_DEFAULT: int = 40

INFLUENCER_ENGAGEMENT_EXCELLENT: Decimal = Decimal("6.0")
INFLUENCER_ENGAGEMENT_HIGH: Decimal = Decimal("4.0")
INFLUENCER_ENGAGEMENT_MEDIUM: Decimal = Decimal("2.5")
INFLUENCER_ENGAGEMENT_LOW: Decimal = Decimal("1.5")

INFLUENCER_FIT_SCORE_MAX: int = 100
INFLUENCER_FIT_SCORE_HIGH: int = 85
INFLUENCER_FIT_SCORE_MEDIUM: int = 70
INFLUENCER_FIT_SCORE_FAIR: int = 50
INFLUENCER_FIT_SCORE_LOW: int = 30

INFLUENCER_AUDIENCE_FIT_BASE: int = 70
INFLUENCER_ECONOMICS_EXCELLENT: int = 95
INFLUENCER_ECONOMICS_VIABLE: int = 75
INFLUENCER_ECONOMICS_HIGH_RISK: int = 50
INFLUENCER_ECONOMICS_POOR: int = 30

# Maximum allowed magnitude for money and numeric inputs
MAX_NUMERIC_MAGNITUDE: Decimal = Decimal("1000000000")




