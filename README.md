# LaunchTwin AI — Deterministic Product Launch Readiness Platform

LaunchTwin AI is an automated launch validation platform that tests D2C product assumptions against live market benchmarks and deterministic unit economics before capital is deployed. It couples AI-driven market intelligence with strict mathematical rules to calculate break-even targets, stage readiness scores, and immutable versioned impact histories.

---

## 🏛️ Architecture in Plain Words

LaunchTwin strictly separates **evidence extraction** from **decision making**:
- **AI only extracts evidence**: The AI research provider crawls competitor websites and uses LLMs exclusively to extract verified claims, observed prices, strengths, and weaknesses. The AI **never** decides whether a product passes or fails, and **never** calculates a score, margin, or financial metric.
- **Python rules decide every status and number**: Pure Python domain modules calculate unit economics (variable costs, contribution margins, break-even units) using exact `Decimal` arithmetic. Deterministic rules evaluate sequential validation stages (`customer`, `competitor`, `product_packaging`, `pricing`, `financial`, `marketing`) and derive readiness verdicts (`READY`, `READY_WITH_WARNINGS`, `NOT_READY`, `INSUFFICIENT_EVIDENCE`).

```mermaid
graph TD
    UI[Frontend: React 18 + Vite] -->|JSON REST API| API[FastAPI Web Layer: app/api/v1]
    API --> ORM[Data Layer: SQLAlchemy 2.0 + PostgreSQL / SQLite]
    
    subgraph Research Engine
        API -->|Trigger| RP[Research Provider]
        RP -->|Mock Mode| MRP[MockResearchProvider]
        RP -->|AI Mode| ARP[AIResearchProvider]
        ARP -->|Safe HTTP/1.1| PF[PageFetcher: SSRF Guarded]
        ARP -->|REST| LLM[LLMClient: Gemini / Anthropic]
        PF -->|Extracted Text| LLM
        LLM -->|Claims & Prices Only| EV[Evidence Store: research_evidence]
    end

    subgraph Deterministic Core Pure Python
        API -->|Validate / Revalidate| VO[Validation Orchestrator]
        VO --> FE[Finance Engine: Decimal Math]
        VO --> SP[Sequential 6-Stage Pipeline]
        VO --> RE[Readiness Engine: 0-100 Score]
        VO --> RG[Recommendation Generator]
        VO --> IT[Impact Tracker: Stage Diffs & Carry Forward]
        EV -.->|Read Verified Evidence| SP
    end
```

---

## 🚀 Quick Start

### 1. Quick Start with Docker
```bash
# 1. Start the PostgreSQL 16 database
docker compose up -d db

# 2. Run database migrations to head
alembic upgrade head

# 3. Seed demo products (Healthy Vector A and Weak Vector B)
python scripts/seed.py

# 4. Start the backend API service
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```
*(Or launch both database and API together via `docker compose up -d`).*

### 2. Local Setup (Standard Python Virtualenv)
```bash
# 1. Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 2. Install pinned dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env

# 4. Run database migrations
alembic upgrade head

# 5. Seed database
python scripts/seed.py

# 6. Start development server
uvicorn backend.app.main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend

# Install frontend dependencies
npm install

# Start frontend development server (defaults to http://localhost:5173)
npm run dev
```

To configure the API target for the frontend, set `VITE_API_BASE_URL` in `frontend/.env` (default is `http://localhost:8000/api/v1`):
```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## ⚙️ Environment Variables

Every configuration setting is validated via Pydantic in `backend/app/core/config.py`:

| Variable Name | Default Value | Purpose | Secret? |
| :--- | :--- | :--- | :---: |
| `DATABASE_URL` | `postgresql+psycopg://postgres:postgres@localhost:5432/launchtwin` | Primary database connection URL (PostgreSQL in prod, SQLite fallback in local dev) | Yes |
| `ENVIRONMENT` | `development` | Deployment environment (`development`, `testing`, `production`) | No |
| `LOG_LEVEL` | `INFO` | Application logging verbosity (`DEBUG`, `INFO`, `WARNING`, `ERROR`) | No |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Comma-separated list of allowed browser origins | No |
| `RESEARCH_PROVIDER` | `mock` | Market research provider mode: `mock` (deterministic canned data) or `ai` (live web fetch + LLM) | No |
| `LLM_PROVIDER` | `gemini` | LLM service provider for research (`gemini` or `anthropic`) | No |
| `LLM_API_KEY` | `None` | Authentication key for Google Gemini or Anthropic API | **Yes** |
| `LLM_MODEL` | `gemini-1.5-flash` | LLM model identifier | No |
| `LLM_TIMEOUT_SECONDS` | `30` | Network timeout for LLM inference requests | No |
| `RESEARCH_FETCH_TIMEOUT_SECONDS` | `10` | HTTP request timeout when scraping competitor pages | No |
| `RESEARCH_MAX_PAGE_BYTES` | `1048576` (1MB) | Maximum allowed HTTP response body size for scraped pages | No |
| `RESEARCH_MAX_TEXT_LENGTH` | `50000` | Maximum character length of extracted text sent to LLM | No |
| `RESEARCH_MAX_REDIRECTS` | `3` | Maximum allowed redirect hops before aborting scrape | No |
| `RESEARCH_USER_AGENT` | `LaunchTwinBot/1.0 (+https://launchtwin.example.com/bot)` | HTTP User-Agent string sent during live page fetching | No |
| `RESEARCH_MAX_COMPETITORS` | `5` | Maximum number of competitors processed per research run | No |
| `RESEARCH_TIME_BUDGET_SECONDS` | `60` | Total time budget allocated to an AI research execution run | No |
| `RESEARCH_CONFIDENCE_CAP` | `0.80` | Maximum confidence score assignable to AI-derived evidence | No |
| `RESEARCH_MAX_EVIDENCE_PER_COMPETITOR` | `10` | Maximum evidence rows captured per competitor | No |
| `RESEARCH_MAX_STRENGTHS` | `10` | Maximum strength bullet points extracted per competitor | No |
| `RESEARCH_MAX_WEAKNESSES` | `10` | Maximum weakness bullet points extracted per competitor | No |

---

## 🧪 Running Tests

### 1. Default SQLite Mode (Fast, Full Pipeline & Logic)
```bash
python -m pytest -q
```
Runs 310 unit, contract, cross-layer invariant, and integration tests in ~2 seconds. The 5 PostgreSQL-gated tests are cleanly skipped.

### 2. PostgreSQL Mode (Triggers & Concurrency Verification)
Requires a live PostgreSQL database running:
```bash
# Set connection string and execute
export TEST_DATABASE_URL="postgresql+psycopg://postgres:postgres@localhost:5432/launchtwin_test"
python -m pytest -q
```
*(On Windows PowerShell: `$env:TEST_DATABASE_URL="postgresql+psycopg://postgres:postgres@localhost:5432/launchtwin_test"; python -m pytest -q`)*.

---

## 📡 API Endpoint Reference

All routes are mounted under `/api/v1` (with root aliases for `/health` and `/docs`):

### Products & Assumptions
- `POST /api/v1/products` — Create a new product and initial Vector A assumptions
- `GET /api/v1/products` — List all products with latest readiness scores and versions
- `GET /api/v1/products/{id}` — Retrieve full product details, assumptions, and validation summary
- `PATCH /api/v1/products/{id}/assumptions` — Apply partial assumption diffs, create immutable version, and trigger selective revalidation

### Competitors & Benchmarks
- `POST /api/v1/products/{id}/competitors` — Add competitor benchmarks with observed prices
- `GET /api/v1/products/{id}/competitors` — List competitors and price corridors

### Market Research & Evidence
- `POST /api/v1/products/{id}/research` — Trigger automated market research (returns 409 if run active)
- `GET /api/v1/products/{id}/research` — List research run history for a product
- `GET /api/v1/products/{id}/research/{run_id}` — Get research run status, competitor claims, and token metrics
- `GET /api/v1/products/{id}/evidence` — List verified evidence rows with confidence scores and content hashes
- `POST /api/v1/internal/research/results` — Direct ingest endpoint for research worker jobs

### Validation & Recommendations
- `POST /api/v1/products/{id}/validate` — Execute full 6-stage validation pipeline
- `POST /api/v1/products/{id}/revalidate` — Re-evaluate only affected stages and carry forward clean stages
- `GET /api/v1/products/{id}/validation` — Retrieve full validation results for the current version
- `GET /api/v1/products/{id}/recommendations` — Get prioritized, actionable recommendations (`CRITICAL`, `HIGH`, etc.)

### Simulation & Versions
- `POST /api/v1/products/{id}/simulate` — Real-time in-memory what-if scenario calculator
- `GET /api/v1/products/{id}/versions` — List immutable product version history
- `GET /api/v1/products/{id}/versions/{v1}/compare/{v2}` — Side-by-side version comparison with exact deltas
- `GET /api/v1/products/{id}/impact-events` — Audit log of assumption changes and stage invalidations

### Reports & System
- `POST /api/v1/products/{id}/reports` — Generate comprehensive JSON and Markdown launch report
- `GET /api/v1/products/{id}/reports` — List generated reports for product
- `GET /api/v1/products/{id}/reports/latest` — Get latest generated report
- `GET /api/v1/health` (and `GET /health`) — Service and database health probe

---

## 🔬 Research Modes & Fallbacks

LaunchTwin supports two research provider modes configured via `RESEARCH_PROVIDER`:

1. **`mock` (Default)**:
   - Uses `MockResearchProvider`.
   - Requires zero API keys and makes no external network requests.
   - Generates realistic, reproducible competitor claims and price benchmarks for fast testing.
2. **`ai`**:
   - Uses `AIResearchProvider`.
   - Crawls competitor URLs using `PageFetcher` with strict anti-SSRF protections.
   - Uses `LLMClient` (Gemini or Anthropic) to extract claims, observed prices, and strengths/weaknesses.
   - **Zero-Key Fallback**: If `RESEARCH_PROVIDER=ai` but `LLM_API_KEY` is not provided, the service logs a warning and **automatically falls back to `MockResearchProvider`** so the application never crashes.

---

## 🛠️ Troubleshooting

| Issue | Root Cause | Solution |
| :--- | :--- | :--- |
| **Database connection refused (`localhost:5432`)** | PostgreSQL container is stopped or offline. | Run `docker compose up -d db` or start your local PostgreSQL service. For unit testing, SQLite is used automatically if Postgres is unreachable. |
| **Alembic head conflict (`Multiple heads present`)** | Multiple unmerged migration branches exist. | Run `alembic heads`. Ensure only a single head exists (`0004_frontend_readiness_gaps`). Merge any divergent migrations. |
| **CORS error in browser** | Frontend origin is missing from `CORS_ORIGINS`. | Add your frontend origin (e.g. `http://localhost:5173`) to `CORS_ORIGINS` in `.env` and restart the backend. |
| **Missing API key falls back to mock** | `RESEARCH_PROVIDER=ai` is set without `LLM_API_KEY`. | Set `LLM_API_KEY=your_key` in `.env`. If running without a key, keep `RESEARCH_PROVIDER=mock`. |
| **Page returns no usable evidence** | Target competitor website is built with heavy client-side JavaScript (e.g. React/SPA) or returned empty text. | `PageFetcher` parses static HTML. For JavaScript-rendered pages, manually input observed prices via `POST /competitors` or provide a static benchmark page. |

---

## 📂 Repository Layout

```
.
├── backend/
│   ├── alembic/                # Database migrations (0001 through 0004)
│   ├── app/
│   │   ├── api/v1/             # REST endpoints (products, research, validation, etc.)
│   │   ├── core/               # config, database engine, error handlers, logging
│   │   ├── models/             # SQLAlchemy 2.0 ORM models
│   │   ├── schemas/            # Pydantic v2 schemas and request/response models
│   │   ├── services/
│   │   │   ├── finance.py      # Pure Decimal unit economics engine
│   │   │   ├── readiness.py    # Deterministic readiness score algorithm
│   │   │   ├── llm_client.py   # REST-based Gemini & Anthropic client
│   │   │   ├── page_fetcher.py # SSRF-hardened streaming HTTP page fetcher
│   │   │   ├── ai_research_provider.py # AI competitor research pipeline
│   │   │   ├── research_provider.py    # Protocol + MockResearchProvider
│   │   │   └── validation/     # 6-stage pipeline, rules config, simulation
│   └── tests/
│       ├── integration/        # End-to-end flows, Postgres triggers, API tests
│       └── unit/               # Deterministic unit tests (finance, stages, SSRF)
├── contracts/
│   ├── openapi.json            # Authoritative OpenAPI 3.1 specification
│   └── examples/               # Example request and response JSON envelopes
├── frontend/                   # React 18 + Vite frontend client
├── scripts/
│   ├── e2e_smoke.py            # 10-stage end-to-end smoke verification
│   ├── export_openapi.py       # OpenAPI contract synchronization tool
│   ├── seed.py                 # Idempotent database seeder (Healthy & Weak products)
│   └── verify_all.py           # Automated health, test, and contract check
├── docker-compose.yml          # PostgreSQL and API container service definitions
├── Dockerfile                  # Production container definition
└── requirements.txt            # Pinned Python package dependencies
```

---

## 🧪 E2E Smoke Testing & Database Hygiene

`scripts/e2e_smoke.py` validates the complete 10-stage product lifecycle from creation through report generation.

### Guarding Seeded Demo Data
To prevent polluting seeded demo products (`TerraFlask 32oz Tumbler` and `Basic Budget Bottle`), `scripts/e2e_smoke.py` automatically detects and **refuses** to execute against the demo database by default.

### Running on a Throwaway Database (Recommended)
```bash
# PowerShell:
$env:DATABASE_URL="sqlite:///./smoke.db"
alembic upgrade head
python scripts/e2e_smoke.py

# Bash:
DATABASE_URL=sqlite:///./smoke.db alembic upgrade head
DATABASE_URL=sqlite:///./smoke.db python scripts/e2e_smoke.py
```

### Forcing Execution on the Demo Database
If you intentionally want to execute smoke tests on the live demo database:
```bash
python scripts/e2e_smoke.py --allow-demo-db
```
All smoke entities are prefixed with `[SMOKE-TEST]` for unmistakable audit traceability.

---

## 🤝 Contribution Rules

1. **Branching & Pull Requests**:
   - Create focused feature branches from `main` (`feature/your-feature-name`).
   - Open PRs against `main` with clear descriptions of rationale and test verification.
2. **Never Weaken an Assertion**:
   - Never remove, weaken, or skip an existing test. Fix genuine code issues, not tests.
3. **Additive Only**:
   - Never rename or remove existing API routes, schema fields, or enum values. Frontends depend on the OpenAPI contract.
4. **Regenerate Contracts**:
   - If you modify any FastAPI schemas or endpoints, always run:
     ```bash
     python scripts/export_openapi.py
     ```
   - Commit the updated `contracts/openapi.json`. CI validates that the code matches the specification character-for-character.