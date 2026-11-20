# DAY 4: INFLUENCERS, SEED DATA, HARDENING, FINAL PROOF, SCORECARD

Read prompts/_PROMPT_ANATOMY.md first. Days 1 to 3 must be finished. Send your Plan Check and wait for "go".

## GOAL
Finish every remaining contract route, load honest demo data, harden the service, and prove the whole backend against the contract and the frontend client.

## T0: RE-VERIFY
python -m pytest -q (SQLite, and Postgres if TEST_DATABASE_URL is set), hygiene greps, Vector A end-to-end test.

## T1: INFLUENCERS (read the contract and frontend/src pages and api calls for Influencers first; summarize in 10 lines)
- Implement exactly the influencer routes in routes.lock (list, create, status change, match, pitch or similar; whatever exists). Filters and field names exactly as the frontend sends them (platform, category, follower tier, budget, engagement, niche tags).
- MATCHING IS DETERMINISTIC PYTHON (pure function in services/influencer_matching.py): filter by category/platform, budget >= estimated_cost_per_post, rank by a documented fixed formula using engagement_rate and niche-tag overlap with the product category. Constants live in rules_config.py. No LLM in matching.
- Pitch text (if a pitch route exists): Gemini may write WORDS ONLY (a short outreach message). It never chooses influencers, never states prices or metrics it was not given, and falls back to a fixed template when there is no key or the call fails. Test the fallback.
- engagement_rate is a float column in the reference schema: keep it out of any money maths; store and compare with Decimal in services where it is used.

## T2: SEED DATA (scripts/seed.py, idempotent, safe to run twice, refuses to run against a database whose name or URL looks like production unless --allow-prod-like is passed)
Load four deterministic demo products through the real repositories and use-cases (not raw SQL), each labelled in its name or description as "SAMPLE". Competitors use real brand names with their public website URLs only as targets for research; every price, claim and excerpt stored by the seed is labelled source_type "sample_seed", titled "SAMPLE ...", never presented as real market data, and never copied from backend/_reference/launchtwin.db.
1. "SAMPLE TerraFlask Tumbler" (Vector A): price 500, cogs 150, packaging 30, shipping 40, fee 0.02, fixed 50000, 10 interviews, filled problem statement and differentiation, CAC 60, two sample competitors priced 450.00 and 550.00 with evidence. Expected: all six PASSED, 100.00, READY, financial 230.00/270.00/0.5400/186.
2. "SAMPLE Heavy-Packaging Bottle": as 1 but packaging 90. Expected: product_packaging WARNING (ratio 0.1800), score 75.00; financial 290.00/210.00/0.4200/239; overall 97.50; READY_WITH_WARNINGS.
3. "SAMPLE Underpriced Bottle": as 1 but price 260. Expected: pricing FAILED and marketing FAILED (ratio 1.7241), financial 225.20/34.80/0.1338/1437 PASSED; weighted overall 79.00 but verdict NOT_READY (critical veto).
4. "SAMPLE Early-Stage Idea": 3 interviews, one competitor, no differentiation. Expected: customer and competitor INSUFFICIENT_EVIDENCE with null scores; verdict READY_WITH_WARNINGS; recommendations ask for the missing inputs.
Also create at least 12 fictional influencers named "(Sample)" with varied platform, tier and engagement. Seed creates versions, runs, recommendations and one report per product through the normal paths. The seed prints a summary table of the actual verdicts and scores it produced; any mismatch with the Expected lines above is reported with the exact findings (do not force the numbers).
- `python scripts/seed.py --live` (optional, manual): runs REAL research with the configured provider on the competitor URLs of product 1 and says plainly how many evidence items were kept or dropped. Never run it automatically.

## T3: HARDENING
- Request-ID in every response header and every log line; structured JSON logs; a catch-all exception handler that returns the standard envelope.
- /health and /api/v1/health check the database. CORS for http://localhost:5173 and http://localhost:5174 (and the origin setting if it exists).
- Input limits: string lengths, list sizes, JSON body size, page-size caps (100). Money fields reject NaN, Infinity, negatives and absurd magnitudes (> 10^9).
- No N+1 queries: a test counting SQL statements for listing 20 products with detail fields (assert a small constant bound).
- Performance: print timings for validate, simulate, product list (20), and report creation on seeded data; fix anything over 1 second that is caused by queries.
- Secrets: grep the repo for the LLM key pattern in tracked files; confirm .env is untracked and ignored; confirm no key in logs or error bodies (test).
- DB sessions always closed; no session leaks across requests (test with repeated calls).

## T4: FINAL CONTRACT AND FRONTEND PROOF
- A test that loads contracts/routes.lock.json and asserts EVERY method+path exists in the app and that no extra undocumented public route exists (except health aliases); and that app.openapi() response schemas for all routes validate the real responses from the seeded data.
- scripts/frontend_coverage.py (read only on frontend): extracts every API call from frontend/src/api/client.ts and prints a table: frontend call | backend route exists | status. Any gap is fixed in the backend (additive only) or listed.
- scripts/e2e_live_walkthrough.py: starts from an empty database, runs the full flow through HTTP against a running uvicorn (create product, competitors, research, validate, recommendations, patch with revalidate, versions, compare, simulate, report, impact events, influencers match) and prints each step's status and key values. Exits non-zero on any failure.
- scripts/verify_all.py: runs pytest, hygiene scans, contract tests, vector checks and prints PASS/FAIL per check.
- contracts/openapi.json: run python scripts/export_openapi.py. If the generated file differs from the committed one, show the diff summary and ask nothing: list it under "needs my decision" unless the difference is only ordering.

## T5: DOCS
- docs/BACKEND_STATUS.md: the real rules table (values read from rules_config.py), route list, which test proves each feature, how to run (exact PowerShell commands), environment variables (names only, no values), and honest limitations (pages built with JavaScript may give no evidence; no authentication; validation is synchronous; AI evidence is capped at 0.80 confidence; demo data is labelled sample).
- README backend section with start commands.

## T6: SCORECARD
Fill prompts/SCORECARD_RUBRIC.md as docs/BACKEND_SCORECARD.md: for every category write the score, the evidence (pasted command output or test names), and the cap rules that applied. Do not score a category above what its evidence supports.

## DONE WHEN
verify_all.py passes; e2e walkthrough passes; seed prints the four expected verdicts; route set equals routes.lock; Postgres suite result shown (or NOT RUN with reason); scorecard filled with evidence.

## DAY REPORT (raw output only)
A. Files created. B. pytest summary (SQLite and Postgres or NOT RUN). C. seed.py output table (verdicts and scores per demo product). D. Timings. E. frontend_coverage.py table. F. e2e walkthrough output. G. verify_all.py output. H. Route list vs routes.lock. I. Hygiene greps. J. The filled scorecard. K. Decisions made. L. Open issues and NOT RUN items. Then STOP.
