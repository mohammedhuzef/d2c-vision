"""Cross-layer invariant tests for pure validation and finance layers.

Step 7 Part A.5:
Enforces:
1. Zero 'float(' in app/services/validation/, app/services/finance.py, app/services/readiness.py
2. Zero forbidden imports (sqlalchemy, httpx, app.models, app.api, openai, anthropic, langchain)
   in pure layers (finance, readiness, base, stages, recommendations, simulation)
3. Zero numeric business literals outside rules_config.py
"""

from pathlib import Path
import re
import pytest

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
SERVICES_DIR = ROOT_DIR / "app" / "services"
VALIDATION_DIR = SERVICES_DIR / "validation"
FINANCE_PATH = SERVICES_DIR / "finance.py"
READINESS_PATH = SERVICES_DIR / "readiness.py"


def test_cross_layer_no_float_calls():
    """No 'float(' calls in services/validation, services/finance.py, or services/readiness.py."""
    files_to_check = [FINANCE_PATH, READINESS_PATH] + list(VALIDATION_DIR.rglob("*.py"))
    violations = []

    for f in files_to_check:
        if not f.exists():
            continue
        content = f.read_text(encoding="utf-8")
        for idx, line in enumerate(content.splitlines(), start=1):
            stripped = line.strip()
            if stripped.startswith("#"):
                continue
            if "float(" in stripped:
                violations.append(f"{f.name}:{idx} -> {stripped}")

    assert not violations, f"Found 'float(' calls in validation/finance services:\n" + "\n".join(violations)


def test_cross_layer_no_forbidden_imports_in_pure_layers():
    """
    Pure layers must import zero database, ORM, HTTP or LLM dependencies:
    - finance.py
    - readiness.py
    - validation/base.py
    - validation/stages/*.py
    - validation/recommendations/*.py
    - validation/simulation.py
    """
    pure_files = [
        FINANCE_PATH,
        READINESS_PATH,
        VALIDATION_DIR / "base.py",
        VALIDATION_DIR / "simulation.py",
    ]
    pure_files.extend(list((VALIDATION_DIR / "stages").glob("*.py")))
    pure_files.extend(list((VALIDATION_DIR / "recommendations").glob("*.py")))

    forbidden_patterns = [
        "import sqlalchemy",
        "from sqlalchemy",
        "import httpx",
        "from httpx",
        "backend.app.models",
        "app.models",
        "backend.app.api",
        "app.api",
        "import openai",
        "from openai",
        "import anthropic",
        "from anthropic",
        "import langchain",
        "from langchain",
    ]

    violations = []
    for f in pure_files:
        if not f.exists():
            continue
        content = f.read_text(encoding="utf-8")
        for pattern in forbidden_patterns:
            if pattern in content:
                violations.append(f"{f.name}: imports forbidden module '{pattern}'")

    assert not violations, f"Forbidden imports detected in pure layers:\n" + "\n".join(violations)


def test_cross_layer_no_numeric_business_literals_outside_rules_config():
    """
    Business thresholds, margin cutoffs, and deduction amounts must NOT be hardcoded
    inline across stages, readiness, recommendations, or simulation.
    All business constants must live in rules_config.py.
    """
    files_to_check = [
        READINESS_PATH,
        VALIDATION_DIR / "simulation.py",
    ]
    files_to_check.extend([
        f for f in (VALIDATION_DIR / "stages").glob("*.py")
        if f.name != "__init__.py"
    ])
    files_to_check.extend([
        VALIDATION_DIR / "recommendations" / "rules.py",
        VALIDATION_DIR / "recommendations" / "generator.py",
        VALIDATION_DIR / "recommendations" / "calculations.py",
    ])

    forbidden_threshold_patterns = [
        r'Decimal\("0\.15"\)',
        r'Decimal\("0\.25"\)',
        r'Decimal\("0\.20"\)',
        r'Decimal\("0\.40"\)',
        r'Decimal\("0\.60"\)',
        r'Decimal\("70\.00"\)',
        r'Decimal\("50\.00"\)',
        r'Decimal\("40\.00"\)',
    ]

    violations = []
    for f in files_to_check:
        if not f.exists():
            continue
        code = f.read_text(encoding="utf-8")
        for pat in forbidden_threshold_patterns:
            matches = re.findall(pat, code)
            if matches:
                violations.append(f"{f.name}: contains inline threshold literal matching {pat}")

    assert not violations, f"Inline numeric business literals found outside rules_config.py:\n" + "\n".join(violations)
