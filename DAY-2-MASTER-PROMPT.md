# DAY 2: COMPETITORS, RESEARCH, REPORTS, INFLUENCERS & FULL CONTRACT COMPLETION

Read _PROMPT_ANATOMY.md first. Then send your Plan Check and wait for "go".

## GOAL
Implement the remaining 19 routes across Competitor Benchmarks, Research Evidence & Runs, Launch Reports Engine, and Influencer Matchmaking. Deliver `scripts/seed.py` and verify all 51 routes in `contracts/routes.lock.json` match with 0 missing.

---

## T1: COMPETITOR & EVIDENCE REPOSITORY & ENDPOINTS
- `POST /api/v1/products/{product_id}/competitors` (201):
  - Validates `CompetitorCreate` / payload with observed price, website, notes.
  - Rejects duplicate competitor name per product with 409 Conflict.
  - Persists `Competitor` and `CompetitorAnalysis` rows atomically.
- `GET /api/v1/products/{product_id}/competitors` (200):
  - Lists competitors for product with observed prices and evidence counts.
- `GET /api/v1/products/{product_id}/competitors/summary` (200):
  - Computes `competitor_price_min`, `competitor_price_median`, `competitor_price_max`, and `competitors_count`.
  - Serializes money as 2 dp JSON numbers/strings matching contract.
- `GET /api/v1/products/{product_id}/evidence` (200):
  - Lists `ResearchEvidence` with query filters (`competitor_id`, `source_type`).
  - Unknown product 404, bad UUID 422.

---

## T2: RESEARCH PIPELINE & INTERNAL INGEST ENDPOINTS
- `POST /api/v1/products/{product_id}/research` (202 Accepted):
  - Starts research run for product. Returns 409 Conflict if active research run is currently running.
  - When `settings.RESEARCH_PROVIDER == "mock"`, loads deterministic evidence without network calls.
  - When `ai`, invokes LLM client safely with SSRF-guarded page fetcher.
  - Re-computes content hash via `sha256(source_url | excerpt)` for deduplication.
- `GET /api/v1/products/{product_id}/research` (200):
  - Lists historical research runs.
- `GET /api/v1/products/{product_id}/research/{research_id}` (200):
  - Returns run status, progress, findings, and evidence items generated.
- `POST /api/v1/internal/research-results` and `/api/v1/internal/research/results` (200):
  - Idempotent ingest for research evidence. Deduplicates by `(product_id, content_hash)`.

---

## T3: LAUNCH REPORTS ENGINE
- `POST /api/v1/products/{product_id}/reports` (201):
  - Assembles latest validation run verdict, stage breakdown, financial metrics, and competitor benchmarks.
  - Generates markdown report and structured JSON payload matching `ReportResponse`.
  - Persists immutable row in `reports` table.
- `GET /api/v1/products/{product_id}/reports` (200):
  - Lists generated reports for product ordered by `created_at DESC`.
- `GET /api/v1/products/{product_id}/reports/latest` (200):
  - Convenience endpoint returning the latest generated report. Returns 404 if no report has been generated yet.
- `GET /api/v1/products/{product_id}/reports/{report_id}` (200):
  - Returns specific report by ID.

---

## T4: INFLUENCER PROFILES & PITCH MATCHING
- `POST /api/v1/influencers` (201):
  - Creates influencer profile with unique handle per platform constraint.
- `GET /api/v1/influencers` (200):
  - Lists influencers with optional filters (`platform`, `follower_tier`).
- `GET /api/v1/influencers/match/{product_id}` (200):
  - Evaluates fit score between product target customer and influencer audience.
  - Returns match list with estimated CAC and ROI indicators (marked with sample disclaimer).
- `POST /api/v1/influencers/match-custom` (200):
  - Stateless fit calculation for custom criteria.
- `POST /api/v1/influencers/{influencer_id}/pitch` (200):
  - Generates tailored outreach pitch text for product.
- `PATCH /api/v1/influencers/{influencer_id}/status` (200):
  - Updates outreach status (`outreach`, `negotiating`, `signed`, `rejected`).

---

## T5: SEED SCRIPT & 51-ROUTE FULL CONTRACT PROOF
- `scripts/seed.py`:
  - Deterministic and idempotent seed script.
  - Populates Vector A demo product, 2 competitors with evidence, 1 validation run, 1 report, and 5 sample influencers.
  - All sample records clearly marked with `(Sample)` and `source_type="sample_seed"`.
- Contract Verification (`test_full_contract_conformance.py`):
  - Asserts all 51 routes in `contracts/routes.lock.json` exist in FastAPI OpenAPI schema with 0 missing.
  - Validates responses against OpenAPI schema components using `jsonschema`.

---

## DONE WHEN
- All 51 locked routes exist in FastAPI and pass schema validation.
- All unit, integration, and contract tests pass on SQLite.
- `scripts/seed.py` runs cleanly and idempotently.
- Zero `float(` in `backend/app/services`.
- Zero diffs in `frontend/` and `landing/`.

---

## DAY REPORT (raw output only)
A. Route list vs routes.lock (51/51 routes verified).
B. Test suite results (all tests passing).
C. Sample seed execution log.
D. Clean hygiene outputs (`float(` grep and frontend/landing diff).
E. Final decision log.
