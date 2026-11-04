# LaunchTwin AI — System Architecture & Design Specification

This document details the architectural boundaries, deterministic pipeline sequencing, dependency invalidation graphs, safe AI research boundaries, stale-run recovery, and precision arithmetic rules governing LaunchTwin AI.

---

## 1. Architectural Layers & Boundaries

LaunchTwin enforces a strict separation between I/O layers (HTTP, ORM, AI, network) and the deterministic core:

```mermaid
graph TD
    subgraph Layer 1: Client & External
        WEB["Vite / React Client"]
        HTTP_IN["External Ingestion Webhooks"]
        WWW["Target Competitor Websites"]
        LLM_EXT["Gemini / Anthropic REST APIs"]
    end

    subgraph Layer 2: API & Transport (app/api/v1)
        ROUTER["FastAPI Routers: Products, Competitors, Validation, Simulation, Reports, Influencers"]
        MIDDLEWARE["Error Envelopes, Request ID, CORS, Body Size Limit, Rate Limiter"]
    end

    subgraph Layer 3: Persistence (app/models & core/database)
        ORM["SQLAlchemy 2.0 Models: Product, Version, ValidationRun, Evidence, ImpactEvent, Report, Influencer"]
        DB[("PostgreSQL 16 / SQLite Fallback")]
    end

    subgraph Layer 4: AI & Research Services (app/services)
        RP["ResearchProvider Protocol"]
        MRP["MockResearchProvider"]
        ARP["AIResearchProvider"]
        PF["PageFetcher: SSRF Guarded & Streaming"]
        LLMC["LLMClient: GeminiRESTClient / AnthropicRESTClient"]
        RECOV["Stale Run Recovery (900s timeout guard)"]
    end

    subgraph Layer 5: Pure Deterministic Engines (ZERO I/O, ZERO Float)
        VO["Validation Orchestrator"]
        STAGES["6 Sequential Stages: Customer, Competitor, Packaging, Pricing, Financial, Marketing"]
        FIN["Finance Engine: Decimal Math"]
        DEP["Dependency Engine: Stage Invalidation DAG"]
        READ["Readiness Scoring Engine"]
        REC["Recommendation Generator"]
        SIM["What-If Simulation Engine"]
        IMP["Impact Tracker: JSON Patch & Stage Diffing"]
    end

    WEB --> ROUTER
    HTTP_IN --> ROUTER
    ROUTER --> ORM
    ORM --> DB
    
    ROUTER --> RP
    RP --> MRP
    RP --> ARP
    ARP --> PF
    ARP --> LLMC
    RP --> RECOV
    PF --> WWW
    LLMC --> LLM_EXT
    ARP -.->|Persist Evidence Rows| ORM

    ROUTER --> VO
    ROUTER --> SIM
    VO --> FIN
    VO --> STAGES
    VO --> DEP
    VO --> READ
    VO --> REC
    ROUTER --> IMP
    IMP --> DEP
```

### Pure Layer Invariant Rule
The pure domain modules (`finance.py`, `dependencies.py`, `readiness.py`, `recommendations/`, `stages/`, `simulation.py`, `orchestrator.py`) **import nothing** from:
- `sqlalchemy` or ORM models
- `httpx` or network clients
- `openai`, `anthropic`, or LLM clients
- `app.models` or `app.api`
- Python `float` (all arithmetic uses `decimal.Decimal`)

---

## 2. Stage Dependency Graph & Execution Order

The sequential validation pipeline evaluates 6 business stages in topological order:

```mermaid
graph LR
    CUST["1. customer (15%)"] --> COMP["2. competitor (15%)"]
    COMP --> PACK["3. product_packaging (15%)"]
    PACK --> PRICE["4. pricing (20% CRITICAL)"]
    PRICE --> FIN["5. financial (20% CRITICAL)"]
    FIN --> MKT["6. marketing (15%)"]

    classDef critical stroke:#e53e3e,stroke-width:2px,fill:#fff5f5;
    class PRICE,FIN critical;
```

### Critical Stages
- **`pricing`** (Weight 20%): Validates target margin compliance and asserts that the product price falls within competitive market price corridors (`-20%` below min to `+15%` above max). Margin `< 15%` triggers `FAILED`.
- **`financial`** (Weight 20%): Validates unit economics, variable cost ceilings, positive contribution margin, and break-even unit feasibility. Contribution margin `<= 0` triggers `FAILED`.
- **Rule**: If *any* critical stage status is `FAILED`, the overall product readiness verdict is capped at `NOT_READY`, regardless of other stage scores.

### Upstream and Downstream Dependencies
- `pricing` depends on `competitor` (requires observed competitor prices for corridor).
- `financial` depends on `pricing` (uses selling price for margin and break-even).
- `marketing` depends on `financial` (uses contribution per unit as denominator for CAC ratio).

---

## 3. Assumption Patching & Selective Revalidation Flow

When product assumptions change, LaunchTwin generates a new immutable version and re-evaluates only downstream affected stages:

```mermaid
sequenceDiagram
    autonumber
    actor User as Client / User
    participant API as PATCH /assumptions
    participant IMP as ImpactTracker
    participant DEP as Dependency Engine
    participant ORM as Database (product_versions)
    participant VO as Validation Orchestrator

    User->>API: PATCH assumptions (e.g. packaging_cost: 30 -> 60, revalidate=True)
    API->>IMP: diff_assumptions(old_assumptions, new_assumptions)
    IMP-->>API: changed_fields: ["packaging.packaging_cost"]
    
    API->>DEP: get_affected_stages(changed_fields)
    DEP-->>API: closure: ["product_packaging", "pricing", "financial", "marketing"]
    
    API->>ORM: Create product_versions record (immutable v2, parent_version=1)
    API->>ORM: Log ImpactEvent (field diffs, invalidated stages)

    alt revalidate == True
        API->>VO: run_pipeline(version=2, stages=[packaging, pricing, financial, marketing])
        VO->>VO: Carry forward clean stage results from v1 (customer, competitor)
        VO->>VO: Execute only affected stages (packaging -> pricing -> financial -> marketing)
        VO->>ORM: Persist validation_runs (v2) with carried-forward stage references
    end
    API-->>User: Return 200 OK (v2, changed_fields, carried_forward_stages, new_scores)
```

---

## 4. Market Research Engine, Anti-SSRF, Anti-Hallucination, and Stale Recovery

The market research subsystem gathers competitive intelligence without allowing untrusted web data or LLMs to alter financial calculations or stage verdicts:

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant API as POST /products/{id}/research
    participant REC as Stale Recovery Guard
    participant ARP as AIResearchProvider
    participant PF as PageFetcher (Safe Streaming)
    participant DNS as OS Resolver
    participant LLM as LLMClient (Gemini / Anthropic)
    participant DB as Evidence Store (research_evidence)

    Client->>API: Trigger research run
    API->>REC: Check existing runs for product
    alt Active run < 900s
        REC-->>API: Return 409 Conflict
    else Stale run >= 900s
        REC->>DB: Mark stale run FAILED ("stale: process interrupted")
        REC-->>API: Proceed with new run
    end

    API->>ARP: execute(product_id, competitors) in separate DB task session
    
    loop For each competitor
        ARP->>PF: fetch_and_clean_text(competitor.website_url)
        PF->>PF: Check scheme (HTTP/HTTPS only)
        PF->>DNS: Resolve Hostname to IP
        PF->>PF: Anti-SSRF Check: Reject loopback, private IPv4/IPv6, hex, decimal, link-local
        PF->>PF: Stream body (cap at 1MB, timeout at 10s)
        PF-->>ARP: Clean extracted static text
        
        ARP->>LLM: complete(system=Strict JSON Extractor, user=Clean Text)
        Note over LLM: Strict schema: observed_price, claims, strengths, weaknesses.
        LLM-->>ARP: Structured JSON (Claims & Prices only)
        
        ARP->>ARP: Anti-Hallucination Guard: Cross-check price against raw text
        ARP->>ARP: Compute SHA-256 content_hash for deduplication
        ARP->>DB: Save research_evidence row (Confidence capped at 0.80)
    end

    ARP-->>API: Research run status: completed (or FAILED on unhandled crash)
    API-->>Client: Return 202 Accepted / Run status
```

### Security, Hallucination, and Recovery Guardrails
1. **Network Boundary**: AI and HTTP network access are isolated to `services/page_fetcher.py` and `services/llm_client.py`. All other modules operate offline.
2. **Anti-SSRF Enforcement**:
   - Rejects loopback addresses (`127.0.0.0/8`, `::1`).
   - Rejects IPv6-mapped IPv4 addresses (e.g. `::ffff:127.0.0.1`).
   - Rejects decimal and hex IP representations (e.g. `http://2130706433`, `http://0x7f000001`).
   - Rejects RFC 1918 private ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
   - Follows redirects manually up to 3 hops, verifying destination IP after each redirect before requesting the next hop.
3. **Anti-Hallucination Constraints**:
   - LLMs are restricted to returning JSON with `observed_price`, `claims`, `strengths`, and `weaknesses`.
   - AI outputs are stored exclusively as `research_evidence` rows.
   - AI confidence is strictly capped at `0.80` (manual entries receive `1.00`).
   - The validation pipeline reads evidence rows to evaluate competitive coverage, but Python formulas calculate all price differences, margins, and thresholds.
4. **Stale Run Recovery**:
   - Background tasks execute in dedicated database sessions (`get_task_session()`).
   - Any run remaining in `running` status longer than `RESEARCH_STALE_AFTER_SECONDS` (default: 900s) is automatically marked `FAILED` with error message `"stale: process interrupted"`.
   - Stale runs are cleaned up at server startup via FastAPI lifespan and before starting any new research run.

---

## 5. Rounding Rules & Precision Standards

All calculations follow strict precision rules to guarantee deterministic parity between local and production environments:

| Metric Type | Representation | Rounding Mode | Precision Rule | Code Example |
| :--- | :--- | :--- | :--- | :--- |
| **Monetary Amounts** | `Decimal` / `String` | `ROUND_HALF_UP` | Exactly 2 decimal places (`0.01`) | `price.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)` |
| **Ratios / Margins / Rates** | `Decimal` / `Float` | `ROUND_HALF_UP` | Exactly 4 decimal places (`0.0001`) | `margin.quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)` |
| **Readiness Scores** | `Decimal` / `String` | `ROUND_HALF_UP` | Exactly 2 decimal places (`0.01`), range `0.00` to `100.00` | `score.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)` |
| **Break-Even Units** | `Integer` | Ceiling | Smallest integer `>= Fixed Costs / Contribution` | `int(math.ceil(fixed_costs / contribution))` |
| **Confidence Scores** | `Decimal` / `Float` | `ROUND_HALF_UP` | 2 decimal places, range `0.00` to `1.00` | `round(confidence, 2)` |

---

## 6. Centralized Business Thresholds

All thresholds, scoring weights, and stage boundaries reside in a single configuration file:
[`backend/app/services/validation/rules_config.py`](file:///c:/Users/huzef/OneDrive/Desktop/d2c-platform/backend/app/services/validation/rules_config.py)

### Stage Weights:
- `customer`: 15% (`0.15`)
- `competitor`: 15% (`0.15`)
- `product_packaging`: 15% (`0.15`)
- `pricing`: 20% (`0.20`) [CRITICAL]
- `financial`: 20% (`0.20`) [CRITICAL]
- `marketing`: 15% (`0.15`)
- *Sum = 100%*

### Thresholds & Scoring Deductions:
- **Base Starting Score**: `100.00`
- **Warning Finding**: `-25.00` points
- **Critical Finding**: `-30.00` points
- **Failed Stage Score Cap**: `40.00`
- **Readiness Cutoffs**:
  - `READY`: Score `≥ 70.00` and all stages passed.
  - `READY_WITH_WARNINGS`: Score `≥ 50.00` or warnings present without failures.
  - `NOT_READY`: Score `< 50.00` or any critical stage failed.
