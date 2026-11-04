# LaunchTwin AI — 5-Minute Live Demo Script

A step-by-step walkthrough demonstrating the full product lifecycle: product creation, competitive benchmarking, background research, deterministic validation, versioned assumption change with smart carry-forward, version comparison, what-if simulation, and executive launch report generation.

---

### Step 1: Create Product (Vector A Assumptions)

- **UI Action**: Navigate to **New Analysis** (`/new-analysis`). Enter Product Name ("Apex Tumbler"), Category ("Drinkware"), Target Customer ("Urban commuters"), Selling Price (₹500.00), COGS (₹150.00), Packaging (₹30.00), Shipping (₹40.00), Payment Fee (2%), and Fixed Costs (₹50,000.00). Click **Create Product**.
- **Invoke-RestMethod Command**:
  ```powershell
  $productPayload = @{
      name = "Apex Tumbler"
      category = "Drinkware"
      target_market = "Urban commuters"
      assumptions = @{
          customer = @{ target_customer = "Commuters"; problem_statement = "Leaking cups"; customer_interviews_count = 10 }
          product = @{ unique_selling_points = @("Thermal insulation"); differentiation_vs_competitors = "Ceramic lining" }
          packaging = @{ material = "Recycled cardboard"; packaging_cost = 30.00 }
          pricing = @{ selling_price = 500.00; target_margin_fraction = 0.40 }
          costs = @{ cogs_per_unit = 150.00; shipping_cost_per_unit = 40.00; packaging_cost = 30.00; payment_fee_fraction = 0.02; fixed_costs_total = 50000.00 }
          marketing = @{ channels = @("Direct", "Search"); expected_cac = 50.00 }
      }
  } | ConvertTo-Json -Depth 5

  $product = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/products" -Method POST -Body $productPayload -ContentType "application/json"
  $PRODUCT_ID = $product.id
  $PRODUCT_ID
  ```
- **Expected Numbers**: Product created with `current_version: 1`, Status `active`.
- **One Sentence to Say**: *"We begin by defining the Apex Tumbler with baseline Vector A assumptions, establishing an initial unit economics target of 40% margin."*

---

### Step 2: Add Competitors & Benchmark Prices

- **UI Action**: In the product view or wizard, enter two competitors: **Hydro Flask** (observed ₹480.00) and **Yeti Rambler** (observed ₹520.00). Click **Add Competitors**.
- **Invoke-RestMethod Command**:
  ```powershell
  $competitorPayload = @{
      competitors = @(
          @{ name = "Hydro Flask"; website_url = "https://hydroflask.com"; product_name = "All Around 20oz"; observed_price = "480.00" },
          @{ name = "Yeti Rambler"; website_url = "https://yeti.com"; product_name = "Rambler 20oz"; observed_price = "520.00" }
      )
  } | ConvertTo-Json -Depth 4

  Invoke-RestMethod -Uri "http://localhost:8000/api/v1/products/$PRODUCT_ID/competitors" -Method POST -Body $competitorPayload -ContentType "application/json"
  ```
- **Expected Numbers**: 2 competitors added, establishing an initial competitive corridor between ₹480.00 and ₹520.00.
- **One Sentence to Say**: *"Adding benchmark competitors anchors our pricing corridor and generates verified evidence rows for downstream validation."*

---

### Step 3: Trigger Market Research

- **UI Action**: Click **Start Automated Research** in the pipeline view. Watch the status indicator change to **Completed**.
- **Invoke-RestMethod Command**:
  ```powershell
  $research = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/products/$PRODUCT_ID/research" -Method POST
  $RUN_ID = $research.id
  Invoke-RestMethod -Uri "http://localhost:8000/api/v1/products/$PRODUCT_ID/research/$RUN_ID" -Method GET
  ```
- **Expected Numbers**: Status: `completed` (or `running`), `evidence_count: 4` items retrieved from verified channels.
- **One Sentence to Say**: *"Our automated research engine extracts structured competitor claims and pricing data, establishing a defensible evidence base."*

---

### Step 4: Run Initial Validation (Vector A Results)

- **UI Action**: Click **Run Full Validation** on the Dashboard. Review the 6-stage scorecards and financial breakdown.
- **Invoke-RestMethod Command**:
  ```powershell
  $val = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/products/$PRODUCT_ID/validate" -Method POST
  $val | Select-Object overall_score, readiness_verdict
  ```
- **Expected Numbers**:
  - Variable Cost: **₹230.00** (`150.00 + 30.00 + 40.00 + 10.00`)
  - Contribution Per Unit: **₹270.00** (`500.00 - 230.00`)
  - Contribution Margin: **54.00%** (`0.5400`)
  - Break-Even Units: **186 units** (`ceil(50000 / 270)`)
  - Readiness Verdict: **READY** (Overall Score: **100.00**)
- **One Sentence to Say**: *"The initial validation confirms strong unit economics with a 54% contribution margin and 186 break-even units, earning a green READY verdict."*

---

### Step 5: Update Packaging Cost (₹30 -> ₹60) with Revalidation (Vector B)

- **UI Action**: In the Assumptions drawer, change Packaging Cost from **₹30.00 to ₹60.00** (premium biodegradable box) and toggle **Revalidate Immediately**. Click **Save Changes**.
- **Invoke-RestMethod Command**:
  ```powershell
  $patchPayload = @{
      patch = @{ packaging = @{ packaging_cost = 60.00 } }
      revalidate = $true
  } | ConvertTo-Json -Depth 4

  $patchResult = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/products/$PRODUCT_ID/assumptions" -Method PATCH -Body $patchPayload -ContentType "application/json"
  $patchResult.revalidation
  ```
- **Expected Numbers**:
  - Version increments: `version: 2`, `changed_fields: ["packaging.packaging_cost"]`
  - Unaffected stages (`customer`, `competitor`) carried forward from v1
  - Affected stages re-evaluated: `product_packaging`, `pricing`, `financial`, `marketing`
  - Variable Cost: **₹260.00**
  - Contribution Per Unit: **₹240.00**
  - Contribution Margin: **48.00%** (`0.4800`)
  - Break-Even Units: **209 units** (`ceil(50000 / 240)`)
- **One Sentence to Say**: *"Doubling packaging cost immediately creates immutable Version 2, intelligently carrying forward customer discovery while shifting break-even to 209 units."*

---

### Step 6: Compare Versions (v1 vs v2)

- **UI Action**: Open the **Change Tracker** tab and select Version 1 vs Version 2.
- **Invoke-RestMethod Command**:
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:8000/api/v1/products/$PRODUCT_ID/versions/compare?a=1&b=2" -Method GET
  ```
- **Expected Numbers**:
  - Contribution Margin Delta: **-0.0600 (-6.00%)**
  - Break-Even Volume Delta: **+23 units**
  - Affected Stages: `product_packaging`, `pricing`, `financial`, `marketing`
- **One Sentence to Say**: *"The version diff gives executives a clear audit trail showing exactly how the ₹30 packaging increase eroded our margin by 6% and added 23 units to break-even."*

---

### Step 7: Simulate What-If Price Change

- **UI Action**: Open the **Simulation** tab. Slide Selling Price from ₹500 to ₹550.
- **Invoke-RestMethod Command**:
  ```powershell
  $simPayload = @{
      overrides = @{ selling_price = 550.00 }
  } | ConvertTo-Json

  $sim = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/products/$PRODUCT_ID/simulate" -Method POST -Body $simPayload -ContentType "application/json"
  $sim.simulated.financial_metrics
  ```
- **Expected Numbers**:
  - Simulated Contribution: **₹279.00**
  - Simulated Margin: **50.73%**
  - Simulated Break-Even: **180 units** (down from 209)
- **One Sentence to Say**: *"In the What-If simulation playground, we test raising our retail price to ₹550, restoring contribution to ₹279 and reducing break-even back to 180 units without touching live data."*

---

### Step 8: Generate Launch-Readiness Report

- **UI Action**: Click **Generate Launch Report** on the Dashboard and view the export.
- **Invoke-RestMethod Command**:
  ```powershell
  $report = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/products/$PRODUCT_ID/reports" -Method POST
  $report.content.executive_summary
  ```
- **Expected Numbers**:
  - Executive Verdict: **GO** (derived deterministically from `READY`)
  - Readiness Score: **100.0 / 100**
  - Evidence Quality: 6 citations, average confidence score recorded
- **One Sentence to Say**: *"We generate our comprehensive Launch-Readiness Report, providing the launch committee with executive verdict, risk flags, and verified evidence."*
