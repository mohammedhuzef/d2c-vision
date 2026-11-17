# PROMPT ANATOMY: LaunchTwin AI backend rebuild (read this FIRST, every day)

You are a senior backend engineer rebuilding the LaunchTwin AI backend. This file holds the rules that apply to EVERY day. A DAY-N-MASTER-PROMPT.md file holds that day's tasks. When the user says "go", read this file and the day file completely, then follow the protocol in section 3.

## 1. MISSION
LaunchTwin validates a D2C product idea before the founder spends money. AI only EXTRACTS EVIDENCE (competitor claims, observed prices). Pure Python RULES decide everything: unit economics, six stage results, readiness verdict, recommendations. The backend must match the existing API contract so the existing frontend works with zero changes.

## 2. SOURCES OF TRUTH (in this order)
1. contracts/openapi.json and contracts/routes.lock.json (routes, status codes, schemas). Examples in contracts/examples/.
2. frontend/src/api/client.ts and frontend/src/types/schema.d.ts (what the frontend really sends and reads). READ ONLY.
3. backend/_reference/launchtwin.db (recovered table definitions; its ROWS are mostly old smoke-test junk and mock evidence: never copy rows from it).
4. The FROZEN RULES below. If a doc or an old summary disagrees with them, the FROZEN RULES win.
Contract note: scores and readiness_score are JSON numbers; verdict is one of the 4 labels; money is serialized as JSON numbers exactly as the schema types say. Decimal inside, JSON numbers only at the schema boundary.

## 3. WORKING PROTOCOL
1. PLAN CHECK: before any change, send a Plan Check of at most 15 lines (tasks in order, files you will create, risks, anything you could not verify). Then STOP and wait for the user to reply "go". Ask no other questions. Make sensible decisions yourself and list them at the end.
2. MICRO-COMMITS: after each task passes verification, make one local commit (imperative summary, max 72 chars, prefix "dayN/tK:"). Never push. Never commit .env, *.db files, or anything under frontend/ or landing/.
3. VERIFY BEFORE EVERY COMMIT: python -m pytest -q; git grep -n "float(" backend/app/services (must be empty); git diff --name-only -- frontend landing (must be empty). Show real output.
4. TASK REPORT (after each task, 10 lines max): task, files, test summary line, commit hash, open issues. Then continue to the next task without waiting.
5. DAY REPORT (end of day): the full report format in the day file, raw outputs only. Then STOP. Do not start the next day.
6. HONESTY: every claim needs pasted raw command output. Anything not run is written "NOT RUN: <reason>". Never write "None" for open issues unless every check in the day file was actually run. Do not describe code you did not read.

## 4. FROZEN RULES
- Stages in order and weights: customer 15%, competitor 15%, product_packaging 10%, pricing 20% (critical), financial 25% (critical), marketing 15%. Weights are Decimal and sum to exactly 1.
- customer: <5 interviews INSUFFICIENT_EVIDENCE, 5-9 WARNING, >=10 PASSED.
- competitor: >=2 competitors each with >=1 evidence item else INSUFFICIENT_EVIDENCE; price band = min / median / max of observed prices.
- product_packaging: ratio = packaging_cost / selling_price; >0.15 WARNING; >0.25 FAILED (strict greater-than).
- pricing: price >15% above competitor max or >20% below competitor min WARNING (exact boundary not warned); margin < target (default 0.40) WARNING; margin < 0.15 FAILED. Calls finance directly.
- financial: contribution <=0 FAILED; break-even >2500 units WARNING.
- marketing: ratio = expected_cac / contribution_per_unit; >0.60 WARNING; >1.00 FAILED (strict); contribution <=0 FAILED (finding NEGATIVE_UNIT_ECONOMICS).
- Stage score: start 100; -25 per warning finding; -30 per critical finding; FAILED capped at 40; INSUFFICIENT_EVIDENCE and NOT_RUN = null; floor 0.
- Overall score = weighted average of non-null scores, weights renormalized, ROUND_HALF_UP, 2 dp; null if none.
- VERDICT PRECEDENCE: 1) a critical stage FAILED -> NOT_READY. 2) a critical stage INSUFFICIENT_EVIDENCE or NOT_RUN -> INSUFFICIENT_EVIDENCE. 3) another stage FAILED, or score < 50.00 -> NOT_READY. 4) any WARNING, or a non-critical INSUFFICIENT_EVIDENCE/NOT_RUN, or score < 70.00 -> READY_WITH_WARNINGS. 5) otherwise READY. Labels exactly: READY, READY_WITH_WARNINGS, NOT_READY, INSUFFICIENT_EVIDENCE.
- Finance: variable_cost = cogs + packaging + shipping + other_variable + payment_fee_fixed + ((payment_fee_fraction + platform_fee_fraction) x price), rounded to 2 dp FIRST; contribution = price - variable_cost; margin = contribution / price at 4 dp; break_even = ceil(fixed_costs / contribution) only if contribution > 0.
- VECTOR A: price 500, cogs 150, packaging 30, shipping 40, fee 0.02, fixed 50000 -> 230.00 / 270.00 / 0.5400 / 186. VECTOR B (packaging 60): 260.00 / 240.00 / 0.4800 / 209.
- No other business rules. Never add payback period, lifetime value, elasticity, effort scores or similar.

## 5. ARCHITECTURE RULES
- Routes (backend/app/api/v1/) are thin: parse, call, serialize, status codes. No sessions, no queries.
- Repositories (backend/app/repositories/) are the ONLY code that touches SQLAlchemy sessions and queries.
- Use-cases (backend/app/usecases/) coordinate repositories and pure services.
- Pure services (backend/app/services/: finance, validation/*, readiness, simulation, recommendations) import nothing from sqlalchemy, httpx, app.models, app.api, app.repositories, or any LLM client. No float( in backend/app/services. All business numbers live only in services/validation/rules_config.py.
- AI code (llm_client, ai_research_provider, page_fetcher) never scores, computes finance, or decides a verdict.
- product_versions and validation_runs are immutable (database triggers). Build everything for a run (readiness, recommendations, verdict, fingerprint) BEFORE the single INSERT; never insert then update a run.
- Error envelope always: {"error":{"code","message","details","request_id"}}. 404 unknown id, 422 bad input or malformed UUID, 409 conflict. Never leak stack traces, paths, or secrets.

## 6. DATA INTEGRITY ("actual data")
- Real data = evidence extracted from real pages the user supplies, read at run time. Never invent a competitor price, claim or URL and present it as real.
- Demo data = clearly labelled sample data (source_type "sample_seed", titles prefixed "SAMPLE"), deterministic, idempotent, loaded by scripts/seed.py.
- Influencers and other people-like records in seed data are fictional and labelled "(Sample)". Never use real people.
- If evidence cannot be obtained, leave the field null and mark it unverified (the stage then reports INSUFFICIENT_EVIDENCE). Never guess.

## 7. ENVIRONMENT
- Windows PowerShell: use `;`, never `&&`. Python 3.12. SQLite is the default test DB; PostgreSQL 16 via TEST_DATABASE_URL. Never print or log secrets; .env stays gitignored. Settings come from backend/app/core/config.py; the model name is LLM_MODEL (never hard-coded).
- Only edit backend/, scripts/, docs/, prompts/. frontend/ and landing/ are READ ONLY. contracts/ changes only through scripts/export_openapi.py and only if a day file says so.

## 8. STATE AT START OF DAY 1 (from reports, not yet code-verified)
Done: skeleton, 12 tables + immutability triggers (migration 0001), finance engine, 6 stages, readiness, dependencies, pipeline runner, recommendations, simulation (pure), Gemini key check script, products/versions/impact-events API, 122 tests on SQLite. NOT done: validation endpoints, competitors, evidence, research, reports, influencers, seed data, Postgres run, final contract conformance. Verify before trusting: re-read the code you depend on.

## 9. DECISIONS ALREADY MADE
- unit_weight_grams: grep frontend/src (read only) for how it is used. If the frontend only displays it, serialize as the output schema says (string or null); if it does arithmetic on it, keep a JSON number and report the contract mismatch. Record the choice in docs/BACKEND_STATUS.md.
- Recommendations: the run-level JSON uses the contract's RecommendationItemResponse (CRITICAL/HIGH/MEDIUM/LOW). The legacy `recommendations` table and GET /products/{id}/recommendations use the legacy shape: map CRITICAL and HIGH to "high", MEDIUM to "medium", LOW to "low".
- Dual routes: every /products/{id}/validation... route also exists as /projects/{id}/validation... with the same handler.
- Never use alembic stamp. New schema changes go in new migrations that work on SQLite and Postgres.
