# DAY 5: REAL-WORLD READINESS (evidence trust, currency, honest coverage, access control, Postgres)

Read prompts/_PROMPT_ANATOMY.md first. Days 1 to 4 are finished. Send your Plan Check and wait for "go". For every task below: FIRST check whether the problem is real in the current code (show the evidence), THEN fix it. If a problem does not exist, say so with proof and move on. Do not change the contract; all fixes must be additive and keep every test passing.

## T0: POSTGRES (must run this time)
Run the full suite and the alembic round trip on a real PostgreSQL 16 (TEST_DATABASE_URL). The trigger tests and concurrency test must run there. Fix Postgres-only failures. If it cannot run, write "Postgres NOT RUN: <reason>" and keep the overall scorecard capped at 8.0.

## T1: FAKE EVIDENCE MUST NOT PASS A REAL PRODUCT
Check whether evidence with source_type "mock" or "sample_seed" is counted by the competitor stage (competitor count, evidence per competitor, price band). A real founder whose key is missing would otherwise get a competitor stage built on fake data.
Fix: only evidence types listed in rules_config (default: manual, ai, ingest) count. A product whose only evidence is mock or sample_seed gets competitor INSUFFICIENT_EVIDENCE with a canonical finding and a GATHER_EVIDENCE recommendation. Demo products from scripts/seed.py must still produce the four expected verdicts: use the smallest mechanism that does not change the contract (for example a demo marker on the product, or a rules_config switch the seed sets), and report the choice. Add tests: real product with mock-only evidence is not PASSED; demo product still READY; source_type listed in the evidence quality summary of reports.

## T2: CURRENCY AND UNIT MISMATCH
Check how an observed price's currency is handled against the product's currency (find the currency field in the assumptions schema). If a competitor price is in another currency, it must NOT enter the price band as if it were the same currency. Never convert and never invent exchange rates: exclude it from the band, add a canonical finding (for example CURRENCY_MISMATCH, severity warning) and a recommendation to enter a comparable price manually. Add the code to EMITTED_CODES and the recommendation rule table (the completeness test must still pass). Tests with hand-calculated bands.

## T3: HONEST RESEARCH COVERAGE
Per competitor, the research run must record an outcome the founder can see through the existing run status fields: price found, no price on page, page blocked, fetch error, page appears to need JavaScript (very little visible text). Never silently drop a competitor. When no price was found, the competitor stage reports NO_PRICE_DATA and the recommendation says how to add the price manually (use the existing manual evidence or ingest route; do not add contract fields). Tests with fake pages (empty, JS-only shell, blocked, normal).

## T4: REAL-WORLD TRIAL SCRIPT (no invented data)
scripts/real_world_trial.py: reads a JSON file (create data/trial_template.json with EMPTY placeholders only) holding the product assumptions and 2 to 4 real competitor URLs supplied by the user. It runs the real fetcher and Gemini (refuses without LLM_API_KEY), prints per competitor: URL, extracted price, currency, the verbatim excerpt, confidence, and what was dropped and why. Then it runs the pure pipeline in memory and prints stage statuses, verdict and recommendations. It stores nothing unless --save is passed. The user compares the printed excerpts with the real pages by eye.

## T5: ACCESS PROTECTION FOR REAL USE
No authentication exists today. Add, OFF by default so the frontend keeps working: settings AUTH_ENABLED (default false) and APP_API_KEY (empty). When enabled, require header X-API-Key (constant-time comparison) on POST research, validate, revalidate, simulate and report routes and the internal ingest route; reads and /health stay open. Add a simple in-memory per-IP rate limit on POST research and POST validate (limits in settings), returning 429 in the standard envelope. Tests: disabled means no change; enabled without key 401; wrong key 403; right key passes; key never logged. Document that this is a minimal guard, not user accounts, and that multi-user separation of products is NOT implemented.

## T6: LIMITATIONS IN PLAIN LANGUAGE
docs/LIMITATIONS.md for founders: what a verdict means and does not mean. It must say: results depend on the numbers entered (price, cost, interviews and CAC are self-reported and not verified); thresholds are general defaults, not category-specific benchmarks; no market-demand sizing, conversion-rate, cash-flow, minimum-order-quantity, tax, returns or seasonality analysis; competitor prices come only from pages the user lists and may miss JavaScript-rendered prices, sale prices or different pack sizes; AI evidence is capped at 0.80 confidence and only counted when the price appears in a verbatim excerpt; no user accounts yet.

## DONE WHEN
Postgres result shown (or NOT RUN with reason); T1 to T6 each marked FIXED / NOT A PROBLEM (with proof) / BLOCKED; all earlier tests still pass; seed verdicts unchanged; hygiene greps clean; frontend/landing diff empty.

## DAY REPORT (raw output only)
A. Per task: problem confirmed or not (evidence), fix, tests added. B. pytest summary (SQLite and Postgres or NOT RUN). C. seed.py verdict table. D. One printed run of real_world_trial.py with the template left empty (shows the refusal or validation message). E. Hygiene greps. F. Updated scorecard. G. Decisions made. H. Open issues and NOT RUN items. Then STOP.
