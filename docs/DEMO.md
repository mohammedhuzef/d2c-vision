# LaunchTwin AI - 5-Minute Live Demo Script

A step-by-step walkthrough demonstrating the full product lifecycle: creation, competitive intelligence, deterministic validation, versioned impact analysis, what-if simulation, and launch report generation.

---

### Step 1: Create Product (Vector A Assumptions)

- **UI Action**: Navigate to **New Analysis** (`/new-analysis`). Fill in Product Name ("Apex Tumbler"), Category ("Drinkware"), Target Customer ("Urban commuters"), Selling Price (₹500.00), COGS (₹150.00), Packaging (₹30.00), Shipping (₹40.00), Fee (2%), and Fixed Costs (₹50,000.00). Click **Create Product**.
- **cURL Command**:
  ```bash
  curl -s -X POST http://localhost:8000/api/v1/products \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Apex Tumbler",
      "category": "Drinkware",
      "target_market": "Urban commuters",
      "assumptions": {
        "customer": { "target_customer": "Commuters", "problem_statement": "Leaking cups", "customer_interviews_count": 10 },
        "product": { "unique_selling_points": ["Thermal insulation"], "differentiation_vs_competitors": "Ceramic lining" },
        "packaging": { "material": "Recycled cardboard", "packaging_cost": 30.00 },
        "pricing": { "selling_price": 500.00, "target_margin_fraction": 0.40 },
        "costs": { "cogs_per_unit": 150.00, "shipping_cost_per_unit": 40.00, "packaging_cost": 30.00, "payment_fee_fraction": 0.02, "fixed_costs_total": 50000.00 },
        "marketing": { "channels": ["Direct", "Search"], "expected_cac": 50.00 }
      }
    }'
  ```
- **Expected Numbers**: Product created with `current_version: 1`, Status `active`.
- **One Sentence to Say**: *"We begin by defining the Apex Tumbler with baseline Vector A assumptions, establishing an initial unit economics target of 40% margin."*

---

### Step 2: Add Competitors & Benchmark Prices

- **UI Action**: In Step 2 of the wizard, enter two competitors: **Hydro Flask** (observed ₹480.00) and **Yeti Rambler** (observed ₹520.00). Click **Add Competitors**.
- **cURL Command**:
  ```bash
  curl -s -X POST http://localhost:8000/api/v1/products/$PRODUCT_ID/competitors \
    -H "Content-Type: application/json" \
    -d '{
      "competitors": [
        { "name": "Hydro Flask", "website_url": "https://hydroflask.com", "product_name": "All Around 20oz", "observed_price": "480.00" },
        { "name": "Yeti Rambler", "website_url": "https://yeti.com", "product_name": "Rambler 20oz", "observed_price": "520.00" }
      ]
    }'
  ```
- **Expected Numbers**: 2 competitors created, auto-generating manual price evidence with confidence `1.00`.
- **One Sentence to Say**: *"Adding benchmark competitors immediately anchors our pricing corridor and generates verified evidence rows for downstream validation."*

---

### Step 3: Trigger Market Research

- **UI Action**: Click **Start Automated Research** in the pipeline view. Watch the status indicator change to **Completed**.
- **cURL Command**:
  ```bash
  curl -s -X POST http://localhost:8000/api/v1/products/$PRODUCT_ID/research
  ```
- **Expected Numbers**: `status: "completed"`, `evidence_count: 4` items retrieved from verified channels.
- **One Sentence to Say**: *"Our automated research engine extracts structured competitor claims and pricing data, establishing a defensible evidence base."*

---

### Step 4: Run Initial Validation (Vector A Results)

- **UI Action**: Click **Run Full Validation** on the Dashboard. Review the 6-stage scorecards and financial breakdown.
- **cURL Command**:
  ```bash
  curl -s -X POST http://localhost:8000/api/v1/products/$PRODUCT_ID/validate
  ```
- **Expected Numbers**:
  - Variable Cost: **₹230.00** (`150 + 30 + 40 + 10`)
  - Contribution Per Unit: **₹270.00** (`500 - 230`)
  - Contribution Margin: **54.00%** (`270 / 500 = 0.5400`)
  - Break-Even Units: **186 units** (`ceil(50000 / 270)`)
  - Overall Readiness: **100.00 / 100 (GO)**
- **One Sentence to Say**: *"The initial validation confirms strong unit economics with a 54% contribution margin and 186 break-even units, earning a green GO verdict."*

---

### Step 5: Update Packaging Cost (₹30 -> ₹60) with Revalidation (Vector B)

- **UI Action**: In the Assumptions drawer, change Packaging Cost from **₹30.00 to ₹60.00** (e.g. premium biodegradable embossed box) and toggle **Revalidate Immediately**. Click **Save Changes**.
- **cURL Command**:
  ```bash
  curl -s -X PATCH http://localhost:8000/api/v1/products/$PRODUCT_ID/assumptions \
    -H "Content-Type: application/json" \
    -d '{
      "patch": { "packaging": { "packaging_cost": 60.00 } },
      "revalidate": true
    }'
  ```
- **Expected Numbers**:
  - `new_version: 2`, `changed_fields: ["packaging.packaging_cost"]`
  - Unaffected stages (`customer`, `competitor`) carried forward from v1
  - Variable Cost: **₹260.00**
  - Contribution Per Unit: **₹240.00**
  - Contribution Margin: **48.00%**
  - Break-Even Units: **209 units** (`ceil(50000 / 240)`)
- **One Sentence to Say**: *"Doubling our packaging cost immediately creates immutable Version 2, intelligently carrying forward unaffected discovery stages while adjusting break-even to 209 units."*

---

### Step 6: Version Comparison (v1 vs v2)

- **UI Action**: Click the **Compare Versions** button in the header and select Version 1 and Version 2.
- **cURL Command**:
  ```bash
  curl -s -X GET http://localhost:8000/api/v1/products/$PRODUCT_ID/versions/1/compare/2
  ```
- **Expected Numbers**:
  - Contribution Margin Delta: **-0.06 (-6.00%)** (from `0.54` to `0.48`)
  - Break-Even Units Delta: **+23 units** (from `186` to `209`)
- **One Sentence to Say**: *"The side-by-side version comparison pinpoints exactly how our packaging upgrade erodes 600 basis points of margin and increases required break-even sales by 23 units."*

---

### Step 7: What-If Simulation (Price Increase to ₹550.00)

- **UI Action**: Open the **What-If Simulation** playground. Slide the Selling Price up to **₹550.00**. Watch the real-time preview recalculate.
- **cURL Command**:
  ```bash
  curl -s -X POST http://localhost:8000/api/v1/products/$PRODUCT_ID/simulate \
    -H "Content-Type: application/json" \
    -d '{
      "overrides": {
        "selling_price": "550.00"
      }
    }'
  ```
- **Expected Numbers**:
  - Baseline Contribution: **₹240.00** -> Simulated Contribution: **₹289.00** (`+₹49.00`)
  - Baseline Margin: **48.00%** -> Simulated Margin: **52.55%** (`+4.55%`)
  - Break-Even Units: **209 units** -> Simulated Break-Even: **173 units** (`-36 units`)
- **One Sentence to Say**: *"Before committing to production, our what-if simulation demonstrates that raising price to ₹550.00 recovers the lost margin and pulls break-even down to just 173 units."*

---

### Step 8: Generate Launch-Readiness Report

- **UI Action**: Click **Generate Executive Report**. Scroll through the formatted report sections including Risk Analysis, Stage Breakdown, and Evidence Quality.
- **cURL Command**:
  ```bash
  curl -s -X POST http://localhost:8000/api/v1/products/$PRODUCT_ID/reports
  curl -s -X GET http://localhost:8000/api/v1/products/$PRODUCT_ID/reports/latest
  ```
- **Expected Numbers**:
  - Verdict: **GO** (Version 2)
  - Total Evidence Count: **6 items**
  - Average Confidence: **0.9500 (95%)**
  - Verified Next Steps: Supplier contract finalization and pre-order pilot.
- **One Sentence to Say**: *"We finalize our analysis with an audit-ready, deterministic launch report complete with evidence quality metrics and immediate next steps for the leadership team."*

---

### Automated Verification & Smoke Test Hygiene

To verify this full 10-step lifecycle automatically without polluting seeded demo products:

```powershell
# Run on a throwaway database (PowerShell):
$env:DATABASE_URL="sqlite:///./smoke.db"
alembic upgrade head
python scripts/e2e_smoke.py
```

If running against the live demo database, explicitly pass:
```powershell
python scripts/e2e_smoke.py --allow-demo-db
```
All smoke entities are labeled `[SMOKE-TEST]` for audit traceability.

