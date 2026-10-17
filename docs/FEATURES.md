# LaunchTwin AI — Verified Features & Proof Catalog

This document indexes all features implemented in LaunchTwin AI that are verified by automated tests. In accordance with platform governance, **only features backed by working assertions are documented here**.

---

## 1. Unit Economics & Deterministic Financial Math

### Mathematical Proof: Vector A vs Vector B Baseline
The platform calculates exact unit economics using Python's `Decimal` type with half-up rounding.

- **Vector A (Initial Product Launch Baseline)**:
  - Assumptions: Selling Price = ₹500.00, COGS = ₹150.00, Packaging = ₹30.00, Shipping = ₹40.00, Payment Fee = 2% (₹10.00), Fixed Costs = ₹50,000.00.
  - Variable Cost: **₹230.00** (`150.00 + 30.00 + 40.00 + 10.00`)
  - Contribution Per Unit: **₹270.00** (`500.00 - 230.00`)
  - Contribution Margin: **0.5400** (54.00%) (`270.00 / 500.00`)
  - Break-Even Sales: **186 units** (`ceil(50000.00 / 270.00) = 186`)
  - **Proving Test**: [`backend/tests/unit/test_finance.py::test_calculate_unit_economics_vector_a`](file:///c:/Users/huzef/OneDrive/Desktop/d2c-platform/backend/tests/unit/test_finance.py) and [`scripts/e2e_smoke.py`](file:///c:/Users/huzef/OneDrive/Desktop/d2c-platform/scripts/e2e_smoke.py)

- **Vector B (Upgraded Packaging Assumption)**:
  - Assumptions: Packaging Cost increases from ₹30.00 to ₹60.00 (biodegradable upgrade).
  - Variable Cost: **₹260.00** (`150.00 + 60.00 + 40.00 + 10.00`)
  - Contribution Per Unit: **₹240.00** (`500.00 - 260.00`)
  - Contribution Margin: **0.4800** (48.00%) (`240.00 / 500.00`)
  - Break-Even Sales: **209 units** (`ceil(50000.00 / 240.00) = 209`)
  - **Proving Test**: [`backend/tests/unit/test_finance.py::test_calculate_unit_economics_vector_b`](file:///c:/Users/huzef/OneDrive/Desktop/d2c-platform/backend/tests/unit/test_finance.py) and [`scripts/e2e_smoke.py`](file:///c:/Users/huzef/OneDrive/Desktop/d2c-platform/scripts/e2e_smoke.py)

- **Version Delta**:
  - Contribution Margin Delta: **-0.0600 (-6.00%)**
  - Break-Even Delta: **+23 units**
  - **Proving Test**: [`backend/tests/integration/test_end_to_end_flow.py::test_full_lifecycle_flow`](file:///c:/Users/huzef/OneDrive/Desktop/d2c-platform/backend/tests/integration/test_end_to_end_flow.py)

---

## 2. Sequential 6-Stage Validation Pipeline

Evaluates products sequentially across 6 business dimensions.

| Stage | Evaluated Criteria | Proving Test |
| :--- | :--- | :--- |
| **`customer`** | Validates customer interview count (`>= 10`) and problem statement clarity. | `backend/tests/unit/stages/test_stages_unit.py::test_customer_stage_evaluation` |
| **`competitor`** | Checks competitor benchmark count (`>= 2`) and verified evidence coverage. | `backend/tests/unit/stages/test_stages_unit.py::test_competitor_stage_evaluation` |
| **`product_packaging`** | Asserts packaging cost ratio stays under 15% of selling price. | `backend/tests/unit/stages/test_stages_unit.py::test_packaging_stage_evaluation` |
| **`pricing` (Critical)** | Verifies target margin compliance and competitive corridor positioning. | `backend/tests/unit/stages/test_stages_unit.py::test_pricing_stage_evaluation` |
| **`financial` (Critical)**| Enforces unit contribution > 0 and break-even unit volume feasibility. | `backend/tests/unit/stages/test_stages_unit.py::test_financial_stage_evaluation` |
| **`marketing`** | Enforces CAC to unit contribution ratio `<= 0.50` (50%). | `backend/tests/unit/stages/test_stages_unit.py::test_marketing_stage_evaluation` |

---

## 3. Assumption Patching, Invalidation DAG & Carry-Forward

- **JSON Diffing**: Patches compare old vs new assumptions and isolate changed dot-notated paths.
  - **Proving Test**: `backend/tests/unit/test_dependencies_and_impact.py::test_assumption_diffing`
- **Topological Invalidation Closure**: Calculates direct and downstream affected stages.
  - **Proving Test**: `backend/tests/unit/test_dependencies_and_impact.py::test_transitive_invalidation`
- **Stage Result Carry-Forward**: Carries forward clean, unaffected stage results from previous versions without re-executing them.
  - **Proving Test**: `backend/tests/integration/test_validation_runs_api.py::test_partial_rerun_with_carry_forward_and_downstream_dependency`
- **Database Immutability Triggers**:
  - PostgreSQL trigger prevents UPDATE/DELETE on `product_versions` and `validation_runs`.
  - **Proving Test**: `backend/tests/integration/test_postgres_features.py::test_postgres_immutability_trigger` (PostgreSQL) and `backend/tests/unit/test_products_and_competitors.py::test_sqlite_immutability_trigger` (SQLite).

---

## 4. Market Research & Safe Scraping Engine

- **Safe Static Scraping**: Extracts readable text and pricing from HTML without executing arbitrary code.
  - **Proving Test**: `backend/tests/unit/test_page_fetcher.py::test_page_fetcher_normal_page_text_extracted`
- **Anti-SSRF Protection Suite**: 
  - Blocks loopback, private IPv4, IPv6, IPv6-mapped IPv4, decimal integer IPs (`2130706433`), hex IPs (`0x7f000001`), and redirect hops to internal networks.
  - **Proving Test**: `backend/tests/unit/test_page_fetcher.py` (20 individual SSRF tests).
- **Evidence Deduplication via SHA-256**: Content hashing prevents duplicate evidence entries across runs.
  - **Proving Test**: `backend/tests/unit/test_ai_research.py::test_re_run_creates_no_duplicates_via_content_hash` and `backend/tests/unit/test_research_provider.py::test_research_endpoints_and_idempotency`
- **Zero-Key Fallback**: Automatically falls back to `MockResearchProvider` if `RESEARCH_PROVIDER=ai` but no API key is configured.
  - **Proving Test**: `backend/tests/unit/test_ai_research.py::test_missing_api_key_falls_back_to_mock`
- **Concurrent Research Protection**: Returns HTTP `409 CONFLICT` if a research run is already active for a product.
  - **Proving Test**: `backend/tests/unit/test_research_provider.py::test_concurrent_research_conflict_409`

---

## 5. What-If Simulation Engine

- **Baseline Invariance**: Simulating with empty overrides returns exact current baseline economics.
  - **Proving Test**: `backend/tests/unit/test_simulation.py::test_simulation_no_overrides_equals_baseline`
- **Price Sensitivity Simulation**: Calculates real-time contribution and break-even deltas under price override scenarios.
  - **Proving Test**: `backend/tests/integration/test_simulation_api.py::test_simulation_price_override`

---

## 6. Executive Report Generation

- **Dual-Format Export**: Generates structured JSON reports and human-readable Markdown exports containing risk flags, evidence metrics, and next steps.
  - **Proving Test**: `backend/tests/unit/test_reports.py::test_report_generation_markdown_export`

---

## 7. Contract Safety & Invariant Scans

- **Contract Equality**: `contracts/openapi.json` exactly matches the running application schema.
  - **Proving Test**: `backend/tests/unit/test_contracts.py::test_openapi_json_matches_app`
- **Zero Route Deletion**: Verifies no endpoints or response fields have been removed or renamed.
  - **Proving Test**: `tests/contract/test_no_route_removed.py::test_no_route_removed`
- **Pure Layer Isolation Scan**: Asserts pure domain modules do not import from ORM, API, or network packages.
  - **Proving Test**: `backend/tests/unit/test_ai_research.py::test_pure_modules_isolation_scan`
- **Validation Determinism**: Asserts two back-to-back validations on the same product return identical results and scores.
  - **Proving Test**: `backend/tests/integration/test_validation_runs_api.py::test_validation_determinism_identical_runs`
