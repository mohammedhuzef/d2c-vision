# DAY 1: VALIDATION EXECUTION AND PERSISTENCE (Task 3B) + POSTGRES PROOF

Read prompts/_PROMPT_ANATOMY.md first. Then send your Plan Check and wait for "go".

## GOAL
Wire the pure pipeline to the database and expose all validation routes from the contract. Prove everything on PostgreSQL.

## T0: POSTGRES FIRST
- If TEST_DATABASE_URL is set to a PostgreSQL database: run alembic upgrade head, downgrade base, upgrade head against it, then python -m pytest -q. The immutability trigger tests and the concurrency test must run there. Fix Postgres-only failures (trigger syntax, UUID/JSON types, locking).
- If it is not set: write "Postgres NOT RUN: TEST_DATABASE_URL not set", continue on SQLite, and repeat this at the end of the day.
- Verify the 12 ORM tables equal the 12 reference tables (names and columns); print the comparison.

## T1: READ THE CONTRACT (read only, summarize in 15 lines)
Schemas and examples for: POST /validate, POST /validation/runs, GET /validation, /validation/runs (list, latest, by id), /validation/readiness, both recommendations routes, GET /products/{id}/recommendations, both revalidate routes, both simulate routes, AssumptionsPatchRequest and AssumptionsPatchResponse, ProductDetailResponse. Also grep frontend/src/api/client.ts for how these are called. List which response fields need data from which table.

## T2: PERSISTENCE AND USE-CASE
- backend/app/repositories/validation_repository.py: load inputs (assumptions of a version, evidence rows, competitor analyses as plain dicts), save_run (ONE insert of the run with readiness, recommendations, verdict, readiness_score, stages_run, input_fingerprint, status; then the validation_results rows in the same transaction), get_latest_run, get_run, list_runs (paginated), previous results for carry-forward, write rows to the legacy recommendations table with the priority mapping.
- backend/app/usecases/run_validation.py: full run or partial run (stages list), uses services.validation.pipeline.run_pipeline, readiness.calculate_readiness, recommendations.generate. Partial run: affected stages via dependencies.affected_stages, everything else carried forward (carried_forward_from = previous result id). Input fingerprint = SHA-256 of canonical JSON of assumptions, evidence and analyses. Per-product lock (row lock on Postgres, thread lock on SQLite). A crashed stage is already isolated by the pipeline (NOT_RUN + STAGE_ERROR); the run still completes.

## T3: ENDPOINTS (every route and status code exactly as the contract says)
POST /products/{id}/validate; POST /products/{id}/validation/runs; GET /products/{id}/validation; GET .../validation/runs (list), /latest, /{run_id}; GET .../validation/readiness; GET .../validation/runs/latest/recommendations and /{run_id}/recommendations (filters `priority` and `stage`, 422 on bad values); GET /products/{id}/recommendations (legacy shape); POST /products/{id}/revalidate and /validation/revalidate; POST /products/{id}/simulate and /validation/simulate (stateless, never writes a row); and the /projects/{id}/... aliases for the validation and simulate routes. Unknown product 404, malformed UUID 422, report-like "no run yet" cases per the contract (404 with a clear message).
PATCH /products/{id}/assumptions with revalidate=true: run the affected stages, carry the rest, return results as AssumptionsPatchResponse defines, set impact_events.rerun_run_id, update the product's validated version.

## T4: PRODUCT DETAIL IS NOW REAL
latest_readiness, stage_statuses, validated_version, revalidation_required, missing_evidence_count and competitors_count come from real rows.

## T5: TESTS (hand-calculate expected values; never copy from code output)
- Vector A end to end through the API with 2 competitors (observed prices 450.00 and 550.00) and evidence on both: all six PASSED, overall 100.00, READY, financial 230.00/270.00/0.5400/186.
- PATCH packaging 30 to 60 with revalidate=true: run 2 re-executes product_packaging, pricing, financial, marketing; customer and competitor carried forward with carried_forward_from set; financial 260.00/240.00/0.4800/209; impact event has rerun_run_id; product detail shows validated_version == current_version; run 1 untouched.
- Underpriced case (price 260, other inputs as Vector A, band 450/550): pricing FAILED, marketing FAILED (ratio 1.7241), financial PASSED, verdict NOT_READY even though the weighted score is 79.00.
- Evidence-poor case (3 interviews, 1 competitor): customer and competitor INSUFFICIENT_EVIDENCE, scores null, verdict READY_WITH_WARNINGS.
- Immutability: raw SQL UPDATE/DELETE on validation_runs rejected; a test proving no code path updates a run after insert.
- Concurrency: two simultaneous validate calls on one product both succeed with distinct runs.
- Simulate: no rows created (count before == after); price raised to the recommended value moves pricing WARNING to PASSED.
- Contract conformance: every response of every route in this day validates against its OpenAPI schema (jsonschema); the route set for this day equals the routes.lock entries.
- Aliases: /projects/... returns identical bodies to /products/....
- Priority mapping test for the legacy recommendations table.

## DONE WHEN
All routes above exist and pass contract tests; Vector A flow passes; Postgres suite result shown (or NOT RUN with reason); 122 earlier tests still pass; hygiene greps clean.

## DAY REPORT (raw output only)
A. Contract summary (T1). B. Reference-table comparison. C. Files created. D. pytest summary on SQLite and on Postgres (or NOT RUN line). E. alembic round trip output (both DBs if possible). F. A printed Vector A validate response and the PATCH-with-revalidate response. G. float( and frontend/landing diff outputs. H. Route list vs routes.lock (missing / extra). I. Decisions made. J. Open issues and NOT RUN items. Then STOP.
