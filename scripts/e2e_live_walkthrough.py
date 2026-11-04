#!/usr/bin/env python3
"""
scripts/e2e_live_walkthrough.py

Comprehensive live lifecycle and error handling test suite executing against
DATABASE_URL=sqlite:///./check.db using httpx.
"""

import os
import sys
import uuid
from decimal import Decimal
from pathlib import Path

# Ensure DATABASE_URL points to check.db before any backend imports
os.environ["DATABASE_URL"] = "sqlite:///./check.db"

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))
sys.path.insert(0, str(ROOT_DIR / "backend"))

import httpx
from fastapi.testclient import TestClient
from backend.app.main import app


def assert_standard_error(resp, expected_status: int, expected_code: str):
    """Enforce exact standard error envelope and absence of stack traces."""
    assert resp.status_code == expected_status, (
        f"Expected status {expected_status}, got {resp.status_code}: {resp.text}"
    )
    data = resp.json()
    assert "error" in data, f"Response missing 'error' envelope: {data}"
    err = data["error"]
    assert "code" in err, f"Error missing 'code': {err}"
    assert "message" in err, f"Error missing 'message': {err}"
    assert "request_id" in err, f"Error missing 'request_id': {err}"
    assert err["code"] == expected_code, f"Expected code {expected_code}, got {err['code']}"

    # Verify no stack traces are leaked
    raw_text = resp.text.lower()
    assert "traceback (most recent call last)" not in raw_text, "Stack trace leaked in response!"
    assert "file \"" not in raw_text, "Source file path leaked in response!"
    print(f"    [OK] Standard error {expected_status} ({expected_code}) verified: {err['message'][:60]}...")


def run_walkthrough():
    client = TestClient(app, base_url="http://testserver")

    print("\n" + "=" * 70)
    print("STARTING E2E LIVE WALKTHROUGH ON sqlite:///./check.db")
    print("=" * 70)

    # 1. Health checks
    print("\n--- 1. Health Checks ---")
    r = client.get("/health")
    assert r.status_code == 200, f"/health failed: {r.status_code}"
    print("    [OK] GET /health ->", r.json())

    r = client.get("/api/v1/health")
    assert r.status_code == 200, f"/api/v1/health failed: {r.status_code}"
    print("    [OK] GET /api/v1/health ->", r.json())

    # 2. Create Product
    print("\n--- 2. Create Product ---")
    product_payload = {
        "name": "Live Apex Tumbler 32oz",
        "description": "Double-wall vacuum insulated stainless steel tumbler",
        "category": "Drinkware",
        "target_market": "Active eco-conscious commuters",
        "assumptions": {
            "customer": {
                "target_customer": "Commuters and students",
                "problem_statement": "Single use waste and leaking tumblers",
                "customer_interviews_count": 10,
                "willingness_to_pay_signal": "High",
            },
            "product": {
                "features": ["32oz volume", "Leak proof straw lid"],
                "unique_selling_points": ["Thermal insulation", "Lifetime guarantee"],
                "differentiation_vs_competitors": "Pure ceramic internal coating",
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
                "channels": ["Direct", "Instagram"],
                "monthly_budget": 30000.00,
                "expected_cac": 60.00,
            },
        },
    }
    r = client.post("/api/v1/products", json=product_payload)
    assert r.status_code == 201, f"Product creation failed: {r.status_code} {r.text}"
    prod_data = r.json()
    product_id = prod_data["id"]
    print(f"    [OK] Created Product ID: {product_id}, Version: {prod_data['current_version']}")

    # 3. Add 2 Competitors
    print("\n--- 3. Add 2 Benchmark Competitors ---")
    competitor_payload = {
        "competitors": [
            {
                "name": "Hydro Flask",
                "website_url": "https://hydroflask.example.com",
                "notes": "Premium insulated bottles",
            },
            {
                "name": "Yeti Rambler",
                "website_url": "https://yeti.example.com",
                "notes": "Rugged outdoor tumblers",
            },
        ]
    }
    r = client.post(f"/api/v1/products/{product_id}/competitors", json=competitor_payload)
    assert r.status_code == 201, f"Add competitors failed: {r.status_code} {r.text}"
    comps = r.json()["items"]
    assert len(comps) == 2, f"Expected 2 competitors, got {len(comps)}"
    print(f"    [OK] Added competitors: {[c['name'] for c in comps]}")

    # 4. Research -> Validate -> Recommendations
    print("\n--- 4. Research -> Validate -> Recommendations ---")
    # Trigger research (synchronous mock runner)
    r = client.post(f"/api/v1/products/{product_id}/research")
    assert r.status_code == 202, f"Research trigger failed: {r.status_code} {r.text}"
    research_start = r.json()
    print("    [OK] Triggered research:", research_start)

    # Check research status
    r = client.get(f"/api/v1/products/{product_id}/research/{research_start['research_id']}")
    assert r.status_code == 200, f"Research status check failed: {r.status_code} {r.text}"
    print("    [OK] Research status:", r.json()["status"], f"(evidence count: {r.json()['evidence_count']})")

    # Full 6-stage validation
    r = client.post(f"/api/v1/products/{product_id}/validate")
    assert r.status_code == 200, f"Validation failed: {r.status_code} {r.text}"
    val_data = r.json()
    print(f"    [OK] Validation run complete: verdict={val_data['verdict']}, score={val_data['readiness_score']}")
    for res in val_data["results"]:
        print(f"        Stage '{res['stage']}': {res['status']} (score: {res['score']})")

    # Recommendations
    r = client.get(f"/api/v1/products/{product_id}/recommendations")
    assert r.status_code == 200, f"Recommendations failed: {r.status_code} {r.text}"
    recs = r.json()["items"]
    print(f"    [OK] Retrieved {len(recs)} product recommendations")

    # 5. PATCH packaging_cost 30 -> 60 with revalidate=true
    print("\n--- 5. Patch packaging_cost 30 -> 60 (Vector B Shock) ---")
    patch_payload = {
        "patch": {
            "packaging": {"packaging_cost": 60.00},
            "costs": {"packaging_cost": 60.00},
        },
        "revalidate": True,
    }
    r = client.patch(f"/api/v1/products/{product_id}/assumptions", json=patch_payload)
    assert r.status_code == 200, f"Patch failed: {r.status_code} {r.text}"
    patch_data = r.json()
    assert patch_data["new_version"] == 2, f"Expected Version 2, got {patch_data['new_version']}"
    assert "product_packaging" in patch_data["affected_stages"], "product_packaging should be affected"
    print(f"    [OK] Version 2 created: new_version={patch_data['new_version']}, affected_stages={patch_data['affected_stages']}, changed_fields={patch_data['changed_fields']}")

    # 6. Versions -> Compare 1 and 2
    print("\n--- 6. Versions & Comparison ---")
    r = client.get(f"/api/v1/products/{product_id}/versions")
    assert r.status_code == 200, f"Versions list failed: {r.status_code} {r.text}"
    version_items = r.json()["items"]
    assert len(version_items) == 2, f"Expected 2 versions, got {len(version_items)}"
    print(f"    [OK] Listed {len(version_items)} versions (v{version_items[0]['version_number']}, v{version_items[1]['version_number']})")

    r = client.get(f"/api/v1/products/{product_id}/versions/1/compare/2")
    assert r.status_code == 200, f"Compare failed: {r.status_code} {r.text}"
    comp_diff = r.json()
    print("    [OK] Compared v1 to v2:")
    print("        Stages compared:", list(comp_diff.get("stages", {}).keys()))

    # 7. Simulate -> Report -> Impact Events
    print("\n--- 7. Simulate -> Report -> Impact Events ---")
    # Simulate price increase to INR 550
    sim_payload = {"overrides": {"pricing.selling_price": 550.00}}
    r = client.post(f"/api/v1/products/{product_id}/validation/simulate", json=sim_payload)
    assert r.status_code == 200, f"Simulate failed: {r.status_code} {r.text}"
    sim_data = r.json()
    print("    [OK] Simulation at price INR 550:", sim_data["deltas"])

    # Simulate via alias route
    r_alias = client.post(f"/api/v1/products/{product_id}/simulate", json=sim_payload)
    assert r_alias.status_code == 200, f"Simulate alias failed: {r_alias.status_code}"

    # Generate Report
    r = client.post(f"/api/v1/products/{product_id}/reports")
    assert r.status_code == 201, f"Report generation failed: {r.status_code} {r.text}"
    report_data = r.json()
    assert report_data["markdown"] and len(report_data["markdown"]) > 100
    print("    [OK] Generated report ID:", report_data["id"], f"Markdown length: {len(report_data['markdown'])} chars")

    r = client.get(f"/api/v1/products/{product_id}/reports/latest")
    assert r.status_code == 200, f"Get latest report failed: {r.status_code}"
    print("    [OK] Retrieved latest report successfully")

    # Impact Events
    r = client.get(f"/api/v1/products/{product_id}/impact-events")
    assert r.status_code == 200, f"Impact events failed: {r.status_code}"
    events = r.json()["items"]
    assert len(events) >= 1, "Expected at least 1 impact event"
    print(f"    [OK] Listed {len(events)} impact events")

    # 8. Additional Step 3 mapped routes
    print("\n--- 8. Additional Frontend Mapped Routes ---")
    r = client.get(f"/api/v1/products/{product_id}/evidence")
    assert r.status_code == 200, f"Evidence failed: {r.status_code}"
    print(f"    [OK] GET /evidence -> {r.json()['total']} items")

    r = client.get(f"/api/v1/products/{product_id}/validation/readiness")
    assert r.status_code == 200, f"Readiness failed: {r.status_code}"
    print("    [OK] GET /validation/readiness ->", r.json()["label"], r.json()["overall_score"])

    r = client.get(f"/api/v1/products/{product_id}/validation/runs/latest")
    assert r.status_code == 200, f"Latest run failed: {r.status_code}"
    print("    [OK] GET /validation/runs/latest -> run_id:", r.json().get("id") or r.json().get("run_id"))

    r = client.get(f"/api/v1/products/{product_id}/validation/runs/latest/recommendations")
    assert r.status_code == 200, f"Latest recommendations failed: {r.status_code}"
    print(f"    [OK] GET /validation/runs/latest/recommendations -> {len(r.json()['items'])} items")

    r = client.get("/api/v1/influencers")
    assert r.status_code == 200, f"Influencers list failed: {r.status_code}"
    print(f"    [OK] GET /api/v1/influencers -> {r.json()['total']} creators available")

    # Ingest internal research results
    ingest_payload = {
        "product_id": product_id,
        "evidence": [
            {
                "source_type": "pricing_page",
                "source_url": "https://hydroflask.example.com/pricing",
                "title": "Hydro Flask Benchmark",
                "excerpt": "Observed retail price is ₹480 with free delivery across metros.",
                "confidence": 0.95,
            }
        ],
        "analyses": [],
    }
    r = client.post("/api/v1/internal/research-results", json=ingest_payload)
    assert r.status_code == 201, f"Internal research-results failed: {r.status_code} {r.text}"
    print("    [OK] POST /api/v1/internal/research-results ->", r.json())

    # Ingest via alias /internal/research/results
    ingest_payload_2 = {
        "product_id": product_id,
        "evidence": [
            {
                "source_type": "pricing_page",
                "source_url": "https://yeti.example.com/pricing",
                "title": "Yeti Benchmark",
                "excerpt": "Observed retail price is ₹520 with heavy duty insulation guarantee.",
                "confidence": 0.95,
            }
        ],
        "analyses": [],
    }
    r = client.post("/api/v1/internal/research/results", json=ingest_payload_2)
    assert r.status_code == 201, f"Internal research/results alias failed: {r.status_code} {r.text}"
    print("    [OK] POST /api/v1/internal/research/results (alias) ->", r.json())

    # 9. Error Handling Standardization Checks
    print("\n--- 9. Error Handling Standardization & Edge Cases ---")
    
    import copy
    bad_product = copy.deepcopy(product_payload)
    bad_product["name"] = "Negative Price Bottle"
    bad_product["assumptions"]["pricing"]["selling_price"] = -100.00
    r = client.post("/api/v1/products", json=bad_product)
    assert_standard_error(r, 422, "VALIDATION_ERROR")

    # 9b. Unknown Product ID -> 404 NOT_FOUND
    random_uuid = str(uuid.uuid4())
    r = client.get(f"/api/v1/products/{random_uuid}")
    assert_standard_error(r, 404, "NOT_FOUND")

    # 9c. Malformed UUID -> 422 VALIDATION_ERROR
    r = client.get("/api/v1/products/not-a-valid-uuid")
    assert_standard_error(r, 422, "VALIDATION_ERROR")

    # 9d. Duplicate competitor -> 409 CONFLICT
    duplicate_payload = {
        "competitors": [
            {"name": "Hydro Flask", "website_url": "https://hydroflask.com"}
        ]
    }
    r = client.post(f"/api/v1/products/{product_id}/competitors", json=duplicate_payload)
    assert_standard_error(r, 409, "CONFLICT")

    # 9e. Report before validation -> 409 BAD_STATE
    fresh_prod_payload = {
        "name": "Unvalidated Product",
        "category": "Drinkware",
        "target_market": "General",
        "assumptions": product_payload["assumptions"],
    }
    r_fresh = client.post("/api/v1/products", json=fresh_prod_payload)
    assert r_fresh.status_code == 201
    fresh_id = r_fresh.json()["id"]

    r_report = client.post(f"/api/v1/products/{fresh_id}/reports")
    assert_standard_error(r_report, 409, "BAD_STATE")

    print("\n" + "=" * 70)
    print("ALL E2E LIFECYCLE & ERROR HANDLING TESTS PASSED PERFECTLY!")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    run_walkthrough()
