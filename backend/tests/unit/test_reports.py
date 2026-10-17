import uuid
import pytest


def test_report_before_validation_raises_bad_state(client):
    prod = client.post("/api/v1/products", json={"name": "Unvalidated Widget"}).json()
    product_id = prod["id"]

    # Calling report before validate must return 409 BAD_STATE
    res = client.post(f"/api/v1/products/{product_id}/reports")
    assert res.status_code == 409
    err = res.json()["error"]
    assert err["code"] == "BAD_STATE"
    assert "validation" in err["message"].lower()


def test_report_generation_after_validation(client):
    prod = client.post(
        "/api/v1/products",
        json={
            "name": "Eco Mug",
            "assumptions": {
                "pricing": {"selling_price": 30.00},
                "packaging": {"material": "Paper", "packaging_cost": 3.00},
                "costs": {"cogs_per_unit": 8.00, "shipping_cost_per_unit": 2.00, "fixed_costs_total": 5000.00},
            }
        }
    ).json()
    product_id = prod["id"]

    # Validate first
    val_res = client.post(f"/api/v1/products/{product_id}/validate")
    assert val_res.status_code == 200

    # Generate report
    rep_res = client.post(f"/api/v1/products/{product_id}/reports")
    assert rep_res.status_code == 201
    rep_data = rep_res.json()
    assert "id" in rep_data
    assert rep_data["product_id"] == product_id
    report_id = rep_data["id"]

    content = rep_data["content"]
    assert content["product_name"] == "Eco Mug"
    assert content["version_number"] == 1
    assert "stage_summaries" in content
    assert "financial_metrics" in content

    md = rep_data["markdown"]
    assert "# Launch-Readiness Report: Eco Mug" in md
    assert "## Executive Verdict:" in md
    assert "### Validation Stage Summary Table" in md
    assert "### Key Unit Economics & Financial Metrics" in md
    assert "### Actionable Recommendations" in md

    # Retrieve report by ID
    get_rep = client.get(f"/api/v1/products/{product_id}/reports/{report_id}")
    assert get_rep.status_code == 200
    assert get_rep.json()["id"] == report_id


def test_report_version_comparison_section(client):
    prod = client.post(
        "/api/v1/products",
        json={
            "name": "Smart Bottle",
            "assumptions": {
                "pricing": {"selling_price": 500.00},
                "packaging": {"material": "Cardboard", "packaging_cost": 30.00},
                "costs": {"cogs_per_unit": 150.00, "shipping_cost_per_unit": 40.00, "fixed_costs_total": 50000.00},
            }
        }
    ).json()
    product_id = prod["id"]

    # Validate v1
    client.post(f"/api/v1/products/{product_id}/validate")

    # Patch packaging cost 30 -> 60 with revalidation
    client.patch(
        f"/api/v1/products/{product_id}/assumptions",
        json={"patch": {"packaging": {"packaging_cost": 60.00}}, "revalidate": True}
    )

    # Generate report for v2
    rep_res = client.post(f"/api/v1/products/{product_id}/reports")
    assert rep_res.status_code == 201
    data = rep_res.json()
    assert data["content"]["version_number"] == 2
    assert data["content"]["version_comparison"] is not None
    assert "### Version Comparison (v1 -> v2)" in data["markdown"]
