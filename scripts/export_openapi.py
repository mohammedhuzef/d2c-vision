import json
import sys
from pathlib import Path

# Ensure workspace root and backend directory are in sys.path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))
sys.path.insert(0, str(root_dir / "backend"))

from backend.app.main import app


def export_openapi() -> Path:
    openapi_schema = app.openapi()
    contracts_dir = root_dir / "contracts"
    contracts_dir.mkdir(parents=True, exist_ok=True)
    out_file = contracts_dir / "openapi.json"

    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(openapi_schema, f, indent=2, sort_keys=True)
        f.write("\n")

    print(f"OpenAPI schema successfully written to {out_file}")
    return out_file


if __name__ == "__main__":
    export_openapi()
