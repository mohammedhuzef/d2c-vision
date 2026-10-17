# LaunchTwin AI - REST API Cheatsheet

Complete reference for all backend API endpoints, verified real request/response payloads captured from end-to-end execution, enum values, error payloads, and strict value formatting rules.

---

## 1. Value Formats & Invariants

| Category | Type & Representation | Format Rule | Examples |
| :--- | :--- | :--- | :--- |
| **Monetary Values** | `String` (or `Numeric(14,2)`) | Exactly 2 decimal places | `"500.00"`, `"230.00"`, `"260.00"`, `"50000.00"` |
| **Fractions & Ratios** | `Decimal` / `Float` | 4 decimal places | `0.5400`, `0.4800`, `0.4000`, `0.0200` |
| **Readiness Scores** | `String` (or `Numeric(5,2)`) | 2 decimal places, range `0.00` - `100.00` | `"100.00"`, `"85.00"`, `"57.50"` |
| **Quantities / Counts** | `Integer` | Whole non-negative integer | `186`, `209`, `10`, `2`, `0` |
| **UUIDs** | `UUIDv4 String` | 36-character hyphenated UUID | `"da77ba53-2e81-40aa-b3a4-725faad22f19"` |
| **Timestamps** | `ISO-8601 UTC String` | RFC-3339 formatted datetime | `"2026-10-17T05:04:53.123456Z"` |

---

## 2. Standard Error Envelope

All error responses strictly adhere to the unified error envelope across all `4xx` and `5xx` status codes:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Field 'assumptions.costs.cogs_per_unit' must be greater than zero",
    "details": [
      {
        "field": "assumptions.costs.cogs_per_unit",
        "issue": "greater_than_zero",
        "location": ["body", "assumptions", "costs", "cogs_per_unit"]
      }
    ],
    "request_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
  }
}
```

### Error Codes
- `VALIDATION_ERROR` (HTTP 422): Schema or business logic validation failure (e.g. unknown assumption keys, negative costs).
- `NOT_FOUND` (HTTP 404): Resource does not exist (e.g. unknown product ID, run ID, or version).
- `CONFLICT` (HTTP 409): Duplicate unique resource (e.g. competitor name conflict for product).
- `BAD_STATE` (HTTP 409): Lifecycle precondition failed (e.g. requesting report before version is validated).
- `INTERNAL_ERROR` (HTTP 500): Unhandled server exception.

---

## 3. Enumerated Types

### Readiness Labels
- `READY` (Score >= 70.00, all critical stages pass)
- `READY_WITH_WARNINGS` (Score >= 70.00 with non-critical warnings, or 60.00 - 69.99)
- `NOT_READY` (Score < 60.00, or any critical stage failed)
- `INSUFFICIENT_EVIDENCE` (Required inputs or evidence missing)

### Pipeline Stages
- `customer`: Customer discovery, interview count, problem validation
- `competitor`: Competitive landscape, pricing benchmarks, evidence coverage
- `product_packaging`: Packaging cost ratio, sustainability materials
- `pricing`: Target margin compliance, competitive price band fit (*Critical Stage*)
- `financial`: Unit economics, contribution margin, break-even units (*Critical Stage*)
- `marketing`: CAC to contribution ratio, channel feasibility

### Stage Statuses
- `PASSED`: Stage evaluation passed all deterministic criteria
- `WARNING`: Non-fatal risk or threshold exceeded (e.g. packaging ratio > 15%)
- `FAILED`: Fatal threshold violation (e.g. margin < 15%, CAC > contribution)
- `INSUFFICIENT_EVIDENCE`: Required inputs absent or missing competitor benchmarks
- `NOT_RUN`: Stage has not yet executed for current version

### Evidence Source Types
- `website`: Official brand product or landing page
- `pricing_page`: Public pricing table or plan matrix
- `review`: Verified customer review or benchmark teardown
- `social`: Social media announcement or forum quote
- `manual`: Direct user input or observed field entry
- `other`: Generic secondary source

### Research Providers & Run Statuses
- Providers: `mock` (deterministic fast mock), `ai` (LLM-driven provider)
- Statuses: `pending`, `running`, `completed`, `failed`

### Recommendation Priorities & Action Types
- Priorities: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`
- Action Types: `INCREASE_PRICE`, `REDUCE_COST`, `CONDUCT_INTERVIEWS`, `EXPAND_COMPETITORS`, `RETHINK_PACKAGING`, `REVISE_CHANNELS`, `REDUCE_FIXED_COSTS`

---

## 4. Endpoints & Real Payloads

### System & Health

#### `GET /health` (or `GET /api/v1/health`)
DB ping check returning service status.

**Response (HTTP 200)**:
```json
{
  "status": "healthy",
  "database": "connected",
  "version": "1.0.0"
}
```

---

### Products

#### `POST /api/v1/products`
Create a new product with initial assumptions (Version 1).

**Request Body**:
```json
{
  "name": "E2E Smoke Tumbler",
  "category": "Drinkware",
  "target_market": "Eco-friendly commuters",
  "assumptions": {
    "customer": {
      "target_customer": "Urban commuters",
      "problem_statement": "Single use waste and leaking tumblers",
      "customer_interviews_count": 10
    },
    "product": {
      "unique_selling_points": ["Thermal insulation", "Leak-proof lid"],
      "differentiation_vs_competitors": "Ceramic lined with recycled steel"
    },
    "packaging": {
      "material": "Recycled cardboard",
      "packaging_cost": 30.00
    },
    "pricing": {
      "selling_price": 500.00,
      "target_margin_fraction": 0.40
    },
    "costs": {
      "cogs_per_unit": 150.00,
      "shipping_cost_per_unit": 40.00,
      "packaging_cost": 30.00,
      "payment_fee_fraction": 0.02,
      "fixed_costs_total": 50000.00
    },
    "marketing": {
      "channels": ["Direct", "Search"],
      "expected_cac": 50.00
    }
  }
}
```

**Response (HTTP 201)**:
```json
{
  "id": "da77ba53-2e81-40aa-b3a4-725faad22f19",
  "name": "E2E Smoke Tumbler",
  "description": null,
  "category": "Drinkware",
  "target_market": "Eco-friendly commuters",
  "current_version": 1,
  "status": "active",
  "created_at": "2026-10-17T05:04:53.100000Z",
  "updated_at": "2026-10-17T05:04:53.100000Z"
}
```

#### `GET /api/v1/products`
List all products with additive readiness & stage summary fields.

**Response (HTTP 200)**:
```json
{
  "items": [
    {
      "id": "da77ba53-2e81-40aa-b3a4-725faad22f19",
      "name": "E2E Smoke Tumbler",
      "category": "Drinkware",
      "target_market": "Eco-friendly commuters",
      "current_version": 2,
      "validated_version": 2,
      "revalidation_required": false,
      "latest_readiness": {
        "label": "READY",
        "overall_score": "100.00"
      },
      "stage_statuses": {
        "customer": "PASSED",
        "competitor": "PASSED",
        "product_packaging": "PASSED",
        "pricing": "PASSED",
        "financial": "PASSED",
        "marketing": "PASSED"
      },
      "competitors_count": 2,
      "missing_evidence_count": 0,
      "research_provider": "mock"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

#### `GET /api/v1/products/{product_id}`
Get full detail for a single product.

**Response (HTTP 200)**: Same structure as list item with full timestamps.

#### `PATCH /api/v1/products/{product_id}/assumptions`
Increment product version, apply assumption changes, trigger impact analysis, and optionally revalidate.

**Request Body**:
```json
{
  "patch": {
    "packaging": {
      "packaging_cost": 60.00
    }
  },
  "revalidate": true
}
```

**Response (HTTP 200)**:
```json
{
  "new_version": 2,
  "changed_fields": [
    "packaging.packaging_cost"
  ],
  "affected_stages": [
    "financial",
    "marketing",
    "pricing",
    "product_packaging"
  ],
  "impact_event": {
    "id": "231845bb-b5bf-4050-bcda-3ebba9e6da06",
    "product_id": "da77ba53-2e81-40aa-b3a4-725faad22f19",
    "from_version": 1,
    "to_version": 2,
    "changed_fields": ["packaging.packaging_cost"],
    "created_at": "2026-10-17T05:04:54.957000Z"
  },
  "results": [
    {
      "stage": "customer",
      "status": "PASSED",
      "score": 100.0,
      "carried_forward_from": 1,
      "findings": [],
      "metrics": {}
    },
    {
      "stage": "competitor",
      "status": "PASSED",
      "score": 100.0,
      "carried_forward_from": 1,
      "findings": [],
      "metrics": {}
    },
    {
      "stage": "financial",
      "status": "PASSED",
      "score": 100.0,
      "carried_forward_from": null,
      "findings": [],
      "metrics": {
        "selling_price": "500.00",
        "variable_cost_per_unit": "260.00",
        "contribution_per_unit": "240.00",
        "contribution_margin": 0.48,
        "break_even_units": 209
      }
    }
  ]
}
```

---

### Competitors & Research

#### `POST /api/v1/products/{product_id}/competitors`
Add competitors with optional `product_name` and `observed_price` (auto-creating manual evidence).

**Request Body**:
```json
{
  "competitors": [
    {
      "name": "Hydro Flask",
      "website_url": "https://hydroflask.com",
      "product_name": "All Around 20oz",
      "observed_price": "480.00"
    },
    {
      "name": "Yeti Rambler",
      "website_url": "https://yeti.com",
      "product_name": "Rambler 20oz",
      "observed_price": "520.00"
    }
  ]
}
```

**Response (HTTP 201)**:
```json
{
  "items": [
    {
      "id": "bb91238b-d54b-4c40-9856-7ee6590b201a",
      "product_id": "da77ba53-2e81-40aa-b3a4-725faad22f19",
      "name": "Hydro Flask",
      "website_url": "https://hydroflask.com",
      "product_name": "All Around 20oz",
      "notes": null,
      "created_at": "2026-10-17T05:04:53.946000Z"
    },
    {
      "id": "2bc845aa-fa72-4740-97cc-bc66b5795e92",
      "product_id": "da77ba53-2e81-40aa-b3a4-725faad22f19",
      "name": "Yeti Rambler",
      "website_url": "https://yeti.com",
      "product_name": "Rambler 20oz",
      "notes": null,
      "created_at": "2026-10-17T05:04:53.946000Z"
    }
  ]
}
```

#### `POST /api/v1/products/{product_id}/research`
Trigger automated research runs using `RESEARCH_PROVIDER` (`mock` or `ai`).

**Response (HTTP 202)**:
```json
{
  "research_id": "84d720fa-e2f9-4d6f-8703-a1fb92bb3b71",
  "status": "completed",
  "evidence_count": 4,
  "started_at": "2026-10-17T05:04:54.236000Z",
  "finished_at": "2026-10-17T05:04:54.236000Z",
  "errors": null
}
```

#### `GET /api/v1/products/{product_id}/evidence`
Retrieve gathered evidence items filtered by competitor or source type.

**Response (HTTP 200)**:
```json
{
  "items": [
    {
      "id": "31b9d4ba-42aa-4d9f-a2aa-cfbcbb031911",
      "product_id": "da77ba53-2e81-40aa-b3a4-725faad22f19",
      "competitor_id": "bb91238b-d54b-4c40-9856-7ee6590b201a",
      "source_type": "manual",
      "source_url": null,
      "title": "Manual Competitor Price",
      "excerpt": "Observed price: 480.00",
      "confidence": "1.00",
      "retrieved_at": "2026-10-17T05:04:53.946000Z"
    }
  ],
  "total": 4,
  "limit": 50,
  "offset": 0
}
```

---

### Validation Pipeline

#### `POST /api/v1/products/{product_id}/validate`
Execute all 6 validation stages sequentially.

**Response (HTTP 200)**:
```json
{
  "run_id": "ee7621fb-553b-4780-b2dd-3bfbc321c109",
  "product_id": "da77ba53-2e81-40aa-b3a4-725faad22f19",
  "version_number": 1,
  "readiness_score": "100.00",
  "verdict": "GO",
  "results": [
    {
      "stage": "customer",
      "status": "PASSED",
      "score": 100.0,
      "findings": []
    },
    {
      "stage": "competitor",
      "status": "PASSED",
      "score": 100.0,
      "findings": []
    },
    {
      "stage": "product_packaging",
      "status": "PASSED",
      "score": 100.0,
      "findings": []
    },
    {
      "stage": "pricing",
      "status": "PASSED",
      "score": 100.0,
      "findings": []
    },
    {
      "stage": "financial",
      "status": "PASSED",
      "score": 100.0,
      "findings": [],
      "metrics": {
        "selling_price": "500.00",
        "variable_cost_per_unit": "230.00",
        "contribution_per_unit": "270.00",
        "contribution_margin": 0.54,
        "break_even_units": 186
      }
    },
    {
      "stage": "marketing",
      "status": "PASSED",
      "score": 100.0,
      "findings": []
    }
  ]
}
```

---

### What-If Simulation

#### `POST /api/v1/products/{product_id}/simulate`
Simulate hypothetical assumption changes in memory without saving state.

**Request Body**:
```json
{
  "overrides": {
    "selling_price": "550.00"
  }
}
```

**Response (HTTP 200)**:
```json
{
  "baseline": {
    "readiness": { "label": "READY", "score": "100.00" },
    "stages": {
      "financial": { "status": "PASSED", "score": "100.00" }
    },
    "metrics": {
      "contribution_per_unit": "240.00",
      "margin_fraction": "0.4800",
      "break_even_units": "209"
    }
  },
  "simulated": {
    "readiness": { "label": "READY", "score": "100.00" },
    "stages": {
      "financial": { "status": "PASSED", "score": "100.00" }
    },
    "metrics": {
      "contribution_per_unit": "289.00",
      "margin_fraction": "0.5255",
      "break_even_units": "173"
    }
  },
  "deltas": {
    "contribution_per_unit": "+49.00",
    "margin_fraction": "+0.0455",
    "break_even_units": "-36"
  },
  "changes": [
    {
      "field": "metrics.contribution_per_unit",
      "baseline": "240.00",
      "simulated": "289.00",
      "delta": "+49.00"
    }
  ]
}
```

---

### Version Comparison & Impact

#### `GET /api/v1/products/{product_id}/versions/1/compare/2`
Compare stage status changes, metric deltas, and added/removed findings between two versions.

**Response (HTTP 200)**:
```json
{
  "from_version": 1,
  "to_version": 2,
  "stages": {
    "financial": {
      "status_before": "PASSED",
      "status_after": "PASSED",
      "metric_deltas": {
        "contribution_margin": {
          "before": 0.54,
          "after": 0.48,
          "delta": -0.06
        },
        "break_even_units": {
          "before": 186,
          "after": 209,
          "delta": 23
        }
      },
      "findings_added": [],
      "findings_removed": []
    }
  }
}
```

---

### Reports

#### `POST /api/v1/products/{product_id}/reports`
Generate a deterministic launch-readiness report (returns 409 `BAD_STATE` if unvalidated).

**Response (HTTP 201)**:
```json
{
  "id": "87a7b537-1766-44bf-a86f-9a78ad4cff93",
  "product_id": "da77ba53-2e81-40aa-b3a4-725faad22f19",
  "title": "Launch-Readiness Report: E2E Smoke Tumbler",
  "content": {
    "verdict": "GO",
    "version_number": 2,
    "generated_at": "2026-10-17T05:04:55.437000Z",
    "evidence_quality": {
      "evidence_count": 6,
      "average_confidence": 0.9500,
      "share_with_source_url": 0.6667,
      "counts_by_source_type": {
        "manual": 2,
        "website": 2,
        "review": 2
      },
      "stages_missing_evidence": []
    },
    "key_metrics": {
      "selling_price": "500.00",
      "contribution_per_unit": "240.00",
      "contribution_margin": 0.48,
      "break_even_units": 209
    },
    "stage_table": [
      { "stage": "customer", "status": "PASSED", "score": 100.0 },
      { "stage": "competitor", "status": "PASSED", "score": 100.0 },
      { "stage": "product_packaging", "status": "PASSED", "score": 100.0 },
      { "stage": "pricing", "status": "PASSED", "score": 100.0 },
      { "stage": "financial", "status": "PASSED", "score": 100.0 },
      { "stage": "marketing", "status": "PASSED", "score": 100.0 }
    ],
    "risks": [],
    "recommendations": [],
    "next_steps": [
      "Finalize packaging supplier quote to prevent margin erosion.",
      "Initiate pre-launch landing page traffic tests."
    ]
  },
  "markdown": "# Launch-Readiness Report: E2E Smoke Tumbler\n\n**Verdict**: GO\n..."
}
```

#### `GET /api/v1/products/{product_id}/reports/latest`
Fetch the most recent report generated for this product.
