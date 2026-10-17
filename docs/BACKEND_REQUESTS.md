# Backend Feature & Schema Requests

This document tracks items requested in frontend specifications or workflows that are currently missing from `contracts/openapi.json`. Per project requirements, the contract wins; no fake APIs or mock schemas are introduced into the frontend code.

---

### Request Log

1. **Competitor Direct Price & Product Fields in CompetitorItem**
   - **What**: Direct `price_observed` and `product_name` fields in `CompetitorItem` when posting competitors.
   - **Why**: The wizard step 4 accepts company name, product name, and observed price. Currently, `CompetitorItem` only supports `{ name, website_url, notes }`. Price observation currently requires a secondary call to internal ingest `POST /api/v1/internal/research-results`.
   - **Suggested Schema / Endpoint**: Add `product_name: Optional[str]` and `observed_price: Optional[Decimal]` to `CompetitorItem` in `POST /api/v1/products/{product_id}/competitors`.

2. **Expected Sales / Customer Volume in Marketing Assumptions**
   - **What**: `expected_monthly_sales_units` field in `MarketingAssumptions`.
   - **Why**: The dashboard financial snapshot asks to show customers per month. In the absence of an explicit expected sales volume, the frontend derives customers per month as `monthly_budget / expected_cac` (labelled "derived").
   - **Suggested Schema / Endpoint**: Add `expected_monthly_sales: Optional[int]` to `MarketingAssumptions` in `contracts/openapi.json`.

3. **Target Segment in Marketing Assumptions**
   - **What**: Dedicated `target_segment` field on `MarketingAssumptions`.
   - **Why**: Wizard step 3 includes target segment. While customer assumptions have `target_customer` and `segment_size_estimate`, `MarketingAssumptions` does not have a dedicated segment field.
   - **Suggested Schema / Endpoint**: Add `target_segment: Optional[str]` to `MarketingAssumptions` or unify under `CustomerAssumptions`.

4. **Personas and Persona Chat Endpoints**
   - **What**: Endpoints for generating consumer personas and interactive chat.
   - **Why**: Phase 2 specification references persona testing and persona chat. These endpoints do not currently exist in the OpenAPI schema.
   - **Suggested Schema / Endpoint**: `GET /api/v1/products/{product_id}/personas` and `POST /api/v1/products/{product_id}/personas/{persona_id}/chat` (kept behind `VITE_ENABLE_PERSONAS` feature flag).

5. **Single Latest Report Endpoint**
   - **What**: Dedicated `GET /api/v1/products/{product_id}/reports/latest` endpoint.
   - **Why**: `GET /api/v1/products/{product_id}/reports` returns an array of reports. A `/latest` convenience endpoint mirrors `/validation/runs/latest`.
   - **Suggested Schema / Endpoint**: Add `GET /api/v1/products/{product_id}/reports/latest` returning `ReportResponse`.
