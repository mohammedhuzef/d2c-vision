"""Pytest test suite executing the complete E2E smoke flow using FastAPI TestClient.

Tests:
- Health check
- Product creation (Vector A)
- Competitors with observed price
- Research run
- Initial validation (Assert Vector A numbers)
- Patch packaging cost 30 -> 60 with revalidate (Assert Vector B + carried forward stages)
- Version comparison v1 vs v2
- What-If simulation
- Recommendations
- Report generation & latest report structure
"""

from decimal import Decimal
import uuid
import pytest
from fastapi.testclient import TestClient


def test_e2e_smoke_lifecycle_pytest(client: TestClient):
    # 1. Health check
    r_health = client.get("/health")
    assert r_health.status_code == 200
    assert r_health.json()["status"] in ("healthy", "degraded")

    # Also test /api/v1/health
    r_v1_health = client.get("/api/v1/health")
    assert r_v1_health.status_code == 200
    assert r_v1_health.json()["status"] in ("healthy", "degraded")

    # 2. Create product with Vector A assumptions
    product_payload = {
        "name": f"Pytest Smoke Tumbler {uuid.uuid4().hex[:6]}",
        "category": "Drinkware",
        "target_market": "Eco-friendly commuters",
        "assumptions": {
            "customer": {
                "target_customer": "Urban commuters",
                "problem_statement": "Single use waste and leaking tumblers",
                "customer_interviews_count": 10,
            },
            "product": {
                "unique_selling_points": ["Thermal insulation", "Leak-proof lid"],
                "differentiation_vs_competitors": "Ceramic lined with recycled steel",
            },
            "packaging": {
                "material": "Recycled cardboard",
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
                "channels": ["Direct", "Search"],
                "expected_cac": 50.00,
            },
        },
    }
    r_prod = client.post("/api/v1/products", json=product_payload)
    assert r_prod.status_code == 201
    prod_data = r_prod.json()
    product_id = prod_data["id"]
    assert prod_data["current_version"] == 1

    # 3. Add competitors with observed prices
    comp_payload = {
        "competitors": [
            {
                "name": "Hydro Flask",
                "website_url": "https://hydroflask.com",
                "product_name": "All Around 20oz",
                "observed_price": "480.00",
            },
            {
                "name": "Yeti Rambler",
                "website_url": "https://yeti.com",
                "product_name": "Rambler 20oz",
                "observed_price": "520.00",
            },
        ]
    }
    r_comp = client.post(f"/api/v1/products/{product_id}/competitors", json=comp_payload)
    assert r_comp.status_code == 201
    assert len(r_comp.json()["items"]) == 2

    # 4. Trigger Research
    r_res = client.post(f"/api/v1/products/{product_id}/research")
    assert r_res.status_code in (200, 202)
    assert r_res.json()["status"] == "completed"

    # 5. Run Initial Validation (Vector A)
    r_val = client.post(f"/api/v1/products/{product_id}/validate")
    assert r_val.status_code == 200
    val_data = r_val.json()
    assert len(val_data["results"]) == 6
    assert val_data["version_number"] == 1

    fin_v1 = next(res for res in val_data["results"] if res["stage"] == "financial")
    v1_metrics = fin_v1["metrics"]
    assert v1_metrics["variable_cost_per_unit"] == "230.00"
    assert v1_metrics["contribution_per_unit"] == "270.00"
    assert Decimal(str(v1_metrics["contribution_margin"])) == Decimal("0.5400")
    assert v1_metrics["break_even_units"] == 186

    # 6. PATCH packaging_cost 30 -> 60 with revalidate=True (Vector B)
    patch_payload = {
        "patch": {
            "packaging": {
                "packaging_cost": 60.00,
            }
        },
        "revalidate": True,
    }
    r_patch = client.patch(f"/api/v1/products/{product_id}/assumptions", json=patch_payload)
    assert r_patch.status_code == 200
    patch_data = r_patch.json()
    assert patch_data["new_version"] == 2
    assert patch_data["changed_fields"] == ["packaging.packaging_cost"]

    # Assert customer and competitor stages were carried forward
    results_v2 = patch_data["results"]
    cust_res = next(res for res in results_v2 if res["stage"] == "customer")
    comp_res = next(res for res in results_v2 if res["stage"] == "competitor")
    assert cust_res["carried_forward_from"] is not None
    assert comp_res["carried_forward_from"] is not None

    # Assert Vector B financial metrics
    fin_v2 = next(res for res in results_v2 if res["stage"] == "financial")
    assert fin_v2["carried_forward_from"] is None
    v2_metrics = fin_v2["metrics"]
    assert v2_metrics["variable_cost_per_unit"] == "260.00"
    assert v2_metrics["contribution_per_unit"] == "240.00"
    assert Decimal(str(v2_metrics["contribution_margin"])) == Decimal("0.4800")
    assert v2_metrics["break_even_units"] == 209

    # 7. Version comparison v1 vs v2
    r_comp = client.get(f"/api/v1/products/{product_id}/versions/1/compare/2")
    assert r_comp.status_code == 200
    comp_data = r_comp.json()
    fin_deltas = comp_data["stages"]["financial"]["metric_deltas"]
    assert Decimal(str(fin_deltas["contribution_margin"]["before"])) == Decimal("0.54")
    assert Decimal(str(fin_deltas["contribution_margin"]["after"])) == Decimal("0.48")
    assert fin_deltas["break_even_units"]["before"] == 186
    assert fin_deltas["break_even_units"]["after"] == 209

    # 8. What-If Simulation
    sim_payload = {
        "overrides": {
            "selling_price": "550.00",
        }
    }
    r_sim = client.post(f"/api/v1/products/{product_id}/simulate", json=sim_payload)
    assert r_sim.status_code == 200
    sim_data = r_sim.json()
    assert "baseline" in sim_data and "simulated" in sim_data
    assert sim_data["simulated"]["metrics"]["contribution_per_unit"] == "289.00"

    # 9. Recommendations
    r_rec = client.get(f"/api/v1/products/{product_id}/recommendations")
    assert r_rec.status_code == 200
    assert "items" in r_rec.json()

    # 10. Reports
    r_rep = client.post(f"/api/v1/products/{product_id}/reports")
    assert r_rep.status_code == 201
    rep_created = r_rep.json()
    assert rep_created["content"]["version_number"] == 2

    r_latest = client.get(f"/api/v1/products/{product_id}/reports/latest")
    assert r_latest.status_code == 200
    rep_latest = r_latest.json()
    assert rep_latest["id"] == rep_created["id"]
    content = rep_latest["content"]
    for section in ["verdict", "stage_table", "key_metrics", "risks", "recommendations", "next_steps", "evidence_quality", "version_comparison"]:
        assert section in content, f"Missing section '{section}' in report"
