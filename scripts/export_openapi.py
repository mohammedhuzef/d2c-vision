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

    # Update openapi.lock.json if it exists to match new openapi.json
    openapi_lock = contracts_dir / "openapi.lock.json"
    if openapi_lock.exists():
        with open(openapi_lock, "w", encoding="utf-8") as f:
            json.dump(openapi_schema, f, indent=2, sort_keys=True)
            f.write("\n")
        print(f"OpenAPI lock successfully written to {openapi_lock}")

    # Additively update routes.lock.json
    lock_file = contracts_dir / "routes.lock.json"
    if lock_file.exists():
        with open(lock_file, "r", encoding="utf-8") as f:
            existing_locked = json.load(f)
        seen = {(r["method"].upper(), r["path"]) for r in existing_locked}
    else:
        existing_locked = []
        seen = set()

    for path, methods in sorted(openapi_schema.get("paths", {}).items()):
        for method in sorted(methods.keys()):
            if method.lower() in ("get", "post", "put", "patch", "delete"):
                key = (method.upper(), path)
                if key not in seen:
                    existing_locked.append({"method": method.upper(), "path": path})
                    seen.add(key)

    existing_locked.sort(key=lambda x: (x["path"], x["method"]))
    with open(lock_file, "w", encoding="utf-8") as f:
        json.dump(existing_locked, f, indent=2)
        f.write("\n")
    print(f"Routes lock successfully written to {lock_file}")

    # Normalize verdict values in contracts/examples
    examples_dir = contracts_dir / "examples"
    if examples_dir.exists():
        for example_path in examples_dir.glob("*.json"):
            with open(example_path, "r", encoding="utf-8") as f:
                content = f.read()
            changed = False
            for old_v, new_v in [
                ('"GO_WITH_CONDITIONS"', '"READY_WITH_WARNINGS"'),
                ('"NO_GO"', '"NOT_READY"'),
                ('"GO"', '"READY"'),
                ('Executive Verdict: GO_WITH_CONDITIONS', 'Executive Verdict: READY_WITH_WARNINGS'),
                ('Executive Verdict: NO_GO', 'Executive Verdict: NOT_READY'),
                ('Executive Verdict: GO', 'Executive Verdict: READY'),
            ]:
                if old_v in content:
                    content = content.replace(old_v, new_v)
                    changed = True
            if changed:
                with open(example_path, "w", encoding="utf-8", newline="\n") as f:
                    f.write(content)
                print(f"Normalized verdicts in {example_path.name}")

    return out_file


if __name__ == "__main__":
    export_openapi()
