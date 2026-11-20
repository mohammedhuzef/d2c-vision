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
