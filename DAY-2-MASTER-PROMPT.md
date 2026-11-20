# DAY 2: COMPETITORS, EVIDENCE, RESEARCH RUNS (MOCK PROVIDER), REPORTS

Read prompts/_PROMPT_ANATOMY.md first. Day 1 must be finished (its gate passed). Send your Plan Check and wait for "go".

## GOAL
All competitor, evidence, research-run and report routes from the contract, working with a deterministic MockResearchProvider (no network, no AI yet). Day 3 adds Gemini behind the same interface.

## T0: RE-VERIFY DAY 1 (10 minutes)
Run python -m pytest -q, the hygiene greps, and the Vector A end-to-end test. If anything fails, fix it first and say so in the report.

## T1: READ THE CONTRACT (read only, summarize in 15 lines)
Schemas and examples for: POST/GET competitors, competitor summary, GET evidence (filters), the internal research-results ingest route(s), POST/GET research, GET research status, POST/GET/latest/by-id reports. Note exact status codes (for example 201, 202, 409) and how the frontend (client.ts, CompetitorIntelligence and LaunchReport pages) uses them.

## T2: COMPETITORS AND EVIDENCE
- POST /products/{id}/competitors: 201; duplicate name (case-insensitive) 409; website_url validated (http/https only, max length). GET list; GET summary as the contract defines. Each competitor shows observed_price (latest analysis), evidence count, strengths, weaknesses.
- GET /products/{id}/evidence with the filters the contract defines (competitor, source_type, min confidence, pagination cap 100).
- Evidence rules: dedupe on (product_id, content_hash) where content_hash = SHA-256 of normalized (source_url + excerpt); confidence stored as Decimal 0.00 to 1.00; manual entries 1.00; AI entries capped at 0.80 (enforced here too, not only in the AI code).
- Internal ingest route(s) (as in the contract): idempotent (re-posting the same payload creates no duplicates), validates every row, creates/updates competitor_analyses with price_observed (NUMERIC 14,2), strengths, weaknesses, evidence_ids. If the contract or settings define a shared secret header, enforce it; otherwise restrict by the setting that exists. Never log payload bodies.

## T3: RESEARCH RUNS WITH A MOCK PROVIDER
- backend/app/services/research_provider.py: ResearchProvider interface (research(product, competitors) -> ResearchResult of plain data: evidence items, per-competitor price/strengths/weaknesses, errors) and MockResearchProvider that is deterministic (same input, same output), labelled provider "mock", source_type "mock", confidence <= 0.50, titles prefixed "MOCK". The mock never claims real facts.
- POST /products/{id}/research: 202 with the run id; runs in a background task; 409 if a run is already active for the product (enforce in the repository with a status check inside a transaction). GET /products/{id}/research (list) and GET .../research/{run_id} (status, evidence_count, provider, errors, started_at, finished_at). Run lifecycle: queued, running, completed, failed. A provider exception marks the run failed with a safe error message, never a stack trace.
- RESEARCH_PROVIDER=ai without LLM_API_KEY falls back to mock and reports provider "mock" (the real AI provider arrives on Day 3; implement the selection function now).

## T4: REPORTS (deterministic, no LLM)
- POST /products/{id}/reports: 201; 409 if the product has no validation run yet. Builds content JSON (executive summary, unit economics from the latest version, stage table, recommendations, evidence quality summary: counts by source_type and average confidence, version and run ids) and a Markdown rendering from the SAME data via a pure function in services/report_builder.py (no float(, no DB). Same input gives identical output. GET list, GET /reports/latest, GET /reports/{id} per the contract.
- Reports are append-only; never update a saved report.

## T5: TESTS (hand-calculate expected values)
- Competitors: create, duplicate name 409 (also different letter case), invalid URL 422, list, summary values.
- Evidence: dedupe, confidence cap 0.80 for AI source, manual 1.00, filters, pagination cap.
- Ingest: idempotent re-post, bad row 422 with row index in details, price stored with 2 dp.
- Research: mock is deterministic; 202 then status completed; second POST while running gives 409; provider exception gives failed with safe message; fallback to mock without key; evidence created by research makes the competitor stage pass in a following validate call (Vector A, two competitors with evidence).
- Reports: 409 before validation; content numbers equal the validation run's numbers; Markdown contains the verdict and the stage table; deterministic output; contract-schema validation of every response.
- Source scans on new pure files; all earlier tests still pass.

## DONE WHEN
Every competitor, evidence, research and report route in routes.lock exists with correct status codes and schema-valid responses; full flow works on SQLite and on Postgres (or NOT RUN with reason): create product, add competitors, run mock research, validate, create report.

## DAY REPORT (raw output only)
A. Contract summary. B. Files created. C. pytest summary (SQLite and Postgres or NOT RUN). D. Printed output of the full flow script (create, competitors, research, validate, report) with the verdict and the first 25 lines of the Markdown report. E. Route list vs routes.lock (missing / extra). F. Hygiene greps. G. Decisions made. H. Open issues and NOT RUN items. Then STOP.


---

# DAY 2 FINAL VERIFICATION REPORT

### A. Contract Summary
- **Competitors & Evidence Endpoints**:
  - `POST /api/v1/products/{product_id}/competitors` (201 Created): Validates `CompetitorCreate`, enforces case-insensitive name uniqueness per product (409 Conflict), and persists `Competitor` and initial `CompetitorAnalysis` rows atomically.
  - `GET /api/v1/products/{product_id}/competitors` (200 OK): Returns `CompetitorListResponse` with observed prices, strengths, weaknesses, and evidence counts.
  - `GET /api/v1/products/{product_id}/competitors/summary` (200 OK): Computes `competitor_price_min`, `competitor_price_median`, and `competitor_price_max` as 2-decimal strings along with `competitors_count`.
  - `GET /api/v1/products/{product_id}/evidence` (200 OK): Returns paginated `EvidenceListResponse` with optional filters by `competitor_id` and `source_type`.
- **Internal Research Ingest**:
  - `POST /api/v1/internal/research-results` & `/api/v1/internal/research/results` (201 Created): Idempotent ingest deduplicated on `(product_id, content_hash)` where `content_hash = SHA-256(source_url | excerpt)`. Re-posting existing content creates zero duplicate rows. Confidence is stored as `Decimal` (1.00 for manual entries; non-manual AI entries capped at 0.80).
- **Research Runs**:
  - `POST /api/v1/products/{product_id}/research` (202 Accepted): Triggers background research run. Rejects concurrent runs with 409 Conflict if an active run is in progress.
  - `GET /api/v1/products/{product_id}/research` (200 OK): Returns `ResearchRunListResponse` with paginated historical runs.
  - `GET /api/v1/products/{product_id}/research/{research_id}` (200 OK): Returns `ResearchStatusResponse` with run status, provider, evidence count, and per-competitor outcomes.
- **Reports Engine**:
  - `POST /api/v1/products/{product_id}/reports` (201 Created): Rejects unvalidated products with 409 Conflict. Assembles structured JSON content and GitHub-Flavored Markdown report using pure deterministic assembly. Reports are append-only.
  - `GET /api/v1/products/{product_id}/reports` (200 OK): Returns `ReportListResponse` ordered by `generated_at DESC`.
  - `GET /api/v1/products/{product_id}/reports/latest` (200 OK): Convenience endpoint returning the latest generated report (404 if none).
  - `GET /api/v1/products/{product_id}/reports/{report_id}` (200 OK): Returns specific report by ID.

### B. Files Created
- `backend/app/schemas/competitor.py`
- `backend/app/schemas/evidence.py`
- `backend/app/schemas/research.py`
- `backend/app/schemas/report.py`
- `backend/app/services/research_provider.py`
- `backend/app/services/report_builder.py`
- `backend/app/repositories/competitor_repository.py`
- `backend/app/repositories/research_repository.py`
- `backend/app/repositories/report_repository.py`
- `backend/app/api/v1/competitors.py`
- `backend/app/api/v1/research.py`
- `backend/app/api/v1/reports.py`
- `backend/tests/integration/test_competitors_api.py`
- `backend/tests/integration/test_research_and_reports_api.py`

### C. pytest Summary
```
python -m pytest -q
........................................................................ [ 50%]
........................................................................ [100%]
144 passed, 21 warnings in 2.43s
```
- **Postgres**: `Postgres NOT RUN: TEST_DATABASE_URL not set`

### D. Full Flow Output (Create -> Competitors -> Research -> Validate -> Report)
```
=== VALIDATION VERDICT ===
Verdict: READY
Readiness Score: 100.0

=== MARKDOWN REPORT (FIRST 25 LINES) ===
# Launch-Readiness Report: Vector A Bamboo Tumbler (v1)

## Executive Verdict: READY (Score: 100.00/100)

**Summary**: Vector A Bamboo Tumbler demonstrates viable unit economics and strong stage readiness across all validation dimensions.

### Stage Summary Table
| Stage | Status | Score | Findings |
|---|---|---|---|
| customer | PASSED | 100.0 | 0 |
| competitor | PASSED | 100.0 | 0 |
| product_packaging | PASSED | 100.0 | 0 |
| pricing | PASSED | 100.0 | 0 |
| financial | PASSED | 100.0 | 0 |
| marketing | PASSED | 100.0 | 0 |

### Unit Economics & Financial Metrics
- **Selling Price**: $500
- **Variable Cost / Unit**: $230
- **Contribution / Unit**: $270
- **Contribution Margin**: 0.54
- **Break-Even Units**: 186

### Evidence Quality Summary
- **Total Evidence Items**: 4
```

### E. Route List vs routes.lock.json
```
=== DAY 2 ROUTES AUDIT ===
[PASS] POST /api/v1/products/{product_id}/competitors
[PASS] GET /api/v1/products/{product_id}/competitors
[PASS] GET /api/v1/products/{product_id}/competitors/summary
[PASS] GET /api/v1/products/{product_id}/evidence
[PASS] POST /api/v1/internal/research-results
[PASS] POST /api/v1/internal/research/results
[PASS] POST /api/v1/products/{product_id}/research
[PASS] GET /api/v1/products/{product_id}/research
[PASS] GET /api/v1/products/{product_id}/research/{research_id}
[PASS] POST /api/v1/products/{product_id}/reports
[PASS] GET /api/v1/products/{product_id}/reports
[PASS] GET /api/v1/products/{product_id}/reports/latest
[PASS] GET /api/v1/products/{product_id}/reports/{report_id}

Total Locked: 51 | Registered & Matched: 45 | Remaining for Day 4: 6
```

### F. Hygiene Checks
- `git grep -n "float(" backend/app/services`: Empty (0 hits)
- `git diff --name-only -- frontend landing`: Empty (0 modified files)

### G. Decisions Made
1. **Mock Research Determinism**: `MockResearchProvider` operates deterministically in memory with fixed prices ($450.00 and $550.00) and confidence values ($0.48 and $0.45) satisfying the `< 0.50` requirement while strictly complying with the business-number hygiene test suite.
2. **Confidence Cap Normalization**: Both pure provider and repository ingest enforce confidence caps: manual entries are normalized to `1.00`, and AI/mock entries are capped at `0.80`.
3. **Database JSON Serialization**: `_to_json_safe` converts `Decimal` instances to standard JSON types at the persistence boundary of `report_repository.py` before insertion into the `content` JSON column, preserving pure `Decimal` arithmetic in `report_builder.py`.

### H. Open Issues and NOT RUN Items
- **Postgres NOT RUN: TEST_DATABASE_URL not set**: Tested and fully verified on SQLite.
- **Day 3 Real AI Provider**: The live Gemini API extractor and SSRF-hardened `page_fetcher.py` will be connected behind the existing `ResearchProvider` interface in Day 3.
- **Day 4 Influencer Routes & Seed Script**: The final 6 influencer routes and `scripts/seed.py` are scheduled for Day 4.
