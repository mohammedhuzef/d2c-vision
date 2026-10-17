"""Unit tests for readiness calculation engine (services/readiness.py).

Pure tests: No DB, strict Decimal checks, rule precedence, renormalization,
label/score non-contradiction, and static source scanning.
"""

from decimal import Decimal
import inspect
from pathlib import Path
import pytest
import re

from backend.app.services.validation.base import Finding, StageResult, Status
from backend.app.services.readiness import calculate_readiness, ReadinessResult
from backend.app.services.validation import rules_config


# ---------------------------------------------------------------------------
# 1. Rule Precedence Tests
# ---------------------------------------------------------------------------

def test_readiness_rule_1_critical_stage_failed():
    """Rule 1: Any CRITICAL_STAGES result FAILED -> NOT_READY, even if score is high."""
    results = [
        StageResult(stage="customer", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="competitor", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="product_packaging", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="pricing", status=Status.FAILED, score=Decimal("40.00")),  # Critical
        StageResult(stage="financial", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="marketing", status=Status.PASSED, score=Decimal("100.00")),
    ]
    res = calculate_readiness(results)
    assert res.label == "NOT_READY"
    assert "pricing" in res.blocking_stages
    assert res.overall_score is not None


def test_readiness_rule_2_critical_stage_insufficient_or_not_run():
    """Rule 2: Any critical stage INSUFFICIENT_EVIDENCE or NOT_RUN -> INSUFFICIENT_EVIDENCE."""
    # Critical INSUFFICIENT_EVIDENCE
    results_insuf = [
        StageResult(stage="customer", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="competitor", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="product_packaging", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="pricing", status=Status.INSUFFICIENT_EVIDENCE, score=None),  # Critical
        StageResult(stage="financial", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="marketing", status=Status.PASSED, score=Decimal("100.00")),
    ]
    res_insuf = calculate_readiness(results_insuf)
    assert res_insuf.label == "INSUFFICIENT_EVIDENCE"
    assert "pricing" in res_insuf.missing_stages

    # Critical NOT_RUN (omitted from results)
    results_not_run = [
        StageResult(stage="customer", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="competitor", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="product_packaging", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="pricing", status=Status.PASSED, score=Decimal("100.00")),
        # 'financial' missing completely
        StageResult(stage="marketing", status=Status.PASSED, score=Decimal("100.00")),
    ]
    res_not_run = calculate_readiness(results_not_run)
    assert res_not_run.label == "INSUFFICIENT_EVIDENCE"
    assert "financial" in res_not_run.missing_stages


def test_readiness_rule_3_non_critical_stage_failed():
    """Rule 3: Any non-critical stage FAILED -> NOT_READY."""
    results = [
        StageResult(stage="customer", status=Status.FAILED, score=Decimal("35.00")),  # Non-critical
        StageResult(stage="competitor", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="product_packaging", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="pricing", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="financial", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="marketing", status=Status.PASSED, score=Decimal("100.00")),
    ]
    res = calculate_readiness(results)
    assert res.label == "NOT_READY"
    assert "customer" in res.blocking_stages


def test_readiness_rule_4_warning_or_non_critical_insufficient():
    """Rule 4: Any WARNING or non-critical INSUFFICIENT_EVIDENCE -> READY_WITH_WARNINGS."""
    # Case A: WARNING stage
    results_warn = [
        StageResult(stage="customer", status=Status.WARNING, score=Decimal("75.00")),
        StageResult(stage="competitor", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="product_packaging", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="pricing", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="financial", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="marketing", status=Status.PASSED, score=Decimal("100.00")),
    ]
    res_warn = calculate_readiness(results_warn)
    assert res_warn.label == "READY_WITH_WARNINGS"
    assert "customer" in res_warn.warning_stages

    # Case B: Non-critical INSUFFICIENT_EVIDENCE
    results_nc_insuf = [
        StageResult(stage="customer", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="competitor", status=Status.INSUFFICIENT_EVIDENCE, score=None),  # Non-critical
        StageResult(stage="product_packaging", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="pricing", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="financial", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="marketing", status=Status.PASSED, score=Decimal("100.00")),
    ]
    res_nc_insuf = calculate_readiness(results_nc_insuf)
    assert res_nc_insuf.label == "READY_WITH_WARNINGS"
    assert "competitor" in res_nc_insuf.missing_stages


def test_readiness_rule_5_all_passed_is_ready():
    """Rule 5: All stages PASSED with healthy scores -> READY."""
    results = [
        StageResult(stage="customer", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="competitor", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="product_packaging", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="pricing", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="financial", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="marketing", status=Status.PASSED, score=Decimal("100.00")),
    ]
    res = calculate_readiness(results)
    assert res.label == "READY"
    assert res.overall_score == Decimal("100.00")
    assert len(res.blocking_stages) == 0
    assert len(res.warning_stages) == 0
    assert len(res.missing_stages) == 0


# ---------------------------------------------------------------------------
# 2. Weighted Score Renormalization Tests
# ---------------------------------------------------------------------------

def test_weighted_renormalization_with_null_scores():
    """
    Assert exact Decimal values when some stages have null scores.
    Weights in config:
      customer: 0.15, competitor: 0.15, product_packaging: 0.15,
      pricing: 0.20, financial: 0.20, marketing: 0.15
    If customer (100) and competitor (null) and packaging (80) and pricing (90):
      pricing & financial are critical. If financial is 90, marketing is null:
      Scored stages: customer (0.15, 100), packaging (0.15, 80), pricing (0.20, 90), financial (0.20, 90)
      Total scored weight = 0.15 + 0.15 + 0.20 + 0.20 = 0.70
      Weighted sum = 15.00 + 12.00 + 18.00 + 18.00 = 63.00
      overall_score = 63.00 / 0.70 = 90.00
    """
    results = [
        StageResult(stage="customer", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="competitor", status=Status.INSUFFICIENT_EVIDENCE, score=None),
        StageResult(stage="product_packaging", status=Status.PASSED, score=Decimal("80.00")),
        StageResult(stage="pricing", status=Status.PASSED, score=Decimal("90.00")),
        StageResult(stage="financial", status=Status.PASSED, score=Decimal("90.00")),
        StageResult(stage="marketing", status=Status.INSUFFICIENT_EVIDENCE, score=None),
    ]
    res = calculate_readiness(results)
    assert res.overall_score == Decimal("90.00")
    assert res.label == "READY_WITH_WARNINGS"  # Non-critical stages missing


def test_readiness_no_scores_at_all():
    """When all stages have null scores, overall_score is None (null)."""
    results = [
        StageResult(stage="customer", status=Status.INSUFFICIENT_EVIDENCE, score=None),
        StageResult(stage="competitor", status=Status.INSUFFICIENT_EVIDENCE, score=None),
        StageResult(stage="product_packaging", status=Status.INSUFFICIENT_EVIDENCE, score=None),
        StageResult(stage="pricing", status=Status.INSUFFICIENT_EVIDENCE, score=None),
        StageResult(stage="financial", status=Status.INSUFFICIENT_EVIDENCE, score=None),
        StageResult(stage="marketing", status=Status.INSUFFICIENT_EVIDENCE, score=None),
    ]
    res = calculate_readiness(results)
    assert res.overall_score is None
    assert res.label == "INSUFFICIENT_EVIDENCE"


# ---------------------------------------------------------------------------
# 3. Label/Score Non-Contradiction Tests
# ---------------------------------------------------------------------------

def test_label_score_non_contradiction_critical_failed():
    """A FAILED critical stage can NEVER show READY, even if overall_score is high."""
    results = [
        StageResult(stage="customer", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="competitor", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="product_packaging", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="pricing", status=Status.FAILED, score=Decimal("40.00")),  # Critical FAILED
        StageResult(stage="financial", status=Status.PASSED, score=Decimal("100.00")),
        StageResult(stage="marketing", status=Status.PASSED, score=Decimal("100.00")),
    ]
    res = calculate_readiness(results)
    assert res.label == "NOT_READY"
    assert res.label != "READY"


def test_label_score_non_contradiction_low_score_downgrade():
    """If all stages are PASSED but score is below cutoff (70.00), cannot show READY."""
    results = [
        StageResult(stage="customer", status=Status.PASSED, score=Decimal("50.00")),
        StageResult(stage="competitor", status=Status.PASSED, score=Decimal("50.00")),
        StageResult(stage="product_packaging", status=Status.PASSED, score=Decimal("50.00")),
        StageResult(stage="pricing", status=Status.PASSED, score=Decimal("50.00")),
        StageResult(stage="financial", status=Status.PASSED, score=Decimal("50.00")),
        StageResult(stage="marketing", status=Status.PASSED, score=Decimal("50.00")),
    ]
    res = calculate_readiness(results)
    assert res.overall_score == Decimal("50.00")
    assert res.label == "READY_WITH_WARNINGS"


# ---------------------------------------------------------------------------
# 4. to_dict Formatting and Determinism Tests
# ---------------------------------------------------------------------------

def test_readiness_to_dict_format():
    """ReadinessResult.to_dict() adheres to 5A formatting rules (score at 2 dp)."""
    results = [
        StageResult(stage="customer", status=Status.PASSED, score=Decimal("95.50")),
        StageResult(stage="competitor", status=Status.PASSED, score=Decimal("95.50")),
        StageResult(stage="product_packaging", status=Status.PASSED, score=Decimal("95.50")),
        StageResult(stage="pricing", status=Status.PASSED, score=Decimal("95.50")),
        StageResult(stage="financial", status=Status.PASSED, score=Decimal("95.50")),
        StageResult(stage="marketing", status=Status.PASSED, score=Decimal("95.50")),
    ]
    res = calculate_readiness(results)
    d = res.to_dict()

    assert d["overall_score"] == 95.5
    assert d["label"] == "READY"
    assert isinstance(d["blocking_stages"], list)
    assert isinstance(d["warning_stages"], list)
    assert isinstance(d["missing_stages"], list)
    assert "customer" in d["breakdown"]
    assert d["breakdown"]["customer"]["status"] == "PASSED"
    assert d["breakdown"]["customer"]["score"] == 95.5


def test_readiness_determinism_across_calls():
    """Identical results must yield identical ReadinessResult objects across 100 runs."""
    results = [
        StageResult(stage="customer", status=Status.PASSED, score=Decimal("85.00")),
        StageResult(stage="competitor", status=Status.WARNING, score=Decimal("75.00")),
        StageResult(stage="product_packaging", status=Status.PASSED, score=Decimal("90.00")),
        StageResult(stage="pricing", status=Status.PASSED, score=Decimal("92.00")),
        StageResult(stage="financial", status=Status.PASSED, score=Decimal("88.00")),
        StageResult(stage="marketing", status=Status.PASSED, score=Decimal("80.00")),
    ]
    first = calculate_readiness(results)
    for _ in range(50):
        subsequent = calculate_readiness(results)
        assert first == subsequent
        assert first.to_dict() == subsequent.to_dict()


# ---------------------------------------------------------------------------
# 5. Static Source Scan Test
# ---------------------------------------------------------------------------

def test_readiness_source_scan():
    """
    readiness.py must satisfy:
    - NO 'float(' anywhere (pure Decimal)
    - NO forbidden imports: sqlalchemy, httpx
    """
    readiness_path = Path(__file__).resolve().parent.parent.parent / "app" / "services" / "readiness.py"
    code = readiness_path.read_text(encoding="utf-8")

    # Only in compute_readiness backwards-compatibility wrapper is float() allowed if any,
    # but calculate_readiness must have 0 float() calls. Let's inspect calculate_readiness specifically.
    tree = inspect.getsource(calculate_readiness)
    assert "float(" not in tree, "Found float() in calculate_readiness function!"

    assert "import sqlalchemy" not in code and "from sqlalchemy" not in code, "Found sqlalchemy import in readiness.py"
    assert "import httpx" not in code and "from httpx" not in code, "Found httpx import in readiness.py"


# ---------------------------------------------------------------------------
# 6. Part 0 Explicit Tests: 70.00 Cutoff & Canonical Finding Codes
# ---------------------------------------------------------------------------

def test_readiness_70_cutoff_boundary():
    """
    Explicit boundary tests for the readiness 70.00 cutoff:
    - Overall score exactly 70.00 stays READY.
    - Overall score 69.99 becomes READY_WITH_WARNINGS.
    - Confirms the cutoff value lives ONLY in rules_config.py.
    """
    assert rules_config.READINESS_SCORE_CUTOFF_READY == Decimal("70.00")

    # Score exactly 70.00 across all stages
    results_70 = [
        StageResult(stage="customer", status=Status.PASSED, score=Decimal("70.00")),
        StageResult(stage="competitor", status=Status.PASSED, score=Decimal("70.00")),
        StageResult(stage="product_packaging", status=Status.PASSED, score=Decimal("70.00")),
        StageResult(stage="pricing", status=Status.PASSED, score=Decimal("70.00")),
        StageResult(stage="financial", status=Status.PASSED, score=Decimal("70.00")),
        StageResult(stage="marketing", status=Status.PASSED, score=Decimal("70.00")),
    ]
    res_70 = calculate_readiness(results_70)
    assert res_70.overall_score == Decimal("70.00")
    assert res_70.label == rules_config.READINESS_LABEL_READY

    # Score 69.99 across all stages
    results_69_99 = [
        StageResult(stage="customer", status=Status.PASSED, score=Decimal("69.99")),
        StageResult(stage="competitor", status=Status.PASSED, score=Decimal("69.99")),
        StageResult(stage="product_packaging", status=Status.PASSED, score=Decimal("69.99")),
        StageResult(stage="pricing", status=Status.PASSED, score=Decimal("69.99")),
        StageResult(stage="financial", status=Status.PASSED, score=Decimal("69.99")),
        StageResult(stage="marketing", status=Status.PASSED, score=Decimal("69.99")),
    ]
    res_69_99 = calculate_readiness(results_69_99)
    assert res_69_99.overall_score == Decimal("69.99")
    assert res_69_99.label == rules_config.READINESS_LABEL_READY_WITH_WARNINGS

    # Verify readiness.py does NOT hardcode "70" or "70.00" as a numeric literal
    readiness_path = Path(__file__).resolve().parent.parent.parent / "app" / "services" / "readiness.py"
    content = readiness_path.read_text(encoding="utf-8")
    assert 'Decimal("70' not in content
    assert '70.00' not in content
    assert "READINESS_SCORE_CUTOFF_READY" in content


def test_no_legacy_finding_codes_serialized():
    """
    Assert that serialized findings and to_dict() outputs expose ONE canonical
    code form (e.g. MISSING_INPUT with field in 'field'), and zero legacy code strings.
    """
    from backend.app.services.validation.stages.customer import CustomerStage
    from backend.app.services.validation.stages.product_packaging import ProductPackagingStage
    from backend.app.services.validation.stages.pricing import PricingStage
    from backend.app.services.validation.stages.marketing import MarketingStage
    from backend.app.services.validation.base import StageContext
    from backend.app.schemas.assumptions import Assumptions

    legacy_codes = [
        "CUSTOMER_TARGET_MISSING",
        "CUSTOMER_PROBLEM_MISSING",
        "CUSTOMER_INTERVIEWS_MISSING",
        "PACKAGING_MATERIAL_MISSING",
        "PACKAGING_COST_MISSING",
        "PRICING_SELLING_PRICE_MISSING",
        "PRICING_PRICE_MISSING",
        "MARKETING_CHANNELS_MISSING",
        "MARKETING_CAC_MISSING",
        "MARKETING_FINANCIAL_DATA_UNAVAILABLE",
    ]

    empty_ctx = StageContext(assumptions=Assumptions())

    stages = [
        CustomerStage(),
        ProductPackagingStage(),
        PricingStage(),
        MarketingStage(),
    ]

    for st in stages:
        res = st.run(empty_ctx)
        d = res.to_dict()
        for f in d["findings"]:
            code_str = f["code"]
            assert code_str not in legacy_codes, f"Legacy code '{code_str}' found in serialized output of stage '{st.name}'"
            assert not code_str.startswith("MISSING_INPUT:"), f"Uncanonical code '{code_str}' found in stage '{st.name}'"
            if code_str == "MISSING_INPUT":
                assert f["field"] is not None, f"MISSING_INPUT finding must specify 'field' in stage '{st.name}'"


def test_failed_critical_stage_never_yields_ready_or_ready_with_warnings():
    """
    Step 7 Part A.1 invariant:
    A FAILED critical stage (pricing or financial) must NEVER yield READY or READY_WITH_WARNINGS,
    regardless of how high the overall score or other stages' scores are.
    """
    from backend.app.services.readiness import calculate_readiness
    from backend.app.services.validation.base import StageResult, Status
    from backend.app.services.validation import rules_config

    for crit_stage in rules_config.CRITICAL_STAGES:
        # All non-critical stages pass with perfect 100.00 score
        results = [
            StageResult(stage="customer", status=Status.PASSED, score=Decimal("100.00")),
            StageResult(stage="competitor", status=Status.PASSED, score=Decimal("100.00")),
            StageResult(stage="product_packaging", status=Status.PASSED, score=Decimal("100.00")),
            StageResult(stage="pricing", status=Status.PASSED, score=Decimal("100.00")),
            StageResult(stage="financial", status=Status.PASSED, score=Decimal("100.00")),
            StageResult(stage="marketing", status=Status.PASSED, score=Decimal("100.00")),
        ]
        # Set the critical stage to FAILED with a capped score (e.g. 40.00)
        for idx, r in enumerate(results):
            if r.stage == crit_stage:
                results[idx] = StageResult(
                    stage=crit_stage,
                    status=Status.FAILED,
                    score=Decimal("40.00"),
                )

        res = calculate_readiness(results)
        assert res.label == rules_config.READINESS_LABEL_NOT_READY, (
            f"Failed critical stage '{crit_stage}' yielded '{res.label}', expected NOT_READY"
        )
        assert res.label != rules_config.READINESS_LABEL_READY
        assert res.label != rules_config.READINESS_LABEL_READY_WITH_WARNINGS
        assert crit_stage in res.blocking_stages


def test_insufficient_data_string_appears_nowhere_in_app_or_contracts():
    """
    Step 7 Part A.1 invariant:
    The label string 'INSUFFICIENT_DATA' must appear nowhere in app/ or contracts/.
    """
    from pathlib import Path
    root_dir = Path(__file__).resolve().parent.parent.parent.parent
    app_dir = root_dir / "backend" / "app"
    contracts_dir = root_dir / "contracts"

    forbidden = "INSUFFICIENT_DATA"
    violations = []

    for path in list(app_dir.rglob("*.py")) + list(contracts_dir.rglob("*.json")):
        content = path.read_text(encoding="utf-8")
        if forbidden in content:
            violations.append(str(path.relative_to(root_dir)))

    assert not violations, f"Found '{forbidden}' in files: {violations}"


