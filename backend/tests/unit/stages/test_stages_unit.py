from decimal import Decimal
from pathlib import Path
import re
import uuid
import pytest

from backend.app.schemas.assumptions import (
    Assumptions,
    CustomerAssumptions,
    ProductAssumptions,
    PackagingAssumptions,
    PricingAssumptions,
    CostsAssumptions,
    MarketingAssumptions,
)
from backend.app.services.validation.base import (
    Finding,
    StageContext,
    StageResult,
    Status,
    STAGE_ORDER,
)
from backend.app.services.validation import STAGES, get_stage, rules_config
from backend.app.services.validation.stages.customer import CustomerStage
from backend.app.services.validation.stages.competitor import CompetitorStage
from backend.app.services.validation.stages.product_packaging import ProductPackagingStage
from backend.app.services.validation.stages.pricing import PricingStage
from backend.app.services.validation.stages.financial import FinancialStage
from backend.app.services.validation.stages.marketing import MarketingStage


class MockEvidence:
    def __init__(self, eid, competitor_id):
        self.id = eid
        self.competitor_id = competitor_id


class MockAnalysis:
    def __init__(self, competitor_id, price_observed):
        self.competitor_id = competitor_id
        self.price_observed = price_observed


class MockCompetitor:
    def __init__(self, cid, name):
        self.id = cid
        self.name = name


# ============================================================================
# 1. Individual Stage State Tests (PASSED, WARNING, FAILED, INSUFFICIENT)
# ============================================================================

def test_customer_stage_all_states():
    stage = CustomerStage()

    # INSUFFICIENT_EVIDENCE: completely empty
    res_empty = stage.run(StageContext(assumptions=Assumptions()))
    assert res_empty.status == Status.INSUFFICIENT_EVIDENCE
    assert res_empty.score is None
    codes = [f.code for f in res_empty.findings]
    assert any("customer.target_customer" in c for c in codes)
    assert any("customer.problem_statement" in c for c in codes)
    assert any("customer.customer_interviews_count" in c for c in codes)

    # INSUFFICIENT_EVIDENCE: interviews < 5 (e.g. 3)
    res_few = stage.run(
        StageContext(
            assumptions=Assumptions(
                customer=CustomerAssumptions(
                    target_customer="Athletes",
                    problem_statement="Hydration tracking",
                    customer_interviews_count=3,
                )
            )
        )
    )
    assert res_few.status == Status.INSUFFICIENT_EVIDENCE
    assert res_few.score is None

    # WARNING: interviews between 5 and 9 (e.g. 7)
    res_warn = stage.run(
        StageContext(
            assumptions=Assumptions(
                customer=CustomerAssumptions(
                    target_customer="Athletes",
                    problem_statement="Hydration tracking",
                    customer_interviews_count=7,
                )
            )
        )
    )
    assert res_warn.status == Status.WARNING
    assert res_warn.score == Decimal("75.00")
    assert any(f.code == "CUSTOMER_INTERVIEWS_LOW" for f in res_warn.findings)

    # PASSED: interviews >= 10 (e.g. 10)
    res_pass = stage.run(
        StageContext(
            assumptions=Assumptions(
                customer=CustomerAssumptions(
                    target_customer="Athletes",
                    problem_statement="Hydration tracking",
                    customer_interviews_count=10,
                )
            )
        )
    )
    assert res_pass.status == Status.PASSED
    assert res_pass.score == Decimal("100.00")
    assert not res_pass.findings


def test_competitor_stage_all_states():
    stage = CompetitorStage()
    comp_a_id = uuid.uuid4()
    comp_b_id = uuid.uuid4()
    ev_a = MockEvidence(uuid.uuid4(), comp_a_id)
    ev_b = MockEvidence(uuid.uuid4(), comp_b_id)
    comp_a = MockCompetitor(comp_a_id, "Brand A")
    comp_b = MockCompetitor(comp_b_id, "Brand B")
    an_a = MockAnalysis(comp_a_id, Decimal("45.00"))
    an_b = MockAnalysis(comp_b_id, Decimal("55.00"))

    # INSUFFICIENT_EVIDENCE: 0 or 1 competitor
    res_insuf = stage.run(
        StageContext(
            assumptions=Assumptions(product=ProductAssumptions(differentiation_vs_competitors="Superior")),
            competitors=[comp_a],
            evidence=[ev_a],
            competitor_analyses=[an_a],
        )
    )
    assert res_insuf.status == Status.INSUFFICIENT_EVIDENCE
    assert any(f.code == "COMPETITOR_COUNT_DEFICIENT" for f in res_insuf.findings)

    # INSUFFICIENT_EVIDENCE: competitor lacking evidence
    res_no_ev = stage.run(
        StageContext(
            assumptions=Assumptions(product=ProductAssumptions(differentiation_vs_competitors="Superior")),
            competitors=[comp_a, comp_b],
            evidence=[ev_a],  # comp_b has no evidence
            competitor_analyses=[an_a, an_b],
        )
    )
    assert res_no_ev.status == Status.INSUFFICIENT_EVIDENCE
    assert any(f.code == "COMPETITOR_EVIDENCE_DEFICIENT" for f in res_no_ev.findings)

    # WARNING: undifferentiated product
    res_undiff = stage.run(
        StageContext(
            assumptions=Assumptions(product=ProductAssumptions(differentiation_vs_competitors="")),
            competitors=[comp_a, comp_b],
            evidence=[ev_a, ev_b],
            competitor_analyses=[an_a, an_b],
        )
    )
    assert res_undiff.status == Status.WARNING
    assert any(f.code == "UNDIFFERENTIATED_PRODUCT" for f in res_undiff.findings)

    # WARNING: no pricing data in analyses
    res_noprice = stage.run(
        StageContext(
            assumptions=Assumptions(product=ProductAssumptions(differentiation_vs_competitors="Superior")),
            competitors=[comp_a, comp_b],
            evidence=[ev_a, ev_b],
            competitor_analyses=[MockAnalysis(comp_a_id, None), MockAnalysis(comp_b_id, None)],
        )
    )
    assert res_noprice.status == Status.WARNING
    assert any(f.code == "NO_PRICE_DATA" for f in res_noprice.findings)
    assert res_noprice.metrics["competitor_price_median"] is None

    # PASSED: >= 2 competitors, evidence present, differentiated, prices observed
    res_pass = stage.run(
        StageContext(
            assumptions=Assumptions(product=ProductAssumptions(differentiation_vs_competitors="Superior")),
            competitors=[comp_a, comp_b],
            evidence=[ev_a, ev_b],
            competitor_analyses=[an_a, an_b],
        )
    )
    assert res_pass.status == Status.PASSED
    assert res_pass.score == Decimal("100.00")
    assert res_pass.metrics["competitor_price_min"] == "45.00"
    assert res_pass.metrics["competitor_price_max"] == "55.00"
    assert res_pass.metrics["competitor_price_median"] == "50.00"


def test_product_packaging_stage_all_states():
    stage = ProductPackagingStage()

    # INSUFFICIENT_EVIDENCE: missing inputs
    res_empty = stage.run(StageContext(assumptions=Assumptions()))
    assert res_empty.status == Status.INSUFFICIENT_EVIDENCE
    assert res_empty.score is None

    # PASSED: packaging ratio <= 0.15 (cost 15, price 100 -> ratio 0.1500)
    res_pass = stage.run(
        StageContext(
            assumptions=Assumptions(
                packaging=PackagingAssumptions(material="Kraft Paper", packaging_cost=Decimal("15.00")),
                pricing=PricingAssumptions(selling_price=Decimal("100.00")),
            )
        )
    )
    assert res_pass.status == Status.PASSED
    assert res_pass.score == Decimal("100.00")
    assert res_pass.metrics["packaging_cost_fraction"] == "0.1500"

    # WARNING: 0.15 < ratio <= 0.25 (cost 20, price 100 -> ratio 0.2000)
    res_warn = stage.run(
        StageContext(
            assumptions=Assumptions(
                packaging=PackagingAssumptions(material="Glass Bottle", packaging_cost=Decimal("20.00")),
                pricing=PricingAssumptions(selling_price=Decimal("100.00")),
            )
        )
    )
    assert res_warn.status == Status.WARNING
    assert res_warn.score == Decimal("75.00")
    assert any(f.code == "PACKAGING_COST_ELEVATED" for f in res_warn.findings)

    # FAILED: ratio > 0.25 (cost 30, price 100 -> ratio 0.3000)
    res_fail = stage.run(
        StageContext(
            assumptions=Assumptions(
                packaging=PackagingAssumptions(material="Custom Ceramic", packaging_cost=Decimal("30.00")),
                pricing=PricingAssumptions(selling_price=Decimal("100.00")),
            )
        )
    )
    assert res_fail.status == Status.FAILED
    assert res_fail.score == Decimal("40.00")
    assert any(f.code == "PACKAGING_COST_EXCESSIVE" for f in res_fail.findings)


def test_pricing_stage_all_states():
    stage = PricingStage()
    comp_upstream = StageResult(
        stage="competitor",
        status=Status.PASSED,
        metrics={"competitor_price_min": "80.00", "competitor_price_max": "120.00"},
    )

    # INSUFFICIENT_EVIDENCE: missing price
    res_noprice = stage.run(
        StageContext(
            assumptions=Assumptions(
                costs=CostsAssumptions(cogs_per_unit=Decimal("30"), packaging_cost=Decimal("5"), shipping_cost_per_unit=Decimal("5"))
            )
        )
    )
    assert res_noprice.status == Status.INSUFFICIENT_EVIDENCE

    # PASSED: price 100 in band [80, 120], cogs 30, pack 5, ship 5 (margin = (100 - 42) / 100 = 0.58 > 0.40)
    res_pass = stage.run(
        StageContext(
            assumptions=Assumptions(
                pricing=PricingAssumptions(selling_price=Decimal("100.00")),
                packaging=PackagingAssumptions(packaging_cost=Decimal("5.00")),
                costs=CostsAssumptions(cogs_per_unit=Decimal("30.00"), shipping_cost_per_unit=Decimal("5.00")),
            ),
            upstream={"competitor": comp_upstream},
        )
    )
    assert res_pass.status == Status.PASSED
    assert res_pass.score == Decimal("100.00")

    # WARNING: price below band min by > 20% (band min 80 -> threshold 64. Price 50 < 64)
    res_below = stage.run(
        StageContext(
            assumptions=Assumptions(
                pricing=PricingAssumptions(selling_price=Decimal("50.00")),
                packaging=PackagingAssumptions(packaging_cost=Decimal("2.00")),
                costs=CostsAssumptions(cogs_per_unit=Decimal("10.00"), shipping_cost_per_unit=Decimal("2.00")),
            ),
            upstream={"competitor": comp_upstream},
        )
    )
    assert res_below.status == Status.WARNING
    assert any(f.code == "PRICE_BELOW_MARKET_BAND" for f in res_below.findings)

    # WARNING: price above band max by > 15% (band max 120 -> threshold 138. Price 150 > 138)
    res_above = stage.run(
        StageContext(
            assumptions=Assumptions(
                pricing=PricingAssumptions(selling_price=Decimal("150.00")),
                packaging=PackagingAssumptions(packaging_cost=Decimal("5.00")),
                costs=CostsAssumptions(cogs_per_unit=Decimal("30.00"), shipping_cost_per_unit=Decimal("5.00")),
            ),
            upstream={"competitor": comp_upstream},
        )
    )
    assert res_above.status == Status.WARNING
    assert any(f.code == "PRICE_ABOVE_MARKET_BAND" for f in res_above.findings)

    # WARNING: margin below target 0.40 (price 100, costs = 70 -> margin ~0.28)
    res_low_margin = stage.run(
        StageContext(
            assumptions=Assumptions(
                pricing=PricingAssumptions(selling_price=Decimal("100.00"), target_margin_fraction=Decimal("0.40")),
                packaging=PackagingAssumptions(packaging_cost=Decimal("10.00")),
                costs=CostsAssumptions(cogs_per_unit=Decimal("50.00"), shipping_cost_per_unit=Decimal("10.00")),
            ),
            upstream={"competitor": comp_upstream},
        )
    )
    assert res_low_margin.status == Status.WARNING
    assert any(f.code == "PRICING_MARGIN_BELOW_TARGET" for f in res_low_margin.findings)

    # FAILED: margin below 0.15 (price 100, cogs 80, pack 5, ship 5 -> margin = (100 - 92) / 100 = 0.08 < 0.15)
    res_fail = stage.run(
        StageContext(
            assumptions=Assumptions(
                pricing=PricingAssumptions(selling_price=Decimal("100.00")),
                packaging=PackagingAssumptions(packaging_cost=Decimal("5.00")),
                costs=CostsAssumptions(cogs_per_unit=Decimal("80.00"), shipping_cost_per_unit=Decimal("5.00")),
            ),
            upstream={"competitor": comp_upstream},
        )
    )
    assert res_fail.status == Status.FAILED
    assert any(f.code == "PRICING_MARGIN_UNVIABLE" for f in res_fail.findings)


def test_financial_stage_all_states():
    stage = FinancialStage()

    # INSUFFICIENT_EVIDENCE: missing cogs
    res_insuf = stage.run(
        StageContext(
            assumptions=Assumptions(
                pricing=PricingAssumptions(selling_price=Decimal("100")),
                packaging=PackagingAssumptions(packaging_cost=Decimal("5")),
            )
        )
    )
    assert res_insuf.status == Status.INSUFFICIENT_EVIDENCE
    assert any("MISSING_INPUT:cogs_per_unit" in f.code for f in res_insuf.findings)

    # PASSED: positive contribution, margin >= target, break-even <= 2500
    res_pass = stage.run(
        StageContext(
            assumptions=Assumptions(
                pricing=PricingAssumptions(selling_price=Decimal("100.00")),
                packaging=PackagingAssumptions(packaging_cost=Decimal("5.00")),
                costs=CostsAssumptions(
                    cogs_per_unit=Decimal("30.00"),
                    shipping_cost_per_unit=Decimal("5.00"),
                    fixed_costs_total=Decimal("10000.00"),
                ),
            )
        )
    )
    assert res_pass.status == Status.PASSED
    assert res_pass.score == Decimal("100.00")

    # WARNING: high break-even volume (> 2500 units)
    # contribution = 100 - (30 + 5 + 5 + 2) = 58. Fixed costs = 200,000 -> break-even = 3449 > 2500
    res_warn_be = stage.run(
        StageContext(
            assumptions=Assumptions(
                pricing=PricingAssumptions(selling_price=Decimal("100.00")),
                packaging=PackagingAssumptions(packaging_cost=Decimal("5.00")),
                costs=CostsAssumptions(
                    cogs_per_unit=Decimal("30.00"),
                    shipping_cost_per_unit=Decimal("5.00"),
                    fixed_costs_total=Decimal("200000.00"),
                ),
            )
        )
    )
    assert res_warn_be.status == Status.WARNING
    assert any(f.code == "FINANCIAL_HIGH_BREAK_EVEN_VOLUME" for f in res_warn_be.findings)

    # FAILED: negative contribution
    res_fail = stage.run(
        StageContext(
            assumptions=Assumptions(
                pricing=PricingAssumptions(selling_price=Decimal("50.00")),
                packaging=PackagingAssumptions(packaging_cost=Decimal("10.00")),
                costs=CostsAssumptions(
                    cogs_per_unit=Decimal("50.00"),
                    shipping_cost_per_unit=Decimal("10.00"),
                    fixed_costs_total=Decimal("5000.00"),
                ),
            )
        )
    )
    assert res_fail.status == Status.FAILED
    assert any(f.code in ("NEGATIVE_CONTRIBUTION", "FINANCIAL_UNIT_ECONOMICS_NEGATIVE") for f in res_fail.findings)


def test_marketing_stage_all_states():
    stage = MarketingStage()
    fin_pos = StageResult(
        stage="financial",
        status=Status.PASSED,
        metrics={"contribution_per_unit": "50.00"},
    )

    # INSUFFICIENT_EVIDENCE: missing channels
    res_nochan = stage.run(
        StageContext(
            assumptions=Assumptions(marketing=MarketingAssumptions(channels=[], expected_cac=Decimal("20"))),
            upstream={"financial": fin_pos},
        )
    )
    assert res_nochan.status == Status.INSUFFICIENT_EVIDENCE

    # INSUFFICIENT_EVIDENCE: upstream financial missing or null contribution
    res_noups = stage.run(
        StageContext(
            assumptions=Assumptions(marketing=MarketingAssumptions(channels=["Meta"], expected_cac=Decimal("20"))),
            upstream={},
        )
    )
    assert res_noups.status == Status.INSUFFICIENT_EVIDENCE

    # PASSED: ratio <= 0.60 (cac 25 / contribution 50 = 0.50)
    res_pass = stage.run(
        StageContext(
            assumptions=Assumptions(marketing=MarketingAssumptions(channels=["Meta"], expected_cac=Decimal("25.00"))),
            upstream={"financial": fin_pos},
        )
    )
    assert res_pass.status == Status.PASSED
    assert res_pass.metrics["cac_to_contribution_ratio"] == "0.5000"

    # WARNING: 0.60 < ratio <= 1.00 (cac 40 / contribution 50 = 0.80)
    res_warn = stage.run(
        StageContext(
            assumptions=Assumptions(marketing=MarketingAssumptions(channels=["Meta"], expected_cac=Decimal("40.00"))),
            upstream={"financial": fin_pos},
        )
    )
    assert res_warn.status == Status.WARNING
    assert any(f.code == "MARKETING_CAC_RATIO_HIGH" for f in res_warn.findings)

    # FAILED: ratio > 1.00 (cac 60 / contribution 50 = 1.20)
    res_fail = stage.run(
        StageContext(
            assumptions=Assumptions(marketing=MarketingAssumptions(channels=["Meta"], expected_cac=Decimal("60.00"))),
            upstream={"financial": fin_pos},
        )
    )
    assert res_fail.status == Status.FAILED
    assert any(f.code == "MARKETING_CAC_EXCEEDS_CONTRIBUTION" for f in res_fail.findings)

    # FAILED: negative contribution from upstream
    fin_neg = StageResult(
        stage="financial",
        status=Status.FAILED,
        metrics={"contribution_per_unit": "-10.00"},
    )
    res_neg_econ = stage.run(
        StageContext(
            assumptions=Assumptions(marketing=MarketingAssumptions(channels=["Meta"], expected_cac=Decimal("20.00"))),
            upstream={"financial": fin_neg},
        )
    )
    assert res_neg_econ.status == Status.FAILED
    assert any(f.code == "NEGATIVE_UNIT_ECONOMICS" for f in res_neg_econ.findings)
    assert res_neg_econ.metrics["cac_to_contribution_ratio"] is None


# ============================================================================
# 2. Boundary Tests at Every Threshold
# ============================================================================

def test_packaging_boundary_thresholds():
    """
    packaging fraction:
    - exactly 0.15 is PASSED
    - 0.1501 is WARNING
    - exactly 0.25 is WARNING
    - 0.2501 is FAILED
    """
    stage = ProductPackagingStage()

    # 1. Exactly 0.1500 -> PASSED
    res_15 = stage.run(
        StageContext(
            assumptions=Assumptions(
                packaging=PackagingAssumptions(material="Paper", packaging_cost=Decimal("15.00")),
                pricing=PricingAssumptions(selling_price=Decimal("100.00")),
            )
        )
    )
    assert res_15.status == Status.PASSED

    # 2. 0.1501 -> WARNING
    res_1501 = stage.run(
        StageContext(
            assumptions=Assumptions(
                packaging=PackagingAssumptions(material="Paper", packaging_cost=Decimal("15.01")),
                pricing=PricingAssumptions(selling_price=Decimal("100.00")),
            )
        )
    )
    assert res_1501.status == Status.WARNING

    # 3. Exactly 0.2500 -> WARNING
    res_25 = stage.run(
        StageContext(
            assumptions=Assumptions(
                packaging=PackagingAssumptions(material="Paper", packaging_cost=Decimal("25.00")),
                pricing=PricingAssumptions(selling_price=Decimal("100.00")),
            )
        )
    )
    assert res_25.status == Status.WARNING

    # 4. 0.2501 -> FAILED
    res_2501 = stage.run(
        StageContext(
            assumptions=Assumptions(
                packaging=PackagingAssumptions(material="Paper", packaging_cost=Decimal("25.01")),
                pricing=PricingAssumptions(selling_price=Decimal("100.00")),
            )
        )
    )
    assert res_2501.status == Status.FAILED


def test_marketing_boundary_thresholds():
    """
    marketing ratio:
    - exactly 0.6 is not escalated (PASSED)
    - exactly 1.0 is not escalated (WARNING, not FAILED)
    """
    stage = MarketingStage()
    fin_upstream = StageResult(
        stage="financial",
        status=Status.PASSED,
        metrics={"contribution_per_unit": "100.00"},
    )

    # Exactly 0.60 (cac 60, contribution 100) -> PASSED
    res_60 = stage.run(
        StageContext(
            assumptions=Assumptions(marketing=MarketingAssumptions(channels=["SEO"], expected_cac=Decimal("60.00"))),
            upstream={"financial": fin_upstream},
        )
    )
    assert res_60.status == Status.PASSED

    # Exactly 1.00 (cac 100, contribution 100) -> WARNING (not FAILED)
    res_100 = stage.run(
        StageContext(
            assumptions=Assumptions(marketing=MarketingAssumptions(channels=["SEO"], expected_cac=Decimal("100.00"))),
            upstream={"financial": fin_upstream},
        )
    )
    assert res_100.status == Status.WARNING

    # 1.0001 (cac 100.01, contribution 100) -> FAILED
    res_10001 = stage.run(
        StageContext(
            assumptions=Assumptions(marketing=MarketingAssumptions(channels=["SEO"], expected_cac=Decimal("100.01"))),
            upstream={"financial": fin_upstream},
        )
    )
    assert res_10001.status == Status.FAILED


def test_customer_interviews_boundaries():
    """
    interviews boundaries:
    - 4: INSUFFICIENT_EVIDENCE
    - 5: WARNING
    - 9: WARNING
    - 10: PASSED
    """
    stage = CustomerStage()

    for count, expected_status in [(4, Status.INSUFFICIENT_EVIDENCE), (5, Status.WARNING), (9, Status.WARNING), (10, Status.PASSED)]:
        res = stage.run(
            StageContext(
                assumptions=Assumptions(
                    customer=CustomerAssumptions(
                        target_customer="Runners",
                        problem_statement="Electrolytes",
                        customer_interviews_count=count,
                    )
                )
            )
        )
        assert res.status == expected_status, f"Expected {expected_status} for {count} interviews, got {res.status}"


# ============================================================================
# 3. Vector A and Vector B Sequential Flows
# ============================================================================

def test_vector_a_stage_flow():
    """
    Vector A flow through pricing, financial and marketing:
    price 500, cogs 150, packaging 30, shipping 40, fee 0.02, fixed 50000, cac 50, channels ['Google']
    -> financial: '270.00', 0.5400, 186
    -> marketing: cac 50 / 270 = 0.1852 -> PASSED
    """
    assumptions = Assumptions(
        pricing=PricingAssumptions(selling_price=Decimal("500.00")),
        packaging=PackagingAssumptions(material="Cardboard", packaging_cost=Decimal("30.00")),
        costs=CostsAssumptions(
            cogs_per_unit=Decimal("150.00"),
            shipping_cost_per_unit=Decimal("40.00"),
            packaging_cost=Decimal("30.00"),
            payment_fee_fraction=Decimal("0.02"),
            fixed_costs_total=Decimal("50000.00"),
        ),
        marketing=MarketingAssumptions(channels=["Google Ads"], expected_cac=Decimal("50.00")),
    )

    ctx = StageContext(assumptions=assumptions, upstream={})

    # Pricing stage
    pricing_res = PricingStage().run(ctx)
    ctx.upstream["pricing"] = pricing_res
    assert pricing_res.status == Status.PASSED
    assert pricing_res.metrics["realized_margin_fraction"] == "0.5400"

    # Financial stage
    fin_res = FinancialStage().run(ctx)
    ctx.upstream["financial"] = fin_res
    assert fin_res.status == Status.PASSED
    assert fin_res.metrics["contribution_per_unit"] == "270.00"
    assert fin_res.metrics["contribution_margin"] == 0.5400
    assert fin_res.metrics["break_even_units"] == 186

    # Marketing stage
    mkt_res = MarketingStage().run(ctx)
    assert mkt_res.status == Status.PASSED
    # 50 / 270 = 0.185185... -> 0.1852
    assert mkt_res.metrics["cac_to_contribution_ratio"] == "0.1852"


def test_vector_b_stage_flow():
    """
    Vector B flow (packaging 60):
    -> financial: '240.00', 0.4800, 209
    -> marketing: cac 50 / 240 = 0.2083 -> PASSED
    """
    assumptions = Assumptions(
        pricing=PricingAssumptions(selling_price=Decimal("500.00")),
        packaging=PackagingAssumptions(material="Cardboard", packaging_cost=Decimal("60.00")),
        costs=CostsAssumptions(
            cogs_per_unit=Decimal("150.00"),
            shipping_cost_per_unit=Decimal("40.00"),
            packaging_cost=Decimal("60.00"),
            payment_fee_fraction=Decimal("0.02"),
            fixed_costs_total=Decimal("50000.00"),
        ),
        marketing=MarketingAssumptions(channels=["Google Ads"], expected_cac=Decimal("50.00")),
    )

    ctx = StageContext(assumptions=assumptions, upstream={})

    fin_res = FinancialStage().run(ctx)
    ctx.upstream["financial"] = fin_res
    assert fin_res.status == Status.PASSED
    assert fin_res.metrics["contribution_per_unit"] == "240.00"
    assert fin_res.metrics["contribution_margin"] == 0.4800
    assert fin_res.metrics["break_even_units"] == 209

    mkt_res = MarketingStage().run(ctx)
    assert mkt_res.status == Status.PASSED
    # 50 / 240 = 0.208333... -> 0.2083
    assert mkt_res.metrics["cac_to_contribution_ratio"] == "0.2083"


# ============================================================================
# 4. Upstream Edge Cases
# ============================================================================

def test_pricing_no_competitor_band():
    """Pricing with no competitor band adds info finding NO_COMPETITOR_BAND, still runs margin checks."""
    assumptions = Assumptions(
        pricing=PricingAssumptions(selling_price=Decimal("100.00")),
        packaging=PackagingAssumptions(packaging_cost=Decimal("10.00")),
        costs=CostsAssumptions(cogs_per_unit=Decimal("30.00"), shipping_cost_per_unit=Decimal("5.00")),
    )
    # Upstream competitor stage is absent
    ctx = StageContext(assumptions=assumptions, upstream={})
    res = PricingStage().run(ctx)
    assert res.status == Status.PASSED
    assert "competitor" in res.upstream_stages_used
    assert any(f.code == "NO_COMPETITOR_BAND" and f.severity == "info" for f in res.findings)


def test_marketing_upstream_null_contribution():
    """Marketing with upstream financial result having null contribution -> INSUFFICIENT_EVIDENCE."""
    fin_mock = StageResult(
        stage="financial",
        status=Status.INSUFFICIENT_EVIDENCE,
        metrics={"contribution_per_unit": None},
    )
    assumptions = Assumptions(marketing=MarketingAssumptions(channels=["Direct"], expected_cac=Decimal("20.00")))
    ctx = StageContext(assumptions=assumptions, upstream={"financial": fin_mock})
    res = MarketingStage().run(ctx)
    assert res.status == Status.INSUFFICIENT_EVIDENCE
    assert any("financial.contribution_per_unit" in f.code for f in res.findings)


def test_marketing_upstream_negative_contribution():
    """Marketing with upstream financial result having negative contribution -> FAILED with NEGATIVE_UNIT_ECONOMICS."""
    fin_mock = StageResult(
        stage="financial",
        status=Status.FAILED,
        metrics={"contribution_per_unit": "-15.00"},
    )
    assumptions = Assumptions(marketing=MarketingAssumptions(channels=["Direct"], expected_cac=Decimal("20.00")))
    ctx = StageContext(assumptions=assumptions, upstream={"financial": fin_mock})
    res = MarketingStage().run(ctx)
    assert res.status == Status.FAILED
    assert any(f.code == "NEGATIVE_UNIT_ECONOMICS" for f in res.findings)
    assert res.metrics["cac_to_contribution_ratio"] is None


# ============================================================================
# 5. Evidence Citations & StageResult.to_dict() Serialization
# ============================================================================

def test_findings_cite_evidence_ids():
    """Findings in competitor stage cite the correct evidence_ids."""
    stage = CompetitorStage()
    ev_id1 = uuid.uuid4()
    ev_id2 = uuid.uuid4()
    comp1_id = uuid.uuid4()
    ev1 = MockEvidence(ev_id1, comp1_id)
    ev2 = MockEvidence(ev_id2, comp1_id)

    # 1 competitor only -> triggers deficient count, citations must include ev_id1 and ev_id2
    ctx = StageContext(
        assumptions=Assumptions(product=ProductAssumptions(differentiation_vs_competitors="Eco")),
        competitors=[MockCompetitor(comp1_id, "Single Comp")],
        evidence=[ev1, ev2],
        competitor_analyses=[MockAnalysis(comp1_id, Decimal("50.00"))],
    )
    res = stage.run(ctx)
    assert res.status == Status.INSUFFICIENT_EVIDENCE
    deficient_finding = next(f for f in res.findings if f.code == "COMPETITOR_COUNT_DEFICIENT")
    assert ev_id1 in deficient_finding.evidence_ids
    assert ev_id2 in deficient_finding.evidence_ids


def test_stage_result_to_dict_format():
    """StageResult.to_dict() formats money as 2 dp string, fractions as 4 dp, score at 2 dp."""
    res = StageResult(
        stage="test",
        status=Status.PASSED,
        score=Decimal("85.50"),
        metrics={
            "selling_price": Decimal("500.00"),
            "packaging_cost": Decimal("30.00"),
            "margin_fraction": Decimal("0.5400"),
            "break_even_units": 186,
        },
        findings=[Finding(code="INFO_CODE", severity="info", message="ok")],
        inputs_used=["input1"],
        upstream_stages_used=["up1"],
    )
    d = res.to_dict()
    assert d["stage"] == "test"
    assert d["status"] == "PASSED"
    assert d["score"] == 85.50
    assert d["metrics"]["selling_price"] == "500.00"
    assert d["metrics"]["packaging_cost"] == "30.00"
    assert d["metrics"]["margin_fraction"] == 0.5400
    assert d["metrics"]["break_even_units"] == 186
    assert d["findings"][0]["code"] == "INFO_CODE"


def test_stage_results_deterministic_across_calls():
    """Stages return identical results across repeated invocations."""
    stage = ProductPackagingStage()
    ctx = StageContext(
        assumptions=Assumptions(
            packaging=PackagingAssumptions(material="Aluminum", packaging_cost=Decimal("12.00")),
            pricing=PricingAssumptions(selling_price=Decimal("80.00")),
        )
    )
    r1 = stage.run(ctx)
    r2 = stage.run(ctx)
    assert r1.status == r2.status
    assert r1.score == r2.score
    assert r1.metrics == r2.metrics
    assert [f.code for f in r1.findings] == [f.code for f in r2.findings]


# ============================================================================
# 6. Stage Registry & Order
# ============================================================================

def test_stage_registry():
    """Verify STAGES registry, get_stage(), and STAGE_ORDER."""
    assert len(STAGES) == 6
    stage_names = tuple(s.name for s in STAGES)
    assert stage_names == STAGE_ORDER
    assert stage_names == ("customer", "competitor", "product_packaging", "pricing", "financial", "marketing")

    for name in STAGE_ORDER:
        st = get_stage(name)
        assert st is not None
        assert st.name == name

    assert get_stage("non_existent_stage") is None


# ============================================================================
# 7. Source Scan Tests
# ============================================================================

def test_stages_source_scan():
    """
    All stage files in validation/stages/ must satisfy:
    - NO 'float(' anywhere (pure Decimal)
    - NO forbidden imports: sqlalchemy, httpx, app.models, app.api, openai, anthropic, langchain
    - NO numeric threshold literals: 0.15, 0.25, 0.2, 0.6, 1.0, 5, 10
    """
    stages_dir = Path(__file__).resolve().parent.parent.parent.parent / "app" / "services" / "validation" / "stages"
    stage_files = list(stages_dir.glob("*.py"))
    assert len(stage_files) >= 6

    forbidden_threshold_patterns = [
        r"0\.15\b",
        r"0\.25\b",
        r"0\.20?\b",
        r"0\.60?\b",
        r"1\.00?\b",
        r"\b5\b",
        r"\b10\b",
    ]

    forbidden_imports = [
        "sqlalchemy",
        "httpx",
        "app.models",
        "app.api",
        "openai",
        "anthropic",
        "langchain",
    ]

    for sf in stage_files:
        if sf.name == "__init__.py":
            continue
        code = sf.read_text(encoding="utf-8")

        assert "float(" not in code, f"Found 'float(' in {sf.name}"

        for imp in forbidden_imports:
            assert imp not in code, f"Found forbidden import '{imp}' in {sf.name}"

        for pat in forbidden_threshold_patterns:
            matches = re.findall(pat, code)
            assert not matches, f"Found forbidden numeric literal matching '{pat}' in {sf.name}: {matches}"
