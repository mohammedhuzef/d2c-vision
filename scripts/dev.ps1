# LaunchTwin AI - Local Development Startup Script (Windows PowerShell)

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host " LaunchTwin AI - Starting Development Environment" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

# 1. Start Database (PostgreSQL if Docker is available, SQLite fallback)
$dockerAvailable = $false
try {
    $null = Get-Command docker -ErrorAction Stop
    $dockerProcess = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        $dockerAvailable = $true
    }
} catch {
    $dockerAvailable = $false
}

if ($dockerAvailable) {
    Write-Host "[1/4] Starting PostgreSQL database via Docker..." -ForegroundColor Green
    docker compose up -d db
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Docker compose up db failed. Falling back to local SQLite database."
        $env:DATABASE_URL = "sqlite:///./launchtwin.db"
    } else {
        $env:DATABASE_URL = "postgresql+psycopg://postgres:postgres@localhost:5432/launchtwin"
    }
} else {
    Write-Host "[1/4] Docker is not available. Using local SQLite database (launchtwin.db)..." -ForegroundColor Yellow
    $env:DATABASE_URL = "sqlite:///./launchtwin.db"
}

# 2. Run Database Migrations to Single Head
Write-Host "[2/4] Running Alembic database migrations..." -ForegroundColor Green
python -m alembic upgrade head
if ($LASTEXITCODE -ne 0) {
    Write-Error "Alembic migrations failed."
    exit $LASTEXITCODE
}

# 3. Seed Demo Data (Vector A & Vector B products)
Write-Host "[3/4] Seeding initial demo products and sample directory..." -ForegroundColor Green
python scripts/seed.py

# 4. Print Service URLs
Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host " LaunchTwin Services are Ready!" -ForegroundColor Green
Write-Host " - Frontend UI:        http://localhost:5173" -ForegroundColor White
Write-Host " - Backend API:        http://localhost:8000" -ForegroundColor White
Write-Host " - Interactive Docs:   http://localhost:8000/docs" -ForegroundColor White
Write-Host " - Health Check:       http://localhost:8000/health" -ForegroundColor White
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[4/4] Launching Uvicorn backend server on http://127.0.0.1:8000..." -ForegroundColor Green
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
