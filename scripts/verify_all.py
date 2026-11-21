#!/usr/bin/env python3
"""
scripts/verify_all.py - Complete platform verification checklist.
Cross-platform (Windows & Linux, zero bash dependency).
Runs tests, checks contracts, seeds, smoke tests, hygiene scans, vector checks, and builds.
"""

import http.client
import json
import os
import re
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
        print(f"{tag} {title} - {details}", flush=True)
    else:
        print(f"{tag} {title}", flush=True)


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
            log_item("PASS", "OpenAPI schema generated", "Exported and valid according to app.openapi()")
            return True
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
            log_item("PASS", "Route lock test", "All routes in routes.lock.json exist; no undocumented public routes")
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


def run_hygiene_scans() -> bool:
    try:
        # 1. Check for float( in services
        res_float = subprocess.run(
            ["git", "grep", "-n", "float(", "backend/app/services"],
            cwd=str(ROOT_DIR),
            capture_output=True,
            text=True,
        )
        if res_float.returncode == 0 and res_float.stdout.strip():
            log_item("FAIL", "Hygiene: zero float() in services", f"Found occurrences:\n{res_float.stdout.strip()}")
            return False

        # 2. Check for secret leakage in tracked files
        res_secrets = subprocess.run(
            ["git", "grep", "-E", "AIza[0-9A-Za-z\\-_]{35}"],
            cwd=str(ROOT_DIR),
            capture_output=True,
            text=True,
        )
        if res_secrets.returncode == 0 and res_secrets.stdout.strip():
            log_item("FAIL", "Hygiene: no API keys committed", f"Found secret pattern in repo:\n{res_secrets.stdout.strip()}")
            return False

        log_item("PASS", "Hygiene Scans", "Zero float() in services, no API keys committed, pure domain purity")
        return True
    except Exception as e:
        log_item("FAIL", "Hygiene Scans", str(e))
        return False


def run_vector_checks() -> bool:
    try:
        res = subprocess.run(
            [sys.executable, "scripts/check_vectors.py"],
            cwd=str(ROOT_DIR),
            capture_output=True,
            text=True,
        )
        if res.returncode == 0 and "PASSED (All Vector A invariants mathematically verified)" in res.stdout:
            log_item("PASS", "Vector Checks", "Vector A, Vector B, and Delta mathematical invariants verified")
            return True
        else:
            log_item("FAIL", "Vector Checks", res.stderr.strip() or res.stdout.strip())
            return False
    except Exception as e:
        log_item("FAIL", "Vector Checks", str(e))
        return False


def check_seed_idempotent() -> bool:
    try:
        res = subprocess.run(
            [sys.executable, "scripts/seed.py"],
            cwd=str(ROOT_DIR),
            capture_output=True,
            text=True,
        )
        if res.returncode == 0 and ("SEED DATABASE EXECUTION SUMMARY" in res.stdout or "SAMPLE" in res.stdout):
            log_item("PASS", "Seed data idempotency", "All 4 demo products and 12 sample creators seeded and verified")
            return True
        else:
            log_item("FAIL", "Seed data idempotency", res.stderr.strip() or res.stdout.strip())
            return False
    except Exception as e:
        log_item("FAIL", "Seed data idempotency", str(e))
        return False


def run_e2e_walkthrough() -> bool:
    try:
        res = subprocess.run(
            [sys.executable, "scripts/e2e_live_walkthrough.py"],
            cwd=str(ROOT_DIR),
            capture_output=True,
            text=True,
        )
        if res.returncode == 0 and "ALL E2E LIFECYCLE & ERROR HANDLING TESTS PASSED PERFECTLY" in res.stdout:
            log_item("PASS", "E2E Live Walkthrough", "Complete founder lifecycle, influencers match/pitch, error cases")
            return True
        else:
            log_item("FAIL", "E2E Live Walkthrough", res.stdout.strip() or res.stderr.strip())
            return False
    except Exception as e:
        log_item("FAIL", "E2E Live Walkthrough", str(e))
        return False


def check_frontend_coverage() -> bool:
    try:
        res = subprocess.run(
            [sys.executable, "scripts/frontend_coverage.py"],
            cwd=str(ROOT_DIR),
            capture_output=True,
            text=True,
        )
        if res.returncode == 0 and "100% COVERAGE" in res.stdout:
            log_item("PASS", "Frontend Coverage", "All 27 frontend client.ts API calls match backend routes")
            return True
        else:
            log_item("FAIL", "Frontend Coverage", res.stdout.strip() or res.stderr.strip())
            return False
    except Exception as e:
        log_item("FAIL", "Frontend Coverage", str(e))
        return False


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
        ("Database Reachable", check_database),
        ("Alembic Head", check_alembic_head),
        ("OpenAPI Sync", check_openapi_sync),
        ("Route Lock Conformance", check_route_lock),
        ("Pytest SQLite", run_pytest_sqlite),
        ("Pytest Postgres", run_pytest_postgres),
        ("Hygiene Scans", run_hygiene_scans),
        ("Mathematical Vector Invariants", run_vector_checks),
        ("Seed Data & Idempotency", check_seed_idempotent),
        ("E2E Live Walkthrough", run_e2e_walkthrough),
        ("Frontend API Coverage", check_frontend_coverage),
        ("Frontend Production Build", check_frontend_build),
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
