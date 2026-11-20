# BACKEND SCORECARD RUBRIC (score only what the evidence proves)

Score each category 0 to 10. Write the evidence next to every score: pasted command output or exact test names. No evidence, no points.

| # | Category | Weight | 10/10 means (evidence required) |
|---|---|---|---|
| 1 | Correctness of rules and math | 20% | Vectors A and B exact; every threshold boundary test (0.15, 0.1501, 0.25, 0.2501, 0.60, 1.00, interviews 4/5/9/10, break-even 2500/2501, band edges) passes; readiness precedence tests for all 5 rules; recommendations round-trip tests (suggested price really reaches the target margin) |
| 2 | Contract fidelity | 20% | Every method+path in routes.lock exists; all responses validate against OpenAPI schemas; frontend_coverage.py shows no gaps; aliases identical |
| 3 | Data integrity and immutability | 15% | Triggers proven by raw SQL on SQLite AND PostgreSQL; unique constraints; single-insert runs; concurrency tests pass on both; migrations round-trip on both; reference-table match |
| 4 | AI safety and honesty | 15% | SSRF tests (all listed cases, resolved-IP and redirect checks), verbatim excerpt + price-in-excerpt checks, 0.80 cap, prompt-injection test, fallback, no secrets in logs; AI code never imported by pure layers |
| 5 | Real and demo data | 10% | seed.py idempotent; four demo products produce the expected verdicts; everything labelled sample; optional live research works on a real URL (manual proof) |
| 6 | Reliability and performance | 10% | catch-all handler, request ids, input limits, no N+1 (query-count test), timings under 1 s, sessions closed |
| 7 | Test suite quality | 5% | Hand-calculated expectations, no deleted or weakened assertions (git diff audit), source scans, deterministic results |
| 8 | Documentation and ops | 5% | BACKEND_STATUS.md accurate, exact run commands, honest limitations, verify_all.py green |

## HARD CAPS (apply the lowest)
- PostgreSQL suite not run: overall maximum 8.0 and category 3 maximum 6.
- Any float( in backend/app/services: category 1 maximum 5.
- Any deleted or weakened test assertion found in git history of this rebuild: category 7 = 0 and overall maximum 6.
- A route in routes.lock missing from the app: category 2 maximum 6.
- frontend/ or landing/ modified: overall maximum 4.
- A secret found in a tracked file, log, or response: category 4 = 0.
- Real AI path never exercised even once manually on a real URL: category 5 maximum 7 and category 4 maximum 8.
- A claim in a report without pasted output: that category maximum 6.

## RESULT FORMAT
Overall = weighted sum, one decimal place. List every cap that applied. List the top 3 weaknesses and what evidence would raise each score. Be conservative: 9.0 or above requires every category at 8 or higher with evidence and no cap applied.
