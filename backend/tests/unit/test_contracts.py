import json
from pathlib import Path
import pytest
from backend.app.main import app

ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
CONTRACTS_DIR = ROOT_DIR / "contracts"
OPENAPI_PATH = CONTRACTS_DIR / "openapi.json"
EXAMPLES_DIR = CONTRACTS_DIR / "examples"


def test_openapi_json_exists_and_is_not_stale():
    """CI test: fails if contracts/openapi.json is missing or out-of-date compared to app.openapi()."""
    assert OPENAPI_PATH.exists(), "contracts/openapi.json does not exist. Run python scripts/export_openapi.py."

    with open(OPENAPI_PATH, "r", encoding="utf-8") as f:
        committed_schema = json.load(f)

    current_schema = app.openapi()

    # Compare as JSON strings to ensure identical structure
    assert committed_schema == current_schema, (
        "contracts/openapi.json is STALE! Changes were made to routes/schemas without regenerating openapi.json. "
        "Run `python scripts/export_openapi.py` to update."
    )


def test_contract_examples_validity():
    """Verify all contracts/examples/*.json exist, parse as JSON, and have request and response keys."""
    assert EXAMPLES_DIR.exists(), "contracts/examples directory does not exist."
    example_files = list(EXAMPLES_DIR.glob("*.json"))
    assert len(example_files) >= 10, f"Expected at least 10 contract examples, found {len(example_files)}"

    for example_file in example_files:
        with open(example_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        assert "request" in data, f"{example_file.name} missing 'request' field"
        assert "response" in data, f"{example_file.name} missing 'response' field"


def test_contract_examples_validate_against_schemas():
    """Validates every example in contracts/examples/*.json against its exact Pydantic v2 schema."""
    from backend.app.schemas import (
        ProductCreate,
        ProductResponse,
        ProductListResponse,
        ProductDetailResponse,
        AssumptionsPatchRequest,
        AssumptionsPatchResponse,
        CompetitorCreate,
        CompetitorListResponse,
        ResearchStartResponse,
        ResearchStatusResponse,
        ResearchIngestRequest,
        ResearchIngestResponse,
        ValidationRunResponse,
        RevalidateRequest,
        ProductVersionListResponse,
        VersionCompareResponse,
        ReportResponse,
        ReportListResponse,
        RecommendationListResponse,
        ErrorResponse,
        SimulationRequest,
        SimulationResponse,
        ImpactEventListResponse,
        EvidenceListResponse,
        ResearchRunListResponse,
    )

    mapping = {
        "post_products.json": (ProductCreate, lambda r: r, ProductResponse),
        "get_products.json": (None, None, ProductListResponse),
        "get_product_detail.json": (None, None, ProductDetailResponse),
        "patch_assumptions.json": (AssumptionsPatchRequest, lambda r: r.get("body", r), AssumptionsPatchResponse),
        "post_competitors.json": (CompetitorCreate, lambda r: r.get("body", r), CompetitorListResponse),
        "get_competitors.json": (None, None, CompetitorListResponse),
        "post_research.json": (None, None, ResearchStartResponse),
        "get_research.json": (None, None, ResearchStatusResponse),
        "get_research_list.json": (None, None, ResearchRunListResponse),
        "post_internal_research_results.json": (ResearchIngestRequest, lambda r: r, ResearchIngestResponse),
        "post_validate.json": (None, None, ValidationRunResponse),
        "get_validation.json": (None, None, ValidationRunResponse),
        "post_revalidate.json": (RevalidateRequest, lambda r: r.get("body", r), ValidationRunResponse),
        "get_versions.json": (None, None, ProductVersionListResponse),
        "get_versions_compare.json": (None, None, VersionCompareResponse),
        "post_reports.json": (None, None, ReportResponse),
        "get_reports.json": (None, None, ReportResponse),
        "get_reports_list.json": (None, None, ReportListResponse),
        "get_report_latest.json": (None, None, ReportResponse),
        "get_recommendations.json": (None, None, RecommendationListResponse),
        "error_response.json": (None, None, ErrorResponse),
        "post_simulate.json": (SimulationRequest, lambda r: r.get("body", r), SimulationResponse),
        "get_impact_events.json": (None, None, ImpactEventListResponse),
        "get_evidence.json": (None, None, EvidenceListResponse),
    }

    for filename, (req_cls, extractor, res_cls) in mapping.items():
        file_path = EXAMPLES_DIR / filename
        assert file_path.exists(), f"Expected example file {filename} does not exist."
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        if req_cls:
            req_data = extractor(data["request"])
            req_instance = req_cls.model_validate(req_data)
            assert req_instance is not None

        if res_cls:
            res_data = data["response"]
            res_instance = res_cls.model_validate(res_data)
            assert res_instance is not None

