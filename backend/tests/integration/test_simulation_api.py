"""Integration tests for What-If Simulation API endpoints.

Step 7 Part B:
Tests:
1. Endpoint 200 success with overrides.
2. Immutability & Zero DB Side Effects: simulate does NOT write to the DB
   (assert validation_runs row count is strictly unchanged).
3. Empty overrides object returns 200 with baseline == simulated and empty changes list.
4. Dual-mounting: works on both /projects/{id}/validation/simulate and /products/{id}/validation/simulate.
5. 404 when project is missing.
6. 422 for invalid overrides (unknown field, negative value, non-numeric value, forbidden extra body fields).
"""

from decimal import Decimal
import uuid
import pytest
from sqlalchemy import func, select
from backend.app.models.validation import ValidationRun


@pytest.fixture
def product_with_vector_a(client):
    """Creates a product seeded with Vector A assumptions."""
    payload = {
        "name": "Simulation Test Tumbler",
        "assumptions": {
            "customer": {
                "target_customer": "Commuters",
                "problem_statement": "Cold drinks get warm",
                "customer_interviews_count": 12,
            },
            "product": {
                "unique_selling_points": ["Triple-wall vacuum insulation"],
                "differentiation_vs_competitors": "Lighter weight and leakproof lid",
            },
            "packaging": {
                "material": "Recycled cardboard box",
                "packaging_cost": "30.00",
            },
            "pricing": {
                "selling_price": "500.00",
                "target_margin_fraction": "0.40",
            },
            "costs": {
                "cogs_per_unit": "150.00",
                "packaging_cost": "30.00",
                "shipping_cost_per_unit": "40.00",
                "payment_fee_fraction": "0.02",
                "fixed_costs_total": "50000.00",
            },
            "marketing": {
                "channels": ["Direct Mail"],
                "expected_cac": "67.50",
                "monthly_budget": "5000.00",
            },
        },
    }
    resp = client.post("/api/v1/products", json=payload)
    assert resp.status_code == 201
    return resp.json()["id"]


def test_simulate_endpoint_200_and_does_not_create_validation_run(client, db_session, product_with_vector_a):
    """
    POST /projects/{id}/validation/simulate returns 200 and does NOT create
    any row in validation_runs (read-only what-if calculation).
    """
    project_id = product_with_vector_a

    # Count runs before simulation
    count_before = db_session.scalar(select(func.count(ValidationRun.id)))

    # Call simulation endpoint
    sim_payload = {
        "overrides": {
            "selling_price": "550.00",
            "packaging_cost": "25.00",
        }
    }
    res = client.post(f"/api/v1/projects/{project_id}/validation/simulate", json=sim_payload)
    assert res.status_code == 200
    data = res.json()

    assert "baseline" in data
    assert "simulated" in data
    assert "deltas" in data
    assert "changes" in data

    # Verify baseline vs simulated values
    assert data["baseline"]["metrics"]["contribution_per_unit"] == "270.00"
    # New selling_price=550.00, cogs=150, pkg=25, ship=40, fee=550*0.02=11 -> var_cost=226 -> contribution=324.00
    assert data["simulated"]["metrics"]["contribution_per_unit"] == "324.00"
    assert data["deltas"]["contribution_per_unit"] == "+54.00"

    # CRITICAL INVARIANT: Row count must be IDENTICAL (zero DB writes)
    count_after = db_session.scalar(select(func.count(ValidationRun.id)))
    assert count_after == count_before, "Simulation must NEVER persist validation_runs rows!"


def test_simulate_endpoint_empty_overrides_returns_empty_changes(client, product_with_vector_a):
    """An empty overrides dict returns baseline == simulated with empty changes list."""
    project_id = product_with_vector_a

    res = client.post(
        f"/api/v1/projects/{project_id}/validation/simulate",
        json={"overrides": {}},
    )
    assert res.status_code == 200
    data = res.json()

    assert data["changes"] == []
    assert data["baseline"]["readiness"] == data["simulated"]["readiness"]
    assert data["baseline"]["metrics"] == data["simulated"]["metrics"]
    assert data["baseline"]["stages"] == data["simulated"]["stages"]


def test_simulate_endpoint_dual_mounting_works_on_both_prefixes(client, product_with_vector_a):
    """
    Dual-mounting contract:
    Both /projects/{id}/validation/simulate and /products/{id}/validation/simulate
    yield identical responses.
    """
    project_id = product_with_vector_a
    body = {"overrides": {"cogs_per_unit": "140.00"}}

    res_proj = client.post(f"/api/v1/projects/{project_id}/validation/simulate", json=body)
    assert res_proj.status_code == 200

    res_prod = client.post(f"/api/v1/products/{project_id}/validation/simulate", json=body)
    assert res_prod.status_code == 200

    assert res_proj.json() == res_prod.json()


def test_simulate_endpoint_404_when_project_missing(client):
    """Returns 404 when project/product UUID does not exist."""
    missing_id = str(uuid.uuid4())
    res = client.post(
        f"/api/v1/projects/{missing_id}/validation/simulate",
        json={"overrides": {}},
    )
    assert res.status_code == 404
    data = res.json()
    assert "error" in data
    assert "not found" in data["error"]["message"].lower()


def test_simulate_endpoint_422_on_invalid_overrides(client, product_with_vector_a):
    """Returns 422 for unknown fields, negative numbers, or invalid strings."""
    project_id = product_with_vector_a

    # 1. Unknown override field
    res1 = client.post(
        f"/api/v1/projects/{project_id}/validation/simulate",
        json={"overrides": {"unknown_input_key": "100.00"}},
    )
    assert res1.status_code == 422

    # 2. Negative override value
    res2 = client.post(
        f"/api/v1/projects/{project_id}/validation/simulate",
        json={"overrides": {"selling_price": "-50.00"}},
    )
    assert res2.status_code == 422

    # 3. Non-numeric override value
    res3 = client.post(
        f"/api/v1/projects/{project_id}/validation/simulate",
        json={"overrides": {"selling_price": "abc"}},
    )
    assert res3.status_code == 422

    # 4. Forbidden extra field in top-level request body
    res4 = client.post(
        f"/api/v1/projects/{project_id}/validation/simulate",
        json={"overrides": {}, "extra_forbidden": "hello"},
    )
    assert res4.status_code == 422
