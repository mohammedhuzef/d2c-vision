"""
Live API verification on a throwaway SQLite database (check.db)
Walking through a realistic founder path and provoking real error cases.
"""
import os
import sys
from decimal import Decimal
from pathlib import Path

# Ensure root is in sys.path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))
sys.path.insert(0, str(root_dir / "backend"))

DB_FILE = root_dir / "check.db"
if DB_FILE.exists():
    try:
        DB_FILE.unlink()
    except Exception:
        pass

# Point to throwaway DB
os.environ["DATABASE_URL"] = f"sqlite:///{DB_FILE}"

from alembic.config import Config
from alembic import command
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from starlette.testclient import TestClient

from backend.app.core.config import settings
settings.DATABASE_URL = f"sqlite:///{DB_FILE}"

from backend.app.core.database import get_db, SessionLocal
from backend.app.main import app

engine = create_engine(f"sqlite:///{DB_FILE}", connect_args={"check_same_thread": False})

# Run alembic migrations to head on check.db
alembic_cfg = Config(str(root_dir / "alembic.ini"))
alembic_cfg.set_main_option("script_location", str(root_dir / "backend" / "alembic"))
with engine.begin() as conn:
    alembic_cfg.attributes["connection"] = conn
    command.upgrade(alembic_cfg, "head")
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_db
client = TestClient(app, base_url="http://testserver")

def check_error_shape(res, expected_status: int, test_name: str):
    assert res.status_code == expected_status, f"[{test_name}] Expected {expected_status}, got {res.status_code}: {res.text}"
    body = res.json()
    assert "error" in body, f"[{test_name}] Missing 'error' key in response: {body}"
    err = body["error"]
    for key in ("code", "message", "details", "request_id"):
        assert key in err, f"[{test_name}] Missing '{key}' in error envelope: {err}"
    print(f"  [OK] Error case '{test_name}' passed with {expected_status}: code={err['code']}")

def run_walkthrough():
    print("=== STARTING LIVE API WALKTHROUGH ON check.db ===")

    # a. Create a product with title, description, category, target_margin_percent, cogs, packaging_cost, shipping_cost, target_retail_price
    create_payload = {
        "title": "HydroPeak Insulated Flask",
        "description": "Double-wall stainless steel insulated flask with temperature retention.",
        "category": "Drinkware",
        "target_margin_percent": 45.0,
        "cogs": 120.00,
        "packaging_cost": 25.00,
        "shipping_cost": 35.00,
        "target_retail_price": 499.00,
    }
    r = client.post("/api/v1/products", json=create_payload)
    assert r.status_code == 201, f"Create product failed: {r.text}"
    product = r.json()
    product_id = product["id"]
    print(f"Step a: Product created: id={product_id}, name={product['name']}")

    # b. Add two competitors (one above target price, one below; valid URLs)
    comp_payload = {
        "competitors": [
            {
                "name": "ThermoPro Flask",
                "product_name": "ThermoPro 1L",
                "website_url": "https://thermopro-flask.example.com",
                "observed_price": "599.00",
                "notes": "Premium market leader"
            },
            {
                "name": "SipCold Basic",
                "product_name": "SipCold 800ml",
                "website_url": "https://sipcold-basic.example.com",
                "observed_price": "399.00",
                "notes": "Budget alternative"
            }
        ]
    }
    r = client.post(f"/api/v1/products/{product_id}/competitors", json=comp_payload)
    assert r.status_code == 201, f"Add competitors failed: {r.text}"
    print("Step b: Added two competitors (above and below target price)")

    # Verify competitors/summary endpoint formatting (money strings, 2 dp)
    r = client.get(f"/api/v1/products/{product_id}/competitors/summary")
    assert r.status_code == 200
    comp_summary = r.json()
    assert comp_summary["competitors_count"] == 2
    assert comp_summary["competitor_price_min"] == "399.00"
    assert comp_summary["competitor_price_max"] == "599.00"
    print(f"  [OK] Competitors summary verified: min={comp_summary['competitor_price_min']}, max={comp_summary['competitor_price_max']}")

    # c. Start research (mock provider); wait or poll until ready
    r = client.post(f"/api/v1/products/{product_id}/research")
    assert r.status_code == 202, f"Start research failed: {r.text}"
    research_id = r.json()["research_id"]
    r = client.get(f"/api/v1/products/{product_id}/research/{research_id}")
    assert r.status_code == 200
    research_status = r.json()["status"]
    print(f"Step c: Research completed with status={research_status}, evidence_count={r.json()['evidence_count']}")

    # d. Run POST validate; wait or poll until the run finishes
    r = client.post(f"/api/v1/products/{product_id}/validate")
    assert r.status_code == 200, f"Validation failed: {r.text}"
    val_run = r.json()
    assert val_run["verdict"] in ("READY", "READY_WITH_WARNINGS", "NOT_READY", "INSUFFICIENT_EVIDENCE")
    print(f"Step d: POST validate succeeded: verdict={val_run['verdict']}, stages_run={val_run['stages_run']}")

    # e. GET validation/readiness; assert score, label and breakdown are present
    r = client.get(f"/api/v1/products/{product_id}/validation/readiness")
    assert r.status_code == 200, f"Readiness failed: {r.text}"
    readiness = r.json()
    assert "overall_score" in readiness
    assert "label" in readiness
    assert "breakdown" in readiness
    assert readiness["label"] in ("READY", "READY_WITH_WARNINGS", "NOT_READY", "INSUFFICIENT_EVIDENCE")
    print(f"Step e: GET readiness verified: label={readiness['label']}, score={readiness['overall_score']}")

    # f. GET validation/runs/latest; assert both `results` and `stage_results` are present, plus `financial_snapshot`
    r = client.get(f"/api/v1/products/{product_id}/validation/runs/latest")
    assert r.status_code == 200, f"Latest run failed: {r.text}"
    latest_run = r.json()
    assert "results" in latest_run and len(latest_run["results"]) > 0
    assert "stage_results" in latest_run and len(latest_run["stage_results"]) > 0
    assert "financial_snapshot" in latest_run
    first_run_id = latest_run["id"]
    print(f"Step f: GET runs/latest verified: results={len(latest_run['results'])}, stage_results={len(latest_run['stage_results'])}, has_financial_snapshot={latest_run['financial_snapshot'] is not None}")

    # g. GET validation/runs/latest/recommendations; assert prioritized list returned
    r = client.get(f"/api/v1/products/{product_id}/validation/runs/latest/recommendations")
    assert r.status_code == 200, f"Recommendations failed: {r.text}"
    recs_data = r.json()
    assert "items" in recs_data
    items = recs_data["items"]
    # Check prioritization order
    p_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    for i in range(len(items) - 1):
        assert p_order.get(items[i]["priority"], 99) <= p_order.get(items[i+1]["priority"], 99)
    print(f"Step g: GET recommendations verified: total={recs_data['total']}, ordered by priority")

    # h. PATCH assumptions (bump packaging_cost) with revalidate=true; prove a new run ran
    patch_payload = {
        "patch": {
            "packaging": {
                "packaging_cost": 45.00
            }
        },
        "revalidate": True
    }
    r = client.patch(f"/api/v1/products/{product_id}/assumptions", json=patch_payload)
    assert r.status_code == 200, f"Patch assumptions failed: {r.text}"
    patch_res = r.json()
    assert patch_res["new_version"] == 2
    assert "packaging.packaging_cost" in patch_res["changed_fields"]
    # Verify new validation run was created
    r_latest = client.get(f"/api/v1/products/{product_id}/validation/runs/latest")
    assert r_latest.status_code == 200
    new_run_id = r_latest.json()["id"]
    assert new_run_id != first_run_id, "New validation run was not triggered!"
    print(f"Step h: PATCH assumptions bumped packaging_cost and triggered new run: version={patch_res['new_version']}, new_run_id={new_run_id}")

    # i. GET versions and GET compare against the previous version
    r = client.get(f"/api/v1/products/{product_id}/versions")
    assert r.status_code == 200
    versions_list = r.json()
    assert len(versions_list["items"]) >= 2

    r = client.get(f"/api/v1/products/{product_id}/versions/1/compare/2")
    assert r.status_code == 200
    comp_v = r.json()
    assert comp_v["version_a"] == 1 and comp_v["version_b"] == 2
    assert "packaging" in comp_v["stage_deltas"] or "financial" in comp_v["stage_deltas"]
    print("Step i: GET versions and GET compare verified: version 1 vs version 2 delta present")

    # j. POST validation/simulate with lower shipping_cost; prove it returns simulated metrics without creating a validation run
    r_runs_before = client.get(f"/api/v1/products/{product_id}/validation/runs")
    count_before = r_runs_before.json()["total"]

    sim_payload = {
        "modifications": {
            "costs.shipping_cost_per_unit": 20.00
        }
    }
    r = client.post(f"/api/v1/products/{product_id}/validation/simulate", json=sim_payload)
    assert r.status_code == 200, f"Simulate failed: {r.text}"
    sim_data = r.json()
    assert "simulated_score" in sim_data
    assert "simulated_label" in sim_data
    assert "deltas" in sim_data

    r_runs_after = client.get(f"/api/v1/products/{product_id}/validation/runs")
    count_after = r_runs_after.json()["total"]
    assert count_before == count_after, "POST simulate incorrectly persisted a validation run!"
    print(f"Step j: POST validation/simulate verified: simulated_score={sim_data['simulated_score']}, runs count unchanged ({count_before})")

    # k. POST reports to generate a report; GET reports/latest; prove executive_summary, unit_economics, unresolved_risks, strategic_recommendations and citations are all present
    r = client.post(f"/api/v1/products/{product_id}/reports")
    assert r.status_code == 201, f"Generate report failed: {r.text}"
    r = client.get(f"/api/v1/products/{product_id}/reports/latest")
    assert r.status_code == 200
    report_data = r.json()
    content = report_data["content"]
    assert "executive_summary" in content
    assert "unit_economics" in content
    assert "unresolved_risks" in content
    assert "strategic_recommendations" in content
    assert "citations" in content["evidence_quality"]
    print("Step k: POST & GET reports/latest verified: executive_summary, unit_economics, unresolved_risks, strategic_recommendations, citations present")

    # l. GET impact-events; prove the price change / packaging cost event is recorded
    r = client.get(f"/api/v1/products/{product_id}/impact-events")
    assert r.status_code == 200
    impact_events = r.json()
    assert impact_events["total"] >= 1
    event = impact_events["items"][0]
    assert "packaging.packaging_cost" in event["changed_fields"] or "costs.packaging_cost" in event["changed_fields"]
    print(f"Step l: GET impact-events verified: total={impact_events['total']}, event={event['changed_fields']}")

    # m. Provoke the real error cases:
    print("Step m: Testing real error cases...")
    # 1. 422 on negative price
    r = client.post("/api/v1/products", json={"title": "Negative Bottle", "target_retail_price": -100.00})
    check_error_shape(r, 422, "Negative Price")

    # 2. 404 on unknown product id
    r = client.get("/api/v1/products/00000000-0000-0000-0000-000000000000")
    check_error_shape(r, 404, "Unknown Product ID")

    # 3. 422 on malformed UUID
    r = client.get("/api/v1/products/not-a-valid-uuid")
    check_error_shape(r, 422, "Malformed UUID")

    # 4. 409 on duplicate competitor URL
    dup_comp_payload = {
        "competitors": [
            {
                "name": "Different Name",
                "website_url": "https://thermopro-flask.example.com",
            }
        ]
    }
    r = client.post(f"/api/v1/products/{product_id}/competitors", json=dup_comp_payload)
    check_error_shape(r, 409, "Duplicate Competitor URL")

    # 5. 409 on report before validate (on a fresh unvalidated product)
    fresh_p = client.post("/api/v1/products", json={"name": "Fresh Unvalidated Product"}).json()
    fresh_id = fresh_p["id"]
    r = client.post(f"/api/v1/products/{fresh_id}/reports")
    check_error_shape(r, 409, "Report Before Validate")

    print("=== ALL STEPS A THROUGH M PASSED SUCCESSFULLY! ===")


if __name__ == "__main__":
    try:
        run_walkthrough()
    finally:
        import time, gc
        app.dependency_overrides.clear()
        client.close()
        del client
        engine.dispose(close=True)
        try:
            from backend.app.core.database import engine as default_engine
            default_engine.dispose(close=True)
        except Exception:
            pass
        gc.collect()
        time.sleep(0.2)
        if DB_FILE.exists():
            try:
                DB_FILE.unlink()
                print("check.db deleted cleanly.")
            except Exception as e:
                print("Note on deleting check.db:", e)
