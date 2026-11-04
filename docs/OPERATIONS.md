# LaunchTwin AI — Production Operations & Maintenance Manual

This manual details deployment, environment configuration, database administration, disaster recovery, security policies, AI cost controls, and operational troubleshooting for LaunchTwin AI.

---

## 1. Environment Variable Reference

All backend configurations are centralized in `backend/app/core/config.py` and read from environment or `.env`:

| Variable | Default Value | Purpose | Secret? |
| :--- | :--- | :--- | :---: |
| `APP_ENV` / `ENVIRONMENT` | `development` | Runtime environment (`development`, `test`, `production`). Rejects SQLite or wildcard CORS in `production`. | No |
| `PROJECT_NAME` | `LaunchTwin AI` | System name displayed in logs, OpenAPI, and health reports. | No |
| `VERSION` | `1.0.0` | Semantic version string. | No |
| `API_V1_PREFIX` | `/api/v1` | URL prefix for REST API v1 routers. | No |
| `DATABASE_URL` | `sqlite:///./launchtwin.db` | Primary database connection string (PostgreSQL 16 in production). | No |
| `TEST_DATABASE_URL` | `""` | Optional isolated PostgreSQL URL for live integration test suite. | No |
| `LOG_LEVEL` | `INFO` | Logging threshold (`DEBUG`, `INFO`, `WARNING`, `ERROR`). | No |
| `CORS_ORIGINS` | `["http://localhost:5173", "http://localhost:3000"]` | Allowed CORS origins list. Wildcard `*` rejected in production. | No |
| `RESEARCH_PROVIDER` | `mock` | Market research provider engine (`mock`, `ai`). | No |
| `GEMINI_API_KEY` | `""` | Google Gemini API key for automated research text analysis. | **Yes** |
| `ANTHROPIC_API_KEY` | `""` | Anthropic Claude API key for automated research text analysis. | **Yes** |
| `LLM_MODEL` | `gemini-1.5-flash` | LLM model identifier used for extraction. | No |
| `ENABLE_DOCS` | `true` | Exposes `/docs`, `/redoc`, and `/openapi.json`. Disable in public production. | No |
| `RESEARCH_STALE_AFTER_SECONDS` | `900` | Timeout window after which hanging research runs are auto-marked `FAILED`. | No |
| `RATE_LIMIT_ENABLED` | `true` | Activates per-IP sliding window rate limiting. | No |
| `RATE_LIMIT_REQUESTS_PER_MINUTE` | `30` | Maximum allowed heavy requests per IP per minute before returning 429. | No |
| `MAX_REQUEST_BODY_BYTES` | `1048576` | Maximum allowed request payload size in bytes (1 MB). Returns 413 if exceeded. | No |

---

## 2. Starting the Platform

### Option A: Local Development (Without Docker)
```powershell
# 1. Activate Python virtual environment and run backend
cd backend
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload

# 2. In a separate terminal, launch the Vite frontend
cd frontend
npm install
npm run dev
```

### Option B: Docker Container Stack
```powershell
# Build API image and spin up PostgreSQL + FastAPI
docker compose build api
docker compose up -d db api

# Optional: Full stack including static frontend Nginx container
docker compose -f docker-compose.full.yml up --build -d
```

---

## 3. Database Administration & Migrations

### Applying Migrations (Alembic)
```powershell
# Check current migration heads (must be exactly ONE head)
alembic heads

# Apply all pending migrations to head
alembic upgrade head

# Rollback single migration step
alembic downgrade -1
```

### Backups & Restores (PostgreSQL)
```powershell
# Create timestamped database backup
pg_dump -U launchtwin -h localhost -d launchtwin -F c -b -v -f "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').dump"

# Restore database from backup
pg_restore -U launchtwin -h localhost -d launchtwin -v -c "backup_20261103.dump"
```

---

## 4. Health Monitoring

Monitor system and database health via the unauthenticated `/health` endpoint:
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/health"
```
**Healthy Response (HTTP 200)**:
```json
{
  "status": "healthy",
  "database": "connected",
  "version": "1.0.0"
}
```
If the database connection is lost, status returns `"degraded"` and database reports `"disconnected"`.

---

## 5. AI Cost & Abuse Controls

1. **Competitor Extraction Cap**:
   - Limits the number of competitors processed per product to prevent runaway crawler loops and token exhaustion.
2. **Per-IP Rate Limiting**:
   - Endpoints executing heavy AI operations (`POST /research`, `POST /reports`, `POST /simulate`) are guarded by `check_rate_limit`.
   - Returns HTTP 429 with `Retry-After: <seconds>` when `RATE_LIMIT_REQUESTS_PER_MINUTE` (default: 30) is exceeded.
3. **Payload Size Guard**:
   - `body_size_limit_middleware` blocks incoming payloads larger than `MAX_REQUEST_BODY_BYTES` (1 MB), returning HTTP 413.

---

## 6. Troubleshooting Common Issues

### Issue 1: Database Connection Failure (`database: disconnected`)
- **Symptoms**: `/health` returns `degraded`, or queries fail with connection refused.
- **Root Cause**: PostgreSQL service is down or connection string has wrong port/credentials.
- **Fix**: The backend automatically falls back to local SQLite (`sqlite:///./launchtwin.db`) in development. In production, check container status via `docker compose ps db` or test credentials with `psql -U launchtwin -h localhost`.

### Issue 2: Multiple Alembic Heads Conflict
- **Symptoms**: `alembic upgrade head` aborts with `Multiple head revisions are present`.
- **Root Cause**: Two developers created branches from the same parent migration.
- **Fix**: Run `alembic merge -m "merge conflicting heads" <rev1> <rev2>` and commit the new merge revision without modifying old migrations.

### Issue 3: CORS Errors in Browser
- **Symptoms**: Browser console blocks fetch requests with `Cross-Origin Request Blocked`.
- **Root Cause**: Frontend origin is not listed in `CORS_ORIGINS`.
- **Fix**: Add the frontend port or domain to `CORS_ORIGINS` in `.env` (e.g. `CORS_ORIGINS=["http://localhost:5173", "http://localhost:5174"]`). Note: Wildcard `*` is prohibited in production.

### Issue 4: Missing AI Key Falls Back to Mock
- **Symptoms**: Research returns canned competitor claims rather than live web data.
- **Root Cause**: `GEMINI_API_KEY` or `ANTHROPIC_API_KEY` is empty while `RESEARCH_PROVIDER=ai`.
- **Fix**: Provide a valid API key in `.env`. By design, the platform never crashes on missing keys; it gracefully falls back to `MockResearchProvider` and logs a warning.

### Issue 5: Stuck or Dangling Research Run
- **Symptoms**: Starting research returns HTTP `409 Conflict` claiming a run is already active.
- **Root Cause**: The background worker process was restarted or interrupted during execution.
- **Fix**: The system auto-recovers. Runs older than `RESEARCH_STALE_AFTER_SECONDS` (900s) are automatically marked `FAILED` upon server restart or on the next research trigger. To force immediate reset, trigger a server restart.
