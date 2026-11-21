import json
from pathlib import Path
import jsonschema
import pytest

from backend.app.main import app

ROOT_DIR = Path(__file__).resolve().parents[2]
LOCK_FILE = ROOT_DIR / "contracts" / "routes.lock.json"
OPENAPI_FILE = ROOT_DIR / "contracts" / "openapi.json"


def test_no_locked_route_removed():
    """Assert every locked route+method still exists in current application openapi,
    and no extra undocumented public routes exist."""
    assert LOCK_FILE.exists(), f"Lock file {LOCK_FILE} does not exist"
    with open(LOCK_FILE, "r", encoding="utf-8") as f:
        locked_routes = json.load(f)

    current_openapi = app.openapi()
    current_paths = current_openapi.get("paths", {})

    locked_set = {(r["method"].upper(), r["path"]) for r in locked_routes}
    
    app_routes = set()
    for path, methods in current_paths.items():
        for method in methods.keys():
            if method.upper() in {"GET", "POST", "PATCH", "PUT", "DELETE"}:
                app_routes.add((method.upper(), path))

    # 1. Assert no locked routes are missing
    missing_routes = sorted(locked_set - app_routes)
    assert not missing_routes, f"The following locked routes were removed: {missing_routes}"

    # 2. Assert no extra undocumented public routes (excluding health aliases or docs)
    extra_routes = sorted(app_routes - locked_set)
    assert not extra_routes, f"The following extra undocumented routes exist in the app: {extra_routes}"


def test_openapi_schemas_validate_seeded_data(client):
    """Assert app.openapi() response schemas validate responses for core seeded endpoints."""
    current_openapi = app.openapi()
    resolver = jsonschema.RefResolver.from_schema(current_openapi)

    # 1. Health
    r = client.get("/health")
    assert r.status_code == 200

    # 2. Products list
    r_prod = client.get("/api/v1/products?limit=10")
    assert r_prod.status_code == 200
    prod_data = r_prod.json()
    prod_schema = current_openapi["components"]["schemas"]["ProductListResponse"]
    jsonschema.validate(instance=prod_data, schema=prod_schema, resolver=resolver)

    # 3. Influencers list
    r_inf = client.get("/api/v1/influencers")
    assert r_inf.status_code == 200
    inf_data = r_inf.json()
    inf_schema = current_openapi["components"]["schemas"]["InfluencerListResponse"]
    jsonschema.validate(instance=inf_data, schema=inf_schema, resolver=resolver)
