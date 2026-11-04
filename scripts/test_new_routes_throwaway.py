import os
import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))
sys.path.insert(0, str(root_dir / "backend"))

# Set throwaway DB URL before importing app
db_path = root_dir / "check.db"
if db_path.exists():
    try:
        db_path.unlink()
    except Exception:
        pass

os.environ["DATABASE_URL"] = "sqlite:///./check.db"
os.environ["RESEARCH_PROVIDER"] = "mock"

from sqlalchemy import create_engine
from backend.app.core.database import Base
from backend.app.main import app
from fastapi.testclient import TestClient

# Initialize schema on check.db
engine = create_engine("sqlite:///./check.db")
Base.metadata.create_all(bind=engine)

client = TestClient(app)

print("=" * 60)
print("TESTING NEW & HARMONIZED ROUTES ON THROWAWAY DATABASE (check.db)")
print("=" * 60)

# 1. Create a product
prod_resp = client.post(
    "/api/v1/products",
    json={
        "name": "Throwaway Product",
        "category": "Food & Beverage",
        "assumptions": {
            "pricing": {"selling_price": "249.00"},
            "costs": {"cogs_per_unit": "75.00", "shipping_cost_per_unit": "25.00"},
            "packaging": {"material": "Recycled Paper", "packaging_cost": "10.00"},
        },
    },
)
print(f"POST /api/v1/products -> Status: {prod_resp.status_code}")
assert prod_resp.status_code == 201
product_id = prod_resp.json()["id"]

# 2. Add competitors
comp_resp = client.post(
    f"/api/v1/products/{product_id}/competitors",
    json={
        "competitors": [
            {"name": "Benchmark Alpha", "observed_price": "199.00"},
            {"name": "Benchmark Beta", "observed_price": "299.00"},
        ]
    },
)
print(f"POST /api/v1/products/{{id}}/competitors -> Status: {comp_resp.status_code}")
assert comp_resp.status_code == 201

# 3. New Route: GET /api/v1/products/{id}/competitors/summary
summary_resp = client.get(f"/api/v1/products/{product_id}/competitors/summary")
print(f"GET /api/v1/products/{{id}}/competitors/summary -> Status: {summary_resp.status_code}")
assert summary_resp.status_code == 200
summary_data = summary_resp.json()
print(f"   Payload: min={summary_data['competitor_price_min']}, median={summary_data['competitor_price_median']}, max={summary_data['competitor_price_max']}, count={summary_data['competitors_count']}")

# 4. Validate product
val_resp = client.post(f"/api/v1/products/{product_id}/validate")
print(f"POST /api/v1/products/{{id}}/validate -> Status: {val_resp.status_code}")
assert val_resp.status_code == 200

# 5. Harmonized Route: GET /api/v1/products/{id}/validation/runs/latest
latest_val_resp = client.get(f"/api/v1/products/{product_id}/validation/runs/latest")
print(f"GET /api/v1/products/{{id}}/validation/runs/latest -> Status: {latest_val_resp.status_code}")
assert latest_val_resp.status_code == 200
latest_val_data = latest_val_resp.json()
assert "stage_results" in latest_val_data, "stage_results alias missing"
assert "financial_snapshot" in latest_val_data, "financial_snapshot missing"
print(f"   Verified Aliases: 'stage_results' count={len(latest_val_data['stage_results'])}, 'financial_snapshot' keys={list(latest_val_data['financial_snapshot'].keys())[:3]}")

# 6. Harmonized Route: POST /api/v1/products/{id}/reports
report_resp = client.post(f"/api/v1/products/{product_id}/reports")
print(f"POST /api/v1/products/{{id}}/reports -> Status: {report_resp.status_code}")
assert report_resp.status_code == 201
report_data = report_resp.json()
report_content = report_data["content"]
assert "executive_summary" in report_content, "executive_summary missing"
assert "unit_economics" in report_content, "unit_economics missing"
print(f"   Verified Content Blocks: executive_summary={report_content['executive_summary']['readiness_label']}, unit_economics margin={report_content['unit_economics']['contribution_margin']}")

# 7. GET /api/v1/products/{id}/reports/latest
rep_latest_resp = client.get(f"/api/v1/products/{product_id}/reports/latest")
print(f"GET /api/v1/products/{{id}}/reports/latest -> Status: {rep_latest_resp.status_code}")
assert rep_latest_resp.status_code == 200

# 8. GET /api/v1/influencers
inf_resp = client.get("/api/v1/influencers")
print(f"GET /api/v1/influencers -> Status: {inf_resp.status_code}")
assert inf_resp.status_code == 200

# 9. GET /api/v1/influencers/match/{id}
match_resp = client.get(f"/api/v1/influencers/match/{product_id}")
print(f"GET /api/v1/influencers/match/{{id}} -> Status: {match_resp.status_code}")
assert match_resp.status_code == 200
match_data = match_resp.json()
assert match_data["is_sample"] is True
print(f"   Verified is_sample={match_data['is_sample']}, disclaimer={match_data['disclaimer'][:40]}...")

print("=" * 60)
print("ALL NEW & HARMONIZED ROUTES CALLED SUCCESSFULLY ON check.db")
print("=" * 60)
