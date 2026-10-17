import json
from pathlib import Path
import pytest
from backend.app.main import app

LOCK_FILE = Path(__file__).resolve().parents[2] / "contracts" / "routes.lock.json"
OPENAPI_LOCK_FILE = Path(__file__).resolve().parents[2] / "contracts" / "openapi.lock.json"
OPENAPI_FILE = OPENAPI_LOCK_FILE if OPENAPI_LOCK_FILE.exists() else (Path(__file__).resolve().parents[2] / "contracts" / "openapi.json")



def test_no_locked_route_removed():
    """Assert every locked route+method still exists in current application openapi."""
    assert LOCK_FILE.exists(), f"Lock file {LOCK_FILE} does not exist"
    with open(LOCK_FILE, "r", encoding="utf-8") as f:
        locked_routes = json.load(f)

    current_openapi = app.openapi()
    current_paths = current_openapi.get("paths", {})

    missing_routes = []
    for r in locked_routes:
        path = r["path"]
        method = r["method"].lower()

        if path not in current_paths:
            missing_routes.append(f"{r['method']} {path} (path missing)")
            continue

        if method not in current_paths[path]:
            missing_routes.append(f"{r['method']} {path} (method missing)")

    assert not missing_routes, f"The following locked routes were removed: {missing_routes}"


def test_existing_response_schemas_only_gained_fields():
    """Assert existing response schemas in openapi.json only gained fields and lost none."""
    assert OPENAPI_FILE.exists(), f"OpenAPI file {OPENAPI_FILE} does not exist"
    with open(OPENAPI_FILE, "r", encoding="utf-8") as f:
        locked_openapi = json.load(f)

    current_openapi = app.openapi()

    locked_schemas = locked_openapi.get("components", {}).get("schemas", {})
    current_schemas = current_openapi.get("components", {}).get("schemas", {})

    missing_fields = []
    for schema_name, locked_schema in locked_schemas.items():
        if schema_name not in current_schemas:
            missing_fields.append(f"Schema removed entirely: {schema_name}")
            continue

        curr_schema = current_schemas[schema_name]
        locked_props = locked_schema.get("properties", {})
        curr_props = curr_schema.get("properties", {})

        for prop_name in locked_props:
            if prop_name not in curr_props:
                missing_fields.append(f"Field removed: {schema_name}.{prop_name}")

    assert not missing_fields, f"The following schema fields were removed: {missing_fields}"
