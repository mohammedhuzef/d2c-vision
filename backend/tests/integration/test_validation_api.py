"""Integration and contract tests for Validation API, carry-forward, immutability, and simulation."""

from concurrent.futures import ThreadPoolExecutor
from decimal import Decimal
import json
from pathlib import Path
from typing import Optional
import uuid
import jsonschema
import pytest
from sqlalchemy import text

from sqlalchemy.exc import DBAPIError

from backend.app.models.analysis import CompetitorAnalysis
from backend.app.models.competitor import Competitor
from backend.app.models.evidence import ResearchEvidence
from backend.app.models.product import Product
from backend.app.models.recommendation import Recommendation
from backend.app.models.validation import ValidationResult, ValidationRun
from backend.app.repositories.product_repository import ProductRepository
from scripts.run_stages_vector_a import get_vector_a_assumptions

ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
OPENAPI_PATH = ROOT_DIR / "contracts" / "openapi.json"
ROUTES_LOCK_PATH = ROOT_DIR / "contracts" / "routes.lock.json"


@pytest.fixture(scope="module")
def openapi_spec():
    with open(OPENAPI_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture(scope="module")
def routes_lock():
    with open(ROUTES_LOCK_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def validate_against_schema(data: dict, schema_ref: str, spec: dict):
    """Validates data against a schema in OpenAPI components."""
    schema_name = schema_ref.split("/")[-1]
    schema = spec["components"]["schemas"][schema_name]
    resolver = jsonschema.RefResolver.from_schema(spec)
    jsonschema.validate(instance=data, schema=schema, resolver=resolver)


def _fmt_id(val: uuid.UUID, dialect_name: str):
    return val.hex if dialect_name == "sqlite" else str(val)


def seed_vector_a_data(client, db_session, price: float = 500.0, packaging_cost: float = 30.0, target_margin: Optional[float] = None):
    """Seeds a product with Vector A assumptions and 2 competitors with evidence."""
    assumptions = get_vector_a_assumptions()
    assumptions["pricing"]["selling_price"] = price
    assumptions["packaging"]["packaging_cost"] = packaging_cost
    if target_margin is not None:
        assumptions["pricing"]["target_margin_fraction"] = target_margin

    create_resp = client.post("/api/v1/products", json={"name": "Vector A Product", "assumptions": assumptions})
    assert create_resp.status_code == 201
    prod_data = create_resp.json()
    product_id = uuid.UUID(prod_data["id"])

    # Add 2 competitors with observed prices 450.00 and 550.00
    comp1 = Competitor(
        id=uuid.uuid4(),
        product_id=product_id,
        name="Competitor Alpha",
        website_url="https://alpha.example.com",
    )
    comp2 = Competitor(
        id=uuid.uuid4(),
        product_id=product_id,
        name="Competitor Beta",
        website_url="https://beta.example.com",
    )
    db_session.add(comp1)
    db_session.add(comp2)
    db_session.commit()

    # Add research evidence for both competitors
    ev1 = ResearchEvidence(
        id=uuid.uuid4(),
        product_id=product_id,
        competitor_id=comp1.id,
        content_hash="hash1",
        source_type="website",
        title="Alpha price evidence",
        excerpt="Alpha price is 450",
    )
    ev2 = ResearchEvidence(
        id=uuid.uuid4(),
        product_id=product_id,
        competitor_id=comp2.id,
        content_hash="hash2",
        source_type="website",
        title="Beta price evidence",
        excerpt="Beta price is 550",
    )
    db_session.add(ev1)
    db_session.add(ev2)
    db_session.commit()

    # Add competitor analyses
    analysis1 = CompetitorAnalysis(
        id=uuid.uuid4(),
        product_id=product_id,
        competitor_id=comp1.id,
        summary="Alpha analysis summary",
        price_observed=Decimal("450.00"),
        evidence_ids=[ev1.id],
    )
    analysis2 = CompetitorAnalysis(
        id=uuid.uuid4(),
        product_id=product_id,
        competitor_id=comp2.id,
        summary="Beta analysis summary",
        price_observed=Decimal("550.00"),
        evidence_ids=[ev2.id],
    )
    db_session.add(analysis1)
    db_session.add(analysis2)
    db_session.commit()

    return str(product_id)


def test_routes_lock_conformance(openapi_spec, routes_lock):
    """Confirm the route set for this day equals the routes.lock entries."""
    openapi_routes = set()
    for path, path_item in openapi_spec.get("paths", {}).items():
        for method in path_item.keys():
            if method.upper() not in ("HEAD", "OPTIONS"):
                openapi_routes.add(f"{method.upper()} {path}")

    lock_routes = [f"{e['method']} {e['path']}" for e in routes_lock]
    val_lock = [r for r in lock_routes if any(k in r for k in ['validate', 'validation', 'recommendations', 'simulate'])]

    for r in val_lock:
        assert r in openapi_routes, f"Locked route {r} missing from OpenAPI paths"


def test_vector_a_end_to_end(client, db_session, openapi_spec):
    """Vector A end to end through API with 2 competitors: all 6 PASSED, score 100, READY, financial metrics match."""
    prod_id = seed_vector_a_data(client, db_session, price=500.0, packaging_cost=30.0)

    # 1. POST /api/v1/products/{id}/validate
    val_resp = client.post(f"/api/v1/products/{prod_id}/validate")
    assert val_resp.status_code == 200
    val_data = val_resp.json()
    validate_against_schema(val_data, "#/components/schemas/ValidationRunResponse", openapi_spec)

    assert val_data["verdict"] == "READY"
    assert val_data["readiness_score"] == 100.0

    # Verify stage results
    results_map = {r["stage"]: r for r in val_data["results"]}
    assert len(results_map) == 6
    for stage_name, res in results_map.items():
        assert res["status"] == "PASSED", f"Stage {stage_name} expected PASSED, got {res['status']}"
        assert res["score"] == 100.0, f"Stage {stage_name} expected score 100.0, got {res['score']}"

    # Verify financial stage hand-calculated metrics: 230.00 / 270.00 / 0.5400 / 186
    fin_metrics = results_map["financial"]["metrics"]
    assert float(fin_metrics["variable_cost_per_unit"]) == 230.00
    assert float(fin_metrics["contribution_per_unit"]) == 270.00
    assert float(fin_metrics["contribution_margin"]) == 0.5400
    assert fin_metrics["break_even_units"] == 186

    # 2. GET /api/v1/products/{id}/validation/readiness
    readiness_resp = client.get(f"/api/v1/products/{prod_id}/validation/readiness")
    assert readiness_resp.status_code == 200
    readiness_data = readiness_resp.json()
    validate_against_schema(readiness_data, "#/components/schemas/ReadinessResponse", openapi_spec)
    assert readiness_data["label"] == "READY"
    assert readiness_data["overall_score"] == 100.0

    # 3. GET /api/v1/products/{id} ProductDetailResponse check
    detail_resp = client.get(f"/api/v1/products/{prod_id}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["validated_version"] == 1
    assert detail["revalidation_required"] is False
    assert detail["latest_readiness"]["label"] == "READY"
    assert detail["latest_readiness"]["score"] == 100.0
    assert detail["competitors_count"] == 2
    assert detail["missing_evidence_count"] == 0
    assert len(detail["stage_statuses"]) == 6


def test_patch_packaging_with_revalidate_carry_forward(client, db_session, openapi_spec):
    """PATCH packaging 30 -> 60 with revalidate=true re-executes 4 stages, carries 2 forward, updates financial."""
    prod_id = seed_vector_a_data(client, db_session, price=500.0, packaging_cost=30.0)

    # Initial full validation run 1
    init_run_resp = client.post(f"/api/v1/products/{prod_id}/validate")
    assert init_run_resp.status_code == 200
    run_1_data = init_run_resp.json()
    run_1_id = run_1_data["run_id"]

    # Query DB to get run 1 result IDs for customer and competitor
    run_1_db = db_session.query(ValidationRun).filter(ValidationRun.id == uuid.UUID(run_1_id)).first()
    cust_res_1 = next(r for r in run_1_db.results if r.stage == "customer")
    comp_res_1 = next(r for r in run_1_db.results if r.stage == "competitor")

    # PATCH packaging.packaging_cost to 60 with revalidate=true
    patch_payload = {
        "patch": {"packaging": {"packaging_cost": 60.0}},
        "revalidate": True,
    }
    patch_resp = client.patch(f"/api/v1/products/{prod_id}/assumptions", json=patch_payload)
    assert patch_resp.status_code == 200
    patch_data = patch_resp.json()
    validate_against_schema(patch_data, "#/components/schemas/AssumptionsPatchResponse", openapi_spec)

    assert patch_data["new_version"] == 2
    assert patch_data["changed_fields"] == ["packaging.packaging_cost"]
    assert set(patch_data["affected_stages"]) == {"product_packaging", "pricing", "financial", "marketing"}
    assert patch_data["impact_event"] is not None
    assert patch_data["impact_event"]["rerun_run_id"] is not None
    rerun_id = patch_data["impact_event"]["rerun_run_id"]
    assert rerun_id != run_1_id

    # Check results in AssumptionsPatchResponse
    assert patch_data["results"] is not None
    results_map_2 = {r["stage"]: r for r in patch_data["results"]}

    # Hand-calculated financial metrics for v2: 260.00 / 240.00 / 0.4800 / 209
    fin_metrics_2 = results_map_2["financial"]["metrics"]
    assert float(fin_metrics_2["variable_cost_per_unit"]) == 260.00
    assert float(fin_metrics_2["contribution_per_unit"]) == 240.00
    assert float(fin_metrics_2["contribution_margin"]) == 0.4800
    assert fin_metrics_2["break_even_units"] == 209

    # Verify carried-forward stages: customer and competitor carried_forward_from must match run 1 result ids
    assert results_map_2["customer"]["carried_forward_from"] == str(cust_res_1.id)
    assert results_map_2["competitor"]["carried_forward_from"] == str(comp_res_1.id)
    assert results_map_2["product_packaging"]["carried_forward_from"] is None
    assert results_map_2["financial"]["carried_forward_from"] is None

    # Verify Product Detail shows validated_version == current_version == 2
    detail_resp = client.get(f"/api/v1/products/{prod_id}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["current_version"] == 2
    assert detail["validated_version"] == 2
    assert detail["revalidation_required"] is False

    # Verify run 1 is untouched
    run_1_check = client.get(f"/api/v1/products/{prod_id}/validation/runs/{run_1_id}")
    assert run_1_check.status_code == 200
    run_1_body = run_1_check.json()
    fin_1 = next(r for r in run_1_body["results"] if r["stage"] == "financial")
    assert float(fin_1["metrics"]["variable_cost_per_unit"]) == 230.00


def test_underpriced_case_not_ready(client, db_session, openapi_spec):
    """Underpriced case (price 260, band 450/550): pricing FAILED, marketing FAILED (ratio 1.7241), financial PASSED, verdict NOT_READY."""
    prod_id = seed_vector_a_data(client, db_session, price=260.0, packaging_cost=30.0, target_margin=0.10)

    val_resp = client.post(f"/api/v1/products/{prod_id}/validate")
    assert val_resp.status_code == 200
    val_data = val_resp.json()

    results_map = {r["stage"]: r for r in val_data["results"]}

    # Pricing failed
    assert results_map["pricing"]["status"] == "FAILED"
    # Marketing failed with ratio 1.7241
    assert results_map["marketing"]["status"] == "FAILED"
    assert float(results_map["marketing"]["metrics"]["cac_to_contribution_ratio"]) == 1.7241
    # Financial passed
    assert results_map["financial"]["status"] == "PASSED"
    # Overall verdict is NOT_READY and score is 79.00
    assert val_data["verdict"] == "NOT_READY"
    assert val_data["readiness_score"] == 79.00


def test_evidence_poor_case(client, db_session, openapi_spec):
    """Evidence-poor case (3 interviews, 1 competitor): customer & competitor INSUFFICIENT_EVIDENCE, scores null, verdict READY_WITH_WARNINGS."""
    assumptions = get_vector_a_assumptions()
    assumptions["customer"]["customer_interviews_count"] = 3

    create_resp = client.post("/api/v1/products", json={"name": "Evidence Poor Product", "assumptions": assumptions})
    assert create_resp.status_code == 201
    prod_id = create_resp.json()["id"]

    # Seed 1 competitor
    comp = Competitor(
        id=uuid.uuid4(),
        product_id=uuid.UUID(prod_id),
        name="Solo Competitor",
        website_url="https://solo.example.com",
    )
    db_session.add(comp)
    db_session.commit()

    val_resp = client.post(f"/api/v1/products/{prod_id}/validate")
    assert val_resp.status_code == 200
    val_data = val_resp.json()

    results_map = {r["stage"]: r for r in val_data["results"]}
    assert results_map["customer"]["status"] == "INSUFFICIENT_EVIDENCE"
    assert results_map["customer"]["score"] is None
    assert results_map["competitor"]["status"] == "INSUFFICIENT_EVIDENCE"
    assert results_map["competitor"]["score"] is None

    assert val_data["verdict"] == "READY_WITH_WARNINGS"


def test_immutability_validation_runs(client, db_session):
    """Raw SQL UPDATE and DELETE on validation_runs rejected; no code path updates a run after insert."""
    prod_id = seed_vector_a_data(client, db_session)
    val_resp = client.post(f"/api/v1/products/{prod_id}/validate")
    assert val_resp.status_code == 200
    run_id = val_resp.json()["run_id"]
    run_uuid = uuid.UUID(run_id)
    dialect_name = db_session.bind.dialect.name
    fmt_run_id = _fmt_id(run_uuid, dialect_name)

    # 1. Raw SQL UPDATE attempt must be rejected by trigger
    with pytest.raises(DBAPIError) as exc_update:
        db_session.execute(
            text("UPDATE validation_runs SET verdict = 'MODIFIED' WHERE id = :id"),
            {"id": fmt_run_id},
        )
        db_session.commit()
    db_session.rollback()
    assert "immutable" in str(exc_update.value).lower()

    # 2. Raw SQL DELETE attempt must be rejected by trigger
    with pytest.raises(DBAPIError) as exc_delete:
        db_session.execute(
            text("DELETE FROM validation_runs WHERE id = :id"),
            {"id": fmt_run_id},
        )
        db_session.commit()
    db_session.rollback()
    assert "immutable" in str(exc_delete.value).lower()

    # 3. ORM-level update attempt must be rejected by before_update listener
    run_obj = db_session.query(ValidationRun).filter(ValidationRun.id == run_uuid).first()
    assert run_obj is not None
    run_obj.verdict = "MODIFIED"
    with pytest.raises(ValueError) as exc_orm:
        db_session.flush()
    db_session.rollback()
    assert "immutable" in str(exc_orm.value).lower()

    # Confirm run is still in its original state
    run_in_db = db_session.query(ValidationRun).filter(ValidationRun.id == run_uuid).first()
    assert run_in_db is not None
    assert run_in_db.verdict == "READY"


def test_concurrency_validation_runs(client, db_session):
    """Two simultaneous validate calls on one product both succeed with distinct runs."""
    prod_id = seed_vector_a_data(client, db_session)

    def trigger_validate():
        return client.post(f"/api/v1/products/{prod_id}/validate")

    with ThreadPoolExecutor(max_workers=2) as executor:
        future1 = executor.submit(trigger_validate)
        future2 = executor.submit(trigger_validate)
        resp1 = future1.result()
        resp2 = future2.result()

    assert resp1.status_code == 200
    assert resp2.status_code == 200
    id1 = resp1.json()["run_id"]
    id2 = resp2.json()["run_id"]
    assert id1 != id2

    # Check total runs in list is 2
    list_resp = client.get(f"/api/v1/products/{prod_id}/validation/runs")
    assert list_resp.status_code == 200
    assert list_resp.json()["total"] == 2


def test_simulation_stateless(client, db_session, openapi_spec):
    """Simulate creates zero DB rows; raising price to recommended value moves pricing WARNING to PASSED."""
    # Price 300 produces realized margin 24.66% < 40% target -> WARNING
    prod_id = seed_vector_a_data(client, db_session, price=300.0)

    # Count rows before simulation
    runs_before = db_session.query(ValidationRun).count()
    results_before = db_session.query(ValidationResult).count()

    sim_payload = {
        "overrides": {
            "selling_price": "500.00"
        }
    }
    sim_resp = client.post(f"/api/v1/products/{prod_id}/simulate", json=sim_payload)
    assert sim_resp.status_code == 200
    sim_data = sim_resp.json()
    validate_against_schema(sim_data, "#/components/schemas/SimulationResponse", openapi_spec)

    # Check that rows count did not change
    assert db_session.query(ValidationRun).count() == runs_before
    assert db_session.query(ValidationResult).count() == results_before

    # Verify baseline vs simulated pricing status
    base_pricing = sim_data["baseline"]["stages"]["pricing"]
    sim_pricing = sim_data["simulated"]["stages"]["pricing"]
    assert base_pricing["status"] == "WARNING"
    assert sim_pricing["status"] == "PASSED"


def test_aliases_return_identical_bodies(client, db_session):
    """/projects/... endpoints return identical bodies to /products/... endpoints."""
    prod_id = seed_vector_a_data(client, db_session)
    client.post(f"/api/v1/products/{prod_id}/validate")

    # 1. Readiness
    p_readiness = client.get(f"/api/v1/products/{prod_id}/validation/readiness").json()
    proj_readiness = client.get(f"/api/v1/projects/{prod_id}/validation/readiness").json()
    assert p_readiness == proj_readiness

    # 2. Runs list
    p_runs = client.get(f"/api/v1/products/{prod_id}/validation/runs").json()
    proj_runs = client.get(f"/api/v1/projects/{prod_id}/validation/runs").json()
    assert p_runs == proj_runs

    # 3. Latest run
    p_latest = client.get(f"/api/v1/products/{prod_id}/validation/runs/latest").json()
    proj_latest = client.get(f"/api/v1/projects/{prod_id}/validation/runs/latest").json()
    assert p_latest == proj_latest

    # 4. Latest recommendations
    p_recs = client.get(f"/api/v1/products/{prod_id}/validation/runs/latest/recommendations").json()
    proj_recs = client.get(f"/api/v1/projects/{prod_id}/validation/runs/latest/recommendations").json()
    assert p_recs == proj_recs

    # 5. Run by ID
    run_id = p_latest["id"]
    p_by_id = client.get(f"/api/v1/products/{prod_id}/validation/runs/{run_id}").json()
    proj_by_id = client.get(f"/api/v1/projects/{prod_id}/validation/runs/{run_id}").json()
    assert p_by_id == proj_by_id

    # 6. Run recommendations by ID
    p_recs_by_id = client.get(f"/api/v1/products/{prod_id}/validation/runs/{run_id}/recommendations").json()
    proj_recs_by_id = client.get(f"/api/v1/projects/{prod_id}/validation/runs/{run_id}/recommendations").json()
    assert p_recs_by_id == proj_recs_by_id

    # 7. Simulate alias
    sim_payload = {"overrides": {"selling_price": "480.00"}}
    p_sim = client.post(f"/api/v1/products/{prod_id}/simulate", json=sim_payload).json()
    proj_sim = client.post(f"/api/v1/projects/{prod_id}/validation/simulate", json=sim_payload).json()
    assert p_sim == proj_sim


def test_legacy_recommendations_priority_mapping(client, db_session):
    """Verify legacy recommendations table maps CRITICAL/HIGH to 'high', MEDIUM to 'medium', LOW to 'low'."""
    prod_id = seed_vector_a_data(client, db_session, price=260.0)  # Will produce recommendations
    val_resp = client.post(f"/api/v1/products/{prod_id}/validate")
    assert val_resp.status_code == 200

    legacy_recs = db_session.query(Recommendation).filter(Recommendation.product_id == uuid.UUID(prod_id)).all()
    assert len(legacy_recs) > 0

    valid_db_priorities = {"high", "medium", "low"}
    for rec in legacy_recs:
        assert rec.priority in valid_db_priorities, f"Invalid legacy priority: {rec.priority}"

    # Also test GET /api/v1/products/{id}/recommendations
    resp = client.get(f"/api/v1/products/{prod_id}/recommendations")
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert len(items) == len(legacy_recs)
    for it in items:
        assert it["priority"] in valid_db_priorities
