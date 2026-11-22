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

### C. Default Currency is INR (₹)
- `pricing.currency` defaults to `INR` unless explicitly specified by the client.
- Competitor prices observed in non-matching currencies (e.g., USD when product is in INR) are excluded from the market price band with a `CURRENCY_MISMATCH` finding. Currency symbols and spellings (`₹`, `Rs`, `Rs.`, `INR`) are normalized to standard ISO codes, while unknown currency symbols are rejected.

### D. Demo Data is Labelled Sample and Server-Marked Only
- Seed demonstration products are explicitly set to `status="demo"` exclusively by `scripts/seed.py` on the server.
- The client cannot mark a product as demo via `POST /api/v1/products` or `PATCH` assumptions, and products named with `"SAMPLE "` are treated as real products. Mock and sample seed evidence will not satisfy competitor validation hurdles for real founder products.

### E. Influencer Marketing Figures are Illustrative Estimates
- Influencer projections (predicted clicks, predicted orders, implied CAC, and estimated revenue) are illustrative estimates based on assumed 5% click and 2% conversion rates, not measured empirical data.
- Influencer profiles are fictional sample demonstration records (`is_sample=True`).

### F. No User Accounts or Multi-Tenant Isolation
- LaunchTwin operates as a single-workspace engine without individual user accounts, multi-tenant databases, or role-based access control.
- API security (`AUTH_ENABLED`) operates via a lightweight header API key gate (`X-API-Key`).

### G. Competitor Prices Come Only from Pages the Founder Lists
- Competitor intelligence only analyzes the specific URLs you provide; it does not crawl the open web to discover unlisted competitors.
- The scraping engine parses server-rendered static HTML and anti-hallucination guards accept claims and pricing only if they appear **verbatim** in the fetched page text. Dynamic pricing, coupon codes, and packs rendered purely via client-side JavaScript (SPAs without SSR) will not be captured.
- AI-generated evidence confidence is capped at a maximum of **0.80**.

### H. Out-of-Scope Analyses
The validation engine intentionally focuses on core unit economics and does **not** evaluate:
- **Total Addressable Market (TAM) & Demand Sizing**: Does not forecast total market demand or search volume.
- **Cash Flow & Working Capital**: Does not model runway, cash conversion cycles, or credit lines.
- **Minimum Order Quantities (MOQ)**: Does not assess upfront inventory purchasing requirements.
- **Taxes, Duties, & Tariffs**: VAT, GST, import tariffs, and local sales taxes are excluded from standard unit economics.
- **Returns & Breakage**: Return rates, restocking fees, and transit damage reserves are not modeled.
- **Seasonality & Shelf Life**: Does not account for seasonal sales fluctuations or expiration dates.
