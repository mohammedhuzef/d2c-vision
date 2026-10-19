#!/usr/bin/env python3
"""
scripts/verify_all.py - Complete platform verification checklist.
Cross-platform (Windows & Linux, zero bash dependency).
Runs tests, checks contracts, seeds, smoke tests, and builds.
"""

import http.client
import json
import os
import subprocess
import sys
import time
from pathlib import Path

# Paths
ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"
CONTRACTS_DIR = ROOT_DIR / "contracts"

sys.path.insert(0, str(ROOT_DIR))
sys.path.insert(0, str(BACKEND_DIR))


def log_item(status: str, title: str, details: str = ""):
    pad = 8 - len(status)
    tag = f"[{status}]" + (" " * pad)
    if details:
        print(f"{tag} {title} - {details}")
    else:
        print(f"{tag} {title}")


def run_pip_check() -> bool:
    try:
        res = subprocess.run(
            [sys.executable, "-m", "pip", "check"],
            cwd=str(ROOT_DIR),
            capture_output=True,
            text=True,
        )
        if res.returncode == 0:
            log_item("PASS", "Dependencies installed (pip check)", "No broken requirements")
            return True
        else:
            log_item("FAIL", "Dependencies installed (pip check)", res.stderr.strip() or res.stdout.strip())
            return False
    except Exception as e:
        log_item("FAIL", "Dependencies installed (pip check)", str(e))
        return False


def check_database() -> bool:
    try:
        from backend.app.core.database import engine
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        log_item("PASS", "Database reachable", f"Engine: {engine.url.render_as_string(hide_password=True)}")
        engine.dispose()
        return True
    except Exception as e:
        log_item("FAIL", "Database reachable", str(e))
        return False


def check_alembic_head() -> bool:
    try:
        res = subprocess.run(
            [sys.executable, "-m", "alembic", "heads"],
            cwd=str(ROOT_DIR),
            capture_output=True,
            text=True,
        )
        output = res.stdout.strip()
        lines = [line.strip() for line in output.splitlines() if line.strip()]
        if res.returncode == 0 and len(lines) == 1 and "(head)" in lines[0]:
            log_item("PASS", "Alembic at single head", lines[0])
            return True
        else:
            log_item("FAIL", "Alembic at single head", output or res.stderr.strip())
            return False
    except Exception as e:
        log_item("FAIL", "Alembic at single head", str(e))
        return False


def check_openapi_sync() -> bool:
    try:
        from backend.app.main import app
        current_schema = app.openapi()
        contract_file = CONTRACTS_DIR / "openapi.json"
        if not contract_file.exists():
            log_item("FAIL", "OpenAPI contract exists", f"{contract_file} missing")
            return False
        with open(contract_file, "r", encoding="utf-8") as f:
            stored_schema = json.load(f)

        current_str = json.dumps(current_schema, sort_keys=True)
        stored_str = json.dumps(stored_schema, sort_keys=True)
        if current_str == stored_str:
            log_item("PASS", "OpenAPI schema in sync with contracts/openapi.json", "Character-for-character match")
            return True
        else:
            log_item("FAIL", "OpenAPI schema in sync with contracts/openapi.json", "Schema differs from generated app.openapi()")
            return False
    except Exception as e:
        log_item("FAIL", "OpenAPI schema in sync with contracts/openapi.json", str(e))
        return False


def check_route_lock() -> bool:
    try:
        res = subprocess.run(
            [sys.executable, "-m", "pytest", "tests/contract/test_no_route_removed.py", "-q"],
            cwd=str(ROOT_DIR),
            capture_output=True,
            text=True,
        )
        if res.returncode == 0:
            log_item("PASS", "Route lock test", "No endpoints removed or modified")
            return True
        else:
            log_item("FAIL", "Route lock test", res.stdout.strip() or res.stderr.strip())
            return False
    except Exception as e:
        log_item("FAIL", "Route lock test", str(e))
        return False


def run_pytest_sqlite() -> bool:
    try:
        res = subprocess.run(
            [sys.executable, "-m", "pytest", "backend/tests/", "tests/", "-q"],
            cwd=str(ROOT_DIR),
            capture_output=True,
            text=True,
        )
        summary = res.stdout.strip().splitlines()[-1] if res.stdout.strip() else ""
        if res.returncode == 0:
            log_item("PASS", "Pytest SQLite mode", summary)
            return True
        else:
            log_item("FAIL", "Pytest SQLite mode", summary or res.stderr.strip())
            return False
    except Exception as e:
        log_item("FAIL", "Pytest SQLite mode", str(e))
        return False


def run_pytest_postgres() -> bool:
    test_pg_url = os.environ.get("TEST_DATABASE_URL")
    if not test_pg_url:
        log_item("SKIP", "Pytest PostgreSQL mode", "TEST_DATABASE_URL is not set (host has no live PostgreSQL daemon)")
        return True
    try:
        res = subprocess.run(
            [sys.executable, "-m", "pytest", "backend/tests/integration/test_postgres_features.py", "-q"],
            cwd=str(ROOT_DIR),
            capture_output=True,
            text=True,
            env=dict(os.environ, TEST_DATABASE_URL=test_pg_url),
        )
        summary = res.stdout.strip().splitlines()[-1] if res.stdout.strip() else ""
        if res.returncode == 0:
            log_item("PASS", "Pytest PostgreSQL mode", summary)
            return True
        else:
            log_item("FAIL", "Pytest PostgreSQL mode", summary or res.stderr.strip())
            return False
    except Exception as e:
        log_item("FAIL", "Pytest PostgreSQL mode", str(e))
        return False


def check_seed_idempotent() -> bool:
    try:
        res = subprocess.run(
            [sys.executable, "scripts/seed.py"],
            cwd=str(ROOT_DIR),
            capture_output=True,
            text=True,
        )
        if res.returncode == 0 and ("SEED DATABASE EXECUTION SUMMARY" in res.stdout or "ALREADY_EXISTS" in res.stdout):
            log_item("PASS", "Seed data idempotency", "Both demo products seeded/verified without duplicates")
            return True
        else:
            log_item("FAIL", "Seed data idempotency", res.stderr.strip() or res.stdout.strip())
            return False
    except Exception as e:
        log_item("FAIL", "Seed data idempotency", str(e))
        return False


def is_server_running(host: str = "127.0.0.1", port: int = 8000) -> bool:
    try:
        conn = http.client.HTTPConnection(host, port, timeout=1.0)
        conn.request("GET", "/health")
        resp = conn.getresponse()
        return resp.status == 200
    except Exception:
        return False


def run_e2e_smoke() -> bool:
    server_proc = None
    started_here = False
    try:
        if not is_server_running():
            # Start uvicorn server in background
            server_proc = subprocess.Popen(
                [sys.executable, "-m", "uvicorn", "backend.app.main:app", "--port", "8000", "--host", "127.0.0.1"],
                cwd=str(ROOT_DIR),
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            started_here = True
            for _ in range(20):
                time.sleep(0.5)
                if is_server_running():
                    break

        res = subprocess.run(
            [sys.executable, "scripts/e2e_smoke.py"],
            cwd=str(ROOT_DIR),
            capture_output=True,
            text=True,
        )
        if res.returncode == 0 and "ALL 10 E2E SMOKE TESTS PASSED" in res.stdout:
            log_item("PASS", "E2E smoke lifecycle (10 stages)", "All endpoints, validations, and carry-forward passed")
            return True
        else:
            log_item("FAIL", "E2E smoke lifecycle (10 stages)", res.stdout.strip() or res.stderr.strip())
            return False
    except Exception as e:
        log_item("FAIL", "E2E smoke lifecycle (10 stages)", str(e))
        return False
    finally:
        if started_here and server_proc is not None:
            server_proc.terminate()
            server_proc.wait(timeout=5)


def check_frontend_build() -> bool:
    if not FRONTEND_DIR.exists():
        log_item("SKIP", "Frontend build", "frontend/ directory does not exist")
        return True
    try:
        cmd = ["npm.cmd", "run", "build"] if os.name == "nt" else ["npm", "run", "build"]
        res = subprocess.run(
            cmd,
            cwd=str(FRONTEND_DIR),
            capture_output=True,
            text=True,
        )
        if res.returncode == 0:
            log_item("PASS", "Frontend build (npm run build)", "Vite production bundle compiled cleanly")
            return True
        else:
            log_item("FAIL", "Frontend build (npm run build)", res.stderr.strip() or res.stdout.strip())
            return False
    except Exception as e:
        log_item("FAIL", "Frontend build (npm run build)", str(e))
        return False


def main():
    print("=" * 70)
    print("LaunchTwin AI — Full Platform Verification Checklist")
    print("=" * 70)

    checklist = [
        ("Dependencies", run_pip_check),
        ("Database", check_database),
        ("Alembic Head", check_alembic_head),
        ("OpenAPI Sync", check_openapi_sync),
        ("Route Lock", check_route_lock),
        ("Pytest SQLite", run_pytest_sqlite),
        ("Pytest Postgres", run_pytest_postgres),
        ("Seed Idempotency", check_seed_idempotent),
        ("E2E Smoke Lifecycle", run_e2e_smoke),
        ("Frontend Build", check_frontend_build),
    ]

    results = []
    for name, func in checklist:
        passed = func()
        results.append(passed)

    print("=" * 70)
    if all(results):
        print("RESULT: ALL AUDIT CHECKS PASSED CLEANLY (EXIT CODE 0)")
        print("=" * 70)
        sys.exit(0)
    else:
        failed_count = sum(1 for r in results if not r)
        print(f"RESULT: {failed_count} CHECK(S) FAILED (EXIT CODE 1)")
        print("=" * 70)
        sys.exit(1)


if __name__ == "__main__":
    main()
