import uuid
import pytest


def test_full_lifecycle_flow(client):
    # 1. Create product with Vector A assumptions
    create_payload = {
        "name": "LaunchTwin Tumbler",
        "category": "Drinkware",
        "target_market": "Eco-friendly commuters",
        "assumptions": {
            "customer": {
                "target_customer": "Urban commuters",
                "problem_statement": "Single use waste",
                "customer_interviews_count": 10
            },
            "product": {
                "unique_selling_points": ["Thermal insulation"],
                "differentiation_vs_competitors": "Organic bamboo exterior"
            },
            "packaging": {
                "material": "Recycled cardboard",
                "packaging_cost": 30.00
            },
            "pricing": {
                "selling_price": 500.00,
                "target_margin_fraction": 0.40
            },
            "costs": {
                "cogs_per_unit": 150.00,
                "shipping_cost_per_unit": 40.00,
                "packaging_cost": 30.00,
                "payment_fee_fraction": 0.02,
                "fixed_costs_total": 50000.00
            },
            "marketing": {
                "channels": ["Direct", "Search"],
                "expected_cac": 50.00
            }
        }
    }
    prod_resp = client.post("/api/v1/products", json=create_payload)
    assert prod_resp.status_code == 201
    prod_data = prod_resp.json()
    product_id = prod_data["id"]
    assert prod_data["current_version"] == 1

    # 2. Add 2 competitors
    comp_resp = client.post(
        f"/api/v1/products/{product_id}/competitors",
        json={
            "competitors": [
                {"name": "Competitor Alpha", "website_url": "https://alpha.com"},
                {"name": "Competitor Beta", "website_url": "https://beta.com"}
            ]
        }
    )
    assert comp_resp.status_code == 201
    assert len(comp_resp.json()["items"]) == 2

    # 3. Trigger Mock Research
    research_resp = client.post(f"/api/v1/products/{product_id}/research")
    assert research_resp.status_code == 202
    assert research_resp.json()["status"] == "completed"
    assert research_resp.json()["evidence_count"] >= 2

    # 4. Validate Version 1
    val_resp = client.post(f"/api/v1/products/{product_id}/validate")
    assert val_resp.status_code == 200
    val_data = val_resp.json()
    assert len(val_data["results"]) == 6
    assert val_data["version_number"] == 1

    # Check Vector A metrics
    fin_v1 = next(r for r in val_data["results"] if r["stage"] == "financial")
    assert fin_v1["metrics"]["variable_cost_per_unit"] == "230.00"
    assert fin_v1["metrics"]["contribution_per_unit"] == "270.00"
    assert fin_v1["metrics"]["contribution_margin"] == 0.5400
    assert fin_v1["metrics"]["break_even_units"] == 186

    # 5. PATCH packaging_cost 30 -> 60 with revalidate=True
    patch_resp = client.patch(
        f"/api/v1/products/{product_id}/assumptions",
        json={
            "patch": {
                "packaging": {
                    "packaging_cost": 60.00
                }
            },
            "revalidate": True
        }
    )
    assert patch_resp.status_code == 200
    patch_data = patch_resp.json()

    assert patch_data["new_version"] == 2
    assert patch_data["changed_fields"] == ["packaging.packaging_cost"]

    # Affected stages include product_packaging, pricing, financial, marketing
    affected = set(patch_data["affected_stages"])
    assert {"product_packaging", "pricing", "financial", "marketing"}.issubset(affected)

    # Unaffected stages (customer, competitor) are carried forward
    results_v2 = patch_data["results"]
    cust_res = next(r for r in results_v2 if r["stage"] == "customer")
    comp_res = next(r for r in results_v2 if r["stage"] == "competitor")
    assert cust_res["carried_forward_from"] is not None
    assert comp_res["carried_forward_from"] is not None

    # Affected financial metrics match Vector B
    fin_v2 = next(r for r in results_v2 if r["stage"] == "financial")
    assert fin_v2["carried_forward_from"] is None
    assert fin_v2["metrics"]["variable_cost_per_unit"] == "260.00"
    assert fin_v2["metrics"]["contribution_per_unit"] == "240.00"
    assert fin_v2["metrics"]["contribution_margin"] == 0.4800
    assert fin_v2["metrics"]["break_even_units"] == 209

    # Impact event stored
    assert patch_data["impact_event"] is not None
    assert patch_data["impact_event"]["from_version"] == 1
    assert patch_data["impact_event"]["to_version"] == 2

    # 6. Version comparison (1 vs 2)
    compare_resp = client.get(f"/api/v1/products/{product_id}/versions/1/compare/2")
    assert compare_resp.status_code == 200
    comp_data = compare_resp.json()
    fin_deltas = comp_data["stages"]["financial"]["metric_deltas"]
    assert fin_deltas["contribution_margin"]["before"] == 0.54
    assert fin_deltas["contribution_margin"]["after"] == 0.48
    assert fin_deltas["break_even_units"]["before"] == 186
    assert fin_deltas["break_even_units"]["after"] == 209

    # 7. Generate Report
    report_resp = client.post(f"/api/v1/products/{product_id}/reports")
    assert report_resp.status_code == 201
    rep_data = report_resp.json()
    assert rep_data["content"]["version_number"] == 2
    assert "# Launch-Readiness Report" in rep_data["markdown"]


def test_standard_error_cases(client):
    # 1. Unknown assumption fields rejected with 422
    bad_payload = {
        "name": "Bad Assumptions",
        "assumptions": {
            "customer": {
                "unsupported_key_xyz": "value"
            }
        }
    }
    r_bad_field = client.post("/api/v1/products", json=bad_payload)
    assert r_bad_field.status_code == 422
    err = r_bad_field.json()["error"]
    assert err["code"] == "VALIDATION_ERROR"
    assert "request_id" in err

    # 2. Duplicate competitor -> 409 CONFLICT
    p = client.post("/api/v1/products", json={"name": "Comp Dup Test"}).json()
    client.post(f"/api/v1/products/{p['id']}/competitors", json={"competitors": [{"name": "Acme"}]})
    r_dup = client.post(f"/api/v1/products/{p['id']}/competitors", json={"competitors": [{"name": "acme"}]})
    assert r_dup.status_code == 409
    assert r_dup.json()["error"]["code"] == "CONFLICT"

    # 3. Report before validation -> 409 BAD_STATE
    p2 = client.post("/api/v1/products", json={"name": "No Val Test"}).json()
    r_rep = client.post(f"/api/v1/products/{p2['id']}/reports")
    assert r_rep.status_code == 409
    assert r_rep.json()["error"]["code"] == "BAD_STATE"

    # 4. Unknown IDs -> 404 NOT_FOUND
    random_id = str(uuid.uuid4())
    assert client.get(f"/api/v1/products/{random_id}").status_code == 404
    assert client.get(f"/api/v1/products/{random_id}/validation").status_code == 404
    assert client.get(f"/api/v1/products/{random_id}/reports/{random_id}").status_code == 404
