# LaunchTwin AI — System Limitations & Constraints

In the interest of engineering transparency and production integrity, this document cataloges known operational limitations, architectural boundaries, and scope constraints in LaunchTwin AI v1.0.

---

## 1. Web Scraping & JavaScript Execution

- **Static HTML Only**: `PageFetcher` uses standard HTTP/1.1 streaming requests (`httpx`) and parses static HTML using an event-based HTML parser.
- **No Headless Browser / JS Execution**: The scraper does not run Chromium or execute client-side JavaScript. Modern Single Page Applications (SPAs built with React, Vue, or Next.js) that render their prices dynamically via client-side JavaScript may return empty text or boilerplate loading skeletons.
- **Bot Mitigation / Cloudflare**: Competitor websites protected by advanced bot management (e.g. Cloudflare Turnstile, DataDome, Akamai) will return HTTP 403 or challenge pages. In these cases, users must input observed benchmark prices manually via `POST /api/v1/products/{id}/competitors`.

---

## 2. Authentication & Authorization

- **No Auth in v1**: Per initial project specifications and rapid-prototyping contract requirements, all API endpoints are unauthenticated.
- **Single-Tenant Assumption**: The platform currently operates as an internal or team-shared tool without role-based access control (RBAC), multi-tenancy, or user session isolation.

---

## 3. Financial Metrics Scope (Claims Check Audit)

- **No Payback Period Calculation**:
  - *Audit Status*: **FALSE**
  - While break-even sales volume, contribution margin, and fixed cost coverage are fully implemented with exact `Decimal` precision, an amortization or payback period timeline (e.g. "time to break-even in months") is **not implemented** in v1.0.
- **Simulation Overrides for Marketing Budget & Conversion Rate**:
  - *Audit Status*: **PARTIAL**
  - The simulation schema accepts `marketing_budget_monthly` and `expected_conversion_rate_fraction` in the override payload. However, these fields are not wired into a dynamic visitor funnel model; they do not alter unit contribution or break-even volume. Only unit price, COGS, shipping, packaging, and payment fee overrides actively drive financial recalculations.

---

## 4. Execution Model & Task Concurrency

- **Synchronous Pipeline Execution**:
  - The 6-stage validation pipeline executes synchronously within the FastAPI request cycle. While typical execution completes in 15–20 milliseconds, very large product matrices or batch imports would benefit from an asynchronous task queue (e.g. Celery or ARQ).
- **Single Active Research Run**:
  - To prevent database collisions and duplicate scraping jobs, the platform returns HTTP `409 CONFLICT` if a research run is triggered while another is already running or pending for that product.

---

## 5. Database & Environment Nuances

- **PostgreSQL vs. SQLite**:
  - In production, PostgreSQL 16 enforces strict immutability triggers (`ON UPDATE OR DELETE RAISE EXCEPTION`) on historical snapshots.
  - In local development and lightweight CI testing, SQLite is supported as a fallback. However, SQLite lacks native stored procedures, so immutability checks are emulated via database triggers defined in test fixtures.
- **AI Research Output Variability**:
  - Although the system enforces strict JSON output schemas, regex validation, and raw-text cross-checking, the qualitative strengths and weaknesses extracted by LLMs depend on the content and tone of the crawled competitor website.
