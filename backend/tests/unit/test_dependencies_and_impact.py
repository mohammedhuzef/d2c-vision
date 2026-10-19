import uuid
import pytest
from backend.app.services.dependencies import get_affected_stages, get_direct_stages_for_field
from backend.app.services.versioning import deep_merge, diff_dict_paths


def test_dependency_map_and_closure_for_every_input_group():
    # 1. customer.*
    assert get_affected_stages(["customer.target_customer"]) == ["customer"]
    assert get_affected_stages(["customer.customer_interviews_count"]) == ["customer"]

    # 2. product.*
    aff_product = get_affected_stages(["product.differentiation_vs_competitors"])
    assert "competitor" in aff_product
    assert "product_packaging" in aff_product
    assert "pricing" in aff_product
    assert "financial" in aff_product
    assert "marketing" in aff_product

    # 3. packaging.packaging_cost -> direct {product_packaging, pricing, financial} + downstream {marketing}
    aff_pkg_cost = get_affected_stages(["packaging.packaging_cost"])
    assert aff_pkg_cost == ["product_packaging", "pricing", "financial", "marketing"]

    # 4. packaging.material -> direct product_packaging + downstream pricing, financial, marketing
    aff_pkg_mat = get_affected_stages(["packaging.material"])
    assert "product_packaging" in aff_pkg_mat

    # 5. pricing.selling_price -> product_packaging, pricing, financial, marketing
    aff_price = get_affected_stages(["pricing.selling_price"])
    assert set(aff_price) == {"product_packaging", "pricing", "financial", "marketing"}

    # 6. pricing.target_margin_fraction -> pricing, financial, marketing
    aff_margin = get_affected_stages(["pricing.target_margin_fraction"])
    assert set(aff_margin) == {"pricing", "financial", "marketing"}

    # 7. costs.* -> pricing, financial, marketing
    aff_costs = get_affected_stages(["costs.cogs_per_unit"])
    assert set(aff_costs) == {"pricing", "financial", "marketing"}

    # 8. marketing.* -> marketing
    aff_mkt = get_affected_stages(["marketing.expected_cac"])
    assert aff_mkt == ["marketing"]

    # 9. competitors.* -> competitor, pricing, financial, marketing
    aff_comp = get_affected_stages(["competitors.added"])
    assert set(aff_comp) == {"competitor", "pricing", "financial", "marketing"}


def test_deep_merge_and_diff():
    base = {
        "packaging": {"material": "Glass", "packaging_cost": 30.0},
        "pricing": {"selling_price": 500.0},
    }
    patch = {
        "packaging": {"packaging_cost": 60.0},
    }
    merged = deep_merge(base, patch)
    assert merged["packaging"]["material"] == "Glass"
    assert merged["packaging"]["packaging_cost"] == 60.0
    assert merged["pricing"]["selling_price"] == 500.0

    diff = diff_dict_paths(base, merged)
    assert diff == ["packaging.packaging_cost"]


def test_patch_assumptions_and_impact_tracking_flow(client):
    # Vector A creation
    create_payload = {
        "name": "Twin Bottle",
        "assumptions": {
            "customer": {
                "target_customer": "Hikers",
                "problem_statement": "Cold drinks get warm",
                "customer_interviews_count": 10
            },
            "product": {
                "differentiation_vs_competitors": "Triple insulation"
            },
            "packaging": {
                "material": "Cardboard",
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
                "channels": ["Google Ads"],
                "expected_cac": 50.00
            }
        }
    }
    prod_res = client.post("/api/v1/products", json=create_payload)
    assert prod_res.status_code == 201
    product_id = prod_res.json()["id"]

    # Add competitors so competitor stage passes
    comp_res = client.post(
        f"/api/v1/products/{product_id}/competitors",
        json={"competitors": [{"name": "Comp A"}, {"name": "Comp B"}]}
    )
    assert comp_res.status_code == 201
    comp_a_id = comp_res.json()["items"][0]["id"]
    comp_b_id = comp_res.json()["items"][1]["id"]

    # Ingest research evidence for competitors
    client.post("/api/v1/internal/research-results", json={
        "product_id": product_id,
        "competitor_id": comp_a_id,
        "evidence": [{"source_type": "website", "title": "A", "excerpt": "Price $499", "data": {"price": 499.0}}]
    })
    client.post("/api/v1/internal/research-results", json={
        "product_id": product_id,
        "competitor_id": comp_b_id,
        "evidence": [{"source_type": "website", "title": "B", "excerpt": "Price $520", "data": {"price": 520.0}}]
    })

    # Validate Version 1 (Vector A)
    val1 = client.post(f"/api/v1/products/{product_id}/validate")
    assert val1.status_code == 200
    val1_data = val1.json()
    assert val1_data["version_number"] == 1
    fin_res1 = next(r for r in val1_data["results"] if r["stage"] == "financial")
    assert fin_res1["metrics"]["variable_cost_per_unit"] == "230.00"
    assert fin_res1["metrics"]["contribution_per_unit"] == "270.00"
    assert fin_res1["metrics"]["contribution_margin"] == 0.5400
    assert fin_res1["metrics"]["break_even_units"] == 186

    # PATCH packaging_cost 30 -> 60 with revalidate=True (Vector B)
    patch_payload = {
        "patch": {
            "packaging": {
                "packaging_cost": 60.00
            }
        },
        "revalidate": True
    }
    patch_res = client.patch(f"/api/v1/products/{product_id}/assumptions", json=patch_payload)
    assert patch_res.status_code == 200
    patch_data = patch_res.json()

    assert patch_data["new_version"] == 2
    assert patch_data["changed_fields"] == ["packaging.packaging_cost"]
    assert set(patch_data["affected_stages"]) == {"product_packaging", "pricing", "financial", "marketing"}

    # Assert unaffected stages (customer, competitor) were carried forward
    results_v2 = patch_data["results"]
    assert len(results_v2) == 6

    cust_v2 = next(r for r in results_v2 if r["stage"] == "customer")
    assert cust_v2["carried_forward_from"] is not None

    comp_v2 = next(r for r in results_v2 if r["stage"] == "competitor")
    assert comp_v2["carried_forward_from"] is not None

    # Assert affected stages (Vector B financials)
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

    # Compare versions 1 and 2
    comp_versions = client.get(f"/api/v1/products/{product_id}/versions/1/compare/2")
    assert comp_versions.status_code == 200
    comp_data = comp_versions.json()

    fin_deltas = comp_data["stages"]["financial"]["metric_deltas"]
    assert fin_deltas["contribution_margin"]["before"] == 0.54
    assert fin_deltas["contribution_margin"]["after"] == 0.48
    assert fin_deltas["break_even_units"]["before"] == 186
    assert fin_deltas["break_even_units"]["after"] == 209
