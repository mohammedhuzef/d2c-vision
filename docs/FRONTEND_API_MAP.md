# LaunchTwin AI - Frontend API Mapping Document

This document provides a comprehensive mapping of every frontend page and interaction to the backend REST API endpoints defined in `contracts/openapi.json`.

## API Prefix Decision

The backend mounts endpoints under both `/api/v1/products/{product_id}` and `/api/v1/projects/{project_id}`.
- **Prefix Selected**: `/api/v1/products/{product_id}/...`
- **Reason**: The `/api/v1/projects/{project_id}/...` prefix ONLY exposes validation endpoints (`readiness`, `runs`, `simulate`), whereas `/api/v1/products/{product_id}/...` exposes the full suite: products, assumptions, competitors, recommendations, research, validation, versions, comparison, and reports. Therefore, the frontend consistently uses `/api/v1/products/{product_id}` across all features and queries.

---

## Global & Shell Endpoints

| Feature / UI Component | Method & Endpoint | Request Type | Response Type | Field UI Mapping |
| :--- | :--- | :--- | :--- | :--- |
| **Workspace Menu - Health Ping** | `GET /health` | None | `{ status: string }` | Displays backend connectivity indicator and base URL in the top bar workspace popover. |
| **Product Selector Dropdown** | `GET /api/v1/products` | Query: `limit`, `offset` | `ProductListResponse` (`items: ProductResponse[]`, `total`, `limit`, `offset`) | Lists existing analyses (`item.name`, `item.category`, `item.id`). Switching changes active ID in URL. |
| **Active Product Detail** | `GET /api/v1/products/{product_id}` | Path: `product_id` | `ProductDetailResponse` | Top bar title, product name, category, target market, current version, and stage statuses. |
| **Top Bar Bell - Activity Feed** | `GET /api/v1/products/{product_id}/versions` | Path: `product_id` | `ProductVersionListResponse` (`items: ProductVersionResponse[]`) | Shows chronological version history and change summaries in recent activity popover. |
| **Top Bar Bell - Validation Runs** | `GET /api/v1/products/{product_id}/validation/runs` | Path: `product_id` | `ValidationRunListResponse` (`items: ValidationRunSummaryResponse[]`) | Shows recent validation runs with status and trigger time. |

---

## Page 1: Dashboard (`/` and `/:id`)

| Feature / UI Component | Method & Endpoint | Request Type | Response Type | Field UI Mapping |
| :--- | :--- | :--- | :--- | :--- |
| **Header Product Summary** | `GET /api/v1/products/{product_id}` | Path: `product_id` | `ProductDetailResponse` | `name`, `category`, `target_market`, `current_version`. |
| **Readiness Hero & Score** | `GET /api/v1/products/{product_id}/validation/readiness` | Path: `product_id` | `ReadinessResponse` | `label` -> Readiness badge (READY, READY_WITH_WARNINGS, NOT_READY, INSUFFICIENT_EVIDENCE); `overall_score` -> Score out of 100. |
| **Run Revalidation Button** | `POST /api/v1/products/{product_id}/revalidate` | Path: `product_id` | `ValidationRunResponse` | Shown when product's `current_version` > latest validation run's `version_number`. Triggers revalidation with confirm dialog. |
| **Pipeline 6-Stage Strip** | `GET /api/v1/products/{product_id}/validation/runs/latest` (or `ProductDetailResponse.stage_statuses`) | Path: `product_id` | `ValidationRunDetailResponse` | 6 stages in order (`customer`, `competitor`, `product_packaging`, `pricing`, `financial`, `marketing`). Colors based on stage `status`. Links to stage in `/validation/:id`. |
| **Metric Tile: Overall Score** | `GET /api/v1/products/{product_id}/validation/readiness` | Path: `product_id` | `ReadinessResponse` | `overall_score` (formatted with 2 decimals). |
| **Metric Tile: Passed Stages** | `GET /api/v1/products/{product_id}/validation/runs/latest` | Path: `product_id` | `ValidationRunDetailResponse` | Count of `results[].status === 'PASSED'` out of 6. |
| **Metric Tile: Competitors Tracked** | `GET /api/v1/products/{product_id}/competitors` | Path: `product_id` | `CompetitorListResponse` | `items.length` count of tracked competitors. |
| **Metric Tile: Missing Evidence & Risks** | `GET /api/v1/products/{product_id}/validation/runs/latest` | Path: `product_id` | `ValidationRunDetailResponse` | Count of stages with `INSUFFICIENT_EVIDENCE` + findings with code `MISSING_INPUT` or severity `critical`. |
| **Financial Snapshot Card** | `GET /api/v1/products/{product_id}/validation/runs/latest` | Path: `product_id` | `ValidationRunDetailResponse` (stage `financial` metrics) | `metrics.selling_price` (₹), `metrics.variable_cost_per_unit` (₹), `metrics.contribution_margin` (%), `metrics.break_even_units` (units). Derived customers/mo: `monthly_budget / expected_cac` (labelled "derived"). |
| **Competitor Price Preview** | `GET /api/v1/products/{product_id}/competitors` & `financial` metrics | Path: `product_id` | `CompetitorListResponse` | Chart comparing product selling price reference line against competitor observed prices (`analyses[0].price_observed`). |
| **Priority Actions (Top 5)** | `GET /api/v1/products/{product_id}/validation/runs/latest/recommendations` | Path: `product_id` | `RunRecommendationListResponse` (`items: RecommendationItemResponse[]`) | Top 5 items sorted by priority (`CRITICAL` > `HIGH` > `MEDIUM` > `LOW`), displaying `title`, `stage`, `action_type`, `suggested_value`. |
| **Recent Change History (Last 5)** | `GET /api/v1/products/{product_id}/versions` | Path: `product_id` | `ProductVersionListResponse` | Last 5 impact events/versions showing `version_number`, `changed_fields`, `created_at`. |

---

## Page 2: New Analysis Wizard (`/new-analysis`)

The wizard orchestrates creation through a 5-step idempotent sequential workflow with per-step retry:

| Step | Method & Endpoint | Request Type | Response Type | Field UI Mapping |
| :--- | :--- | :--- | :--- | :--- |
| **Step 1: Product Creation & Assumptions** | `POST /api/v1/products` | Body: `ProductCreate` | `ProductResponse` | `name`, `category`, `description`, `target_market`. `assumptions.customer`: `problem_statement`, `customer_interviews_count`, `willingness_to_pay_signal`, `target_customer`. `assumptions.product`: `features`, `unique_selling_points`, `differentiation_vs_competitors`. `assumptions.packaging`: `material`, `packaging_cost`. `assumptions.pricing`: `selling_price`, `target_margin_fraction`. `assumptions.costs`: `cogs_per_unit`, `shipping_cost_per_unit`, `packaging_cost`, `payment_fee_fraction`, `fixed_costs_total`, `other_variable_cost_per_unit`. `assumptions.marketing`: `monthly_budget`, `expected_cac`, `channels`, `expected_conversion_rate_fraction`. |
| **Step 2: Add Competitors** | `POST /api/v1/products/{product_id}/competitors` | Body: `CompetitorCreate` (`competitors: CompetitorItem[]`) | `CompetitorListResponse` | List of `{ name, website_url, notes }`. Returns generated competitor IDs. |
| **Step 3: Ingest Manual Price Evidence** | `POST /api/v1/internal/research-results` | Body: `ResearchIngestRequest` | `ResearchIngestResponse` | For competitors with observed prices: stores `analyses: [{ competitor_id, price_observed, summary: "User-entered competitor benchmark" }]`. |
| **Step 4: Start Research** | `POST /api/v1/products/{product_id}/research` | Path: `product_id` | `ResearchStartResponse` | Starts background research run (mock or AI provider). Returns `{ research_id, status, evidence_count }`. |
| **Step 5: Run Initial Validation** | `POST /api/v1/products/{product_id}/validate` | Path: `product_id` | `ValidationRunResponse` | Executes sequential 6-stage pipeline. On success, redirects to `/validation/{product_id}`. |

*Live Economics Estimate Panel (Step 2)*: Computed client-side with `decimal.js` using identical backend logic from `backend/app/services/finance.py`. Displays variable cost per unit, contribution per unit, margin %, and break-even units.

---

## Page 3: Validation Pipeline (`/validation/:id`)

| Feature / UI Component | Method & Endpoint | Request Type | Response Type | Field UI Mapping |
| :--- | :--- | :--- | :--- | :--- |
| **Pipeline Readiness Hero** | `GET /api/v1/products/{product_id}/validation/readiness` | Path: `product_id` | `ReadinessResponse` | `label`, `overall_score`, `blocking_stages`, `warning_stages`, `missing_stages`. |
| **Stage Cards (6 stages)** | `GET /api/v1/products/{product_id}/validation/runs/latest` | Path: `product_id` | `ValidationRunDetailResponse` (`results: StageResultDetailResponse[]`) | For each stage (`customer`, `competitor`, `product_packaging`, `pricing`, `financial`, `marketing`): `status`, `score`, `metrics`, `carried_forward_from` (shows "Reused from version N" chip). |
| **Stage Findings & Evidence** | `ValidationRunDetailResponse.results[].findings` | Embedded | `FindingResponse[]` | `code`, `severity` (info/warning/critical), `message`, `evidence_ids`. |
| **Missing Inputs CTA** | `FindingResponse` where `code.startsWith('MISSING_INPUT')` | Embedded | Field path | "Add this input" link to `/change-tracker/:id?field=...` prefilled with field path. |
| **Stage Recommendations** | `GET /api/v1/products/{product_id}/validation/runs/latest/recommendations` | Path: `product_id` | `RunRecommendationListResponse` | Recommendations matching `item.stage`. Shows `priority`, `action_type`, `suggested_value`. |
| **Re-Run Validation Action** | `POST /api/v1/products/{product_id}/validate` (or `revalidate`) | Path: `product_id` | `ValidationRunResponse` | ConfirmDialog trigger. On success invalidates cache and triggers toast. |

---

## Page 4: Competitor Intelligence (`/competitors/:id` - Phase 2)

| Feature / UI Component | Method & Endpoint | Request Type | Response Type | Field UI Mapping |
| :--- | :--- | :--- | :--- | :--- |
| **Competitor List & Cards** | `GET /api/v1/products/{product_id}/competitors` | Path: `product_id` | `CompetitorListResponse` | `items[].name`, `website_url`, `notes`, `analyses[].summary`, `strengths`, `weaknesses`, `price_observed`. |
| **Price Positioning Chart** | `GET /api/v1/products/{product_id}/competitors` + validation run competitor metrics | Path: `product_id` | Competitors + `StageResultDetailResponse.metrics` | Recharts bar/scatter chart with min/median/max price bands and selling price reference line. |
| **Run Research Action** | `POST /api/v1/products/{product_id}/research` | Path: `product_id` | `ResearchStartResponse` | ConfirmDialog to trigger fresh research run. |
| **Research Status Check** | `GET /api/v1/products/{product_id}/research/{research_id}` | Path: `product_id`, `research_id` | `ResearchStatusResponse` | Checks research progress and evidence count. |

---

## Page 5: Change Tracker (`/change-tracker/:id` - Phase 2)

| Feature / UI Component | Method & Endpoint | Request Type | Response Type | Field UI Mapping |
| :--- | :--- | :--- | :--- | :--- |
| **Assumption Baseline** | `GET /api/v1/products/{product_id}` | Path: `product_id` | `ProductDetailResponse` | Baseline assumption values for selected fields. |
| **Simulate Impact** | `POST /api/v1/products/{product_id}/validation/simulate` | Body: `SimulationRequest` (`overrides: { [key]: value }`) | `SimulationResponse` | Before vs after comparison for metrics, stage statuses, readiness label/score, and deltas. |
| **Apply as Version N+1** | `PATCH /api/v1/products/{product_id}/assumptions` | Body: `AssumptionsPatchRequest` (`patch: object, revalidate: true`) | `AssumptionsPatchResponse` | Applies change, increments version, updates affected stages, and displays impact event. |
| **Change Ledger** | `GET /api/v1/products/{product_id}/versions` | Path: `product_id` | `ProductVersionListResponse` | Chronological version ledger showing `from_version`, `to_version`, `changed_fields`, `created_at`. |
| **Version Compare** | `GET /api/v1/products/{product_id}/versions/{version_a}/compare/{version_b}` | Path: `product_id`, `version_a`, `version_b` | `VersionCompareResponse` | Side-by-side stage status and findings diff. |

---

## Page 6: Launch Report (`/reports/:id` - Phase 2)

| Feature / UI Component | Method & Endpoint | Request Type | Response Type | Field UI Mapping |
| :--- | :--- | :--- | :--- | :--- |
| **Fetch Report** | `GET /api/v1/products/{product_id}/reports` | Path: `product_id` | `ReportResponse[]` (or item) | Returns markdown and JSON dossier. If 404/empty, displays generate button. |
| **Generate Report** | `POST /api/v1/products/{product_id}/reports` | Path: `product_id` | `ReportResponse` | Generates official dossier report. |
| **Report Content** | `ReportResponse` | Path: `product_id` | `content` (structured object) & `markdown` (rendered markdown) | Executive verdict, unit economics, unresolved risks, strategic recommendations, EQI. |

---

## Error Handling & Status Codes

All non-2xx responses adhere to the standard error contract:
```json
{
  "error": {
    "code": "VALIDATION_ERROR | NOT_FOUND | BAD_STATE | ...",
    "message": "Human readable explanation",
    "details": [
      {
        "field": "costs.cogs_per_unit",
        "issue": "cogs_per_unit cannot be negative"
      }
    ],
    "request_id": "cfa07154-2d7c-48b5-8a09-5454858a8dde"
  }
}
```
- **422 Validation Errors**: Extracted by `ApiError` and mapped directly onto `react-hook-form` field errors via `setError(field, { message: issue })`.
- **409 Bad State**: (e.g. Generating report before validation is run) Displays contextual banner with action link (e.g., "Run validation first").
- **500 / Network Errors**: Displays `ErrorState` card with `message`, `request_id`, and explicit `Retry` button.
