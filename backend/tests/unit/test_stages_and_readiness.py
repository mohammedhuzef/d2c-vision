from decimal import Decimal
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
from backend.app.services.validation.base import Finding, StageContext, StageResult, Status
from backend.app.services.validation.stages.customer import CustomerStage
from backend.app.services.validation.stages.competitor import CompetitorStage
from backend.app.services.validation.stages.product_packaging import ProductPackagingStage
from backend.app.services.validation.stages.pricing import PricingStage
from backend.app.services.validation.stages.financial import FinancialStage
from backend.app.services.validation.stages.marketing import MarketingStage
from backend.app.services.readiness import compute_readiness


def test_customer_stage_states():
    stage = CustomerStage()

    # 1. Missing target customer -> INSUFFICIENT_EVIDENCE
    ctx1 = StageContext(assumptions=Assumptions())
    res1 = stage.run(ctx1)
    assert res1.status == Status.INSUFFICIENT_EVIDENCE
    assert any(f.code == "CUSTOMER_TARGET_MISSING" for f in res1.findings)

    # 2. Interviews 3 (< 5) -> INSUFFICIENT_EVIDENCE
    ctx2 = StageContext(
        assumptions=Assumptions(
            customer=CustomerAssumptions(
                target_customer="Busy parents",
                problem_statement="Need fast healthy meals",
                customer_interviews_count=3,
            )
        )
    )
    res2 = stage.run(ctx2)
    assert res2.status == Status.INSUFFICIENT_EVIDENCE
    assert any(f.code == "CUSTOMER_INTERVIEWS_INSUFFICIENT" for f in res2.findings)

    # 3. Interviews 7 (5-9) -> WARNING
    ctx3 = StageContext(
        assumptions=Assumptions(
            customer=CustomerAssumptions(
                target_customer="Busy parents",
                problem_statement="Need fast healthy meals",
                customer_interviews_count=7,
            )
        )
    )
    res3 = stage.run(ctx3)
    assert res3.status == Status.WARNING
    assert any(f.code == "CUSTOMER_INTERVIEWS_LOW" for f in res3.findings)

    # 4. Interviews 12 -> PASSED
    ctx4 = StageContext(
        assumptions=Assumptions(
            customer=CustomerAssumptions(
                target_customer="Busy parents",
                problem_statement="Need fast healthy meals",
                customer_interviews_count=12,
            )
        )
    )
    res4 = stage.run(ctx4)
    assert res4.status == Status.PASSED
    assert not res4.findings


def test_packaging_stage_states():
    stage = ProductPackagingStage()

    # 1. Missing material -> INSUFFICIENT_EVIDENCE
    ctx1 = StageContext(assumptions=Assumptions())
    res1 = stage.run(ctx1)
    assert res1.status == Status.INSUFFICIENT_EVIDENCE

    # 2. Packaging cost ratio > 0.25 -> FAILED (cost 30, price 100 -> ratio 0.30)
    ctx2 = StageContext(
        assumptions=Assumptions(
            packaging=PackagingAssumptions(material="Glass", packaging_cost=Decimal("30")),
            pricing=PricingAssumptions(selling_price=Decimal("100")),
        )
    )
    res2 = stage.run(ctx2)
    assert res2.status == Status.FAILED
    assert any(f.code == "PACKAGING_COST_EXCESSIVE" for f in res2.findings)

    # 3. Packaging cost ratio 0.18 (> 0.15) -> WARNING (cost 18, price 100)
    ctx3 = StageContext(
        assumptions=Assumptions(
            packaging=PackagingAssumptions(material="Glass", packaging_cost=Decimal("18")),
            pricing=PricingAssumptions(selling_price=Decimal("100")),
        )
    )
    res3 = stage.run(ctx3)
    assert res3.status == Status.WARNING
    assert any(f.code == "PACKAGING_COST_ELEVATED" for f in res3.findings)

    # 4. Packaging cost ratio 0.08 -> PASSED
    ctx4 = StageContext(
        assumptions=Assumptions(
            packaging=PackagingAssumptions(material="Glass", packaging_cost=Decimal("8")),
            pricing=PricingAssumptions(selling_price=Decimal("100")),
        )
    )
    res4 = stage.run(ctx4)
    assert res4.status == Status.PASSED


def test_marketing_stage_states():
    stage = MarketingStage()

    # 1. Missing channels or CAC -> INSUFFICIENT_EVIDENCE
    ctx1 = StageContext(assumptions=Assumptions())
    res1 = stage.run(ctx1)
    assert res1.status == Status.INSUFFICIENT_EVIDENCE

    # 2. Ratio > 1.0 -> FAILED (CAC 50, contribution 40)
    fin_mock = StageResult(
        stage="financial",
        status=Status.PASSED,
        metrics={"contribution_per_unit": 40.0},
    )
    ctx2 = StageContext(
        assumptions=Assumptions(
            marketing=MarketingAssumptions(channels=["Meta Ads"], expected_cac=Decimal("50"))
        ),
        upstream={"financial": fin_mock},
    )
    res2 = stage.run(ctx2)
    assert res2.status == Status.FAILED
    assert any(f.code == "MARKETING_CAC_EXCEEDS_CONTRIBUTION" for f in res2.findings)

    # 3. Ratio 0.75 (> 0.6) -> WARNING (CAC 30, contribution 40)
    ctx3 = StageContext(
        assumptions=Assumptions(
            marketing=MarketingAssumptions(channels=["Meta Ads"], expected_cac=Decimal("30"))
        ),
        upstream={"financial": fin_mock},
    )
    res3 = stage.run(ctx3)
    assert res3.status == Status.WARNING
    assert any(f.code == "MARKETING_CAC_RATIO_HIGH" for f in res3.findings)

    # 4. Ratio 0.25 (<= 0.6) -> PASSED (CAC 10, contribution 40)
    ctx4 = StageContext(
        assumptions=Assumptions(
            marketing=MarketingAssumptions(channels=["Meta Ads"], expected_cac=Decimal("10"))
        ),
        upstream={"financial": fin_mock},
    )
    res4 = stage.run(ctx4)
    assert res4.status == Status.PASSED


def test_readiness_rules():
    # 2+ INSUFFICIENT_EVIDENCE -> INSUFFICIENT_EVIDENCE
    res_insuf = [
        StageResult(stage="customer", status=Status.INSUFFICIENT_EVIDENCE, score=30.0),
        StageResult(stage="competitor", status=Status.INSUFFICIENT_EVIDENCE, score=30.0),
        StageResult(stage="product_packaging", status=Status.PASSED, score=90.0),
        StageResult(stage="pricing", status=Status.PASSED, score=90.0),
        StageResult(stage="financial", status=Status.PASSED, score=90.0),
        StageResult(stage="marketing", status=Status.PASSED, score=90.0),
    ]
    _, verdict_insuf = compute_readiness(res_insuf)
    assert verdict_insuf == "INSUFFICIENT_EVIDENCE"

    # FAILED critical stage (e.g. financial) -> NO_GO even if high score
    res_fail_crit = [
        StageResult(stage="customer", status=Status.PASSED, score=95.0),
        StageResult(stage="competitor", status=Status.PASSED, score=95.0),
        StageResult(stage="product_packaging", status=Status.PASSED, score=95.0),
        StageResult(stage="pricing", status=Status.PASSED, score=95.0),
        StageResult(stage="financial", status=Status.FAILED, score=10.0),
        StageResult(stage="marketing", status=Status.PASSED, score=95.0),
    ]
    _, verdict_crit = compute_readiness(res_fail_crit)
    assert verdict_crit == "NO_GO"

    # All PASSED with high score -> GO
    res_go = [
        StageResult(stage="customer", status=Status.PASSED, score=90.0),
        StageResult(stage="competitor", status=Status.PASSED, score=90.0),
        StageResult(stage="product_packaging", status=Status.PASSED, score=90.0),
        StageResult(stage="pricing", status=Status.PASSED, score=90.0),
        StageResult(stage="financial", status=Status.PASSED, score=90.0),
        StageResult(stage="marketing", status=Status.PASSED, score=90.0),
    ]
    score_go, verdict_go = compute_readiness(res_go)
    assert score_go == 90.0
    assert verdict_go == "GO"


def test_validation_api_flow(client):
    prod_res = client.post("/api/v1/products", json={"name": "Tumbler Pro"})
    product_id = prod_res.json()["id"]

    # Trigger validation on initial version (mostly blank) -> 6 stages returned with INSUFFICIENT_EVIDENCE
    val_res = client.post(f"/api/v1/products/{product_id}/validate")
    assert val_res.status_code == 200
    data = val_res.json()
    assert len(data["results"]) == 6
    assert data["verdict"] == "INSUFFICIENT_EVIDENCE"
    assert data["stages_run"] == ["customer", "competitor", "product_packaging", "pricing", "financial", "marketing"]

    # Check GET /validation
    get_val = client.get(f"/api/v1/products/{product_id}/validation")
    assert get_val.status_code == 200
    assert get_val.json()["run_id"] == data["run_id"]

    # Check recommendations endpoint
    rec_res = client.get(f"/api/v1/products/{product_id}/recommendations")
    assert rec_res.status_code == 200
    assert len(rec_res.json()["items"]) > 0
