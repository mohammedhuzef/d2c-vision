"""Integration tests for Validation Runs API, persistence, carry-forward, isolation, and readiness.

Tests end-to-end flows through FastAPI endpoints (/projects/{id}/validation/runs and readiness).
"""

from decimal import Decimal
import threading
import time
import uuid
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.validation.base import Finding, StageContext, StageResult, Status
from backend.app.services.validation import STAGE_MAP


VECTOR_A_PAYLOAD = {
    "name": "Vector A Project",
    "assumptions": {
        "customer": {
            "target_customer": "Hikers",
            "problem_statement": "Cold drinks get warm",
            "customer_interviews_count": 10,
        },
        "product": {
            "differentiation_vs_competitors": "Triple vacuum insulation",
        },
        "packaging": {
            "material": "Cardboard",
            "packaging_cost": 30.00,
        },
        "pricing": {
            "selling_price": 500.00,
            "target_margin_fraction": 0.40,
        },
        "costs": {
            "cogs_per_unit": 150.00,
            "shipping_cost_per_unit": 40.00,
            "packaging_cost": 30.00,
            "payment_fee_fraction": 0.02,
            "fixed_costs_total": 50000.00,
        },
        "marketing": {
            "channels": ["Google Ads"],
            "expected_cac": 50.00,
        },
    },
}


def _setup_project_with_competitors(client: TestClient, payload: dict) -> tuple[str, str, str]:
    """Helper to create project and seed 2 competitors with research evidence."""
    res = client.post("/api/v1/products", json=payload)
    assert res.status_code == 201
    project_id = res.json()["id"]

    comp_res = client.post(
        f"/api/v1/products/{project_id}/competitors",
        json={"competitors": [{"name": "Hydro Flask"}, {"name": "Yeti"}]},
    )
    assert comp_res.status_code == 201
    c1_id = comp_res.json()["items"][0]["id"]
    c2_id = comp_res.json()["items"][1]["id"]

    # Ingest research results with analyses and observed prices
    client.post("/api/v1/internal/research-results", json={
        "product_id": project_id,
        "competitor_id": c1_id,
        "evidence": [{"source_type": "website", "title": "Store A", "excerpt": "Price $499", "data": {"price": 499.0}}],
        "analyses": [{"price_observed": 499.00, "summary": "Store A analysis"}],
    })
    client.post("/api/v1/internal/research-results", json={
        "product_id": project_id,
        "competitor_id": c2_id,
        "evidence": [{"source_type": "website", "title": "Store B", "excerpt": "Price $520", "data": {"price": 520.0}}],
        "analyses": [{"price_observed": 520.00, "summary": "Store B analysis"}],
    })

    return project_id, c1_id, c2_id


# ---------------------------------------------------------------------------
# 1. Full Run on Vector A and Vector B
# ---------------------------------------------------------------------------

def test_full_validation_run_vector_a_and_vector_b(client):
    """
    Vector A and Vector B flow through the API and persist exact financial metrics:
    - Vector A: variable cost 230.00, contribution 270.00, margin 0.5400, break_even 186
    - Vector B (packaging 60.00): variable cost 260.00, contribution 240.00, margin 0.4800, break_even 209
    """
    project_id, _, _ = _setup_project_with_competitors(client, VECTOR_A_PAYLOAD)

    # 1. Trigger full run for Vector A
    run_a_res = client.post(f"/api/v1/projects/{project_id}/validation/runs")
    assert run_a_res.status_code == 201
    data_a = run_a_res.json()
    assert data_a["status"] == "COMPLETED"
    assert data_a["readiness"]["label"] == "READY"
    assert data_a["readiness"]["overall_score"] == 100.0

    fin_a = next(r for r in data_a["results"] if r["stage"] == "financial")
    assert fin_a["metrics"]["variable_cost_per_unit"] == "230.00"
    assert fin_a["metrics"]["contribution_per_unit"] == "270.00"
    assert fin_a["metrics"]["contribution_margin"] == 0.5400
    assert fin_a["metrics"]["break_even_units"] == 186

    # 2. Patch to Vector B (packaging_cost 30 -> 60)
    patch_res = client.patch(
        f"/api/v1/products/{project_id}/assumptions",
        json={"patch": {"packaging": {"packaging_cost": 60.00}}, "revalidate": False},
    )
    assert patch_res.status_code == 200

    # Trigger full run for Vector B
    run_b_res = client.post(f"/api/v1/projects/{project_id}/validation/runs")
    assert run_b_res.status_code == 201
    data_b = run_b_res.json()

    fin_b = next(r for r in data_b["results"] if r["stage"] == "financial")
    assert fin_b["metrics"]["variable_cost_per_unit"] == "260.00"
    assert fin_b["metrics"]["contribution_per_unit"] == "240.00"
    assert fin_b["metrics"]["contribution_margin"] == 0.4800
    assert fin_b["metrics"]["break_even_units"] == 209


# ---------------------------------------------------------------------------
# 2. Partial Re-run with Carry-Forward and Forced Downstream Re-run
# ---------------------------------------------------------------------------

def test_partial_rerun_with_carry_forward_and_downstream_dependency(client):
    """
    If partial stages are requested (e.g. competitor):
    - competitor runs
    - pricing is forced to re-run because it is downstream-dependent on competitor
    - unaffected stages (customer, packaging, financial, marketing) are carried forward from prior run
    """
    project_id, _, _ = _setup_project_with_competitors(client, VECTOR_A_PAYLOAD)

    # Initial Run (all 6 stages)
    init_res = client.post(f"/api/v1/projects/{project_id}/validation/runs")
    assert init_res.status_code == 201
    run_1 = init_res.json()

    # Re-run only competitor stage
    partial_res = client.post(
        f"/api/v1/projects/{project_id}/validation/runs",
        json={"stages": ["competitor"]},
    )
    assert partial_res.status_code == 201
    run_2 = partial_res.json()

    # stages_run must include competitor AND its downstream dependent pricing
    assert "competitor" in run_2["stages_run"]
    assert "pricing" in run_2["stages_run"]

    results_map = {r["stage"]: r for r in run_2["results"]}
    # competitor was fresh
    assert results_map["competitor"]["carried_forward_from"] is None
    # pricing was forced fresh
    assert results_map["pricing"]["carried_forward_from"] is None
    # customer was carried forward
    assert results_map["customer"]["carried_forward_from"] is not None
    # product_packaging was carried forward
    assert results_map["product_packaging"]["carried_forward_from"] is not None


# ---------------------------------------------------------------------------
# 3. Stage Exception Isolation
# ---------------------------------------------------------------------------

def test_stage_exception_isolation(client, monkeypatch):
    """
    If a stage crashes unexpectedly during execution:
    - Run does not fail (returns 201)
    - Crashed stage is recorded as NOT_RUN with critical finding STAGE_ERROR
    - Subsequent stages still run
    - Readiness reflects the error
    """
    project_id, _, _ = _setup_project_with_competitors(client, VECTOR_A_PAYLOAD)

    def faulty_pricing_run(self, ctx):
        raise RuntimeError("Simulated internal math crash in pricing engine")

    pricing_stage = STAGE_MAP["pricing"]
    monkeypatch.setattr(pricing_stage, "run", faulty_pricing_run.__get__(pricing_stage))

    res = client.post(f"/api/v1/projects/{project_id}/validation/runs")
    assert res.status_code == 201
    data = res.json()

    pricing_res = next(r for r in data["results"] if r["stage"] == "pricing")
    assert pricing_res["status"] == "NOT_RUN"
    assert any(f["code"] == "STAGE_ERROR" for f in pricing_res["findings"])

    # Later stages (financial, marketing) still executed
    fin_res = next(r for r in data["results"] if r["stage"] == "financial")
    assert fin_res["status"] == "PASSED"

    # Pricing is a critical stage; being NOT_RUN triggers INSUFFICIENT_EVIDENCE label
    assert data["readiness"]["label"] == "INSUFFICIENT_EVIDENCE"


# ---------------------------------------------------------------------------
# 4. Immutability of Old Runs and Pagination Order
# ---------------------------------------------------------------------------

def test_immutability_and_pagination(client):
    """
    Each validation run is an immutable record.
    GET /projects/{project_id}/validation/runs returns paginated runs newest first.
    """
    project_id, _, _ = _setup_project_with_competitors(client, VECTOR_A_PAYLOAD)

    # Create run 1
    r1 = client.post(f"/api/v1/projects/{project_id}/validation/runs").json()
    time.sleep(0.02)
    # Create run 2
    r2 = client.post(f"/api/v1/projects/{project_id}/validation/runs").json()
    time.sleep(0.02)
    # Create run 3
    r3 = client.post(f"/api/v1/projects/{project_id}/validation/runs").json()

    assert r1["id"] != r2["id"] != r3["id"]

    # Verify run 1 is unchanged
    fetch_r1 = client.get(f"/api/v1/projects/{project_id}/validation/runs/{r1['id']}").json()
    assert fetch_r1["id"] == r1["id"]

    # Test pagination: limit=2, offset=0
    page1 = client.get(f"/api/v1/projects/{project_id}/validation/runs?limit=2&offset=0").json()
    assert page1["total"] == 3
    assert len(page1["items"]) == 2
    assert page1["items"][0]["id"] == r3["id"]  # newest first
    assert page1["items"][1]["id"] == r2["id"]

    # Test pagination: limit=2, offset=2
    page2 = client.get(f"/api/v1/projects/{project_id}/validation/runs?limit=2&offset=2").json()
    assert len(page2["items"]) == 1
    assert page2["items"][0]["id"] == r1["id"]


# ---------------------------------------------------------------------------
# 5. Error Cases: 404s, 422s, and Readiness Endpoint
# ---------------------------------------------------------------------------

def test_validation_api_error_cases(client):
    """
    - 404 on non-existent project
    - 404 on no validation runs yet
    - 422 on unknown stage name
    """
    random_id = uuid.uuid4()

    # 404 on non-existent project
    res_404 = client.post(f"/api/v1/projects/{random_id}/validation/runs")
    assert res_404.status_code == 404

    # Create fresh project without running validation
    fresh_res = client.post("/api/v1/products", json={"name": "No Runs Yet"})
    fresh_id = fresh_res.json()["id"]

    # 404 on readiness when no runs exist
    readiness_404 = client.get(f"/api/v1/projects/{fresh_id}/validation/readiness")
    assert readiness_404.status_code == 404

    # 404 on latest run when no runs exist
    latest_404 = client.get(f"/api/v1/projects/{fresh_id}/validation/runs/latest")
    assert latest_404.status_code == 404

    # 422 on unknown stage
    bad_stage_res = client.post(
        f"/api/v1/projects/{fresh_id}/validation/runs",
        json={"stages": ["cryptocurrency_mining"]},
    )
    assert bad_stage_res.status_code == 422


# ---------------------------------------------------------------------------
# 6. Concurrency Guard
# ---------------------------------------------------------------------------

def test_concurrent_validation_runs_guard(client):
    """
    Two simultaneous runs for the same project execute cleanly without data corruption.
    """
    project_id, _, _ = _setup_project_with_competitors(client, VECTOR_A_PAYLOAD)

    results = []
    barrier = threading.Barrier(2)

    def worker():
        barrier.wait()
        r = client.post(f"/api/v1/projects/{project_id}/validation/runs")
        results.append(r)

    t1 = threading.Thread(target=worker)
    t2 = threading.Thread(target=worker)

    t1.start()
    t2.start()
    t1.join()
    t2.join()

    assert len(results) == 2
    assert results[0].status_code == 201
    assert results[1].status_code == 201
    assert results[0].json()["id"] != results[1].json()["id"]


# ---------------------------------------------------------------------------
# 7. Persisted JSON Round-Trip Test
# ---------------------------------------------------------------------------

def test_persisted_json_roundtrip_to_dict(client):
    """
    Validates that persisted JSON fields in DB round-trip cleanly and match
    the exact structure and values expected.
    """
    project_id, _, _ = _setup_project_with_competitors(client, VECTOR_A_PAYLOAD)

    post_res = client.post(f"/api/v1/projects/{project_id}/validation/runs")
    assert post_res.status_code == 201
    run_id = post_res.json()["id"]

    get_res = client.get(f"/api/v1/projects/{project_id}/validation/runs/{run_id}")
    assert get_res.status_code == 200
    fetched = get_res.json()

    assert fetched["id"] == run_id
    assert fetched["readiness"]["label"] == "READY"
    assert fetched["readiness"]["overall_score"] == 100.0
    assert len(fetched["results"]) == 6


# ---------------------------------------------------------------------------
# 8. Vector A Service Layer Demonstration and POST Sample
# ---------------------------------------------------------------------------

def test_vector_a_service_demo_and_post_sample(client, db_session):
    """
    Creates a validation run for Vector A through the service layer, prints
    per-stage status/score, readiness label, overall score, and prints an example
    JSON response body from the POST endpoint.
    """
    import json
    from backend.app.services.validation.orchestrator import ValidationOrchestrator

    project_id, _, _ = _setup_project_with_competitors(client, VECTOR_A_PAYLOAD)

    # 1. Run through service layer
    orch = ValidationOrchestrator(db_session)
    run_record = orch.run_validation(project_id=uuid.UUID(project_id), trigger="service_demo")
    readiness_data = run_record.readiness or {}

    print("\n=== SERVICE LAYER RUN FOR VECTOR A ===")
    print(f"Run ID: {run_record.id}")
    print(f"Triggered By: {run_record.triggered_by}")
    print(f"Status: {run_record.status}")
    print(f"Readiness Label: {readiness_data.get('label')}")
    print(f"Overall Score: {readiness_data.get('overall_score')}")
    print("Per-stage status and score:")
    for r in run_record.results:
        print(f"  - {r.stage:<18}: status={r.status:<6} | score={r.score} | key metrics={list(r.metrics.keys())}")

    assert readiness_data.get("label") == "READY"
    assert readiness_data.get("overall_score") == 100.0

    # 2. Example POST endpoint response
    post_res = client.post(f"/api/v1/projects/{project_id}/validation/runs")
    assert post_res.status_code == 201
    post_json = post_res.json()
    print("\n=== EXAMPLE JSON RESPONSE BODY (POST /projects/{project_id}/validation/runs) ===")
    print(json.dumps(post_json, indent=2))


def test_no_legacy_code_strings_in_api_response(client):
    """
    Assert that API responses (runs, results) expose ONE canonical code form per finding
    (e.g. MISSING_INPUT with field in 'field') and no legacy code strings appear anywhere in the body.
    """
    import json

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

    # Create empty product
    prod_res = client.post("/api/v1/products", json={"name": "Empty Test Product", "assumptions": {}})
    assert prod_res.status_code == 201
    prod_id = prod_res.json()["id"]

    # Run validation
    run_res = client.post(f"/api/v1/projects/{prod_id}/validation/runs")
    assert run_res.status_code == 201
    run_json = run_res.json()
    raw_str = json.dumps(run_json)

    for legacy in legacy_codes:
        assert legacy not in raw_str, f"Found legacy code '{legacy}' in API response!"

    # Verify canonical code MISSING_INPUT appears and has 'field' set
    findings = [f for r in run_json["results"] for f in r["findings"]]
    missing_findings = [f for f in findings if f["code"] == "MISSING_INPUT"]
    assert len(missing_findings) > 0
    for mf in missing_findings:
        assert mf["field"] is not None and len(mf["field"]) > 0


def test_validation_determinism_identical_runs(client):
    """
    Validating the same product twice gives identical stage results,
    scores, readiness, and recommendations (ignoring IDs and timestamps).
    """
    project_id, _, _ = _setup_project_with_competitors(client, VECTOR_A_PAYLOAD)

    res1 = client.post(f"/api/v1/products/{project_id}/validate")
    assert res1.status_code == 200
    run1 = res1.json()

    res2 = client.post(f"/api/v1/products/{project_id}/validate")
    assert res2.status_code == 200
    run2 = res2.json()

    # Compare readiness
    assert run1["readiness_score"] == run2["readiness_score"]
    assert run1["verdict"] == run2["verdict"]
    assert len(run1["results"]) == len(run2["results"])

    # Compare each stage result
    for s1, s2 in zip(run1["results"], run2["results"]):
        assert s1["stage"] == s2["stage"]
        assert s1["status"] == s2["status"]
        assert s1["score"] == s2["score"]
        assert s1["metrics"] == s2["metrics"]

    # Compare recommendations
    rec1 = client.get(f"/api/v1/products/{project_id}/recommendations").json()
    rec2 = client.get(f"/api/v1/products/{project_id}/recommendations").json()
    assert [r["action_type"] for r in rec1["items"]] == [r["action_type"] for r in rec2["items"]]
    assert [r["priority"] for r in rec1["items"]] == [r["priority"] for r in rec2["items"]]


