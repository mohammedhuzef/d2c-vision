# LaunchTwin AI — Full Project Truth Specification

> Auto-generated purely from backend code, contracts, and schema metadata.

## 1. Validation Rules & Thresholds Truth Table

| Stage | Weight | Critical? | Key Thresholds | Denominator / Exact Formula | Scoring Method & Penalties |
| :--- | :---: | :---: | :--- | :--- | :--- |
| **customer** | 15% (`0.15`) | No | `CUSTOMER_MIN_INTERVIEWS = 5`<br>`CUSTOMER_STRONG_INTERVIEWS = 10` | Count of interviews (`customer_interviews_count`) | $< 5 \rightarrow \text{INSUFFICIENT\_EVIDENCE (None)}$<br>$5..9 \rightarrow \text{WARNING (75)}$<br>$\ge 10 \rightarrow \text{PASSED (100)}$ |
| **competitor** | 15% (`0.15`) | No | `COMPETITOR_MIN_COUNT = 2`<br>`COMPETITOR_MIN_EVIDENCE = 1` | Competitor count & evidence count per competitor | $< 2\text{ competitors} \rightarrow \text{INSUFFICIENT\_EVIDENCE (None)}$<br>Lacking evidence $\rightarrow \text{INSUFFICIENT\_EVIDENCE (None)}$<br>Undifferentiated $\rightarrow \text{WARNING (-25 deduction)}$<br>Else $\rightarrow \text{PASSED (100)}$ |
| **product_packaging** | 15% (`0.15`) | No | `PACKAGING_WARN_FRACTION = 0.15` (15%)<br>`PACKAGING_FAIL_FRACTION = 0.25` (25%) | $$\frac{\text{packaging\_cost}}{\text{selling\_price}}$$ (Denominator is **selling price**, not COGS) | $> 25\% \rightarrow \text{FAILED (capped at 40)}$<br>$> 15\% \rightarrow \text{WARNING (75)}$<br>$\le 15\% \rightarrow \text{PASSED (100)}$ |
| **pricing** | 20% (`0.20`) | **Yes** | `PRICING_BELOW_BAND_WARN = 0.20` (20%)<br>`PRICING_ABOVE_BAND_WARN = 0.15` (15%)<br>`PRICING_FAIL_MARGIN = 0.15` (15%) | Min/Max corridor vs competitors:<br>$\text{Price} < \text{comp\_min} \times (1 - 0.20)$<br>$\text{Price} > \text{comp\_max} \times (1 + 0.15)$<br>Contribution margin vs target | Margin $< 15\% \rightarrow \text{FAILED (capped at 40)}$<br>Outside corridor $\rightarrow \text{WARNING (-25)}$<br>Margin $<$ target $\rightarrow \text{WARNING (-25)}$<br>Else $\rightarrow \text{PASSED (100)}$ |
| **financial** | 20% (`0.20`) | **Yes** | `FINANCIAL_BREAK_EVEN_WARN_UNITS = 2500` units | Unit contribution (Price - Variable Cost) and break-even volume $\lceil \text{Fixed} / \text{Contribution} \rceil$ | Contribution $\le 0 \rightarrow \text{FAILED (capped at 40)}$<br>Break-even $> 2500 \rightarrow \text{WARNING (75)}$<br>Margin $<$ target $\rightarrow \text{WARNING (75)}$<br>Else $\rightarrow \text{PASSED (100)}$ |
| **marketing** | 15% (`0.15`) | No | `MARKETING_CAC_RATIO_WARN = 0.60` (0.60)<br>`MARKETING_CAC_RATIO_FAIL = 1.00` (1.00) | $$\frac{\text{expected\_cac}}{\text{contribution\_per\_unit}}$$ (Denominator is **unit contribution**, not price) | Ratio $> 1.00 \rightarrow \text{FAILED (capped at 40)}$<br>Ratio $> 0.60 \rightarrow \text{WARNING (75)}$<br>Else $\rightarrow \text{PASSED (100)}$ |

### Deterministic Stage Scoring Mechanism
- Base Starting Score: `100.00`
- Warning Finding Deduction: `-25.00` points per warning
- Critical Finding Deduction: `-30.00` points per critical
- Failed Stage Score Cap: `40.00` (scores on failed stages cannot exceed 40.00)
- Missing / Insufficient Evidence Score: `None` (null, omitted from renormalized weighted score)

## 2. Verdict Precedence & Readiness Cutoffs

Evaluated strictly in priority order 1 through 5:
1. **Critical Failed**: If any critical stage (`pricing`, `financial`) has status `FAILED` $\rightarrow$ **`NOT_READY`**.
2. **Critical Insufficient / Not Run**: If any critical stage has status `INSUFFICIENT_EVIDENCE` or `NOT_RUN` $\rightarrow$ **`INSUFFICIENT_EVIDENCE`**.
3. **Non-Critical Failed or Very Low Score**: If any non-critical stage is `FAILED` OR overall weighted score $< 50.00$ (`READINESS_WARNING_MIN_SCORE`) $\rightarrow$ **`NOT_READY`**.
4. **Warnings, Gaps, or Sub-Threshold Score**: If any stage is `WARNING` OR non-critical `INSUFFICIENT_EVIDENCE` OR overall weighted score $< 70.00$ (`READINESS_SCORE_CUTOFF_READY`) $\rightarrow$ **`READY_WITH_WARNINGS`**.
5. **Fully Ready**: All stages `PASSED` AND overall weighted score $\ge 70.00$ $\rightarrow$ **`READY`**.

## 3. Financial Math & Dynamic Verification Proofs

Exact formulas computed in pure Python `Decimal` with `ROUND_HALF_UP`:
- $\text{Variable Cost} = \text{COGS} + \text{Packaging} + \text{Shipping} + \text{Other Variable} + \text{Fixed Payment Fee} + (\text{Payment Fee \%} + \text{Platform Fee \%}) \times \text{Selling Price}$ *(rounded to 2 dp)*
- $\text{Contribution Margin} = \text{Selling Price} - \text{Variable Cost}$ *(2 dp)*
- $\text{Margin Fraction} = \frac{\text{Contribution Margin}}{\text{Selling Price}}$ *(4 dp)*
- $\text{Break-Even Units} = \lceil \frac{\text{Fixed Costs}}{\text{Contribution Margin}} \rceil$ *(ceiling integer, only when Contribution Margin > 0)*

### Dynamic Verification Vectors (Computed at Generation Time)
- **Vector A (Healthy Baseline)**:
  - Inputs: Price 500.00, COGS 150.00, Packaging 30.00, Shipping 40.00, Fee 0.02, Fixed 50000.00
  - Variable Cost: **230.00**
  - Contribution Margin: **270.00**
  - Margin Fraction: **0.5400** (54.00%)
  - Break-Even Units: **186**

- **Vector B (High Packaging Cost)**:
  - Inputs: Packaging increased to 60.00
  - Variable Cost: **260.00**
  - Contribution Margin: **240.00**
  - Margin Fraction: **0.4800** (48.00%)
  - Break-Even Units: **209**

## 4. Database Schema Truth (SQLAlchemy Metadata)

| Table Name | Column Name | Column Type |
| :--- | :--- | :--- |
| `competitor_analyses` | `product_id` | `UUID` |
| `competitor_analyses` | `competitor_id` | `UUID` |
| `competitor_analyses` | `summary` | `TEXT` |
| `competitor_analyses` | `strengths` | `JSONB` |
| `competitor_analyses` | `weaknesses` | `JSONB` |
| `competitor_analyses` | `price_observed` | `NUMERIC(14, 2)` |
| `competitor_analyses` | `evidence_ids` | `ARRAY` |
| `competitor_analyses` | `produced_by` | `TEXT` |
| `competitor_analyses` | `id` | `UUID` |
| `competitor_analyses` | `created_at` | `DATETIME` |
| `competitors` | `product_id` | `UUID` |
| `competitors` | `name` | `VARCHAR(255)` |
| `competitors` | `website_url` | `TEXT` |
| `competitors` | `notes` | `TEXT` |
| `competitors` | `product_name` | `TEXT` |
| `competitors` | `id` | `UUID` |
| `competitors` | `created_at` | `DATETIME` |
| `impact_events` | `product_id` | `UUID` |
| `impact_events` | `from_version` | `INTEGER` |
| `impact_events` | `to_version` | `INTEGER` |
| `impact_events` | `changed_fields` | `ARRAY` |
| `impact_events` | `affected_stages` | `ARRAY` |
| `impact_events` | `rerun_run_id` | `UUID` |
| `impact_events` | `before` | `JSONB` |
| `impact_events` | `after` | `JSONB` |
| `impact_events` | `id` | `UUID` |
| `impact_events` | `created_at` | `DATETIME` |
| `influencers` | `product_id` | `UUID` |
| `influencers` | `name` | `VARCHAR(255)` |
| `influencers` | `handle` | `VARCHAR(255)` |
| `influencers` | `avatar_url` | `TEXT` |
| `influencers` | `platform` | `VARCHAR(50)` |
| `influencers` | `category` | `VARCHAR(100)` |
| `influencers` | `bio` | `TEXT` |
| `influencers` | `location` | `VARCHAR(255)` |
| `influencers` | `follower_count` | `INTEGER` |
| `influencers` | `follower_tier` | `VARCHAR(50)` |
| `influencers` | `engagement_rate` | `FLOAT` |
| `influencers` | `avg_views` | `INTEGER` |
| `influencers` | `avg_likes` | `INTEGER` |
| `influencers` | `niche_tags` | `ARRAY` |
| `influencers` | `audience_demographics` | `JSONB` |
| `influencers` | `estimated_cost_per_post` | `NUMERIC(14, 2)` |
| `influencers` | `deliverables_summary` | `VARCHAR(255)` |
| `influencers` | `sample_content_url` | `TEXT` |
| `influencers` | `status` | `VARCHAR(50)` |
| `influencers` | `notes` | `TEXT` |
| `influencers` | `id` | `UUID` |
| `influencers` | `created_at` | `DATETIME` |
| `product_versions` | `product_id` | `UUID` |
| `product_versions` | `version_number` | `INTEGER` |
| `product_versions` | `assumptions` | `JSONB` |
| `product_versions` | `change_summary` | `JSONB` |
| `product_versions` | `created_by` | `TEXT` |
| `product_versions` | `id` | `UUID` |
| `product_versions` | `created_at` | `DATETIME` |
| `products` | `name` | `VARCHAR(255)` |
| `products` | `description` | `TEXT` |
| `products` | `category` | `VARCHAR(100)` |
| `products` | `target_market` | `TEXT` |
| `products` | `current_version` | `INTEGER` |
| `products` | `status` | `VARCHAR(50)` |
| `products` | `id` | `UUID` |
| `products` | `created_at` | `DATETIME` |
| `recommendations` | `product_id` | `UUID` |
| `recommendations` | `version_id` | `UUID` |
| `recommendations` | `stage` | `TEXT` |
| `recommendations` | `priority` | `TEXT` |
| `recommendations` | `title` | `TEXT` |
| `recommendations` | `detail` | `TEXT` |
| `recommendations` | `evidence_ids` | `ARRAY` |
| `recommendations` | `id` | `UUID` |
| `recommendations` | `created_at` | `DATETIME` |
| `reports` | `product_id` | `UUID` |
| `reports` | `version_id` | `UUID` |
| `reports` | `format` | `VARCHAR(50)` |
| `reports` | `content` | `JSONB` |
| `reports` | `markdown` | `TEXT` |
| `reports` | `generated_at` | `DATETIME` |
| `reports` | `id` | `UUID` |
| `reports` | `created_at` | `DATETIME` |
| `research_evidence` | `product_id` | `UUID` |
| `research_evidence` | `competitor_id` | `UUID` |
| `research_evidence` | `content_hash` | `VARCHAR(64)` |
| `research_evidence` | `source_type` | `VARCHAR(50)` |
| `research_evidence` | `source_url` | `TEXT` |
| `research_evidence` | `title` | `TEXT` |
| `research_evidence` | `excerpt` | `TEXT` |
| `research_evidence` | `retrieved_at` | `DATETIME` |
| `research_evidence` | `confidence` | `NUMERIC(3, 2)` |
| `research_evidence` | `data` | `JSONB` |
| `research_evidence` | `id` | `UUID` |
| `research_evidence` | `created_at` | `DATETIME` |
| `research_runs` | `product_id` | `UUID` |
| `research_runs` | `status` | `VARCHAR(50)` |
| `research_runs` | `evidence_count` | `INTEGER` |
| `research_runs` | `started_at` | `DATETIME` |
| `research_runs` | `finished_at` | `DATETIME` |
| `research_runs` | `provider` | `TEXT` |
| `research_runs` | `errors` | `JSONB` |
| `research_runs` | `id` | `UUID` |
| `research_runs` | `created_at` | `DATETIME` |
| `validation_results` | `run_id` | `UUID` |
| `validation_results` | `product_id` | `UUID` |
| `validation_results` | `version_id` | `UUID` |
| `validation_results` | `stage` | `TEXT` |
| `validation_results` | `status` | `TEXT` |
| `validation_results` | `score` | `NUMERIC(5, 2)` |
| `validation_results` | `metrics` | `JSONB` |
| `validation_results` | `findings` | `JSONB` |
| `validation_results` | `inputs_used` | `JSONB` |
| `validation_results` | `upstream` | `JSONB` |
| `validation_results` | `carried_forward_from` | `UUID` |
| `validation_results` | `id` | `UUID` |
| `validation_results` | `created_at` | `DATETIME` |
| `validation_runs` | `product_id` | `UUID` |
| `validation_runs` | `version_id` | `UUID` |
| `validation_runs` | `trigger` | `TEXT` |
| `validation_runs` | `triggered_by` | `TEXT` |
| `validation_runs` | `status` | `TEXT` |
| `validation_runs` | `stages_run` | `ARRAY` |
| `validation_runs` | `readiness_score` | `NUMERIC(5, 2)` |
| `validation_runs` | `readiness` | `JSONB` |
| `validation_runs` | `recommendations` | `JSONB` |
| `validation_runs` | `verdict` | `TEXT` |
| `validation_runs` | `input_fingerprint` | `VARCHAR(64)` |
| `validation_runs` | `started_at` | `DATETIME` |
| `validation_runs` | `finished_at` | `DATETIME` |
| `validation_runs` | `id` | `UUID` |
| `validation_runs` | `created_at` | `DATETIME` |

## 5. Registered REST API Routes

| Method | Path | Summary / Operation ID |
| :---: | :--- | :--- |
| `GET` | `/api/v1/health` | Api V1 Health Check |
| `GET` | `/api/v1/influencers` | List Influencers |
| `POST` | `/api/v1/influencers` | Create Influencer |
| `POST` | `/api/v1/influencers/match-custom` | Match Influencers Custom |
| `GET` | `/api/v1/influencers/match/{product_id}` | Match Influencers For Product |
| `POST` | `/api/v1/influencers/{influencer_id}/pitch` | Generate Pitch |
| `PATCH` | `/api/v1/influencers/{influencer_id}/status` | Update Influencer Status |
| `POST` | `/api/v1/internal/research-results` | Ingest Research Results |
| `POST` | `/api/v1/internal/research/results` | Ingest Research Results |
| `GET` | `/api/v1/products` | List Products |
| `POST` | `/api/v1/products` | Create Product |
| `GET` | `/api/v1/products/{product_id}` | Get Product |
| `PATCH` | `/api/v1/products/{product_id}/assumptions` | Patch Assumptions |
| `GET` | `/api/v1/products/{product_id}/competitors` | List Competitors |
| `POST` | `/api/v1/products/{product_id}/competitors` | Add Competitors |
| `GET` | `/api/v1/products/{product_id}/competitors/summary` | Get Competitor Price Summary |
| `GET` | `/api/v1/products/{product_id}/evidence` | List Product Evidence |
| `GET` | `/api/v1/products/{product_id}/impact-events` | List Product Impact Events |
| `GET` | `/api/v1/products/{product_id}/recommendations` | Get Recommendations |
| `GET` | `/api/v1/products/{product_id}/reports` | List Reports |
| `POST` | `/api/v1/products/{product_id}/reports` | Generate Report |
| `GET` | `/api/v1/products/{product_id}/reports/latest` | Get Latest Report |
| `GET` | `/api/v1/products/{product_id}/reports/{report_id}` | Get Report |
| `GET` | `/api/v1/products/{product_id}/research` | List Research Runs |
| `POST` | `/api/v1/products/{product_id}/research` | Start Research |
| `GET` | `/api/v1/products/{product_id}/research/{research_id}` | Get Research Status |
| `POST` | `/api/v1/products/{product_id}/revalidate` | Revalidate Stages |
| `POST` | `/api/v1/products/{product_id}/simulate` | Simulate Product Validation Direct |
| `POST` | `/api/v1/products/{product_id}/validate` | Run Validation |
| `GET` | `/api/v1/products/{product_id}/validation` | Get Validation Results |
| `GET` | `/api/v1/products/{product_id}/validation/readiness` | Get Product Readiness |
| `POST` | `/api/v1/products/{product_id}/validation/revalidate` | Revalidate Stages |
| `GET` | `/api/v1/products/{product_id}/validation/runs` | List Product Validation Runs |
| `POST` | `/api/v1/products/{product_id}/validation/runs` | Create Product Validation Run |
| `GET` | `/api/v1/products/{product_id}/validation/runs/latest` | Get Latest Product Validation Run |
| `GET` | `/api/v1/products/{product_id}/validation/runs/latest/recommendations` | Get Latest Product Recommendations |
| `GET` | `/api/v1/products/{product_id}/validation/runs/{run_id}` | Get Product Validation Run By Id |
| `GET` | `/api/v1/products/{product_id}/validation/runs/{run_id}/recommendations` | Get Product Run Recommendations |
| `POST` | `/api/v1/products/{product_id}/validation/simulate` | Simulate Product Validation |
| `GET` | `/api/v1/products/{product_id}/versions` | List Versions |
| `GET` | `/api/v1/products/{product_id}/versions/compare` | Compare Product Versions Query |
| `GET` | `/api/v1/products/{product_id}/versions/{version_a}/compare/{version_b}` | Compare Product Versions |
| `GET` | `/api/v1/projects/{project_id}/validation/readiness` | Get Project Readiness |
| `GET` | `/api/v1/projects/{project_id}/validation/runs` | List Project Validation Runs |
| `POST` | `/api/v1/projects/{project_id}/validation/runs` | Create Project Validation Run |
| `GET` | `/api/v1/projects/{project_id}/validation/runs/latest` | Get Latest Project Validation Run |
| `GET` | `/api/v1/projects/{project_id}/validation/runs/latest/recommendations` | Get Latest Project Recommendations |
| `GET` | `/api/v1/projects/{project_id}/validation/runs/{run_id}` | Get Project Validation Run By Id |
| `GET` | `/api/v1/projects/{project_id}/validation/runs/{run_id}/recommendations` | Get Project Run Recommendations |
| `POST` | `/api/v1/projects/{project_id}/validation/simulate` | Simulate Project Validation |
| `GET` | `/health` | Health Check |

## 6. Configuration & Environment Variables

| Variable | Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `PROJECT_NAME` | `<class 'str'>` | `LaunchTwin AI Backend` |  |
| `VERSION` | `<class 'str'>` | `1.0.0` |  |
| `API_V1_PREFIX` | `<class 'str'>` | `/api/v1` |  |
| `DATABASE_URL` | `<class 'str'>` | `sqlite:///./launchtwin.db` |  |
| `RESEARCH_PROVIDER` | `Literal['mock', 'ai']` | `mock` |  |
| `ENVIRONMENT` | `Literal['development', 'testing', 'production']` | `development` |  |
| `APP_ENV` | `Optional[Literal['development', 'testing', 'production']]` | `development` |  |
| `LOG_LEVEL` | `<class 'str'>` | `INFO` |  |
| `ENABLE_DOCS` | `<class 'bool'>` | `True` |  |
| `CORS_ORIGINS` | `Union[List[str], str]` | `http://localhost:5173, http://localhost:5174, http://127.0.0.1:5173, http://127.0.0.1:5174, http://localhost:3000` |  |
| `LLM_PROVIDER` | `<class 'str'>` | `gemini` |  |
| `LLM_API_KEY` | `Optional[str]` | `None` |  |
| `LLM_MODEL` | `<class 'str'>` | `gemini-1.5-flash` |  |
| `LLM_TIMEOUT_SECONDS` | `<class 'int'>` | `30` |  |
| `RESEARCH_FETCH_TIMEOUT_SECONDS` | `<class 'int'>` | `10` |  |
| `RESEARCH_MAX_PAGE_BYTES` | `<class 'int'>` | `1048576` |  |
| `RESEARCH_MAX_TEXT_LENGTH` | `<class 'int'>` | `50000` |  |
| `RESEARCH_MAX_REDIRECTS` | `<class 'int'>` | `3` |  |
| `RESEARCH_USER_AGENT` | `<class 'str'>` | `LaunchTwinBot/1.0 (+https://launchtwin.example.com/bot)` |  |
| `RESEARCH_MAX_COMPETITORS` | `<class 'int'>` | `5` |  |
| `RESEARCH_TIME_BUDGET_SECONDS` | `<class 'int'>` | `60` |  |
| `RESEARCH_CONFIDENCE_CAP` | `<class 'decimal.Decimal'>` | `0.8` |  |
| `RESEARCH_MAX_EVIDENCE_PER_COMPETITOR` | `<class 'int'>` | `10` |  |
| `RESEARCH_MAX_STRENGTHS` | `<class 'int'>` | `10` |  |
| `RESEARCH_MAX_WEAKNESSES` | `<class 'int'>` | `10` |  |
| `RESEARCH_STALE_AFTER_SECONDS` | `<class 'int'>` | `900` |  |
| `RATE_LIMIT_ENABLED` | `<class 'bool'>` | `False` |  |
| `RATE_LIMIT_REQUESTS_PER_MINUTE` | `<class 'int'>` | `30` |  |
| `MAX_REQUEST_BODY_BYTES` | `<class 'int'>` | `1048576` |  |

## 7. Frontend Environment & CORS Origins
- **Frontend `.env` Content**: `VITE_API_BASE_URL=http://localhost:8000/api/v1`
- **Allowed CORS Origins in Backend**: `['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://localhost:3000']`

## 8. Seed Demo Products
- TerraFlask 32oz Eco-Insulated Tumbler (Key: `healthy`)
- Basic Budget Bottle (Key: `weak`)
- Fictional Demo Influencers: `@sample.creator.alpha`, `@mock.niche.beta`

## 9. Test Suite Verification
- Total Collected Automated Tests: **366 tests**
- Test Coverage: Unit tests, integration tests, immutability checks, SSRF guards, contract & route locks.

## 10. SUMMARY FOR AI ASSISTANTS

```text
PROJECT: LaunchTwin AI — Deterministic Product Launch Readiness Platform
ARCHITECTURE:
  - Separation of Concerns: AI extracts evidence (claims & prices) only. Python rules decide all numbers and verdicts.
  - Pure Domain: Zero database, HTTP, or LLM imports in domain modules (finance, stages, readiness, simulation).
  - Pure Decimal: Strictly no float() in backend/app/services. All monetary calculations use Decimal with ROUND_HALF_UP.
FINANCIAL RULES:
  - Variable Cost = COGS + packaging + shipping + other_variable + fixed_fee + (payment_fee% + platform_fee%) * price (rounded to 2 dp).
  - Contribution Margin = Price - Variable Cost (2 dp).
  - Margin Fraction = Contribution Margin / Price (4 dp).
  - Break-Even Units = CEIL(Fixed Costs / Contribution Margin) only when Contribution > 0.
VALIDATION ENGINE:
  - 6 Sequential Stages: customer (15%), competitor (15%), product_packaging (15%), pricing (20%, critical), financial (20%, critical), marketing (15%).
  - Scoring: Base 100.00; -25.00 per warning finding; -30.00 per critical finding; FAILED capped at 40.00.
  - Precedence: Critical FAILED -> NOT_READY; Critical Insufficient/Not Run -> INSUFFICIENT_EVIDENCE; Non-critical FAILED or score < 50 -> NOT_READY; Any Warning or score < 70 -> READY_WITH_WARNINGS; All Passed and score >= 70 -> READY.
IMMUTABILITY & SAFETY:
  - ProductVersion and ValidationRun are immutable (UPDATE and DELETE raise exceptions).
  - Research POST returns HTTP 202; runs synchronously in v1; prevents concurrent runs with HTTP 409 Conflict.
  - Page fetcher blocks SSRF attacks (private IPs, loopbacks, octal/hex encodings, cloud metadata).
  - Settings API and database store zero secret API keys (keys live strictly in .env).
```
