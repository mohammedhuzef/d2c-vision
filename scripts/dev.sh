#!/usr/bin/env bash
set -e

echo "======================================================"
echo " LaunchTwin AI - Starting Development Environment"
echo "======================================================"

# 1. Start Database
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    echo "[1/4] Starting PostgreSQL database via Docker..."
    docker compose up -d db
    export DATABASE_URL="postgresql+psycopg://postgres:postgres@localhost:5432/launchtwin"
else
    echo "[1/4] Docker is not available. Using local SQLite database (launchtwin.db)..."
    export DATABASE_URL="sqlite:///./launchtwin.db"
fi

# 2. Run Database Migrations
echo "[2/4] Running Alembic database migrations..."
python -m alembic upgrade head

# 3. Seed Demo Data
echo "[3/4] Seeding initial demo products and sample directory..."
python scripts/seed.py

# 4. Print URLs and Launch Server
echo ""
echo "======================================================"
echo " LaunchTwin Services are Ready!"
echo " - Frontend UI:        http://localhost:5173"
echo " - Backend API:        http://localhost:8000"
echo " - Interactive Docs:   http://localhost:8000/docs"
echo " - Health Check:       http://localhost:8000/health"
echo "======================================================"
echo ""
echo "[4/4] Launching Uvicorn backend server on http://127.0.0.1:8000..."
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
