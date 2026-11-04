# LaunchTwin AI — Verified Features & Proof Catalog

This document indexes all features implemented in LaunchTwin AI that are verified by automated tests. In accordance with platform governance, **only features backed by working assertions are documented here**.

---

## 1. Unit Economics & Deterministic Financial Math

### Mathematical Proof: Vector A vs Vector B Baseline
The platform calculates exact unit economics using Python's `Decimal` type with half-up rounding.

- **Vector A (Initial Product Launch Baseline)**:
  - Inputs: Selling Price = ₹500.00, COGS = ₹150.00, Packaging = ₹30.00, Shipping = ₹40.00, Payment Fee = 2% (₹10.00), Fixed Costs = ₹50,000.00.
  - Variable Cost: **₹230.00** (`150.00 + 30.00 + 40.00 + 10.00`)
  - Contribution Per Unit: **₹270.00** (`500.00 - 230.00`)
  - Contribution Margin Fraction: **0.5400** (54.00%) (`270.00 / 500.00`)
  - Break-Even Sales: **186 units** (`ceil(50000.00 / 270.00) = 186`)
  - **Proving Tests**:
    - `backend/tests/unit/test_finance.py::test_calculate_unit_economics_vector_a`
    - `backend/tests/integration/test_end_to_end_flow.py::test_full_lifecycle_flow`
    - `scripts/e2e_smoke.py`

- **Vector B (Upgraded Packaging Assumption)**:
  - Inputs: Packaging Cost increases from ₹30.00 to ₹60.00 (premium biodegradable packaging).
  - Variable Cost: **₹260.00** (`150.00 + 60.00 + 40.00 + 10.00`)
  - Contribution Per Unit: **₹240.00** (`500.00 - 260.00`)
  - Contribution Margin Fraction: **0.4800** (48.00%) (`240.00 / 500.00`)
  - Break-Even Sales: **209 units** (`ceil(50000.00 / 240.00) = 209`)
  - **Proving Tests**:
    - `backend/tests/unit/test_finance.py::test_calculate_unit_economics_vector_b`
    - `backend/tests/integration/test_end_to_end_flow.py::test_full_lifecycle_flow`
    - `scripts/e2e_smoke.py`

- **Version Delta**:
  - Contribution Margin Delta: **-0.0600 (-6.00%)**
  - Break-Even Delta: **+23 units**
  - **Proving Test**: `backend/tests/integration/test_end_to_end_flow.py::test_full_lifecycle_flow`

---

## 2. Sequential 6-Stage Validation Pipeline

Evaluates products sequentially across 6 business dimensions.

| Stage | Evaluated Criteria | Proving Test |
| :--- | :--- | :--- |
| **`customer`** | Validates customer interview count: `< 5` insufficient, `5..9` warning, `≥ 10` passed. | `backend/tests/unit/stages/test_stages_unit.py::test_customer_stage_evaluation` |
| **`competitor`** | Requires `≥ 2` competitors with at least 1 verified evidence item each. | `backend/tests/unit/stages/test_stages_unit.py::test_competitor_stage_evaluation` |
| **`product_packaging`** | Packaging ratio (`packaging_cost / selling_price`): `> 25%` failed, `> 15%` warning, `≤ 15%` passed. | `backend/tests/unit/stages/test_stages_unit.py::test_packaging_stage_evaluation` |
| **`pricing` (Critical)** | Corridor `-20%` to `+15%` vs competitors; margin `< 15%` fails. | `backend/tests/unit/stages/test_stages_unit.py::test_pricing_stage_evaluation` |
| **`financial` (Critical)**| Unit contribution `≤ 0` fails; break-even `> 2500` warns. | `backend/tests/unit/stages/test_stages_unit.py::test_financial_stage_evaluation` |
| **`marketing`** | CAC ratio (`CAC / contribution_margin`): `> 1.00` fails, `> 0.60` warns, `≤ 0.60` passes. | `backend/tests/unit/stages/test_stages_unit.py::test_marketing_stage_evaluation` |

---

## 3. Assumption Patching, Invalidation DAG & Carry-Forward

- **JSON Diffing**: Patches compare old vs new assumptions and isolate changed dot-notated paths.
  - **Proving Test**: `backend/tests/unit/test_dependencies_and_impact.py::test_assumption_diffing`
- **Topological Invalidation Closure**: Calculates direct and downstream affected stages (`packaging.packaging_cost` closure is exactly `product_packaging`, `pricing`, `financial`, `marketing`).
  - **Proving Test**: `backend/tests/unit/test_release_readiness_part2.py::test_packaging_cost_transitive_closure`
- **Stage Result Carry-Forward**: Carries forward clean, unaffected stage results from previous versions without re-executing them.
  - **Proving Test**: `backend/tests/integration/test_validation_runs_api.py::test_partial_rerun_with_carry_forward_and_downstream_dependency`

---

## 4. Market Research & Safe Scraping Engine

- **Safe Static Scraping**: Extracts readable text and pricing from HTML without executing arbitrary code.
  - **Proving Test**: `backend/tests/unit/test_page_fetcher.py::test_page_fetcher_normal_page_text_extracted`
- **Anti-SSRF Protection Suite**: 
  - Blocks loopback, private IPv4, IPv6, IPv6-mapped IPv4, decimal integer IPs (`2130706433`), hex IPs (`0x7f000001`), and redirect hops to internal networks.
  - **Proving Test**: `backend/tests/unit/test_page_fetcher.py` (20 individual SSRF tests).
- **Evidence Deduplication via SHA-256**: Content hashing prevents duplicate evidence entries across runs.
  - **Proving Test**: `backend/tests/unit/test_ai_research.py::test_re_run_creates_no_duplicates_via_content_hash`
- **Zero-Key Fallback**: Automatically falls back to `MockResearchProvider` if `RESEARCH_PROVIDER=ai` but no API key is configured.
  - **Proving Test**: `backend/tests/unit/test_ai_research.py::test_missing_api_key_falls_back_to_mock`
- **Concurrent Research Protection (409 Conflict)**: Returns HTTP 409 if an active research run is already in progress.
  - **Proving Test**: `backend/tests/unit/test_research_recovery.py::test_active_research_run_returns_409`
- **Stale Run Recovery**: Automatically marks runs older than 900s as `failed` on new trigger or startup.
  - **Proving Test**: `backend/tests/unit/test_research_recovery.py::test_stale_research_run_is_auto_failed_and_replaced`

---

## 5. Abuse & Cost Controls

- **Sliding-Window IP Rate Limiter**: Returns 429 Too Many Requests with `Retry-After` header when limit is exceeded.
  - **Proving Test**: `backend/tests/unit/test_abuse_and_cost_control.py::test_rate_limiter_exceeded_returns_429`
- **Request Body Size Limit**: Returns 413 Payload Too Large if Content-Length exceeds `MAX_REQUEST_BODY_BYTES`.
  - **Proving Test**: `backend/tests/unit/test_abuse_and_cost_control.py::test_request_body_size_limit_middleware`
- **Competitor Ingestion Cap**: Enforces hard limit on competitors per product to guard AI cost.
  - **Proving Test**: `backend/tests/unit/test_abuse_and_cost_control.py::test_competitor_cap_enforced`

---

## 6. What-If Simulation Engine

- **Baseline Invariance**: Simulating with empty overrides returns exact current baseline economics.
  - **Proving Test**: `backend/tests/unit/test_simulation.py::test_simulation_no_overrides_equals_baseline`
- **Price Sensitivity Simulation**: Calculates real-time contribution and break-even deltas under price override scenarios.
  - **Proving Test**: `backend/tests/integration/test_simulation_api.py::test_simulation_price_override`

---

## 7. Executive Report Generation

- **Dual-Format Export**: Generates structured JSON reports and human-readable Markdown exports containing risk flags, evidence metrics, and next steps.
  - **Proving Test**: `backend/tests/unit/test_reports.py::test_report_generation_markdown_export`
- **Deterministic Verdict Mapping**: Maps readiness labels to executive verdicts (`READY` -> `GO`, `READY_WITH_WARNINGS` -> `CAUTION`, `NOT_READY` -> `NO_GO`, `INSUFFICIENT_EVIDENCE` -> `INSUFFICIENT_EVIDENCE`).
  - **Proving Test**: `backend/tests/unit/test_release_readiness_part2.py::test_report_verdict_mapping_every_pair`

---

## 8. Contract Safety & Invariant Scans

- **Contract Equality**: `contracts/openapi.json` exactly matches the running application schema.
  - **Proving Test**: `backend/tests/unit/test_contracts.py::test_openapi_json_matches_app`
- **Route Lock**: Asserts that no existing routes, methods, or fields have been removed or broken.
  - **Proving Test**: `tests/contract/test_no_route_removed.py::test_routes_lock_matches_registered_routes`
