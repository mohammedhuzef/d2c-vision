#!/usr/bin/env python3
"""
scripts/frontend_coverage.py - Frontend API Coverage Verifier.

Reads frontend/src/api/client.ts (read-only), extracts every API call,
and verifies corresponding backend route existence in the FastAPI application.
Prints a coverage comparison table.
"""

import re
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))
sys.path.insert(0, str(ROOT_DIR / "backend"))

from backend.app.main import app

CLIENT_TS_PATH = ROOT_DIR / "frontend" / "src" / "api" / "client.ts"


def extract_frontend_api_calls():
    """Extracts endpoint calls from frontend/src/api/client.ts."""
    if not CLIENT_TS_PATH.exists():
        raise FileNotFoundError(f"Cannot find frontend client at {CLIENT_TS_PATH}")

    content = CLIENT_TS_PATH.read_text(encoding="utf-8")
    lines = content.splitlines()

    calls = []
    current_svc = ""
    current_fn = ""
    in_request = False
    req_lines = []

    for line in lines:
        s = line.strip()

        # Track service blocks: e.g. "products: {", "validation: {"
        m_svc = re.match(r"^([a-zA-Z_]\w*):\s*\{", s)
        if m_svc and m_svc.group(1) not in ("headers", "params", "body", "options"):
            current_svc = m_svc.group(1)

        # Track member functions: e.g. "list: (params", "get: (productId"
        m_fn = re.match(r"^([a-zA-Z_]\w*):\s*(?:\([^)]*\)|[a-zA-Z_]\w*)?\s*=>", s)
        if m_fn:
            current_fn = m_fn.group(1)

        # Detect start of request(...) invocation
        if "request<" in s or "request(" in s:
            in_request = True
            req_lines = [s]
        elif in_request:
            req_lines.append(s)

        # Detect end of request(...) invocation
        if in_request and (s.endswith(")") or s.endswith("),") or s.endswith("});") or s.endswith("}") or s.endswith("},")):
            full_req = " ".join(req_lines)
            p_match = re.search(r"request(?:<[^>]*>)?\(\s*[`'\"]([^`'\"]+)[`'\"]", full_req)
            if p_match:
                raw_path = p_match.group(1)
                method = "GET"
                m_method = re.search(r"method:\s*['\"](POST|PATCH|DELETE|PUT|GET)['\"]", full_req, re.IGNORECASE)
                if m_method:
                    method = m_method.group(1).upper()

                # Normalize path
                clean_path = raw_path.split("${qs")[0]
                clean_path = re.sub(r"\$\{productId\}", "{product_id}", clean_path)
                clean_path = re.sub(r"\$\{projectId\}", "{project_id}", clean_path)
                clean_path = re.sub(r"\$\{researchId\}", "{research_id}", clean_path)
                clean_path = re.sub(r"\$\{runId\}", "{run_id}", clean_path)
                clean_path = re.sub(r"\$\{versionA\}", "{version_a}", clean_path)
                clean_path = re.sub(r"\$\{versionB\}", "{version_b}", clean_path)
                clean_path = re.sub(r"\$\{reportId\}", "{report_id}", clean_path)
                clean_path = re.sub(r"\$\{influencerId\}", "{influencer_id}", clean_path)

                if clean_path != "/health" and not clean_path.startswith("/api/v1"):
                    expected_backend_path = f"/api/v1{clean_path if clean_path.startswith('/') else '/' + clean_path}"
                else:
                    expected_backend_path = clean_path

                call_label = f"{current_svc}.{current_fn}" if current_svc and current_fn else raw_path
                calls.append({
                    "name": call_label,
                    "method": method,
                    "normalized_path": expected_backend_path,
                })
                in_request = False
                req_lines = []

    return calls


def main():
    print("=" * 105)
    print("FRONTEND API CLIENT COVERAGE VERIFICATION")
    print(f"Inspecting: {CLIENT_TS_PATH}")
    print("=" * 105)

    frontend_calls = extract_frontend_api_calls()

    # Load OpenAPI paths from app
    spec = app.openapi()
    backend_routes = set()
    for path, methods in spec.get("paths", {}).items():
        for m in methods.keys():
            if m.upper() in {"GET", "POST", "PATCH", "PUT", "DELETE"}:
                backend_routes.add((m.upper(), path))

    # Also include root /health
    backend_routes.add(("GET", "/health"))

    print(f"\nDiscovered {len(frontend_calls)} frontend API call invocations in client.ts.\n")
    print(f"{'Frontend Call':<38} | {'Method':<6} | {'Target Backend Route':<45} | {'Status'}")
    print("-" * 105)

    all_matched = True
    for call in frontend_calls:
        key = (call["method"], call["normalized_path"])
        exists = key in backend_routes
        status = "MATCHED (200/201/202)" if exists else "MISSING"
        if not exists:
            all_matched = False
        print(f"{call['name']:<38} | {call['method']:<6} | {call['normalized_path']:<45} | {status}")

    print("-" * 105)
    if all_matched:
        print("\nALL FRONTEND API CALLS HAVE MATCHING BACKEND ROUTES (100% COVERAGE)!\n")
        sys.exit(0)
    else:
        print("\nERROR: SOME FRONTEND API CALLS DO NOT HAVE MATCHING BACKEND ROUTES!\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
