# LaunchTwin AI — Non-Technical Presentation Notes & Demo Guide

A cheat-sheet for non-technical teammates presenting LaunchTwin AI to founders, investors, and leadership teams.

---

## 🎤 1. The 3-Sentence Pitch

> **"LaunchTwin AI is a launch simulation and readiness platform that pressure-tests D2C product assumptions against live market data before founders spend capital on inventory. Unlike generic AI tools that hallucinate advice, LaunchTwin uses AI solely to gather market evidence, while strict mathematical formulas compute break-even targets, unit margins, and launch readiness scores. Every assumption tweak creates an immutable, audit-ready version history so teams can track exactly how cost changes impact their bottom line."**

---

## 💥 2. The Problem

Founders and brand managers currently launch physical products using fragmented spreadsheets and guesswork:
1. **Silent Margin Killers**: Packaging, payment gateway fees, and shipping costs are routinely underestimated, turning assumed 50% margins into unprofitable operations.
2. **AI Hallucinations**: Prompting ChatGPT with *"Is my product viable?"* generates polite, fabricated encouragement with ungrounded financial math.
3. **No Change Audit Trail**: When suppliers quote new packaging costs, teams update a shared spreadsheet without knowing which discovery assumptions were invalidated or what new sales volume is required to break even.

---

## 💎 3. Three Core Differentiators

| Differentiator | What It Means in Plain Words |
| :--- | :--- |
| **1. Deterministic Numbers** | **AI never does the math.** A pure Python calculation engine uses exact penny-accurate arithmetic. 100% of the numbers and launch verdicts (GO / NO GO) are reproducible and grounded in financial reality. |
| **2. Evidence-Backed Findings** | Every recommendation and competitor benchmark cites a verified evidence row with a confidence score and source URL. If market data is missing, the system warns you rather than inventing numbers. |
| **3. Versioned Change Impact** | When you change an assumption (e.g. packaging costs increase by ₹30), LaunchTwin creates an immutable Version 2, preserves your past records, and recalculates only the affected downstream stages while carrying forward unaffected discovery research. |

---

## ⏱️ 4. 5-Minute Live Demo Flow

Follow this exact script and recite these numbers during the demonstration:

| Minute | Screen & Action | Exact Script & Numbers to Say |
| :---: | :--- | :--- |
| **0:00 - 1:00** | **Create Product** (`/new-analysis`)<br>Enter "Apex Tumbler", Selling Price ₹500, COGS ₹150, Packaging ₹30, Shipping ₹40, Fee 2%, Fixed Costs ₹50,000. | *"We begin by defining the Apex Tumbler with Vector A baseline assumptions. We want to achieve a healthy 40% margin target."* |
| **1:00 - 2:00** | **Benchmark Competitors**<br>Add Hydro Flask (₹480) and Yeti (₹520). Click **Start Automated Research**. | *"We benchmark against Hydro Flask and Yeti. Our automated engine crawls verified pages, captures real pricing evidence, and anchors our competitive corridor."* |
| **2:00 - 3:00** | **Initial Validation**<br>Click **Run Full Validation**. Show the Green Dashboard. | *"Initial validation shows excellent unit economics: Variable cost is exactly **₹230.00**, leaving **₹270.00** in contribution per unit. That is a **54.00% contribution margin**, requiring **186 units** to break even. The verdict is a solid green **GO**."* |
| **3:00 - 4:00** | **The Packaging Shock (Vector B)**<br>In Assumptions drawer, change Packaging from ₹30 to ₹60. Check "Revalidate" and save. | *"Now the supplier quotes a premium eco-friendly box: packaging doubles to **₹60.00**. Notice the system instantly creates **Version 2**, carries forward our customer discovery from v1, and updates the math: variable cost jumps to **₹260.00**, squeezing margin down to **48.00%** and pushing our break-even up by 23 units to **209 units**."* |
| **4:00 - 5:00** | **What-If Simulation & Report**<br>Open Simulation tab. Slide price to ₹550. Click **Generate Report**. | *"Can we fix this? In the What-If playground, we test raising price to **₹550.00**. Instantly, contribution recovers to **₹289.00** and break-even drops to **173 units**. We generate our executive report with audit-ready evidence for the launch committee."* |

---

## 🖼️ 5. One-Slide Architecture Explanation

> **"Think of LaunchTwin like a modern courtroom: The AI is the research investigator who brings in the exhibits and documents. But Python is the judge who reads the law, does the math, and renders the verdict. The investigator never gets to wear the judge's robe."**

---

## ❓ 6. 10 Likely Questions & Honest Answers

#### Q1: Why not let the AI calculate the financial numbers directly?
**Answer**: Large Language Models are probabilistic text generators, not arithmetic calculators. In physical manufacturing and D2C, a 5% hallucination error can bankrupt an inventory run. We keep LLMs strictly confined to text extraction.

#### Q2: How do you stop the AI from inventing competitor prices?
**Answer**: Our page fetcher extracts raw webpage text first. The LLM extracts the candidate price, which is then cross-referenced against raw text, capped at an 80% confidence score, and stored with an immutable SHA-256 content hash. Manual user entries always take precedence.

#### Q3: What happens when a competitor website blocks web scraping?
**Answer**: Many modern sites use Cloudflare or JavaScript protection. When our scraper detects a block or unparseable page, it flags the issue cleanly. Founders can simply enter observed prices manually via the UI in 10 seconds.

#### Q4: How is this different from an Excel template?
**Answer**: Spreadsheets don't scrape competitor intelligence, don't automatically enforce stage invalidation rules when assumptions change, and don't provide tamper-proof immutable version histories or shareable API contracts.

#### Q5: Is the platform production-ready today?
**Answer**: The backend calculation engine, database schemas, OpenAPI contracts, and test suite (310 passing tests) are production-grade. To scale to thousands of simultaneous users, we will add multi-tenant authentication and asynchronous Celery queues in v2.

#### Q6: How do you decide if a stage passes or fails?
**Answer**: Every threshold lives in a centralized rules configuration file (`rules_config.py`). For example, customer discovery requires at least 10 interviews, packaging must not exceed 15% of retail price, and CAC must not exceed 50% of contribution.

#### Q7: Does the platform support other currencies?
**Answer**: Yes. The mathematical engine operates on unitless `Decimal` values. While the demo uses Rupee/Dollar conventions, all formulas apply identically to USD, EUR, or GBP.

#### Q8: Does the system work without an internet connection?
**Answer**: Yes. In `mock` mode, the platform runs 100% offline with canned competitor data and zero external API dependencies. All 310 core tests pass without an internet connection.

#### Q9: Can users export the findings?
**Answer**: Yes. LaunchTwin generates both raw machine-readable JSON reports and clean Markdown documents that can be converted to PDF or pasted into Notion/Slack.

#### Q10: What is on the roadmap for Version 2?
**Answer**: 
1. Multi-tenant user authentication (SSO / OAuth2).
2. Headless browser rendering for complex JavaScript-rendered competitor stores.
3. Native Shopify / Amazon API integrations to pull real-time historical sales data.
