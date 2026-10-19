import json
import sys
from pathlib import Path
from decimal import Decimal

# Ensure python path includes project root and backend
root = Path(__file__).resolve().parent.parent.parent
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root))
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from backend.app.core.database import Base, get_db
from backend.app.main import app
from backend.tests.conftest import test_engine, TestingSessionLocal, ROOT_DIR
from backend.tests.integration.test_validation_runs_api import VECTOR_A_PAYLOAD, _setup_project_with_competitors
from alembic.config import Config
from alembic import command

# Setup database schema
alembic_cfg = Config(str(ROOT_DIR / "alembic.ini"))
alembic_cfg.set_main_option("script_location", str(ROOT_DIR / "backend" / "alembic"))
with test_engine.begin() as conn:
    alembic_cfg.attributes["connection"] = conn
    command.upgrade(alembic_cfg, "head")

connection = test_engine.connect()
session = TestingSessionLocal(bind=connection)

def override_get_db():
    try:
        yield session
    finally:
        pass

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

print("=================================================================")
print("RUNNING VECTOR A (HEALTHY) THROUGH FULL VALIDATION PIPELINE")
print("=================================================================")
project_id, _, _ = _setup_project_with_competitors(client, VECTOR_A_PAYLOAD)

post_res = client.post(f"/api/v1/projects/{project_id}/validation/runs")
assert post_res.status_code == 201
run_data = post_res.json()
run_id = run_data["id"]

print(f"Run ID: {run_id}")
print(f"Status: {run_data.get('status')}")
print(f"Readiness Label: {run_data.get('readiness', {}).get('label')}")
print(f"Readiness Overall Score: {run_data.get('readiness', {}).get('overall_score')}")
print(f"Recommendations count summary: {run_data.get('recommendations')}")

rec_res = client.get(f"/api/v1/projects/{project_id}/validation/runs/{run_id}/recommendations")
assert rec_res.status_code == 200
rec_json = rec_res.json()

print(f"\nTotal Recommendations generated for Vector A: {rec_json['total']}")
for r in rec_json["items"]:
    print(f"[{r['priority']}] action_type={r['action_type']} | title='{r['title']}' | suggested_value={r['suggested_value']}")
if rec_json["total"] == 0:
    print("-> As expected: Vector A is a fully healthy product (100% readiness, all stages PASSED), so no corrective recommendations are generated.")

print("\n=================================================================")
print("RUNNING VECTOR B (DEFICIENT / STRUGGLING) THROUGH FULL PIPELINE")
print("=================================================================")
VECTOR_B_PAYLOAD = {
    "name": "Vector B Struggling Project",
    "assumptions": {
        "customer": {
            "target_customer": "Coffee Drinkers",
            "problem_statement": "Spills",
            "customer_interviews_count": 2,
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
            "shipping_cost_per_unit": 10.00,
            "packaging_cost": 20.00,
            "payment_fee_fraction": 0.02,
            "fixed_costs_total": 100000.00,
        },
        "marketing": {
            "channels": ["Meta Ads"],
            "expected_cac": 30.00,
        },
    },
}
proj_b_res = client.post("/api/v1/products", json=VECTOR_B_PAYLOAD)
proj_b_id = proj_b_res.json()["id"]
run_b_res = client.post(f"/api/v1/projects/{proj_b_id}/validation/runs")
run_b_id = run_b_res.json()["id"]
rec_b_res = client.get(f"/api/v1/projects/{proj_b_id}/validation/runs/{run_b_id}/recommendations")
rec_b_json = rec_b_res.json()

print(f"Run ID: {run_b_id}")
print(f"Total Recommendations generated for Vector B: {rec_b_json['total']}")
for r in rec_b_json["items"]:
    print(f"[{r['priority']}] action_type={r['action_type']} | stage={r['stage']} | title='{r['title']}' | suggested_value={r['suggested_value']}")

print("\n=================================================================")
print("EXAMPLE JSON RESPONSE FROM RECOMMENDATIONS ENDPOINT (Vector B)")
print("=================================================================")
print(json.dumps(rec_b_json, indent=2))
