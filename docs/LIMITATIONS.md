# LaunchTwin AI — System Limitations & Constraints

In the interest of engineering transparency and production integrity, this document catalogs known operational limitations, architectural boundaries, and scope constraints in LaunchTwin AI.

---

## 1. Web Scraping & JavaScript Execution
- **Static HTML Only**: `PageFetcher` uses standard HTTP/1.1 streaming requests (`httpx`) and parses static HTML using an event-based HTML parser.
- **No Headless Browser / JS Execution**: The scraper does not execute client-side JavaScript. Modern Single Page Applications (SPAs built with React, Vue, or Next.js) that render their prices dynamically via client-side JavaScript may return empty text or boilerplate loading skeletons, resulting in no scraped evidence.
- **Bot Mitigation / Cloudflare**: Competitor websites protected by advanced bot management (e.g. Cloudflare Turnstile, DataDome, Akamai) will return HTTP 403 or challenge pages. In these cases, users must input observed benchmark prices manually via `POST /api/v1/products/{id}/competitors`.

---

## 2. Authentication & Authorization
- **No Authentication**: Per initial design constraints and prototyping contract requirements, all API endpoints are unauthenticated.
- **Single-Tenant Assumption**: The platform currently operates as an internal or team-shared tool without role-based access control (RBAC), multi-tenancy, or user session isolation.

---

## 3. Financial Metrics Scope
- **No Payback Period Calculation**: While break-even sales volume, contribution margin, and fixed cost coverage are fully implemented with exact `Decimal` precision, an amortization or payback period timeline (e.g. "time to break-even in months") is **not implemented**.
- **No Customer Lifetime Value (LTV) Model**: The engine does not compute repeat purchase curves, retention cohorts, or multi-year LTV. The unit economics focus strictly on first-purchase unit contribution margin and break-even unit volume.
- **Simulation Overrides Scope**: Simulation accepts unit price, COGS, shipping, packaging, and payment fee overrides to drive financial recalculations. Marketing budget and conversion rate fields are accepted by schema but do not alter contribution margin.

---

## 4. Execution Model & Concurrency
- **Synchronous Pipeline Execution**: The 6-stage validation pipeline executes synchronously within the FastAPI request cycle. Typical execution completes in under 25 milliseconds, but batch operations should be monitored.
- **Per-Process In-Memory Rate Limiter**: The sliding-window rate limiter runs in-memory within the active Python process. If scaled across multiple worker processes or containers behind a load balancer without sticky sessions, each process maintains its own independent rate limit window. A distributed Redis backend is recommended for horizontal scaling.
- **Single Active Research Run**: To prevent database collisions and duplicate scraping jobs, the platform returns HTTP `409 Conflict` if a research run is triggered while another is active for that product. Stale runs (older than 900s) are automatically cleaned up.

---

## 5. Research Quality & Sample Directory Data
- **Research Quality Depends on Source Pages**: Although the system enforces strict JSON schemas, regex validation, and raw-text cross-checking, the qualitative strengths and weaknesses extracted by LLMs depend on the content, accuracy, and readability of the crawled competitor website.
- **Sample Directory Data Is Fictional**: Pre-seeded demo influencer records are fictional examples created for UI workflow demonstration and should not be used as real business contact intelligence.
- **Public Share Links (When Enabled)**: Any public share link or token is an unauthenticated URL; anyone in possession of the link can read the report snapshot.
