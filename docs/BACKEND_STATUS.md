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

### Influencer Matching & Analytics Rules

Deterministic scoring formula implemented in pure Decimal in `backend/app/services/influencer_matching.py`:

| Dimension | Sub-Score Weight | Scoring Logic |
| :--- | :---: | :--- |
| **Category Fit** | 35% (0.35) | Direct category match = 100; related vertical overlap = 70; unaligned = 30 |
| **Audience Fit** | 25% (0.25) | Product target tag overlap with creator niche tags: $\min(100, 40 + 20 \times \text{overlap\_count})$ |
| **Economics Fit** | 25% (0.25) | Ratio of Implied CAC to Target CAC:<br>$\le 0.85 \times \text{target} \rightarrow 95$ (`EXCELLENT_CAC`)<br>$\le 1.25 \times \text{target} \rightarrow 75$ (`VIABLE`)<br>$\le 2.00 \times \text{target} \rightarrow 50$ (`HIGH_CAC_RISK`)<br>$> 2.00 \times \text{target} \rightarrow 30$ (`POOR`) |
| **Engagement Fit** | 15% (0.15) | Ratio to tier median benchmark: $\min(100, \text{int}((\text{rate} / \text{tier\_median}) \times 80))$ |

- **Predicted Reach**: $\text{followers} \times 0.28$ (Instagram) or $\times 0.22$ (YouTube/TikTok)
- **Conversion Constants**: `INFLUENCER_CTR_ESTIMATE = 0.012` (1.2%), `INFLUENCER_CVR_ESTIMATE = 0.025` (2.5%)
- **Predicted Orders**: $\text{Reach} \times \text{CTR} \times \text{CVR}$
- **Implied CAC**: $\text{Cost per Post} / \max(1, \text{Predicted Orders})$
- **Predicted ROAS**: $(\text{Predicted Orders} \times \text{Selling Price}) / \text{Cost per Post}$

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
4. **Break-Even Units** is computed as the ceiling (`ROUND_CEILING`) only when contribution $> 0$.

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
| `/health` | GET | Root health check with DB connectivity ping |
| `/api/v1/health` | GET | API v1 health check alias |
| `/api/v1/products` | GET | List products with pagination caps (max 100) and no N+1 queries |
| `/api/v1/products` | POST | Create product with initial immutable version 1 |
| `/api/v1/products/{product_id}` | GET | Get product detail, current assumptions, and latest readiness state |
| `/api/v1/products/{product_id}/assumptions` | PATCH | Patch assumptions; creates new immutable version, diffs impact, optional revalidate |
| `/api/v1/products/{product_id}/competitors` | GET | List competitor benchmarks |
| `/api/v1/products/{product_id}/competitors` | POST | Register competitor benchmarks |
| `/api/v1/products/{product_id}/competitors/summary` | GET | Summarized competitor landscape and pricing statistics |
| `/api/v1/products/{product_id}/evidence` | GET | List research evidence with filters |
| `/api/v1/products/{product_id}/impact-events` | GET | List historical impact events across version transitions |
| `/api/v1/products/{product_id}/recommendations` | GET | Fetch actionable recommendations based on stage findings |
| `/api/v1/products/{product_id}/reports` | GET | List generated launch reports |
| `/api/v1/products/{product_id}/reports` | POST | Generate markdown launch report |
| `/api/v1/products/{product_id}/reports/latest` | GET | Get latest generated launch report |
| `/api/v1/products/{product_id}/reports/{report_id}` | GET | Get report by ID |
| `/api/v1/products/{product_id}/research` | GET | List research runs for product |
| `/api/v1/products/{product_id}/research` | POST | Trigger research run (returns 202 Accepted, 409 Conflict if active) |
| `/api/v1/products/{product_id}/research/{research_id}` | GET | Get research run status and competitor findings |
| `/api/v1/products/{product_id}/revalidate` | POST | Revalidate affected stages after an assumption change (carries forward clean stages) |
| `/api/v1/products/{product_id}/simulate` | POST | What-If simulation without persisting assumptions or versions (alias) |
| `/api/v1/products/{product_id}/validate` | POST | Execute 6-stage validation pipeline on latest version |
| `/api/v1/products/{product_id}/validation` | GET | Validation summary alias |
| `/api/v1/products/{product_id}/validation/readiness` | GET | Fetch calculated launch readiness status, score, and verdict |
| `/api/v1/products/{product_id}/validation/revalidate` | POST | Revalidate affected stages alias |
| `/api/v1/products/{product_id}/validation/runs` | GET | List historical validation runs for product |
| `/api/v1/products/{product_id}/validation/runs` | POST | Trigger validation run alias |
| `/api/v1/products/{product_id}/validation/runs/latest` | GET | Get latest completed validation run |
| `/api/v1/products/{product_id}/validation/runs/latest/recommendations` | GET | Get recommendations from latest run |
| `/api/v1/products/{product_id}/validation/runs/{run_id}` | GET | Get specific validation run by ID |
| `/api/v1/products/{product_id}/validation/runs/{run_id}/recommendations` | GET | Get recommendations from specific run |
| `/api/v1/products/{product_id}/validation/simulate` | POST | What-If simulation without persisting assumptions or versions |
| `/api/v1/products/{product_id}/versions` | GET | List immutable product assumption versions |
| `/api/v1/products/{product_id}/versions/compare` | GET | Compare versions query alias |
| `/api/v1/products/{product_id}/versions/{version_a}/compare/{version_b}` | GET | Compare two versions showing field-level diffs & metric changes |
| `/api/v1/projects/{project_id}/validation/readiness` | GET | Project readiness alias |
| `/api/v1/projects/{project_id}/validation/runs` | GET | Project runs list alias |
| `/api/v1/projects/{project_id}/validation/runs` | POST | Project trigger run alias |
| `/api/v1/projects/{project_id}/validation/runs/latest` | GET | Project latest run alias |
| `/api/v1/projects/{project_id}/validation/runs/latest/recommendations` | GET | Project latest recommendations alias |
| `/api/v1/projects/{project_id}/validation/runs/{run_id}` | GET | Project specific run alias |
| `/api/v1/projects/{project_id}/validation/runs/{run_id}/recommendations` | GET | Project run recommendations alias |
| `/api/v1/projects/{project_id}/validation/simulate` | POST | Project simulation alias |
| `/api/v1/influencers` | GET | List influencers with filters (platform, category, tier, budget, tag) |
| `/api/v1/influencers` | POST | Register influencer marketing creator profile |
| `/api/v1/influencers/match-custom` | POST | Deterministic influencer matching using custom ad-hoc product parameters |
| `/api/v1/influencers/match/{product_id}` | GET | Deterministic influencer matching for existing product |
| `/api/v1/influencers/{influencer_id}/pitch` | POST | Generate personalized outreach pitch copy with fallback |
| `/api/v1/influencers/{influencer_id}/status` | PATCH | Update outreach status (discovered, shortlisted, contacted, contracted, declined) |
| `/api/v1/internal/research-results` | POST | Ingest external research results idempotently (content hash deduplication) |
| `/api/v1/internal/research/results` | POST | External research results ingest alias |

---

## 4. Test Proof Matrix

| Feature / Requirement | Proving Test File & Test Name | Verdict |
| :--- | :--- | :---: |
| **Financial Calculations & Proof Vectors** | `backend/tests/unit/test_finance.py` (`test_finance_vector_a`, `test_finance_vector_b`) | PASS |
| **Vector Invariants Script** | `scripts/check_vectors.py` (pure Decimal math verification) | PASS |
| **Determinism (Validate Twice -> Identical)** | `backend/tests/integration/test_validation_runs_api.py` (`test_validation_determinism_identical_runs`) | PASS |
| **Domain Purity (Zero DB/HTTP/LLM in Pure Layers)** | `backend/tests/unit/test_ai_research.py` (`test_pure_modules_isolation_scan`) | PASS |
| **Float Ban (Strictly Zero `float(` in Services)** | Static git grep scan across `backend/app/services` | PASS |
| **Database Immutability & Constraints** | `backend/tests/integration/test_db_immutability_and_constraints.py` (triggers, uniqueness) | PASS |
| **Core Flow (Vector A -> PATCH Packaging 30->60 -> v2)** | `backend/tests/integration/test_products_api.py` (`test_vector_a_to_vector_b_patch_and_compare`) | PASS |
| **No-Op Patch Creates No Version** | `backend/tests/integration/test_products_api.py` (`test_no_op_patch_creates_no_version`) | PASS |
| **Simultaneous Patches Concurrency** | `backend/tests/integration/test_concurrency.py` (`test_concurrent_patches_same_product`) | PASS |
| **Research Fallback when Key Missing** | `backend/tests/unit/test_ai_research.py` (`test_missing_api_key_falls_back_to_mock`) | PASS |
| **Research 409 Conflict on Active Run** | `backend/tests/integration/test_research_and_reports_api.py` (`test_research_run_endpoints`) | PASS |
| **Idempotent Evidence Deduplication** | `backend/tests/integration/test_research_and_reports_api.py` (`test_ingest_research_results_and_idempotency`) | PASS |
| **Confidence Score Capped at 0.80** | `backend/tests/integration/test_research_and_reports_api.py` (`test_ingest_confidence_capping`) | PASS |
| **SSRF Comprehensive Guard (All Private IPs & DNS)** | `backend/tests/unit/test_ssrf_protection.py` (14 distinct attack vectors) | PASS |
| **Prompt Injection Defense** | `backend/tests/unit/test_ai_research.py` (`test_prompt_injection_in_page_cannot_change_status_or_numbers`) | PASS |
| **Request-ID & Error Propagation** | `backend/tests/integration/test_hardening_and_resilience.py` (`test_request_id_header_and_error_propagation`) | PASS |
| **Request Body Size Limit (413)** | `backend/tests/integration/test_hardening_and_resilience.py` (`test_request_body_size_limit`) | PASS |
| **Money Input Validation (NaN, Inf, >10^9)** | `backend/tests/integration/test_hardening_and_resilience.py` (`test_money_validation_limits`) | PASS |
| **N+1 Query Elimination on 20 Products** | `backend/tests/integration/test_hardening_and_resilience.py` (`test_no_n_plus_one_queries_product_list`) | PASS |
| **DB Sessions Closed Without Leaks** | `backend/tests/integration/test_hardening_and_resilience.py` (`test_db_sessions_no_leaks`) | PASS |
| **Performance Benchmarks (< 1s)** | `backend/tests/integration/test_hardening_and_resilience.py` (`test_performance_benchmarks`) | PASS |
| **Influencer Matching Determinism** | `backend/tests/unit/test_influencer_matching.py` (pure scoring formula, tier benchmarks) | PASS |
| **Influencer API Lifecycle & Outreach** | `backend/tests/integration/test_influencers_api.py` (CRUD, match, match-custom, pitch, status) | PASS |
| **Route & Schema Lock (No Removed Routes/Fields)** | `tests/contract/test_no_route_removed.py` (`test_no_locked_route_removed`) | PASS |
| **Frontend API Coverage (100%)** | `scripts/frontend_coverage.py` (all 27 calls in client.ts verified) | PASS |
| **End-to-End Live Walkthrough** | `scripts/e2e_live_walkthrough.py` (complete lifecycle and error handling) | PASS |
| **Full Platform Verification** | `scripts/verify_all.py` (all 13 automated audit checks green) | PASS |

---

## 5. How to Run (Exact PowerShell Commands)

Run from repository root in PowerShell:

```powershell
# 1. Run full test suite (186 tests)
python -m pytest -v

# 2. Run mathematical proof vectors check
python scripts/check_vectors.py

# 3. Seed demo products and creators idempotently
python scripts/seed.py

# 4. Verify frontend API client coverage against backend routes
python scripts/frontend_coverage.py

# 5. Run end-to-end live founder walkthrough
python scripts/e2e_live_walkthrough.py

# 6. Run complete platform audit checklist
python scripts/verify_all.py

# 7. Start development server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

---

## 6. Environment Variables (Names Only)

All runtime configuration is managed through Pydantic `BaseSettings`:

- `DATABASE_URL`
- `TEST_DATABASE_URL`
- `ENVIRONMENT`
- `APP_ENV`
- `LOG_LEVEL`
- `CORS_ORIGINS`
- `RESEARCH_PROVIDER`
- `LLM_PROVIDER`
- `LLM_API_KEY`
- `LLM_MODEL`
- `LLM_TIMEOUT_SECONDS`
- `LLM_CALL_BUDGET_PER_RUN`
- `LLM_MAX_RETRIES`
- `RESEARCH_FETCH_TIMEOUT_SECONDS`
- `RESEARCH_MAX_PAGE_BYTES`
- `RESEARCH_MAX_TEXT_LENGTH`
- `MAX_REQUEST_BODY_BYTES`

---

## 7. Honest Limitations

1. **Client-Side JavaScript Pages**: The `page_fetcher` service uses `httpx` to perform safe, SSRF-guarded HTTP GET requests and extracts content using BeautifulSoup. Websites rendered purely with client-side JavaScript (SPAs without SSR or prerendering) will yield empty or minimal text excerpts unless server-rendered HTML is present.
2. **Authentication & Multi-Tenancy**: The current release does not enforce user authentication, JWT tokens, or multi-tenant database isolation. All products and runs reside in a shared schema suitable for internal evaluation.
3. **Synchronous Validation Lifecycle**: Validation runs, simulations, and revalidations are computed synchronously in-process. While performance is sub-40ms on SQLite, prolonged external web research in AI mode should be run via asynchronous worker queues in high-concurrency production environments.
4. **AI Evidence Confidence Capped at 0.80**: Market research evidence gathered through LLMs is capped at a maximum confidence score of 0.80 to prevent unverified model hallucinations from falsely attaining perfect evidence weights.
5. **Sample Seed Data**: All seed products, competitor prices, and influencers are strictly sample demonstration records labelled `(Sample)`, `source_type="sample_seed"`, and `is_sample=True`. They do not represent real commercial guarantees or endorsements.
6. **PostgreSQL Tests Gated by Environment**: When running locally on Windows without a running PostgreSQL daemon, PostgreSQL integration tests are cleanly skipped when `TEST_DATABASE_URL` is unset. Full migration scripts and table schemas are identical and verified on SQLite.
