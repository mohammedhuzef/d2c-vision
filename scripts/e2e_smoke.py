#!/usr/bin/env python3
"""End-to-End Smoke Test for LaunchTwin AI Platform.

Executes the full product lifecycle:
1. Health check (DB ping)
2. Create product (Vector A assumptions)
3. Add competitors with observed prices
4. Trigger research
5. Validate version 1 (Assert Vector A metrics)
6. PATCH packaging_cost 30 -> 60 with revalidate (Assert Vector B metrics + carried forward stages)
7. Version comparison (v1 vs v2)
8. What-If Simulation
9. Fetch Recommendations
10. Generate & fetch Launch-Readiness Report

Exit code: 0 on success, 1 on failure.
"""

import argparse
import json
import sys
import uuid
from decimal import Decimal
import httpx


def run_e2e_smoke(base_url: str = "http://localhost:8000/api/v1", allow_demo_db: bool = False) -> dict:
    base_url = base_url.rstrip("/")
    print(f"[smoke] Starting E2E smoke tests against {base_url} ...")
    captured_exchanges = {}

    use_asgi = False
    try:
        with httpx.Client(base_url=base_url, timeout=1.5) as test_c:
            res = test_c.get("/health")
            if res.status_code != 200 and "/api/v1" in base_url:
                root_url = base_url.replace("/api/v1", "")
                res = httpx.get(f"{root_url}/health", timeout=1.5)
            if res.status_code != 200:
                raise RuntimeError("Non-200")
    except Exception:
        if "localhost" in base_url or "127.0.0.1" in base_url:
            print(f"[smoke] Live HTTP server at {base_url} is not responding.")
            print("[smoke] Falling back to in-process ASGI Transport (httpx.ASGITransport) for local execution.")
            use_asgi = True

    if use_asgi:
        import os
        from pathlib import Path
        root_dir = Path(__file__).resolve().parent.parent
        sys.path.insert(0, str(root_dir))
        sys.path.insert(0, str(root_dir / "backend"))
        if "DATABASE_URL" not in os.environ:
            os.environ["DATABASE_URL"] = "sqlite:///./launchtwin.db"
        from backend.app.main import app
        from fastapi.testclient import TestClient
        client = TestClient(app, base_url="http://testserver/api/v1")
    else:
        client = httpx.Client(base_url=base_url, timeout=30.0)

    try:
        # 1. Health check
        print("[1/10] Checking /health ...")
        # Try base_url/health first, then /health if mounted at root
        r = client.get("/health")
        if r.status_code == 404 and "/api/v1" in base_url:
            root_url = base_url.replace("/api/v1", "")
            r = httpx.get(f"{root_url}/health")
        
        assert r.status_code == 200, f"Health check failed: {r.status_code} {r.text}"
        health_data = r.json()
        assert health_data.get("status") in ("healthy", "degraded"), f"Unexpected health status: {health_data}"
        print(f"       Health: status={health_data.get('status')} db={health_data.get('database')}")
        captured_exchanges["health"] = {"request": {"method": "GET", "url": "/health"}, "response": health_data}

        # Check database hygiene: refuse to run against demo database without flag
        if not allow_demo_db:
            prod_check = client.get("/products?limit=10")
            if prod_check.status_code == 200:
                items = prod_check.json().get("items", [])
                has_demo = any(
                    p.get("name") in ("TerraFlask 32oz Tumbler", "Basic Budget Bottle")
                    or p.get("id") in ("9756e7ae-ffba-45b7-94f7-f9743f03390d", "3b778cb1-e5ae-426f-b6f2-09ce32a93866")
                    for p in items
                )
                if has_demo:
                    raise RuntimeError(
                        "Refusing to run E2E smoke tests against seeded demo database.\n"
                        "Smoke tests create and mutate products, which would contaminate demo data.\n"
                        "Options:\n"
                        "  1. Run against a throwaway database (recommended):\n"
                        "     $env:DATABASE_URL='sqlite:///./smoke.db'; alembic upgrade head; python scripts/e2e_smoke.py\n"
                        "  2. Pass --allow-demo-db to explicitly permit running against the demo database."
                    )

        # 2. Create product with Vector A assumptions
        print("[2/10] Creating product with Vector A assumptions ...")
        product_payload = {
            "name": f"[SMOKE-TEST] E2E Tumbler {uuid.uuid4().hex[:6]}",
            "category": "Drinkware",
            "target_market": "Eco-friendly commuters",
            "assumptions": {
                "customer": {
                    "target_customer": "Urban commuters",
                    "problem_statement": "Single use waste and leaking tumblers",
                    "customer_interviews_count": 10
                },
                "product": {
                    "unique_selling_points": ["Thermal insulation", "Leak-proof lid"],
                    "differentiation_vs_competitors": "Ceramic lined with recycled steel"
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
        r = client.post("/products", json=product_payload)
        assert r.status_code == 201, f"Create product failed: {r.status_code} {r.text}"
        prod_data = r.json()
        product_id = prod_data["id"]
        assert prod_data["current_version"] == 1
        print(f"       Product created: id={product_id} v={prod_data['current_version']}")
        captured_exchanges["create_product"] = {"request": {"method": "POST", "url": "/products", "body": product_payload}, "response": prod_data}

        # 3. Add competitors with observed prices
        print("[3/10] Adding competitors with observed prices ...")
        comp_payload = {
            "competitors": [
                {
                    "name": f"[SMOKE-TEST] Hydro Flask {uuid.uuid4().hex[:4]}",
                    "website_url": "https://hydroflask.com",
                    "product_name": "All Around 20oz",
                    "observed_price": "480.00"
                },
                {
                    "name": f"[SMOKE-TEST] Yeti Rambler {uuid.uuid4().hex[:4]}",
                    "website_url": "https://yeti.com",
                    "product_name": "Rambler 20oz",
                    "observed_price": "520.00"
                }
            ]
        }
        r = client.post(f"/products/{product_id}/competitors", json=comp_payload)
        assert r.status_code == 201, f"Add competitors failed: {r.status_code} {r.text}"
        comp_data = r.json()
        assert len(comp_data["items"]) == 2
        print(f"       Competitors added: {len(comp_data['items'])} competitors")
        captured_exchanges["add_competitors"] = {"request": {"method": "POST", "url": f"/products/{{id}}/competitors", "body": comp_payload}, "response": comp_data}

        # 4. Trigger Research
        print("[4/10] Triggering research run ...")
        r = client.post(f"/products/{product_id}/research")
        assert r.status_code in (200, 202), f"Research trigger failed: {r.status_code} {r.text}"
        res_data = r.json()
        assert res_data.get("status") in ("completed", "pending", "running")
        print(f"       Research run: status={res_data.get('status')} evidence_count={res_data.get('evidence_count')}")
        captured_exchanges["research"] = {"request": {"method": "POST", "url": f"/products/{{id}}/research"}, "response": res_data}

        # 5. Run Initial Validation (Vector A)
        print("[5/10] Running initial validation (Vector A) ...")
        r = client.post(f"/products/{product_id}/validate")
        assert r.status_code == 200, f"Validate failed: {r.status_code} {r.text}"
        val_data = r.json()
        assert len(val_data["results"]) == 6
        assert val_data["version_number"] == 1

        fin_v1 = next(res for res in val_data["results"] if res["stage"] == "financial")
        v1_metrics = fin_v1["metrics"]
        print(f"       Asserting Vector A metrics: var={v1_metrics['variable_cost_per_unit']}, cont={v1_metrics['contribution_per_unit']}, margin={v1_metrics['contribution_margin']}, BE={v1_metrics['break_even_units']}")
        assert v1_metrics["variable_cost_per_unit"] == "230.00", f"Expected 230.00, got {v1_metrics['variable_cost_per_unit']}"
        assert v1_metrics["contribution_per_unit"] == "270.00", f"Expected 270.00, got {v1_metrics['contribution_per_unit']}"
        assert Decimal(str(v1_metrics["contribution_margin"])) == Decimal("0.5400"), f"Expected 0.5400, got {v1_metrics['contribution_margin']}"
        assert v1_metrics["break_even_units"] == 186, f"Expected 186, got {v1_metrics['break_even_units']}"
        captured_exchanges["validate"] = {"request": {"method": "POST", "url": f"/products/{{id}}/validate"}, "response": val_data}

        # 6. PATCH packaging_cost 30 -> 60 with revalidate (Vector B)
        print("[6/10] PATCH packaging_cost 30 -> 60 with revalidate=True (Vector B) ...")
        patch_payload = {
            "patch": {
                "packaging": {
                    "packaging_cost": 60.00
                }
            },
            "revalidate": True
        }
        r = client.patch(f"/products/{product_id}/assumptions", json=patch_payload)
        assert r.status_code == 200, f"Patch assumptions failed: {r.status_code} {r.text}"
        patch_data = r.json()
        assert patch_data["new_version"] == 2
        assert patch_data["changed_fields"] == ["packaging.packaging_cost"]

        # Check carried-forward stages: customer and competitor
        results_v2 = patch_data["results"]
        cust_res = next(res for res in results_v2 if res["stage"] == "customer")
        comp_res = next(res for res in results_v2 if res["stage"] == "competitor")
        assert cust_res["carried_forward_from"] is not None, "Customer stage was not carried forward!"
        assert comp_res["carried_forward_from"] is not None, "Competitor stage was not carried forward!"
        print(f"       Stages carried forward: customer (from v{cust_res['carried_forward_from']}), competitor (from v{comp_res['carried_forward_from']})")

        # Check Vector B metrics in financial stage
        fin_v2 = next(res for res in results_v2 if res["stage"] == "financial")
        assert fin_v2["carried_forward_from"] is None, "Financial stage should have been re-evaluated, not carried forward!"
        v2_metrics = fin_v2["metrics"]
        print(f"       Asserting Vector B metrics: var={v2_metrics['variable_cost_per_unit']}, cont={v2_metrics['contribution_per_unit']}, margin={v2_metrics['contribution_margin']}, BE={v2_metrics['break_even_units']}")
        assert v2_metrics["variable_cost_per_unit"] == "260.00", f"Expected 260.00, got {v2_metrics['variable_cost_per_unit']}"
        assert v2_metrics["contribution_per_unit"] == "240.00", f"Expected 240.00, got {v2_metrics['contribution_per_unit']}"
        assert Decimal(str(v2_metrics["contribution_margin"])) == Decimal("0.4800"), f"Expected 0.4800, got {v2_metrics['contribution_margin']}"
        assert v2_metrics["break_even_units"] == 209, f"Expected 209, got {v2_metrics['break_even_units']}"
        captured_exchanges["patch_assumptions"] = {"request": {"method": "PATCH", "url": f"/products/{{id}}/assumptions", "body": patch_payload}, "response": patch_data}

        # 7. Version comparison (v1 vs v2)
        print("[7/10] Comparing version 1 vs 2 ...")
        r = client.get(f"/products/{product_id}/versions/1/compare/2")
        assert r.status_code == 200, f"Compare failed: {r.status_code} {r.text}"
        comp_data = r.json()
        fin_deltas = comp_data["stages"]["financial"]["metric_deltas"]
        assert Decimal(str(fin_deltas["contribution_margin"]["before"])) == Decimal("0.54")
        assert Decimal(str(fin_deltas["contribution_margin"]["after"])) == Decimal("0.48")
        assert fin_deltas["break_even_units"]["before"] == 186
        assert fin_deltas["break_even_units"]["after"] == 209
        print(f"       Comparison OK: margin delta {fin_deltas['contribution_margin']['delta']}, BE delta {fin_deltas['break_even_units']['delta']}")
        captured_exchanges["compare_versions"] = {"request": {"method": "GET", "url": f"/products/{{id}}/versions/1/compare/2"}, "response": comp_data}

        # 8. What-If Simulation
        print("[8/10] Simulating price change ...")
        sim_payload = {
            "overrides": {
                "selling_price": "550.00"
            }
        }
        r = client.post(f"/products/{product_id}/simulate", json=sim_payload)
        if r.status_code == 404:
            r = client.post(f"/products/{product_id}/validation/simulate", json=sim_payload)
        assert r.status_code == 200, f"Simulate failed: {r.status_code} {r.text}"
        sim_data = r.json()
        assert "baseline" in sim_data and "simulated" in sim_data
        print(f"       Simulate OK: simulated contribution={sim_data['simulated']['metrics']['contribution_per_unit']}")
        captured_exchanges["simulate"] = {"request": {"method": "POST", "url": f"/products/{{id}}/simulate", "body": sim_payload}, "response": sim_data}

        # 9. Recommendations
        print("[9/10] Fetching recommendations ...")
        r = client.get(f"/products/{product_id}/recommendations")
        assert r.status_code == 200, f"Recommendations failed: {r.status_code} {r.text}"
        rec_data = r.json()
        assert "items" in rec_data
        print(f"       Recommendations OK: count={len(rec_data['items'])}")
        captured_exchanges["recommendations"] = {"request": {"method": "GET", "url": f"/products/{{id}}/recommendations"}, "response": rec_data}

        # 10. Reports
        print("[10/10] Generating and retrieving Launch-Readiness Report ...")
        r = client.post(f"/products/{product_id}/reports")
        assert r.status_code == 201, f"Generate report failed: {r.status_code} {r.text}"
        rep_created = r.json()
        assert "id" in rep_created
        assert rep_created["content"]["version_number"] == 2
        print(f"        Report generated: id={rep_created['id']}")

        r = client.get(f"/products/{product_id}/reports/latest")
        assert r.status_code == 200, f"Get latest report failed: {r.status_code} {r.text}"
        rep_latest = r.json()
        assert rep_latest["id"] == rep_created["id"]
        assert "content" in rep_latest and "markdown" in rep_latest
        content = rep_latest["content"]
        for section in ["verdict", "stage_table", "key_metrics", "risks", "recommendations", "next_steps", "evidence_quality"]:
            assert section in content, f"Missing section '{section}' in report content"
        print(f"        Report validated: verdict={content['verdict']} evidence_quality.evidence_count={content['evidence_quality']['evidence_count']}")
        captured_exchanges["report"] = {"request": {"method": "POST", "url": f"/products/{{id}}/reports"}, "response": rep_latest}
    finally:
        try:
            client.close()
        except Exception:
            pass

    print("\n======================================================================")
    print("ALL 10 E2E SMOKE TESTS PASSED CLEANLY")
    print("======================================================================")
    return captured_exchanges


def main():
    parser = argparse.ArgumentParser(description="LaunchTwin AI E2E Smoke Tests")
    parser.add_argument("base_url", nargs="?", default="http://localhost:8000/api/v1", help="Base URL (default: http://localhost:8000/api/v1)")
    parser.add_argument("--allow-demo-db", action="store_true", help="Allow running smoke tests against seeded demo database")
    args = parser.parse_args()

    try:
        run_e2e_smoke(args.base_url, allow_demo_db=args.allow_demo_db)
        sys.exit(0)
    except AssertionError as e:
        print(f"\n[FAIL] Assertion failed: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] E2E smoke test crashed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
