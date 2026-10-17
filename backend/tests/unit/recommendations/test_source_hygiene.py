"""Source scan tests for recommendation engine and validation services.

Enforces:
- Zero float( in services/validation and recommendations package
- Zero forbidden imports (sqlalchemy, httpx, app.models, app.api) in recommendations package
- Zero numeric business thresholds inline in engine files
"""

from pathlib import Path
import re
import pytest

ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
VALIDATION_SERVICES_DIR = ROOT_DIR / "app" / "services" / "validation"
RECOMMENDATIONS_DIR = VALIDATION_SERVICES_DIR / "recommendations"


def test_no_float_in_recommendations_and_validation():
    """No 'float(' calls in services/validation or recommendations package."""
    py_files = list(VALIDATION_SERVICES_DIR.rglob("*.py"))
    assert len(py_files) > 0, "No python files found in validation directory"

    violations = []
    for f in py_files:
        content = f.read_text(encoding="utf-8")
        lines = content.splitlines()
        for idx, line in enumerate(lines, start=1):
            stripped = line.strip()
            # Ignore comments
            if stripped.startswith("#"):
                continue
            if "float(" in stripped:
                violations.append(f"{f.name}:{idx} -> {stripped}")

    assert not violations, f"Found float() calls in validation services:\n" + "\n".join(violations)


def test_no_forbidden_imports_in_recommendations_engine():
    """
    Recommendations package is pure:
    Zero imports from sqlalchemy, httpx, app.models, or app.api.
    """
    py_files = list(RECOMMENDATIONS_DIR.glob("*.py"))
    assert len(py_files) > 0, "No python files found in recommendations directory"

    forbidden_patterns = [
        "import sqlalchemy",
        "from sqlalchemy",
        "import httpx",
        "from httpx",
        "backend.app.models",
        "app.models",
        "backend.app.api",
        "app.api",
    ]

    violations = []
    for f in py_files:
        content = f.read_text(encoding="utf-8")
        for pattern in forbidden_patterns:
            if pattern in content:
                violations.append(f"{f.name}: imports forbidden module '{pattern}'")

    assert not violations, f"Forbidden imports in recommendations package:\n" + "\n".join(violations)


def test_no_numeric_business_threshold_literals_in_recommendations():
    """
    Engine files must not contain inline numeric business literals.
    Thresholds and step sizes must come from rules_config.py.
    """
    files_to_check = [
        RECOMMENDATIONS_DIR / "calculations.py",
        RECOMMENDATIONS_DIR / "rules.py",
        RECOMMENDATIONS_DIR / "generator.py",
    ]

    # Thresholds that must not be inlined
    forbidden_literals = [
        'Decimal("0.15")',
        'Decimal("0.25")',
        'Decimal("0.20")',
        'Decimal("0.40")',
        'Decimal("0.60")',
        'Decimal("1.00")',
    ]

    violations = []
    for f in files_to_check:
        content = f.read_text(encoding="utf-8")
        for lit in forbidden_literals:
            if lit in content:
                violations.append(f"{f.name}: contains inline threshold literal {lit} (must reference rules_config)")

    assert not violations, f"Found inline numeric threshold literals:\n" + "\n".join(violations)
