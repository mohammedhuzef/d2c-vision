# LaunchTwin AI — Backend & Deterministic Validation Engine

LaunchTwin AI is an AI-powered product-launch validation platform. This repository contains the backend and deterministic validation engine (Member 2 of 3).

- **Member 1 (Frontend)**: React client consuming OpenAPI contracts and sample data.
- **Member 2 (Backend)**: Core FastAPI service, PostgreSQL database schema, deterministic financial engine, sequential 6-stage validation pipeline, change impact tracker, and report generation engine.
- **Member 3 (Research AI)**: AI research pipeline that ingests competitor intelligence via the pluggable `ResearchProvider` interface or direct internal HTTP ingest.

---

## 🏛️ Non-Negotiable Architecture Principles

1. **Deterministic Validation**: Stage statuses, financial metrics, and readiness scores are derived purely from Python rules. AI output is never used to decide status or compute numbers—AI contributes evidence excerpts and qualitative weakness text only.
2. **Evidence-Backed Findings**: Findings cite `evidence_ids`. If a rule requires evidence that is missing, the stage status is marked `INSUFFICIENT_EVIDENCE` (never fabricated or guessed).
3. **Money is Decimal**: Exact `Decimal` arithmetic in Python and `NUMERIC(14,2)` in PostgreSQL. Never float for currency. Round half-up to 2 decimal places for currency, and rates/margins rounded to 4 decimal places (e.g., `0.5400` = 54%).
4. **Never Crash on Bad Input**: Invalid, partial, or incomplete assumptions produce structured issues and non-blocking results, never uncaught exceptions or 500s.
5. **Immutable Versions**: Every assumption modification creates a new immutable product version snapshot (`product_versions`). Old versions and previous results are preserved.
6. **Contract-First**: OpenAPI schemas (`contracts/openapi.json`) and request/response examples (`contracts/examples/`) are defined first. CI fails automatically if `openapi.json` is stale.
7. **Offline-First & Zero-Key Operation**: Operates through a pluggable `ResearchProvider` Protocol with a `MockResearchProvider` returning realistic canned competitor evidence. The entire suite runs offline with zero external network or AI API keys.
8. **Simple First**: Synchronous execution in v1 with clean extension points for asynchronous task queues in v2.

---

## 📂 Repository Layout

```
.
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI application entrypoint & middleware
│   │   ├── core/                       # config, database session, logging, errors
│   │   ├── models/                     # SQLAlchemy 2.0 typed models
│   │   ├── schemas/                    # Pydantic v2 schemas per resource
│   │   ├── api/v1/                     # REST API route handlers
│   │   └── services/
│   │       ├── research_provider.py    # ResearchProvider Protocol + MockResearchProvider
│   │       ├── finance.py              # Pure Decimal unit economics engine
│   │       ├── dependencies.py         # Single source of truth dependency map & transitive closure
│   │       ├── impact_tracker.py       # Assumption diffing, selective stage reruns & impact events
│   │       ├── versioning.py           # Snapshotting & version comparison
│   │       ├── readiness.py            # Readiness score (0-100) & verdict determination
│   │       ├── reports.py              # JSON + Markdown report generator
│   │       └── validation/
│   │           ├── base.py             # Stage ABC, StageContext, StageResult, Finding
│   │           ├── rules_config.py     # Centralized rule thresholds & weights
│   │           ├── orchestrator.py     # Sequential execution & carried-forward state
│   │           └── stages/             # customer, competitor, product_packaging,
│   │                                   # pricing, financial, marketing
│   ├── alembic/                        # Migration scripts (0001 baseline)
│   ├── seed/
│   │   └── demo_product.json           # Realistic Day 1 demo product & competitor evidence
│   └── tests/
│       ├── unit/                       # Unit tests (health, contracts, finance, stages, impact, seed)
│       └── integration/                # End-to-end integration lifecycle test
├── contracts/
│   ├── openapi.json                    # Generated, committed OpenAPI 3.1 specification
│   └── examples/                       # Request & response JSON pairs per endpoint
├── scripts/
│   ├── export_openapi.py               # Generates and validates contracts/openapi.json
│   └── seed.py                         # Seeds database with demo product & initial validation
├── docker-compose.yml                  # PostgreSQL 16 Alpine + API container definitions
├── Dockerfile                          # Production container build
├── requirements.txt                    # Python dependencies
├── .env.example                        # Documented environment template
└── README.md
```

---

## 🚀 Quickstart

### Prerequisites
- Python 3.11+
- Docker & Docker Compose (optional for local development; required for containerized deployment)

### 1. Running with Docker Compose
```bash
# Start PostgreSQL and API service
docker compose up -d

# Check API health
curl http://localhost:8000/health
```

### 2. Local Setup (Standard Python)
```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Setup environment
cp .env.example .env

# 3. Run database migrations
alembic upgrade head

# 4. Seed demo product data
python scripts/seed.py

# 5. Start dev server
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```
- API Base URL: `http://localhost:8000`
- Interactive Swagger UI: `http://localhost:8000/docs`
- Interactive ReDoc: `http://localhost:8000/redoc`

---

## ⚙️ Environment Variables (`.env`)

| Variable | Type | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | string | `postgresql+psycopg://postgres:postgres@localhost:5432/launchtwin` | PostgreSQL connection string |
| `RESEARCH_PROVIDER` | string (`mock` \| `ai`) | `mock` | Active competitor research provider |
| `ENVIRONMENT` | string | `development` | Environment name (`development`, `testing`, `production`) |
| `LOG_LEVEL` | string | `INFO` | Logging level (`DEBUG`, `INFO`, `WARNING`, `ERROR`) |
| `CORS_ORIGINS` | list | `["*"]` | Allowed CORS origins for frontend integration |

---

## 📡 API Endpoints Reference

All endpoints are prefixed with `/api/v1` (except `/health`). Every non-2xx response follows the standard structured error format:
```json
{
  "error": {
    "code": "VALIDATION_ERROR | NOT_FOUND | CONFLICT | BAD_STATE | INTERNAL",
    "message": "Human readable message",
    "details": [{"field": "pricing.selling_price", "issue": "must be > 0"}],
    "request_id": "00000000-0000-0000-0000-000000000000"
  }
}
```

### Products & Assumptions
| Method | Path | Summary | Success Status |
|---|---|---|---|
| `POST` | `/api/v1/products` | Create product and version 1 immutable snapshot | `201 Created` |
| `GET` | `/api/v1/products` | List products with pagination (`limit`, `offset`) | `200 OK` |
| `GET` | `/api/v1/products/{id}` | Get product, current assumptions, and stage status summary | `200 OK` |
| `PATCH` | `/api/v1/products/{id}/assumptions` | Patch assumptions, trigger impact analysis, and optionally revalidate | `200 OK` |

### Competitors
| Method | Path | Summary | Success Status |
|---|---|---|---|
| `POST` | `/api/v1/products/{id}/competitors` | Add competitor(s) with case-insensitive deduplication | `201 Created` |
| `GET` | `/api/v1/products/{id}/competitors` | List competitors with analyses and evidence counts | `200 OK` |

### Competitor Research (Member 3 Interface)
| Method | Path | Summary | Success Status |
|---|---|---|---|
| `POST` | `/api/v1/products/{id}/research` | Trigger research provider (stores evidence & analyses) | `202 Accepted` |
| `GET` | `/api/v1/products/{id}/research/{research_id}` | Check status and item counts for a research run | `200 OK` |
| `POST` | `/api/v1/internal/research-results` | Ingest research data from AI pipeline (idempotent by hash) | `201 Created` |

### Validation Engine & Recommendations
| Method | Path | Summary | Success Status |
|---|---|---|---|
| `POST` | `/api/v1/products/{id}/validate` | Run all 6 sequential validation stages on current version | `200 OK` |
| `GET` | `/api/v1/products/{id}/validation` | Get latest or version-specific validation run results | `200 OK` |
| `POST` | `/api/v1/products/{id}/revalidate` | Re-run affected stages or explicitly requested stages | `200 OK` |
| `GET` | `/api/v1/products/{id}/recommendations` | Get prioritized actionable recommendations | `200 OK` |

### Versioning & Impact
| Method | Path | Summary | Success Status |
|---|---|---|---|
| `GET` | `/api/v1/products/{id}/versions` | List immutable versions with change summaries | `200 OK` |
| `GET` | `/api/v1/products/{id}/versions/{a}/compare/{b}` | Per-stage comparison (status, metric deltas, findings diff) | `200 OK` |

### Launch Readiness Reports
| Method | Path | Summary | Success Status |
|---|---|---|---|
| `POST` | `/api/v1/products/{id}/reports` | Generate report (JSON + Markdown) for latest validated version | `201 Created` |
| `GET` | `/api/v1/products/{id}/reports/{report_id}` | Retrieve report by ID | `200 OK` |

### Health Check
| Method | Path | Summary | Success Status |
|---|---|---|---|
| `GET` | `/health` | Service and database connectivity health status | `200 OK` |

---

## 🤖 How Member 3 (AI / Competitor Research) Integrates

Member 3 can integrate using either of two decoupled methods without touching validation logic:

### Option A: HTTP Ingest Endpoint (Microservice / Script)
Member 3's pipeline runs independently and posts research evidence directly to:
```http
POST /api/v1/internal/research-results
Content-Type: application/json

{
  "product_id": "11111111-1111-1111-1111-111111111111",
  "competitor_id": "22222222-2222-2222-2222-222222222221",
  "evidence": [
    {
      "source_type": "pricing_page",
      "source_url": "https://competitor.com/product",
      "title": "Competitor Flagship Page",
      "excerpt": "Observed selling price $44.95 with free shipping.",
      "confidence": 0.95,
      "data": {"price": 44.95}
    }
  ],
  "analyses": [
    {
      "competitor_id": "22222222-2222-2222-2222-222222222221",
      "summary": "Incumbent category leader.",
      "strengths": ["Brand recognition", "Strong retail presence"],
      "weaknesses": ["Heavy weight", "Higher pricing"],
      "price_observed": 44.95,
      "produced_by": "ai-v1"
    }
  ]
}
```
- **Idempotency Guarantee**: The endpoint calculates a SHA-256 hash of `(source_url + excerpt)`. Re-submitting identical evidence does not create duplicate database rows.

### Option B: Code-Level ResearchProvider Implementation
In `backend/app/services/research_provider.py`, implement the `ResearchProvider` Protocol:
```python
class RealAIResearchProvider:
    def research(self, product: ProductSummary, competitors: list[CompetitorSummary]) -> ResearchOutput:
        # Member 3's LLM / scraping logic here
        return ResearchOutput(evidence=[...], analyses=[...])
```
Then set `RESEARCH_PROVIDER=ai` in `.env`.

---

## 💻 How Member 1 (Frontend) Integrates

1. **OpenAPI Specification**: Up-to-date schema is in `contracts/openapi.json`.
2. **Endpoint Examples**: Every endpoint has a verified JSON request/response pair in `contracts/examples/`.
3. **Seed Data**: Run `python scripts/seed.py` to immediately obtain a fully validated product with 2 competitors, 4 research evidence items, and a generated report.
4. **Interactive API Explorer**: Available at `http://localhost:8000/docs`.

---

## 🧪 Testing Suite & CI Rules

### Running the Test Suite

LaunchTwin AI supports dual test execution modes: fast in-memory SQLite (default) and full real PostgreSQL mode.

#### 1. Fast SQLite Default
Runs all unit and integration tests using in-memory SQLite. Tests requiring PostgreSQL-specific engine behavior (immutability trigger, `SELECT ... FOR UPDATE` concurrency, functional unique index on `lower(name)`, `UUID[]` and `JSONB` native operators) are automatically skipped with clear skip reasons:
```bash
# Fast test run (SQLite default)
pytest -q
```

#### 2. Full PostgreSQL Test Suite
To run the full test suite against real PostgreSQL (including Alembic migration upgrade/downgrade against Postgres, concurrency threads, immutability triggers, and JSONB/UUID array semantics), set `TEST_DATABASE_URL`:
```bash
# Full test suite against PostgreSQL
TEST_DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/launchtwin pytest -q
```

#### Running Specific Test Modules
```bash
pytest -q backend/tests/unit/test_finance.py
pytest -q backend/tests/unit/test_stages_and_readiness.py
pytest -q backend/tests/unit/test_dependencies_and_impact.py
pytest -q backend/tests/integration/test_end_to_end_flow.py
pytest -q backend/tests/integration/test_postgres_features.py
```

### Contract-First CI Guard
If any route signature, schema, or endpoint parameter is modified, `contracts/openapi.json` must be regenerated:
```bash
python scripts/export_openapi.py
```
`backend/tests/unit/test_contracts.py` runs in CI and will fail if `contracts/openapi.json` does not match the active FastAPI specification.

### Branching and Pull Request Rules
- Always create feature branches (e.g., `feat/`, `fix/`).
- Never push float values for financial arithmetic.
- Maintain deterministic validation: AI output must not determine validation scores, thresholds, or statuses.
- Ensure `pytest -q` is 100% green before opening PRs.
#   d 2 c - v i s i o n  
 