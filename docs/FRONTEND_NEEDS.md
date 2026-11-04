# LaunchTwin AI — Frontend Needs Audit & Compatibility Matrix

## 1. Verified Backend Routes (from `contracts/openapi.json`)

| Method | Path | Status |
| :--- | :--- | :---: |
| `GET` | `/health` | EXISTS |
| `GET` | `/api/v1/health` | EXISTS |
| `GET` | `/api/v1/products` | EXISTS |
| `POST` | `/api/v1/products` | EXISTS |
| `GET` | `/api/v1/products/{product_id}` | EXISTS |
| `PATCH` | `/api/v1/products/{product_id}/assumptions` | EXISTS |
| `GET` | `/api/v1/products/{product_id}/competitors` | EXISTS |
| `POST` | `/api/v1/products/{product_id}/competitors` | EXISTS |
| `GET` | `/api/v1/products/{product_id}/competitors/summary` | EXISTS |
| `GET` | `/api/v1/products/{product_id}/evidence` | EXISTS |
| `GET` | `/api/v1/products/{product_id}/impact-events` | EXISTS |
| `GET` | `/api/v1/products/{product_id}/recommendations` | EXISTS |
| `GET` | `/api/v1/products/{product_id}/reports` | EXISTS |
| `POST` | `/api/v1/products/{product_id}/reports` | EXISTS |
| `GET` | `/api/v1/products/{product_id}/reports/latest` | EXISTS |
| `GET` | `/api/v1/products/{product_id}/reports/{report_id}` | EXISTS |
| `GET` | `/api/v1/products/{product_id}/research` | EXISTS |
| `POST` | `/api/v1/products/{product_id}/research` | EXISTS |
| `GET` | `/api/v1/products/{product_id}/research/{research_id}` | EXISTS |
| `POST` | `/api/v1/products/{product_id}/revalidate` | EXISTS |
| `POST` | `/api/v1/products/{product_id}/validation/revalidate` | ADDED |
| `POST` | `/api/v1/products/{product_id}/simulate` | EXISTS |
| `POST` | `/api/v1/products/{product_id}/validate` | EXISTS |
| `GET` | `/api/v1/products/{product_id}/validation` | EXISTS |
| `GET` | `/api/v1/products/{product_id}/validation/readiness` | EXISTS |
| `GET` | `/api/v1/products/{product_id}/validation/runs` | EXISTS |
| `POST` | `/api/v1/products/{product_id}/validation/runs` | EXISTS |
| `GET` | `/api/v1/products/{product_id}/validation/runs/latest` | EXISTS |
| `GET` | `/api/v1/products/{product_id}/validation/runs/latest/recommendations` | EXISTS |
| `GET` | `/api/v1/products/{product_id}/validation/runs/{run_id}` | EXISTS |
| `GET` | `/api/v1/products/{product_id}/validation/runs/{run_id}/recommendations` | EXISTS |
| `POST` | `/api/v1/products/{product_id}/validation/simulate` | EXISTS |
| `GET` | `/api/v1/products/{product_id}/versions` | EXISTS |
| `GET` | `/api/v1/products/{product_id}/versions/compare` | ADDED |
| `GET` | `/api/v1/products/{product_id}/versions/{version_a}/compare/{version_b}` | EXISTS |
| `GET` | `/api/v1/projects/{project_id}/validation/readiness` | EXISTS |
| `GET` | `/api/v1/projects/{project_id}/validation/runs` | EXISTS |
| `POST` | `/api/v1/projects/{project_id}/validation/runs` | EXISTS |
| `GET` | `/api/v1/projects/{project_id}/validation/runs/latest` | EXISTS |
| `GET` | `/api/v1/projects/{project_id}/validation/runs/latest/recommendations` | EXISTS |
| `GET` | `/api/v1/projects/{project_id}/validation/runs/{run_id}` | EXISTS |
| `GET` | `/api/v1/projects/{project_id}/validation/runs/{run_id}/recommendations` | EXISTS |
| `POST` | `/api/v1/projects/{project_id}/validation/simulate` | EXISTS |
| `GET` | `/api/v1/influencers` | EXISTS |
| `POST` | `/api/v1/influencers` | EXISTS |
| `POST` | `/api/v1/influencers/match-custom` | EXISTS |
| `GET` | `/api/v1/influencers/match/{product_id}` | EXISTS |
| `POST` | `/api/v1/influencers/{influencer_id}/pitch` | EXISTS |
| `PATCH` | `/api/v1/influencers/{influencer_id}/status` | EXISTS |
| `POST` | `/api/v1/internal/research-results` | EXISTS |
| `POST` | `/api/v1/internal/research/results` | EXISTS |

---

## 2. Frontend Data Source Classification & Audit Table

Classes:
- **A. EXISTING**: calls a backend route that exists in the contract.
- **B. MISSING**: calls a backend route or field that does not exist.
- **C. CLIENT-ONLY**: static/hardcoded data, localStorage, or client calculation.
- **D. FAKE-LOOKING**: hardcoded data that looks like factual claims (market sizes, suppliers, trend velocity).

| Page / Component | Route | Class | Endpoint or File | Field Mismatches | Status | Recommendation / Notes |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- |
| **Dashboard** (Product Detail) | `/`, `/dashboard` | **A** | `GET /api/v1/products/{product_id}` | None. ID parameter cleanly binds. | **DONE** | MAP TO EXISTING |
| **Dashboard** (Readiness Score) | `/`, `/dashboard` | **A** | `GET /api/v1/products/{product_id}/validation/readiness` | Frontend reads `overall_score` (number), matching contract. | **DONE** | MAP TO EXISTING |
| **Dashboard** (Latest Validation Run) | `/`, `/dashboard` | **A** | `GET /api/v1/products/{product_id}/validation/runs/latest` | Accesses `latestRun.stage_results` and `financial_snapshot`. | **DONE** | BUILT: Added `stage_results` and `financial_snapshot` property aliases on `ValidationRunDetailResponse`. |
| **Dashboard** (Competitor Benchmark List) | `/`, `/dashboard` | **A** | `GET /api/v1/products/{product_id}/competitors` | None. Reads `items` array. | **DONE** | MAP TO EXISTING |
| **Dashboard** (Hero HUD Pins) | `/`, `/dashboard` | **C** | `src/components/dashboard/HeroSection.tsx` | None. Pure visual UI overlay pins. | **SKIPPED** | LEAVE CLIENT-SIDE |
| **Dashboard** (Hero AI Assistant) | `/`, `/dashboard` | **D** | `src/components/dashboard/HeroAIAssistant.tsx` | Hard-coded simulated chat strings. No API call. | **SKIPPED** | LEAVE CLIENT-SIDE (mock chat) |
| **Dashboard** (Hero Analytics) | `/`, `/dashboard` | **C** | `src/components/dashboard/HeroAnalytics.tsx` | Static stats dropdown with simulated period switcher. | **SKIPPED** | LEAVE CLIENT-SIDE |
| **Dashboard** (Product Category Carousel) | `/`, `/dashboard` | **C** | `src/components/dashboard/ProductCategoryCarousel.tsx` | Static 10 category presets (`CATEGORIES` array). | **SKIPPED** | LEAVE CLIENT-SIDE |
| **Dashboard** (Market Insights Card) | `/`, `/dashboard` | **D** | `src/components/dashboard/MarketInsightsCard.tsx` | Hardcoded regional growth rates (+42% India, +28% USA). Already flagged as "Sample Data". | **SKIPPED** | LEAVE CLIENT-SIDE (never invent TAM/growth on backend) |
| **Dashboard** (Demand Trend Card) | `/`, `/dashboard` | **D** | `src/components/dashboard/DemandTrendCard.tsx` | Hardcoded 6-month synthetic points (34, 42, 39...). Already flagged as "Sample Data". | **SKIPPED** | LEAVE CLIENT-SIDE (never invent trend volumes on backend) |
| **Dashboard** (Trending Products Card) | `/`, `/dashboard` | **D** | `src/components/dashboard/TrendingProductsCard.tsx` | Hardcoded product growth rates (+82%) & sparklines. | **SKIPPED** | LEAVE CLIENT-SIDE |
| **Dashboard** (Top Opportunities Card) | `/`, `/dashboard` | **D** | `src/components/dashboard/TopOpportunitiesCard.tsx` | Hardcoded opportunity scores (92, 88, 84). | **SKIPPED** | LEAVE CLIENT-SIDE |
| **Dashboard** (Manufacturers Card) | `/`, `/dashboard` | **D** | `src/components/dashboard/ManufacturersCard.tsx` | Hardcoded OEM facilities with "Demo Listing" status. Mock contact submission timeout. | **SKIPPED** | LEAVE CLIENT-SIDE (sample directory) |
| **Dashboard** (Influencer Matchmaker Card) | `/`, `/dashboard` | **D** | `src/components/dashboard/InfluencerMatchmakerCard.tsx` | Hardcoded creator profiles (`FITWITHSNEHA`, etc.) with mock match calculator. | **DONE** | MAP TO EXISTING: `GET /api/v1/influencers/match/{product_id}` active with `is_sample: true` and disclaimer. |
| **Dashboard** (My Projects Card) | `/`, `/dashboard` | **C** | `src/components/dashboard/MyProjectsCard.tsx` | Reads `localStorage` (`getStoredProjects()`). | **SKIPPED** | LEAVE CLIENT-SIDE |
| **Dashboard** (Profit Calculator Card) | `/`, `/dashboard` | **C** | `src/components/dashboard/ProfitCalculatorCard.tsx` | Pure client-side arithmetic. | **SKIPPED** | LEAVE CLIENT-SIDE |
| **Dashboard** (Pipeline Strip) | `/`, `/dashboard` | **A** | `src/components/dashboard/PipelineStrip.tsx` | Expects `stageResults` prop; `DashboardPage` passes `latestRun.stage_results`. | **DONE** | BUILT: Aliased `stage_results` on validation run detail response. |
| **Dashboard** (Financial Snapshot Card) | `/`, `/dashboard` | **A** | `src/components/dashboard/FinancialSnapshotCard.tsx` | Reads `financialResult.metrics`; in `DashboardPage`, `financialResult` prop was omitted. | **DONE** | BUILT: Populated `financial_snapshot` in `ValidationRunDetailResponse` directly. |
| **Dashboard** (Competitor Price Chart) | `/`, `/dashboard` | **A** | `src/components/dashboard/CompetitorPriceChart.tsx` | Accepts `competitorMetrics: { competitor_price_min, median, max }`. | **DONE** | BUILT: Added endpoint `GET /api/v1/products/{product_id}/competitors/summary` (money as strings, 2 dp). |
| **New Analysis** (Step 1: Product Creation) | `/new-analysis` | **A** | `POST /api/v1/products` | Currency inputs sent as strings (`String(data.selling_price)`); backend schema accepts `anyOf: number, string, null`. | **DONE** | MAP TO EXISTING |
| **New Analysis** (Step 2: Add Competitors) | `/new-analysis` | **A** | `POST /api/v1/products/{product_id}/competitors` | None. Sent as `{ competitors: validComps }`. | **DONE** | MAP TO EXISTING |
| **New Analysis** (Step 3: Trigger Research) | `/new-analysis` | **A** | `POST /api/v1/products/{product_id}/research` | None. Empty POST trigger. | **DONE** | MAP TO EXISTING |
| **New Analysis** (Step 4: Execute Validation) | `/new-analysis` | **A** | `POST /api/v1/products/{product_id}/validate` | None. Empty POST trigger. | **DONE** | MAP TO EXISTING |
| **Validation Pipeline** (Legacy Validator) | `/validation` | **C** | `src/pages/ProductValidationPage.tsx` | Heuristic client score formula (`score = 50 + margin...`) saved to `localStorage`. No API called. | **NEEDS DECISION** | Legacy client-side playground. Decision needed: deprecate or redirect to `/new-analysis`. |
| **Validation Pipeline** (Pipeline Deep-Dive) | `/validation/:id` | **A** | `GET /api/v1/products/{product_id}` | None. Reads version and stage statuses. | **DONE** | MAP TO EXISTING |
| **Validation Pipeline** (Readiness Summary) | `/validation/:id` | **A** | `GET /api/v1/products/{product_id}/validation/readiness` | None. Reads `overall_score`, `label`, `blocking_stages`. | **DONE** | MAP TO EXISTING |
| **Validation Pipeline** (Latest Run Details) | `/validation/:id` | **A** | `GET /api/v1/products/{product_id}/validation/runs/latest` | Reads `latestRun.results`. Matches contract schema. | **DONE** | MAP TO EXISTING |
| **Validation Pipeline** (Recommendations) | `/validation/:id` | **A** | `GET /api/v1/products/{product_id}/validation/runs/latest/recommendations` | None. Reads `items` list (prioritized CRITICAL, HIGH, MEDIUM, LOW). | **DONE** | MAP TO EXISTING |
| **Validation Pipeline** (Revalidate Trigger) | `/validation/:id` | **A** | `POST /api/v1/products/{product_id}/revalidate` | None. Returns updated validation run record. | **DONE** | MAP TO EXISTING |
| **Competitor Intelligence** (Product Info) | `/competitors/:id` | **A** | `GET /api/v1/products/{product_id}` | None. | **DONE** | MAP TO EXISTING |
| **Competitor Intelligence** (Benchmarks) | `/competitors/:id` | **A** | `GET /api/v1/products/{product_id}/competitors` | None. Reads `items` array. | **DONE** | MAP TO EXISTING |
| **Competitor Intelligence** (Latest Run) | `/competitors/:id` | **A** | `GET /api/v1/products/{product_id}/validation/runs/latest` | None. Extracts competitor stage metrics. | **DONE** | MAP TO EXISTING |
| **Change Tracker** (Version List) | `/changes/:id` | **A** | `GET /api/v1/products/{product_id}/versions` | None. Displays immutable version cards. | **DONE** | MAP TO EXISTING |
| **Change Tracker** (Version Compare) | `/changes/:id` | **A** | `GET /api/v1/products/{product_id}/versions/{vA}/compare/{vB}` | Supported both via path params and `/versions/compare?version_a=&version_b=`. | **DONE** | MAP TO EXISTING |
| **Change Tracker** (Impact Event History) | `/changes/:id` | **A** | `GET /api/v1/products/{product_id}/impact-events` | None. Reads `changed_fields`, `rerun_run_id`. | **DONE** | MAP TO EXISTING |
| **Launch Report** (Latest Report Query) | `/reports/:id` | **A** | `GET /api/v1/products/{product_id}/reports/latest` | Visual Tab expects structured JSON content (`executive_summary`, `unit_economics`, etc.). | **DONE** | BUILT: Harmonized `content` JSON structure in `generate_launch_report`. |
| **Launch Report** (Report Generation Trigger) | `/reports/:id` | **A** | `POST /api/v1/products/{product_id}/reports` | Same as above. | **DONE** | BUILT: Same as above. |
| **Profit Calculator** | `/calculator` | **C** | `src/pages/ProfitCalculatorPage.tsx` | Pure client calculation with CSV export and comparison slider. | **SKIPPED** | LEAVE CLIENT-SIDE |
| **Market Analysis** | `/market-analysis` | **D** | `src/pages/MarketAnalysisPage.tsx` | Synthetic charts (market size, segment CAGR, demand velocity). Flagged as Sample Data. | **SKIPPED** | LEAVE CLIENT-SIDE |
| **Manufacturers Directory** | `/manufacturers` | **D** | `src/pages/ManufacturersPage.tsx` | Demo listings with simulated inquiry flow and localStorage favorites. | **SKIPPED** | LEAVE CLIENT-SIDE |
| **Influencer Database & Matcher** | `/influencers` | **A** | `GET /api/v1/influencers` | Uses seeded fictional demo creators carrying `is_sample: true` and disclaimer. | **DONE** | MAP TO EXISTING |
| **Influencer Product Matcher** | `/influencers` | **A** | `GET /api/v1/influencers/match/{product_id}` | Deterministic fit scoring & CAC calculations. `is_sample: true`. | **DONE** | MAP TO EXISTING |
| **Ad & Creative Tools** | `/ad-tools` | **C** | `src/pages/AdContentToolsPage.tsx` | Fixed templates with instant local string generation. | **SKIPPED** | LEAVE CLIENT-SIDE |
| **Trends & Insights** | `/trends` | **D** | `src/pages/TrendsInsightsPage.tsx` | Synthetic trend indices and demand velocity spikes. | **SKIPPED** | LEAVE CLIENT-SIDE |
| **Projects List** | `/projects` | **C** | `src/pages/ProjectsPage.tsx` | Uses `localStorage` (`getStoredProjects()`). | **SKIPPED** | LEAVE CLIENT-SIDE |
| **Team Management** | `/team` | **C** | `src/pages/TeamPage.tsx` | Hardcoded demo team members with local invite modal. | **SKIPPED** | LEAVE CLIENT-SIDE (no auth/teams in v1) |
| **Settings** | `/settings` | **C** | `src/pages/SettingsPage.tsx` | Saves non-secret profile in `localStorage`. API keys in `.env` only. | **SKIPPED** | LEAVE CLIENT-SIDE |
| **Notification Drawer** | Global Shell | **C** | `src/components/notifications/NotificationDrawer.tsx` | Static demo notifications in `useState`. | **SKIPPED** | LEAVE CLIENT-SIDE |
| **Upgrade Modal** | Global Shell | **C** | `src/components/modals/UpgradeModal.tsx` | Pure UI upsell modal with static plan tier comparisons. | **SKIPPED** | LEAVE CLIENT-SIDE |
| **Video Modal** | Global Shell | **C** | `src/components/modals/VideoModal.tsx` | Embedded video demo player. | **SKIPPED** | LEAVE CLIENT-SIDE |

---

## 3. Specific Route Presence Verification under `/api/v1/products/{id}/`

- `competitors/summary` -> **EXISTS** (`{competitor_price_min, competitor_price_median, competitor_price_max, competitors_count}` with money as strings, 2 dp)
- `validation/readiness` -> **EXISTS** (`{overall_score, label, blocking_stages, breakdown}`)
- `validation/runs/latest` -> **EXISTS** (including stage results under BOTH names `stage_results` and `results`, plus `financial_snapshot`)
- `validation/runs/latest/recommendations` -> **EXISTS** (priority order CRITICAL, HIGH, MEDIUM, LOW)
- `validation/simulate` -> **EXISTS** (stateless in-memory calculation, creates no run)
- `POST validate` -> **EXISTS**
- `POST revalidate` -> **EXISTS** (and `/validation/revalidate` alias ADDED)
- `PATCH assumptions with revalidate` -> **EXISTS** (supports both query param `?revalidate=true` and payload `{"revalidate": true}`)
- `versions and compare` -> **EXISTS** (supports both path `/versions/{a}/compare/{b}` and `/versions/compare?version_a=&version_b=`)
- `impact-events` -> **EXISTS**
- `research start, list and status` -> **EXISTS** (`POST /research`, `GET /research`, `GET /research/{id}`)
- `evidence list` -> **EXISTS** (`GET /evidence`)
- `reports create and latest` -> **EXISTS** (`POST /reports`, `GET /reports/latest`, `GET /reports/{id}`)
- At `/api/v1`: `GET /influencers` and `GET /influencers/match/{product_id}` -> **EXISTS** (fictional sample records, `is_sample: true`, disclaimer)

---

## 4. Environment Variables & CORS Expectations

### Frontend Expected Environment Variables
- `VITE_API_BASE_URL`: Base target URL for backend API v1 routes.
  - Set in `frontend/.env`: `VITE_API_BASE_URL=http://localhost:8000/api/v1`
  - Fallback in `frontend/src/api/client.ts`: `const RAW_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'`
  - Root base for `/health`: Derived automatically by stripping `/api/v1` (`http://localhost:8000/health`).

### Backend Matching CORS Origins
Configured in `backend/app/core/config.py` and `.env`:
- `CORS_ORIGINS`: `http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174,http://localhost:3000`
- Verified: Both Vite default dev port (`5173`) and alternative local ports are permitted with credentials enabled.

---

## 5. Items Requiring User Decision ("Needs My Decision")

1. **Legacy Product Validation Route (`/validation`)**:
   - `frontend/src/pages/ProductValidationPage.tsx` runs a client-only heuristic formula (`score = 50 + margin...`) that does not call the deterministic 6-stage backend pipeline.
   - *Decision*: Keep as an offline exploratory sandbox, or add a frontend route redirect pointing `/validation` to `/new-analysis`?

2. **Projects Page (`/projects`) Persistence**:
   - `frontend/src/pages/ProjectsPage.tsx` stores project cards in client `localStorage`.
   - *Decision*: Keep `localStorage` in v1, or map `/projects` to `GET /api/v1/products` and `POST /api/v1/products` in v2?

3. **Settings Preferences & Read-Only Status Endpoint**:
   - `frontend/src/pages/SettingsPage.tsx` stores founder details and theme preferences in `localStorage`. API keys live in `.env` only.
   - *Decision*: Keep preferences entirely in `localStorage`, or introduce a non-secret `workspace_settings` table and a `GET /api/v1/status` endpoint in v2?
