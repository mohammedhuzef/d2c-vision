"""Unit tests for recommendation rules, generator, and prioritisation (generator.py & rules.py).

Pure unit tests: no DB, strict Decimal checks, reachability, boundary cases,
Vector A and Vector B hand-calculated values, determinism, and completeness.
"""

from decimal import Decimal
import uuid
import pytest

from backend.app.schemas.assumptions import (
    Assumptions,
    CostsAssumptions,
    CustomerAssumptions,
    MarketingAssumptions,
    PackagingAssumptions,
    PricingAssumptions,
    ProductAssumptions,
)
from backend.app.services.validation.base import Finding, StageResult, Status, STAGE_ORDER
from backend.app.services.validation import rules_config
from backend.app.services.validation.recommendations.models import ActionType, Priority, Recommendation
from backend.app.services.validation.recommendations.generator import generate_recommendations
from backend.app.services.validation.recommendations.rules import RECOMMENDATION_RULE_TABLE


def test_passed_stages_produce_no_recommendations():
    """PASSED stages produce no recommendations."""
    stage_results = [
        StageResult(stage="customer", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="competitor", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="product_packaging", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="pricing", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="financial", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="marketing", status=Status.PASSED, score=Decimal("100.00")),
    ]
    recs = generate_recommendations(stage_results, Assumptions())
    assert recs == []


def test_every_action_type_reachable():
    """Every ActionType enum value must be reachable by at least one recommendation rule."""
    all_action_types = set(ActionType)
    reached_action_types = set()

    ev_id = uuid.uuid4()
    assumptions = Assumptions(
        pricing=PricingAssumptions(selling_price=Decimal("100.00"), target_margin_fraction=Decimal("0.40")),
        packaging=PackagingAssumptions(packaging_cost=Decimal("30.00")),
        costs=CostsAssumptions(
            cogs_per_unit=Decimal("70.00"),
            packaging_cost=Decimal("30.00"),
            shipping_cost_per_unit=Decimal("10.00"),
            payment_fee_fraction=Decimal("0.02"),
        ),
        marketing=MarketingAssumptions(expected_cac=Decimal("50.00")),
        customer=CustomerAssumptions(customer_interviews_count=2),
    )

    stage_results = [
        # PROVIDE_INPUT
        StageResult(
            stage="customer",
            status=Status.INSUFFICIENT_EVIDENCE,
            findings=[Finding(code="MISSING_INPUT", severity="critical", message="Missing field", field="customer.target_customer")],
        ),
        # GATHER_EVIDENCE
        StageResult(
            stage="customer",
            status=Status.INSUFFICIENT_EVIDENCE,
            findings=[Finding(code="CUSTOMER_INTERVIEWS_INSUFFICIENT", severity="critical", message="Too few interviews")],
        ),
        # IMPROVE_DIFFERENTIATION
        StageResult(
            stage="competitor",
            status=Status.WARNING,
            findings=[Finding(code="UNDIFFERENTIATED_PRODUCT", severity="warning", message="No differentiation")],
        ),
        # REDUCE_PACKAGING_COST
        StageResult(
            stage="product_packaging",
            status=Status.WARNING,
            findings=[Finding(code="PACKAGING_COST_ELEVATED", severity="warning", message="High packaging")],
        ),
        # ADJUST_PRICE & REDUCE_COST
        StageResult(
            stage="pricing",
            status=Status.FAILED,
            findings=[Finding(code="PRICING_MARGIN_UNVIABLE", severity="critical", message="Unviable margin")],
        ),
        # REVISE_CHANNEL_MIX
        StageResult(
            stage="marketing",
            status=Status.FAILED,
            metrics={"contribution_per_unit": "10.00"},
            findings=[Finding(code="MARKETING_CAC_EXCEEDS_CONTRIBUTION", severity="critical", message="High CAC")],
        ),
        # REVIEW_ASSUMPTION
        StageResult(
            stage="customer",
            status=Status.WARNING,
            findings=[Finding(code="CUSTOMER_WTP_WEAK", severity="warning", message="Weak WTP signal")],
        ),
    ]

    recs = generate_recommendations(stage_results, assumptions)
    for r in recs:
        reached_action_types.add(r.action_type)

    missing = all_action_types - reached_action_types
    assert not missing, f"Unreachable ActionTypes: {missing}"


def test_boundary_margin_at_target_vs_just_under():
    """
    Boundary cases:
    - Margin exactly at target produces nothing.
    - Margin just under produces ADJUST_PRICE and REDUCE_COST with exact Decimal values.
    """
    # Exact target margin (40%): price 100.00, cogs 28.00, pkg 20.00, ship 10.00, fee 2% (2.00)
    # variable cost = 60.00, contribution = 40.00, margin = 40.00% -> PASSED
    pass_results = [
        StageResult(stage="pricing", status=Status.PASSED, score=Decimal("100.00")),
    ]
    assumptions_pass = Assumptions(
        pricing=PricingAssumptions(selling_price=Decimal("100.00"), target_margin_fraction=Decimal("0.40")),
        packaging=PackagingAssumptions(packaging_cost=Decimal("20.00")),
        costs=CostsAssumptions(
            cogs_per_unit=Decimal("28.00"),
            packaging_cost=Decimal("20.00"),
            shipping_cost_per_unit=Decimal("10.00"),
            payment_fee_fraction=Decimal("0.02"),
        ),
    )
    assert generate_recommendations(pass_results, assumptions_pass) == []

    # Just under target: cogs = 28.01 -> margin = 39.99% < 40.00%
    fail_results = [
        StageResult(
            stage="pricing",
            status=Status.WARNING,
            findings=[
                Finding(
                    code="PRICING_MARGIN_BELOW_TARGET",
                    severity="warning",
                    message="Contribution margin (39.9%) is below target margin of 40%.",
                    field="pricing.selling_price",
                )
            ],
        )
    ]
    assumptions_just_under = Assumptions(
        pricing=PricingAssumptions(selling_price=Decimal("100.00"), target_margin_fraction=Decimal("0.40")),
        packaging=PackagingAssumptions(packaging_cost=Decimal("20.00")),
        costs=CostsAssumptions(
            cogs_per_unit=Decimal("28.01"),
            packaging_cost=Decimal("20.00"),
            shipping_cost_per_unit=Decimal("10.00"),
            payment_fee_fraction=Decimal("0.02"),
        ),
    )

    recs = generate_recommendations(fail_results, assumptions_just_under)
    assert len(recs) == 2

    adjust_price_rec = next(r for r in recs if r.action_type == ActionType.ADJUST_PRICE)
    reduce_cost_rec = next(r for r in recs if r.action_type == ActionType.REDUCE_COST)

    # Base cost = 28.01 + 20 + 10 = 58.01
    # Price needed = 58.01 / (1 - 0.02 - 0.40) = 58.01 / 0.58 = 100.017... -> 100.02
    assert adjust_price_rec.suggested_value == "100.02"
    # Max cogs = 100 * (1 - 0.40 - 0.02) - 20 - 10 = 58 - 30 = 28.00
    assert reduce_cost_rec.suggested_value == "28.00"

    # Shared alternative group
    assert "alternative_group_id" in adjust_price_rec.impact
    assert adjust_price_rec.impact["alternative_group_id"] == reduce_cost_rec.impact["alternative_group_id"]


def test_vector_a_pipeline_recommendations():
    """Vector A (healthy product) produces zero recommendations."""
    vector_a_results = [
        StageResult(stage="customer", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="competitor", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="product_packaging", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="pricing", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="financial", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="marketing", status=Status.PASSED, score=Decimal("100.00")),
    ]
    recs = generate_recommendations(vector_a_results, Assumptions())
    assert recs == []


def test_vector_b_hand_calculated_recommendations():
    """
    Vector B (struggling product) test with hand-calculated expected values:
    - Packaging: ratio 20/100 = 0.20 -> ceiling 100 * 0.15 = $15.00
    - Pricing: base 90, denominator 0.58 -> price needed $155.17, max cogs $28.00
    - Marketing: contribution $8.00, ratio 30/8 = 3.75 -> ceiling $8.00 * 0.60 = $4.80
    - Customer: interviews 3 conducted -> suggested 5
    - Competitor: 1 competitor -> suggested 2, undifferentiated
    """
    assumptions_b = Assumptions(
        pricing=PricingAssumptions(selling_price=Decimal("100.00"), target_margin_fraction=Decimal("0.40")),
        packaging=PackagingAssumptions(packaging_cost=Decimal("20.00")),
        costs=CostsAssumptions(
            cogs_per_unit=Decimal("60.00"),
            packaging_cost=Decimal("20.00"),
            shipping_cost_per_unit=Decimal("10.00"),
            payment_fee_fraction=Decimal("0.02"),
            fixed_costs_total=Decimal("100000.00"),
        ),
        marketing=MarketingAssumptions(channels=["Meta Ads"], expected_cac=Decimal("30.00")),
        customer=CustomerAssumptions(customer_interviews_count=3),
    )

    vector_b_results = [
        StageResult(
            stage="customer",
            status=Status.INSUFFICIENT_EVIDENCE,
            findings=[
                Finding(
                    code="CUSTOMER_INTERVIEWS_INSUFFICIENT",
                    severity="critical",
                    message="Only 3 customer interviews conducted.",
                    field="customer.customer_interviews_count",
                )
            ],
        ),
        StageResult(
            stage="competitor",
            status=Status.INSUFFICIENT_EVIDENCE,
            findings=[
                Finding(code="COMPETITOR_COUNT_DEFICIENT", severity="critical", message="Found 1 competitors."),
                Finding(code="UNDIFFERENTIATED_PRODUCT", severity="warning", message="Product differentiation is empty."),
            ],
        ),
        StageResult(
            stage="product_packaging",
            status=Status.WARNING,
            metrics={"packaging_cost": "20.00", "packaging_cost_fraction": 0.2000},
            findings=[
                Finding(
                    code="PACKAGING_COST_ELEVATED",
                    severity="warning",
                    message="Packaging cost is 20.0% of retail price.",
                    field="packaging.packaging_cost",
                )
            ],
        ),
        StageResult(
            stage="pricing",
            status=Status.FAILED,
            metrics={"selling_price": "100.00", "target_margin_fraction": 0.4000, "realized_margin_fraction": 0.0800},
            findings=[
                Finding(
                    code="PRICING_MARGIN_UNVIABLE",
                    severity="critical",
                    message="Contribution margin (8.0%) is below viability threshold of 15%.",
                    field="pricing.selling_price",
                )
            ],
        ),
        StageResult(
            stage="financial",
            status=Status.WARNING,
            metrics={"break_even_units": 12500, "contribution_per_unit": "8.00"},
            findings=[
                Finding(
                    code="FINANCIAL_HIGH_BREAK_EVEN_VOLUME",
                    severity="warning",
                    message="High break-even volume required: 12500 units.",
                    field="costs.fixed_costs_total",
                )
            ],
        ),
        StageResult(
            stage="marketing",
            status=Status.FAILED,
            metrics={"expected_cac": "30.00", "contribution_per_unit": "8.00", "cac_to_contribution_ratio": 3.7500},
            findings=[
                Finding(
                    code="MARKETING_CAC_EXCEEDS_CONTRIBUTION",
                    severity="critical",
                    message="CAC ($30.00) exceeds unit contribution ($8.00) with ratio 3.7500.",
                    field="marketing.expected_cac",
                )
            ],
        ),
    ]

    recs = generate_recommendations(vector_b_results, assumptions_b)

    # 1. Packaging cost reduction hand-calculated value: $15.00
    pkg_rec = next(r for r in recs if r.action_type == ActionType.REDUCE_PACKAGING_COST)
    assert pkg_rec.current_value == "20.00"
    assert pkg_rec.suggested_value == "15.00"

    # 2. Margin adjustment hand-calculated values: Price $155.17 or COGS $28.00
    price_rec = next(r for r in recs if r.action_type == ActionType.ADJUST_PRICE)
    assert price_rec.current_value == "100.00"
    assert price_rec.suggested_value == "155.17"

    cost_rec = next(r for r in recs if r.action_type == ActionType.REDUCE_COST and r.target_field == "costs.cogs_per_unit")
    assert cost_rec.current_value == "60.00"
    assert cost_rec.suggested_value == "28.00"

    # 3. Marketing CAC reduction hand-calculated value: $4.80
    mkt_rec = next(r for r in recs if r.action_type == ActionType.REVISE_CHANNEL_MIX)
    assert mkt_rec.current_value == "30.00"
    assert mkt_rec.suggested_value == "4.80"

    # 4. Interviews hand-calculated target: 5
    int_rec = next(r for r in recs if r.code == "RECOMMEND_CONDUCT_INTERVIEWS")
    assert int_rec.current_value == "3"
    assert int_rec.suggested_value == "5"

    # 5. Competitors hand-calculated target: 2
    comp_rec = next(r for r in recs if r.code == "RECOMMEND_ADD_COMPETITORS")
    assert comp_rec.suggested_value == "2"

    # 6. Differentiation recommendation
    diff_rec = next(r for r in recs if r.action_type == ActionType.IMPROVE_DIFFERENTIATION)
    assert diff_rec.target_field == "product.differentiation_vs_competitors"


def test_missing_input_produces_provide_input_without_invented_numbers():
    """Missing inputs must produce PROVIDE_INPUT recommendations with no guessed figures."""
    finding = Finding(code="MISSING_INPUT", severity="critical", message="cogs_per_unit is missing.", field="costs.cogs_per_unit")
    sr = StageResult(stage="pricing", status=Status.INSUFFICIENT_EVIDENCE, findings=[finding])
    recs = generate_recommendations([sr], Assumptions())

    assert len(recs) == 1
    r = recs[0]
    assert r.action_type == ActionType.PROVIDE_INPUT
    assert r.target_field == "costs.cogs_per_unit"
    assert r.current_value is None
    assert r.suggested_value is None


def test_deterministic_ordering_across_repeated_calls():
    """Recommendations output order must be stable and deterministic across repeated calls."""
    sr1 = StageResult(
        stage="pricing",
        status=Status.FAILED,
        findings=[Finding(code="PRICING_MARGIN_UNVIABLE", severity="critical", message="Unviable")],
    )
    sr2 = StageResult(
        stage="customer",
        status=Status.INSUFFICIENT_EVIDENCE,
        findings=[Finding(code="CUSTOMER_INTERVIEWS_INSUFFICIENT", severity="critical", message="Interviews")],
    )
    sr3 = StageResult(
        stage="product_packaging",
        status=Status.WARNING,
        findings=[Finding(code="PACKAGING_COST_ELEVATED", severity="warning", message="Packaging")],
    )

    assumptions = Assumptions(
        pricing=PricingAssumptions(selling_price=Decimal("100.00")),
        costs=CostsAssumptions(cogs_per_unit=Decimal("70.00"), packaging_cost=Decimal("20.00"), shipping_cost_per_unit=Decimal("5.00")),
        packaging=PackagingAssumptions(packaging_cost=Decimal("20.00")),
        customer=CustomerAssumptions(customer_interviews_count=2),
    )

    baseline = generate_recommendations([sr1, sr2, sr3], assumptions)
    baseline_dicts = [r.to_dict() for r in baseline]

    for _ in range(50):
        # Call with reversed order of input list to verify order independence
        subsequent = generate_recommendations([sr3, sr1, sr2], assumptions)
        subsequent_dicts = [r.to_dict() for r in subsequent]
        assert baseline_dicts == subsequent_dicts


def test_evidence_ids_carried_through():
    """Evidence IDs present on findings are preserved in the recommendation."""
    eid1 = uuid.uuid4()
    eid2 = uuid.uuid4()
    finding = Finding(
        code="COMPETITOR_COUNT_DEFICIENT",
        severity="critical",
        message="Deficient count",
        evidence_ids=[eid1, eid2],
    )
    sr = StageResult(stage="competitor", status=Status.INSUFFICIENT_EVIDENCE, findings=[finding])
    recs = generate_recommendations([sr], Assumptions())
    assert len(recs) == 1
    assert recs[0].evidence_ids == [eid1, eid2]
    d = recs[0].to_dict()
    assert d["evidence_ids"] == [str(eid1), str(eid2)]


def test_completeness_every_emitted_code_has_mapped_rule():
    """
    Completeness test: Asserts that EVERY finding code emitted across all 6 validation stages,
    finance issues, and orchestrator has an explicit mapped rule in RECOMMENDATION_RULE_TABLE.
    """
    known_codes = {
        # Missing & Upstream
        "MISSING_INPUT",
        "MISSING_UPSTREAM",
        "MISSING_UPSTREAM:financial.contribution_per_unit",

        # Customer
        "CUSTOMER_INTERVIEWS_INSUFFICIENT",
        "CUSTOMER_INTERVIEWS_LOW",
        "CUSTOMER_WTP_WEAK",

        # Competitor
        "COMPETITOR_COUNT_DEFICIENT",
        "COMPETITOR_EVIDENCE_DEFICIENT",
        "UNDIFFERENTIATED_PRODUCT",
        "NO_PRICE_DATA",

        # Product Packaging
        "PACKAGING_COST_EXCESSIVE",
        "PACKAGING_COST_ELEVATED",

        # Pricing
        "PRICE_BELOW_MARKET_BAND",
        "PRICE_ABOVE_MARKET_BAND",
        "NO_COMPETITOR_BAND",
        "PRICING_MARGIN_UNVIABLE",
        "PRICING_MARGIN_BELOW_TARGET",

        # Financial & Issues
        "FINANCIAL_UNIT_ECONOMICS_NEGATIVE",
        "NEGATIVE_CONTRIBUTION",
        "ZERO_CONTRIBUTION",
        "FINANCIAL_MARGIN_BELOW_TARGET",
        "FINANCIAL_MARGIN_UNVIABLE",
        "FINANCIAL_HIGH_BREAK_EVEN_VOLUME",
        "FINANCIAL_BREAK_EVEN_EXCESSIVE",
        "FINANCIAL_BREAK_EVEN_ELEVATED",
        "NEGATIVE_COST",
        "NON_POSITIVE_PRICE",
        "INVALID_FRACTION",
        "INVALID_NUMBER",

        # Marketing
        "NEGATIVE_UNIT_ECONOMICS",
        "MARKETING_CAC_EXCEEDS_CONTRIBUTION",
        "MARKETING_CAC_RATIO_HIGH",

        # Orchestrator
        "STAGE_ERROR",
    }

    for code in known_codes:
        assert code in RECOMMENDATION_RULE_TABLE, f"Finding code '{code}' has no mapped rule in RECOMMENDATION_RULE_TABLE!"
