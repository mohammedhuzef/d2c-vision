# LaunchTwin AI — Non-Technical Presentation Notes & Demo Guide

A cheat-sheet for non-technical teammates presenting LaunchTwin AI to founders, investors, and leadership teams.

---

## 🔍 Corrected Platform Facts (Claims Check Audit)

Before presenting, review these verified facts confirmed directly against the production codebase:

| Claim | Status | Real Code Truth & File Location |
| :--- | :---: | :--- |
| **a. Success responses wrapped in `{data: ...}`** | **FALSE** | Responses return top-level models/dicts (`{"items": [...], "total": ...}` or `{"id": ...}`), not wrapped in `{data: ...}`. (`schemas/product.py:76`, `schemas/validation.py:140`). |
| **b. Report verdict stored as GO/CAUTION/NO_GO** | **TRUE** | Executive reports store deterministic verdicts (`GO`, `CAUTION`, `NO_GO`) mapped directly from readiness labels (`READY` -> `GO`, `READY_WITH_WARNINGS` -> `CAUTION`, `NOT_READY` -> `NO_GO`). (`services/reports.py:175-180`, `services/readiness.py:155-165`). |
| **c. Public share route `/reports/public/{share_token}`** | **FALSE** | No public share route or share token column exists. Reports are fetched via standard authenticated product report endpoints. (`api/v1/reports.py`). |
| **d. Manufacturers table and `/manufacturers` route** | **FALSE** | No manufacturers table or route exists in the backend schema. Directory data for suppliers is not implemented in backend. (`Base.metadata.tables`). |
| **e. Influencers have POST, PATCH, and `collab_status`** | **FALSE** | Influencers support `POST /api/v1/influencers` and `PATCH /api/v1/influencers/{id}/status`, but the status column is named `status`, not `collab_status`. (`models/influencer.py:34`). |
| **f. DELETE competitor endpoint exists** | **FALSE** | Only `GET` and `POST` are implemented for competitors. Competitor deletion is not supported. (`api/v1/competitors.py`). |
| **g. `versions/compare` accepts `from_version`/`to_version` and aliases** | **FALSE** | The query endpoint accepts `a`, `b`, `version_a`, `version_b`, but not `from_version`/`to_version`. (`api/v1/versions.py:80-86`). |
| **h. Closure of `packaging.packaging_cost` is 4 stages** | **TRUE** | Transitive invalidation closure is exactly `{'product_packaging', 'pricing', 'financial', 'marketing'}`. (`services/dependencies.py:14-16, 59-81`). |
| **i. Evidence confidence stored as Float or Numeric** | **TRUE** | Database stores confidence as `NUMERIC(3, 2)` (Python `Decimal`), serialized rounded to 2 decimal places. (`models/evidence.py:53`, `schemas/evidence.py:35`). |
| **j. Assumptions in separate table or as JSON** | **TRUE** | Assumptions are stored as `JSONB` in `product_versions.assumptions`. There is no separate assumptions table. (`models/version.py:25`). |
| **k. Rate limiter is in-memory and per-process** | **TRUE** | Sliding window rate limiter runs in-memory per process. (`core/rate_limit.py:11-40`). |

---

## 🎤 1. The 3-Sentence Pitch

> **"LaunchTwin AI is a launch simulation and readiness platform that pressure-tests D2C product assumptions against live market data before founders commit capital to manufacturing. Unlike generic AI tools that hallucinate advice, LaunchTwin uses AI strictly to gather market evidence, while deterministic Python formulas compute break-even targets, unit margins, and launch readiness verdicts. Every assumption tweak creates an immutable, audit-ready version history so teams can track exactly how cost changes impact their bottom line."**

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

## 🖼️ 4. One-Slide Architecture Explanation

> **"Think of LaunchTwin like a modern courtroom: The AI is the research investigator who brings in the exhibits and documents. But Python is the judge who reads the law, does the math, and renders the verdict. The investigator never gets to wear the judge's robe."**

---

## ❓ 5. 10 Likely Questions & Honest Answers

#### Q1: Why not let the AI calculate the financial numbers directly?
**Answer**: Large Language Models are probabilistic text generators, not arithmetic calculators. In physical manufacturing and D2C, a 5% hallucination error can bankrupt an inventory run. We keep LLMs strictly confined to text extraction.

#### Q2: How do you stop the AI from inventing competitor prices?
**Answer**: Our page fetcher extracts raw webpage text first. The LLM extracts the candidate price, which is then cross-referenced against raw text, capped at an 80% confidence score, and stored with an immutable SHA-256 content hash. Manual user entries always take precedence.

#### Q3: What happens when a competitor website blocks web scraping?
**Answer**: Many modern sites use Cloudflare or JavaScript protection. When our scraper detects a block or unparseable page, it flags the issue cleanly. Founders can simply enter observed prices manually via the UI in 10 seconds.

#### Q4: How is this different from an Excel template?
**Answer**: Spreadsheets don't scrape competitor intelligence, don't automatically enforce stage invalidation rules when assumptions change, and don't provide tamper-proof immutable version histories or shareable API contracts.

#### Q5: Is the platform production-ready today?
**Answer**: The backend calculation engine, database schemas, OpenAPI contracts, and test suite (357 passing tests) are production-grade. To scale to thousands of simultaneous users, we will add multi-tenant authentication and asynchronous Celery queues in v2.

#### Q6: How do you decide if a stage passes or fails?
**Answer**: Every threshold lives in a centralized rules configuration file (`rules_config.py`). For example, customer discovery requires at least 10 interviews, packaging must not exceed 15% of retail price, and CAC must not exceed 60% of unit contribution.

#### Q7: Does the platform support other currencies?
**Answer**: Yes. The mathematical engine operates on unitless `Decimal` values. While the demo uses Rupee/Dollar conventions, all formulas apply identically to USD, EUR, or GBP.

#### Q8: Does the system work without an internet connection?
**Answer**: Yes. In `mock` mode, the platform runs 100% offline with canned competitor data and zero external API dependencies. All 357 core tests pass without an internet connection.

#### Q9: Can users export the findings?
**Answer**: Yes. LaunchTwin generates both raw machine-readable JSON reports and clean Markdown documents that can be converted to PDF or pasted into Notion/Slack.

#### Q10: What is on the roadmap for Version 2?
**Answer**: 
1. Multi-tenant user authentication (SSO / OAuth2).
2. Headless browser rendering for complex JavaScript-rendered competitor stores.
3. Native Shopify / Amazon API integrations to pull real-time historical sales data.
