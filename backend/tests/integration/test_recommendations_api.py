"""Integration tests for Validation Runs Recommendations API.

Tests:
- POST a run, then fetch recommendations by latest and by run_id
- Query filters: priority and stage
- 404 when no run exists
- 422 on invalid filter values
- Recommendations persisted and identical on re-fetch
- Historical run recommendations preserved when new run is executed
- Legacy GET /products/{id}/recommendations endpoint backwards-compatibility
"""

from decimal import Decimal
import uuid
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app

STRUGGLING_PAYLOAD = {
    "name": "Struggling Product",
    "assumptions": {
        "customer": {
            "target_customer": "Coffee Drinkers",
            "problem_statement": "Spills while driving",
            "customer_interviews_count": 3,
        },
        "product": {
            "differentiation_vs_competitors": "",
        },
        "packaging": {
            "material": "Cardboard",
            "packaging_cost": 20.00,
        },
        "pricing": {
            "selling_price": 100.00,
            "target_margin_fraction": 0.40,
        },
        "costs": {
            "cogs_per_unit": 60.00,
            "packaging_cost": 20.00,
            "shipping_cost_per_unit": 10.00,
            "payment_fee_fraction": 0.02,
            "fixed_costs_total": 50000.00,
        },
        "marketing": {
            "channels": ["Meta Ads"],
            "expected_cac": 30.00,
        },
    },
}

HEALTHY_PAYLOAD = {
    "name": "Healthy Product",
    "assumptions": {
        "customer": {
            "target_customer": "Office Workers",
            "problem_statement": "Cold tea",
            "customer_interviews_count": 10,
        },
        "product": {
            "differentiation_vs_competitors": "Unique Smart Warmer",
        },
        "packaging": {
            "material": "Recycled Box",
            "packaging_cost": 5.00,
        },
        "pricing": {
            "selling_price": 200.00,
            "target_margin_fraction": 0.40,
        },
        "costs": {
            "cogs_per_unit": 40.00,
            "packaging_cost": 5.00,
            "shipping_cost_per_unit": 10.00,
            "payment_fee_fraction": 0.02,
            "fixed_costs_total": 10000.00,
        },
        "marketing": {
            "channels": ["Search Ads"],
            "expected_cac": 20.00,
        },
    },
}


def _create_product_with_competitors(client: TestClient, payload: dict) -> str:
    res = client.post("/api/v1/products", json=payload)
    assert res.status_code == 201
    prod_id = res.json()["id"]

    # Add 2 competitors with pricing
    client.post(
        f"/api/v1/products/{prod_id}/competitors",
        json={"name": "Comp A", "price_observed": 110.00},
    )
    client.post(
        f"/api/v1/products/{prod_id}/competitors",
        json={"name": "Comp B", "price_observed": 120.00},
    )
    return prod_id


def test_post_run_and_fetch_recommendations_latest_and_by_id(client):
    """
    POST a validation run, then fetch recommendations by /runs/latest/recommendations
    and /runs/{run_id}/recommendations. Both project and product routes.
    """
    prod_id = _create_product_with_competitors(client, STRUGGLING_PAYLOAD)

    # Trigger run
    run_res = client.post(f"/api/v1/projects/{prod_id}/validation/runs")
    assert run_res.status_code == 201
    run_json = run_res.json()
    run_id = run_json["id"]

    # Verify recommendations summary count inside run response
    assert "recommendations" in run_json
    summary = run_json["recommendations"]
    assert isinstance(summary, dict)
    assert "CRITICAL" in summary
    assert "HIGH" in summary
    assert "MEDIUM" in summary
    assert "LOW" in summary

    # Fetch latest via projects router
    latest_res = client.get(f"/api/v1/projects/{prod_id}/validation/runs/latest/recommendations")
    assert latest_res.status_code == 200
    latest_data = latest_res.json()

    assert latest_data["run_id"] == run_id
    assert latest_data["project_id"] == prod_id
    assert latest_data["total"] > 0
    assert len(latest_data["items"]) == latest_data["total"]
    assert isinstance(latest_data["counts_by_priority"], dict)

    # Fetch by run_id via projects router
    run_rec_res = client.get(f"/api/v1/projects/{prod_id}/validation/runs/{run_id}/recommendations")
    assert run_rec_res.status_code == 200
    assert run_rec_res.json() == latest_data

    # Fetch via products router alias
    prod_latest_res = client.get(f"/api/v1/products/{prod_id}/validation/runs/latest/recommendations")
    assert prod_latest_res.status_code == 200
    assert prod_latest_res.json() == latest_data

    prod_id_res = client.get(f"/api/v1/products/{prod_id}/validation/runs/{run_id}/recommendations")
    assert prod_id_res.status_code == 200
    assert prod_id_res.json() == latest_data


def test_recommendations_filtering_priority_and_stage(client):
    """
    Test optional query filters: priority and stage.
    """
    prod_id = _create_product_with_competitors(client, STRUGGLING_PAYLOAD)
    client.post(f"/api/v1/projects/{prod_id}/validation/runs")

    # Filter priority=CRITICAL
    crit_res = client.get(f"/api/v1/projects/{prod_id}/validation/runs/latest/recommendations?priority=CRITICAL")
    assert crit_res.status_code == 200
    crit_items = crit_res.json()["items"]
    assert len(crit_items) > 0
    assert all(r["priority"] == "CRITICAL" for r in crit_items)

    # Filter priority=medium (case-insensitive)
    med_res = client.get(f"/api/v1/projects/{prod_id}/validation/runs/latest/recommendations?priority=medium")
    assert med_res.status_code == 200
    med_items = med_res.json()["items"]
    assert all(r["priority"] == "MEDIUM" for r in med_items)

    # Filter stage=pricing
    pricing_res = client.get(f"/api/v1/projects/{prod_id}/validation/runs/latest/recommendations?stage=pricing")
    assert pricing_res.status_code == 200
    pricing_items = pricing_res.json()["items"]
    assert len(pricing_items) > 0
    assert all(r["stage"] == "pricing" for r in pricing_items)

    # Combined filter
    combined_res = client.get(
        f"/api/v1/projects/{prod_id}/validation/runs/latest/recommendations?priority=CRITICAL&stage=pricing"
    )
    assert combined_res.status_code == 200
    comb_items = combined_res.json()["items"]
    assert all(r["priority"] == "CRITICAL" and r["stage"] == "pricing" for r in comb_items)


def test_recommendations_404_no_run_and_422_invalid_filters(client):
    """
    404 when no run exists, 422 on invalid filter values.
    """
    # Create product with no runs yet
    p_res = client.post("/api/v1/products", json={"name": "No Run Product"})
    no_run_id = p_res.json()["id"]

    # 404 when no run
    no_run_rec = client.get(f"/api/v1/projects/{no_run_id}/validation/runs/latest/recommendations")
    assert no_run_rec.status_code == 404

    # 404 on fake run id
    fake_run_id = str(uuid.uuid4())
    fake_rec = client.get(f"/api/v1/projects/{no_run_id}/validation/runs/{fake_run_id}/recommendations")
    assert fake_rec.status_code == 404

    # Post run so we can test 422 filter validations
    client.post(f"/api/v1/projects/{no_run_id}/validation/runs")

    # 422 on invalid priority
    inv_p = client.get(f"/api/v1/projects/{no_run_id}/validation/runs/latest/recommendations?priority=SUPER_HIGH")
    assert inv_p.status_code == 422

    # 422 on invalid stage
    inv_s = client.get(f"/api/v1/projects/{no_run_id}/validation/runs/latest/recommendations?stage=blockchain_stage")
    assert inv_s.status_code == 422


def test_recommendations_persistence_and_historical_isolation(client):
    """
    Recommendations are persisted atomically with the run.
    Old runs are never mutated when new runs are executed.
    """
    prod_id = _create_product_with_competitors(client, STRUGGLING_PAYLOAD)

    # Run 1 on struggling product
    run1_res = client.post(f"/api/v1/projects/{prod_id}/validation/runs")
    run1_id = run1_res.json()["id"]

    rec1_res = client.get(f"/api/v1/projects/{prod_id}/validation/runs/{run1_id}/recommendations")
    assert rec1_res.status_code == 200
    run1_items = rec1_res.json()["items"]
    assert len(run1_items) > 0

    # Update product to healthy assumptions (version bump)
    patch_res = client.patch(
        f"/api/v1/products/{prod_id}/assumptions",
        json={"patch": HEALTHY_PAYLOAD["assumptions"]},
    )
    assert patch_res.status_code == 200

    # Run 2 on healthy product
    run2_res = client.post(f"/api/v1/projects/{prod_id}/validation/runs")
    run2_id = run2_res.json()["id"]

    rec2_res = client.get(f"/api/v1/projects/{prod_id}/validation/runs/{run2_id}/recommendations")
    assert rec2_res.status_code == 200
    run2_items = rec2_res.json()["items"]
    # Healthy product has fewer or no recommendations
    assert len(run2_items) < len(run1_items)

    # Re-fetch Run 1: must be completely unchanged and preserved
    run1_refetch = client.get(f"/api/v1/projects/{prod_id}/validation/runs/{run1_id}/recommendations")
    assert run1_refetch.status_code == 200
    assert run1_refetch.json()["items"] == run1_items


def test_legacy_recommendations_endpoint_backward_compatibility(client):
    """
    GET /products/{id}/recommendations still works and preserves backwards compatibility.
    """
    prod_id = _create_product_with_competitors(client, STRUGGLING_PAYLOAD)
    client.post(f"/api/v1/projects/{prod_id}/validation/runs")

    legacy_res = client.get(f"/api/v1/products/{prod_id}/recommendations")
    assert legacy_res.status_code == 200
    data = legacy_res.json()
    assert "items" in data
    assert len(data["items"]) > 0
    first = data["items"][0]
    assert "priority" in first
    assert "title" in first
    assert "detail" in first
