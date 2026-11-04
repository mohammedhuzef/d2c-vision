# LaunchTwin AI — Backend Status & Truth Specification

## 1. Rules Truth Table

Real values extracted directly from `backend/app/services/validation/rules_config.py` and `backend/app/services/readiness.py`.

### Validation Stage Rules & Thresholds

| Stage | Stage Weight | Critical? | Thresholds & Cutoffs | Rules & Deductions |
| :--- | :---: | :---: | :--- | :--- |
| **customer** | 15% (0.15) | No | `CUSTOMER_MIN_INTERVIEWS = 5`<br>`CUSTOMER_STRONG_INTERVIEWS = 10` | $\ge 10 \rightarrow \text{PASSED (100)}$<br>$5..9 \rightarrow \text{WARNING (75)}$<br>$< 5 \rightarrow \text{FAILED (40)}$ |
| **competitor** | 15% (0.15) | No | `COMPETITOR_MIN_COUNT = 2`<br>`COMPETITOR_MIN_EVIDENCE_PER_COMPETITOR = 1` | $\ge 2\text{ comps w/ evidence} \rightarrow \text{PASSED (100)}$<br>$1\text{ comp w/ evidence} \rightarrow \text{WARNING (75)}$<br>$0\text{ comps} \rightarrow \text{INSUFFICIENT\_EVIDENCE (None)}$ |
| **product_packaging** | 15% (0.15) | No | `PACKAGING_WARN_FRACTION = 0.15`<br>`PACKAGING_FAIL_FRACTION = 0.25` | $\le 15\% \text{ of price} \rightarrow \text{PASSED (100)}$<br>$15\%..25\% \rightarrow \text{WARNING (75)}$<br>$> 25\% \rightarrow \text{FAILED (40)}$ |
| **pricing** | 20% (0.20) | **Yes** | `PRICING_BELOW_BAND_WARN = 0.20`<br>`PRICING_ABOVE_BAND_WARN = 0.15`<br>`PRICING_FAIL_MARGIN = 0.15`<br>`PRICING_TARGET_MARGIN_DEFAULT = 0.40` | Margin $< 15\% \rightarrow \text{FAILED (40)}$<br>Price $< 20\%\text{ of band} \rightarrow \text{WARNING (75)}$<br>Price $> 15\%\text{ of band} \rightarrow \text{WARNING (75)}$<br>Else $\rightarrow \text{PASSED (100)}$ |
| **financial** | 20% (0.20) | **Yes** | `FINANCIAL_BREAK_EVEN_WARN_UNITS = 2500` | Break-even $\le 2500 \rightarrow \text{PASSED (100)}$<br>Break-even $> 2500 \rightarrow \text{WARNING (75)}$<br>Contribution $\le 0 \rightarrow \text{FAILED (40)}$ |
| **marketing** | 15% (0.15) | No | `MARKETING_CAC_RATIO_WARN = 0.60`<br>`MARKETING_CAC_RATIO_FAIL = 1.00` | CAC / Price $< 0.60 \rightarrow \text{PASSED (100)}$<br>$0.60..1.00 \rightarrow \text{WARNING (75)}$<br>$\ge 1.00 \rightarrow \text{FAILED (40)}$ |

### Overall Readiness Precedence & Score Cutoffs

Implemented in `backend/app/services/readiness.py`:

| Priority | Condition | Overall Readiness Verdict |
| :---: | :--- | :--- |
| **1 (Highest)** | Any **Critical Stage** (`pricing`, `financial`) is `FAILED` | `NOT_READY` |
| **2** | Any **Critical Stage** is `INSUFFICIENT_EVIDENCE` or `NOT_RUN` | `INSUFFICIENT_EVIDENCE` |
| **3** | Any non-critical stage is `FAILED` OR Overall Weighted Score $< 50.00$ | `NOT_READY` |
| **4** | Any stage is `WARNING` OR non-critical `INSUFFICIENT_EVIDENCE`/`NOT_RUN` OR Score $< 70.00$ | `READY_WITH_WARNINGS` |
| **5 (Default)** | All stages `PASSED` AND Overall Weighted Score $\ge 70.00$ | `READY` |

Score Deductions and Caps:
- `BASE_SCORE = 100.00`
- `WARNING_DEDUCTION = -25.00` (Stage score: 75.00)
- `CRITICAL_DEDUCTION = -30.00`
- `FAILED_CAP = 40.00` (Failed stages are capped at 40.00)
- Ready Threshold: $\ge 70.00$; Ready with Warnings Threshold: $\ge 50.00$.

---

## 2. Financial Math & Truth Verification

Implemented in pure Decimal within `backend/app/services/finance.py`:

$$\text{Variable Cost} = \text{COGS} + \text{Packaging} + \text{Shipping} + \text{Other Variable} + \text{Fixed Payment Fee} + (\text{Payment Fee Fraction} + \text{Platform Fee Fraction}) \times \text{Selling Price}$$

$$\text{Contribution Margin (per unit)} = \text{Selling Price} - \text{Variable Cost}$$

$$\text{Margin Fraction} = \frac{\text{Contribution Margin}}{\text{Selling Price}}$$

$$\text{Break-Even Units} = \left\lceil \frac{\text{Fixed Costs Total}}{\text{Contribution Margin}} \right\rceil \quad (\text{only when Contribution Margin} > 0)$$

### Rounding & Consistency Rule
1. **Variable Cost** is rounded to 2 decimal places first (`ROUND_HALF_UP`).
2. **Contribution** is derived from the rounded Variable Cost.
3. **Margin Fraction** is rounded to 4 decimal places (`ROUND_HALF_UP`).
4. **Break-Even Units** is computed as the ceiling (`math.ceil` / `ROUND_CEILING`) only when contribution $> 0$.

### Mathematical Proof Vectors

- **Vector A (Healthy Baseline)**:
  - Price: 500.00, COGS: 150.00, Packaging: 30.00, Shipping: 40.00, Fee: 0.02 (10.00), Fixed: 50000.00
  - Variable Cost: $150 + 30 + 40 + (0.02 \times 500) = \mathbf{230.00}$
  - Contribution: $500 - 230 = \mathbf{270.00}$
  - Margin: $270 / 500 = \mathbf{0.5400}$ (54.00%)
  - Break-Even: $\lceil 50000 / 270 \rceil = \lceil 185.185 \rceil = \mathbf{186}$ units

- **Vector B (High Packaging Cost)**:
  - Packaging: 60.00
  - Variable Cost: $150 + 60 + 40 + (0.02 \times 500) = \mathbf{260.00}$
  - Contribution: $500 - 260 = \mathbf{240.00}$
  - Margin: $240 / 500 = \mathbf{0.4800}$ (48.00%)
  - Break-Even: $\lceil 50000 / 240 \rceil = \lceil 208.333 \rceil = \mathbf{209}$ units

---

## 3. Comprehensive Route List

All routes verified against `contracts/routes.lock.json` and `contracts/openapi.json`:

| Route Path | Method | Purpose |
| :--- | :---: | :--- |
| `/health` | GET | Database connectivity health check |
| `/api/v1/products` | POST | Create product with immutable version 1 |
| `/api/v1/products` | GET | List products with pagination caps (max 100) & N+1 query prevention |
| `/api/v1/products/{product_id}` | GET | Get product details, latest run, readiness & enriched counts |
| `/api/v1/products/{product_id}/assumptions` | PATCH | Patch assumptions; creates immutable v2, diffs impact, optional revalidate |
| `/api/v1/products/{product_id}/impact-events` | GET | List historical impact events and stage-level diffs |
| `/api/v1/products/{product_id}/evidence` | GET | List product research evidence with filters (`source_type`, `competitor_id`) |
| `/api/v1/products/{product_id}/competitors` | POST | Register competitor benchmarks with observed price and notes |
| `/api/v1/products/{product_id}/competitors` | GET | List product competitors with observed prices and evidence counts |
| `/api/v1/products/{product_id}/versions` | GET | List immutable product assumption versions |
| `/api/v1/products/{product_id}/versions/compare` | GET | Compare two versions showing field-level assumption diffs & metric changes |
| `/api/v1/products/{product_id}/validate` | POST | Execute 6-stage validation pipeline on latest version |
| `/api/v1/products/{product_id}/revalidate` | POST | Revalidate affected stages after an assumption change (carries forward clean stages) |
| `/api/v1/products/{product_id}/readiness` | GET | Fetch calculated launch readiness status, score, and blocking stages |
| `/api/v1/products/{product_id}/recommendations` | GET | Fetch actionable recommendations based on stage findings |
| `/api/v1/products/{product_id}/validation/simulate` | POST | What-If simulation without persisting assumptions or versions |
| `/api/v1/products/{product_id}/validation/runs` | GET | List historical validation runs for a product |
| `/api/v1/products/{product_id}/validation/runs/latest` | GET | Get latest completed validation run |
| `/api/v1/products/{product_id}/validation/runs/{run_id}` | GET | Get specific validation run by ID |
| `/api/v1/products/{product_id}/research` | POST | Trigger research run (returns 202 Accepted, 409 Conflict if active) |
| `/api/v1/products/{product_id}/research` | GET | List research runs for a product |
| `/api/v1/products/{product_id}/research/{run_id}` | GET | Get research run status and competitor outcomes |
| `/api/v1/products/{product_id}/reports` | POST | Generate launch readiness markdown report with evidence quality |
| `/api/v1/products/{product_id}/reports` | GET | List generated reports |
| `/api/v1/products/{product_id}/reports/latest` | GET | Fetch latest generated report |
| `/api/v1/products/{product_id}/reports/{report_id}` | GET | Fetch specific report by ID |
| `/api/v1/products/{product_id}/influencers` | POST | Add influencer marketing profile |
| `/api/v1/products/{product_id}/influencers` | GET | List influencers and aggregate ROI / budget metrics |
| `/api/v1/internal/research-results` | POST | Ingest external research results idempotently (content hash deduplication) |
| `/api/v1/internal/research/results` | POST | Slash-alias for external ingest compatibility |

---

## 4. Test Proof Matrix

| Feature / Requirement | Proving Test File & Test Name | Verdict |
| :--- | :--- | :---: |
| **Financial Calculations & Proof Vectors** | `backend/tests/unit/test_finance.py` (`test_finance_vector_a`, `test_finance_vector_b`) | PASS |
| **Determinism (Validate Twice -> Identical)** | `backend/tests/integration/test_validation_runs_api.py` (`test_validation_determinism_identical_runs`) | PASS |
| **Domain Purity (Zero DB/HTTP/LLM in Pure Layers)** | `backend/tests/unit/test_ai_research.py` (`test_pure_modules_isolation_scan`) | PASS |
| **Float Ban (Strictly Zero `float(` in Services)** | Static ripgrep scan across `backend/app/services` | PASS |
| **Immutability of Versions & Validation Runs** | `backend/tests/unit/test_database_immutability.py` (`test_database_immutability_product_versions_and_validation_runs`) | PASS |
| **Core Flow (Vector A -> PATCH Packaging 30->60 -> v2)** | `backend/tests/integration/test_task5_contract_and_immutability.py` (`test_task5_core_patch_flow_versioning_and_stage_isolation`) | PASS |
| **No-Op Patch Creates No Version** | `backend/tests/unit/test_task4_readiness_and_pipeline.py` (`test_noop_patch_creates_no_version`) | PASS |
| **Simultaneous Patches (Versions 2 & 3 Concurrency)** | `backend/tests/unit/test_task4_readiness_and_pipeline.py` (`test_simultaneous_patches_produce_distinct_versions`) | PASS |
| **Money Columns NUMERIC(14,2) or Wider** | `backend/tests/unit/test_task4_readiness_and_pipeline.py` (`test_database_money_columns_are_numeric_14_2_or_wider`) | PASS |
| **Research Fallback to Mock when Key Missing** | `backend/tests/unit/test_ai_research.py` (`test_missing_api_key_falls_back_to_mock`) | PASS |
| **Research 409 Conflict on Active Run** | `backend/tests/integration/test_task5_contract_and_immutability.py` (`test_research_run_conflict_409_when_active`) | PASS |
| **Idempotent Evidence Deduplication** | `backend/tests/integration/test_task5_contract_and_immutability.py` (`test_research_evidence_deduplication_by_content_hash`) | PASS |
| **SSRF Comprehensive Guard (All IP & URL Formats)** | `backend/tests/unit/test_page_fetcher.py` (`test_ssrf_reject_*` [14 distinct attack vectors]) | PASS |
| **Prompt Injection Immunity** | `backend/tests/unit/test_ai_research.py` (`test_prompt_injection_in_page_cannot_change_status_or_numbers`) | PASS |
| **X-Request-ID & Structured Logging** | `backend/tests/integration/test_task5_contract_and_immutability.py` (`test_request_id_middleware_and_structured_logs`) | PASS |
| **N+1 Query Elimination on 20 Products** | `backend/tests/unit/test_frontend_readiness_and_gaps.py` (`test_no_n_plus_one_queries_for_products`) | PASS |
| **Route & Schema Lock (No Removed Routes/Fields)** | `tests/contract/test_no_route_removed.py` (`test_no_locked_route_removed`, `test_existing_response_schemas_only_gained_fields`) | PASS |
| **End-to-End Smoke Lifecycle (10 Stages)** | `scripts/e2e_smoke.py` / `scripts/verify_all.py` | PASS |

---

## 5. Honest Limitations

1. **Client-Side JavaScript Pages**: The `page_fetcher` service uses `httpx` to perform safe, SSRF-guarded HTTP GET requests and extracts content using BeautifulSoup. Websites rendered purely with client-side JavaScript (SPAs without SSR / prerendering) will yield empty or minimal text excerpts unless server-rendered HTML is present.
2. **Authentication & Multi-Tenancy**: The current release does not enforce user authentication, JWT verification, or tenant isolation. All products and runs reside in a shared schema suitable for internal evaluation.
3. **Synchronous Validation Lifecycle**: Validation runs, simulations, and revalidations are computed synchronously in-process. While performance is sub-35ms on SQLite, prolonged external web research in AI mode should be run via asynchronous job queues in higher-concurrency environments.
4. **Scope of Financial Models**: The financial engine computes unit economics (variable cost, contribution margin, break-even unit threshold). Customer Lifetime Value (LTV), customer churn curves, and multi-month payback period schedules are intentionally outside current scope and are not computed.
5. **PostgreSQL Gated Tests on Local Windows**: The local test environment runs on Windows without an active Docker daemon or live PostgreSQL service. While PostgreSQL migrations, triggers, and column widths are verified in migration files and SQLite, PostgreSQL-gated integration tests are cleanly skipped when `TEST_DATABASE_URL` is absent.
