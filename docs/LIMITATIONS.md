# LaunchTwin AI — Limitations & Founder Guide

This document clearly outlines what a LaunchTwin AI validation run means, what it does **not** mean, and the boundary assumptions governing the platform.

---

## 1. What a Readiness Verdict Means (and Does NOT Mean)

- **What It Means**: LaunchTwin AI evaluates whether your product's self-reported unit economics and market assumptions satisfy core mathematical viability rules and minimum evidence hurdles.
- **What It Does NOT Mean**: A `READY` verdict is **not a guarantee of commercial success, market adoption, or investor funding**. It simply verifies that the idea's underlying math and initial evidence do not violate basic unit economic principles.

---

## 2. Key Limitations & Assumptions

### A. Founder-Reported Data is Unverified
- The validation engine calculates results based strictly on the financial numbers and customer research counts you provide (selling price, COGS, packaging cost, shipping cost, expected CAC, and customer interviews).
- LaunchTwin does **not** audit factory quotes, supplier reliability, or interview transcripts. If your cost inputs are overly optimistic or inaccurate, the resulting score and verdict will reflect those inaccuracies.

### B. General Heuristics, Not Category-Specific Benchmarks
- Stage thresholds (e.g., 40% target gross margin, packaging cost ratio under 15%, 2,500-unit break-even scale, 10 customer interviews) represent broad consumer packaged goods (CPG) rules of thumb.
- They are **not tailored to specialized niches** (e.g., ultra-luxury items, high-volume commodities, or perishable food products) which may operate profitably on fundamentally different margin structures.

### C. Out-of-Scope Analyses
The validation engine intentionally focuses on core unit economics and does **not** evaluate:
- **Total Addressable Market (TAM) & Demand Sizing**: Does not forecast total market demand or search volume.
- **Cash Flow & Working Capital**: Does not model runway, cash conversion cycles, or credit lines.
- **Minimum Order Quantities (MOQ)**: Does not assess upfront inventory purchasing requirements.
- **Taxes, Duties, & Tariffs**: VAT, GST, import tariffs, and local sales taxes are excluded from standard unit economics.
- **Returns & Breakage**: Return rates, restocking fees, and transit damage reserves are not modeled.
- **Seasonality & Shelf Life**: Does not account for seasonal sales fluctuations or expiration dates.

### D. Competitor Research Constraints
- **Target URL Scope**: Competitor intelligence only analyzes the specific URLs you provide; it does not crawl the open web to discover unlisted competitors.
- **Client-Rendered JavaScript**: The scraping engine parses server-rendered static HTML. It may not capture prices or claims rendered exclusively via client-side JavaScript frameworks (SPAs without SSR).
- **Dynamic Pricing & Pack Sizes**: Observed prices reflect the exact snapshot at scrape time and may not reflect temporary promotional coupons, regional currency conversions, or bundle pack discounts.

### E. AI Evidence Guardrails
- **Anti-Hallucination Enforcement**: Extracted claims and pricing are accepted only if they appear **verbatim** in the fetched page text. If a competitor page obscures its price, no price will be inferred.
- **Confidence Ceiling**: AI-generated evidence is capped at a maximum confidence score of **0.80**, reflecting that machine-extracted web data carries inherent uncertainty compared to direct founder observations (which score 1.00).

### F. Security & Access Boundaries
- **No Multi-Tenant User Isolation**: LaunchTwin currently operates as a single-workspace engine. User authentication (`AUTH_ENABLED`) is a lightweight API key gate, not a multi-tenant user account system with role-based access control.
