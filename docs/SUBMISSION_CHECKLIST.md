# LaunchTwin AI — Submission Checklist & Judge Guide

## 1. What This Tool Is and Is Not

> **What it is**: LaunchTwin AI is an automated, mathematically rigorous pre-launch unit economics and market feasibility validation engine for Direct-to-Consumer (D2C) founders. It strictly evaluates whether founder assumptions satisfy fundamental unit economic laws (positive contribution margin, sustainable break-even scale, healthy packaging cost ratios, and viable CAC thresholds) and verifies whether competitor evidence corroborates the target retail price band. All mathematical calculations use pure `Decimal` arithmetic with hand-calculated proof vectors and automated anti-hallucination guardrails.
>
> **What it is not**: LaunchTwin AI is **not** a speculative revenue forecasting crystal ball, **not** an investor guarantee of commercial success, and **not** an unconstrained open-web web crawler. It does not audit factory quotes or interview transcripts, does not model working capital runways or GST/VAT taxes, and does not operate multi-tenant user accounts. All competitor research is strictly bounded to founder-provided URLs, and influencer performance projections are honest, illustrative estimates based on assumed baseline rates.

---

## 2. Startup Commands (PowerShell)

### Backend (Terminal 1)
```powershell
# Navigate to repository root
cd c:\Users\huzef\OneDrive\Desktop\d2c-platform

# Activate Python virtual environment (if configured)
# .\.venv\Scripts\Activate.ps1

# Launch FastAPI backend with uvicorn
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Health Check (Terminal 3 or Browser)
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/health"
# Expected response: {"status": "ok", "version": "1.0.0", "database": "connected"}
```

### Frontend (Terminal 2)
```powershell
# Navigate to frontend directory
cd c:\Users\huzef\OneDrive\Desktop\d2c-platform\frontend

# Install dependencies (if not already installed)
npm install

# Start Vite development server
npm run dev
# Local UI available at: http://localhost:5173
```

---

## 3. Recommended Demo Order

Follow this sequence to experience the full end-to-end founder workflow:

1. **Create Product (`POST /api/v1/products`)**:
   - Provide product title, category (`Fitness & Active`), and baseline assumptions (selling price ₹500, COGS ₹150, packaging ₹30, shipping ₹40).
   - Currency automatically defaults to `INR` server-side without manual client input.
2. **Add Competitors (`POST /api/v1/products/{id}/competitors`)**:
   - Register 2+ competitor benchmarks with product page URLs and observed prices.
3. **Run AI Market Research (`POST /api/v1/products/{id}/research`)**:
   - Extract competitor strengths, weaknesses, and verified price evidence with verbatim excerpt verification.
4. **Validate Readiness (`POST /api/v1/products/{id}/validate`)**:
   - Execute the 6-stage validation pipeline (`customer`, `competitor`, `product_packaging`, `pricing`, `financial`, `marketing`).
   - Review the aggregate score (e.g. `100.00`) and verdict (`READY`).
5. **Change Packaging Cost with Revalidation (`PATCH /api/v1/products/{id}/assumptions`)**:
   - Patch `packaging.packaging_cost` from ₹30 to ₹60 with `revalidate: true`.
   - The platform creates immutable Version 2, records before/after diffs in an `ImpactEvent`, and carries forward clean stages while re-running affected ones (`product_packaging`, `financial`).
6. **Simulate What-If Scenarios (`POST /api/v1/products/{id}/simulate`)**:
   - Test alternative retail prices (e.g. ₹600) or supplier cost reductions without polluting database version history.
7. **Generate Launch Report (`POST /api/v1/products/{id}/reports`)**:
   - Generate a comprehensive, markdown-formatted readiness dossier detailing financial unit economics, findings, and priority recommendations.
8. **Influencer Matching & Pitch Generation (`GET /api/v1/influencers/match/{id}`)**:
   - Deterministically score creator candidates across Category, Audience, Engagement, and CAC Economics fit.
   - Note the honest disclosure: *"Figures are illustrative estimates based on assumed 5% click and 2% conversion rates."*
   - Generate personalized outreach pitch templates (`POST /api/v1/influencers/{id}/pitch`).

---

## 4. Expected Verdicts for Canonical Demo Products

Seed the deterministic demo catalog at any time by running `python scripts/seed.py`:

| # | Product Name | Target Retail Price | Expected Verdict | Expected Score | Key Validation Behavior |
| :-: | :--- | :---: | :---: | :---: | :--- |
| **1** | **SAMPLE TerraFlask Tumbler** | ₹500.00 | `READY` | **100.00** | Healthy unit economics: 54% margin, break-even at 186 units, all 6 stages passed. |
| **2** | **SAMPLE Heavy-Packaging Bottle** | ₹500.00 | `READY_WITH_WARNINGS` | **97.50** | Packaging cost is 20% of price (exceeds 15% threshold); margin remains viable at 42%. |
| **3** | **SAMPLE Underpriced Bottle** | ₹260.00 | `NOT_READY` | **79.00** | **Critical Stage Veto**: Contribution margin is 13.38% (below 15% cutoff). Fails financial stage. |
| **4** | **SAMPLE Early-Stage Idea** | ₹500.00 | `READY_WITH_WARNINGS` | **100.00 / null** | Incomplete founder evidence on non-critical stages (customer interviews missing). |

---

## 5. Verification Commands Summary

```powershell
# 1. Complete Pytest Suite (205 passing unit & integration tests)
python -m pytest -q

# 2. Complete Platform Audit Checklist (all 13 checks passing)
python scripts/verify_all.py

# 3. Frontend API Coverage Check (100% route coverage)
python scripts/frontend_coverage.py

# 4. OpenAPI Contract Fidelity Diff Check
python scripts/export_openapi.py

# 5. Idempotent Database Seeding
python scripts/seed.py

# 6. Live E2E Walkthrough on Throwaway DB
python scripts/e2e_live_walkthrough.py
```
