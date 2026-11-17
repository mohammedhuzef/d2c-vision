"""Unit tests for rules_config, scoring, and source code hygiene.

Tests:
- score_from for every status
- Stage score deductions, failed cap (40), floor (0), and null on INSUFFICIENT_EVIDENCE / NOT_RUN
- Stage weights sum to exactly Decimal("1.00")
- Source code scans:
  - No `float(` in backend/app/services
  - No forbidden imports (sqlalchemy, httpx, app.models, app.api, LLM clients)
  - No business-number literals outside rules_config.py
"""

from decimal import Decimal
from pathlib import Path
import re
import pytest

from backend.app.services.validation.base import Finding, Severity, Status
from backend.app.services.validation.rules_config import (
    BASE_SCORE,
    CRITICAL_DEDUCTION,
    CRITICAL_STAGES,
    FAILED_CAP,
    MIN_SCORE,
    STAGE_ORDER,
    STAGE_WEIGHTS,
    WARNING_DEDUCTION,
)
from backend.app.services.validation.scoring import score_from


def test_stage_weights_sum_to_exactly_one():
    """STAGE_WEIGHTS must sum to Decimal('1.00') exactly and cover all STAGE_ORDER."""
    total = sum(STAGE_WEIGHTS.values())
    assert total == Decimal("1.00")
    assert set(STAGE_WEIGHTS.keys()) == set(STAGE_ORDER)
    for stage, weight in STAGE_WEIGHTS.items():
        assert isinstance(weight, Decimal)
        assert weight > Decimal("0")


def test_critical_stages():
    """CRITICAL_STAGES must match pricing and financial."""
    assert CRITICAL_STAGES == frozenset({"pricing", "financial"})


def test_score_from_insufficient_evidence():
    """INSUFFICIENT_EVIDENCE yields None (null score)."""
    assert score_from(Status.INSUFFICIENT_EVIDENCE) is None
    assert score_from(Status.INSUFFICIENT_EVIDENCE, [Finding(code="C1", severity=Severity.WARNING, message="m")]) is None


def test_score_from_not_run():
    """NOT_RUN yields None (null score)."""
    assert score_from(Status.NOT_RUN) is None


def test_score_from_passed():
    """PASSED with no findings starts at 100.00."""
    score = score_from(Status.PASSED)
    assert score == Decimal("100.00")


def test_score_from_warning_deductions():
    """Warning findings deduct 25.00 points each."""
    f1 = Finding(code="W1", severity=Severity.WARNING, message="warn 1")
    f2 = Finding(code="W2", severity=Severity.WARNING, message="warn 2")

    score_1 = score_from(Status.WARNING, [f1])
    assert score_1 == Decimal("75.00")

    score_2 = score_from(Status.WARNING, [f1, f2])
    assert score_2 == Decimal("50.00")


def test_score_from_critical_deductions():
    """Critical findings deduct 30.00 points each."""
    f_crit = Finding(code="C1", severity=Severity.CRITICAL, message="crit 1")
    # Non-failed status with critical finding: 100 - 30 = 70.00
    score = score_from(Status.WARNING, [f_crit])
    assert score == Decimal("70.00")


def test_score_from_failed_cap():
    """FAILED stages are capped at 40.00."""
    # FAILED with no findings: 100 capped at 40.00
    score_no_findings = score_from(Status.FAILED)
    assert score_no_findings == Decimal("40.00")

    # FAILED with 1 warning finding: 100 - 25 = 75, capped at 40.00
    f_warn = Finding(code="W1", severity=Severity.WARNING, message="warn")
    score_warn = score_from(Status.FAILED, [f_warn])
    assert score_warn == Decimal("40.00")

    # FAILED with 1 critical finding: 100 - 30 = 70, capped at 40.00
    f_crit = Finding(code="C1", severity=Severity.CRITICAL, message="crit")
    score_crit = score_from(Status.FAILED, [f_crit])
    assert score_crit == Decimal("40.00")

    # FAILED with 3 critical findings: 100 - 90 = 10.00 (< 40.00, remains 10.00)
    score_multi_crit = score_from(Status.FAILED, [f_crit, f_crit, f_crit])
    assert score_multi_crit == Decimal("10.00")


def test_score_from_floor_zero():
    """Score never drops below 0.00."""
    f_crit = Finding(code="C1", severity=Severity.CRITICAL, message="crit")
    # 4 critical findings = 100 - 120 = -20 -> clamped to 0.00
    score_negative = score_from(Status.FAILED, [f_crit] * 4)
    assert score_negative == Decimal("0.00")


def test_source_hygiene_no_float():
    """Ensure no 'float(' exists in any Python file under backend/app/services."""
    services_dir = Path(__file__).resolve().parent.parent.parent / "app" / "services"
    violations = []
    for py_file in services_dir.rglob("*.py"):
        content = py_file.read_text(encoding="utf-8")
        for line_num, line in enumerate(content.splitlines(), start=1):
            # Check for float( but not in comments or docstrings
            stripped = line.strip()
            if not stripped.startswith("#") and "float(" in line:
                violations.append(f"{py_file.name}:{line_num}: {line}")

    assert not violations, f"Found 'float(' in services: {violations}"


def test_source_hygiene_no_forbidden_imports():
    """Ensure pure services import nothing from sqlalchemy, httpx, app.models, app.api, or LLMs."""
    services_dir = Path(__file__).resolve().parent.parent.parent / "app" / "services"
    forbidden = [
        "sqlalchemy",
        "httpx",
        "app.models",
        "app.api",
        "openai",
        "anthropic",
        "langchain",
    ]
    violations = []
    for py_file in services_dir.rglob("*.py"):
        content = py_file.read_text(encoding="utf-8")
        for line_num, line in enumerate(content.splitlines(), start=1):
            stripped = line.strip()
            if stripped.startswith("#"):
                continue
            for f in forbidden:
                if f"import {f}" in stripped or f"from {f}" in stripped:
                    violations.append(f"{py_file.name}:{line_num}: {line}")

    assert not violations, f"Found forbidden imports in services: {violations}"


def test_source_hygiene_no_business_numbers_outside_rules_config():
    """Ensure business-number literals (0.15, 0.25, 0.2, 0.6, 1.0, 2500, 0.4, 70, 50) only live in rules_config.py."""
    services_dir = Path(__file__).resolve().parent.parent.parent / "app" / "services"
    business_number_patterns = [
        r'(?<![0-9a-zA-Z_])0\.15(?![0-9])',
        r'(?<![0-9a-zA-Z_])0\.25(?![0-9])',
        r'(?<![0-9a-zA-Z_])0\.2(?![0-9])',
        r'(?<![0-9a-zA-Z_])0\.6(?![0-9])',
        r'(?<![0-9a-zA-Z_])1\.0(?![0-9])',
        r'(?<![0-9a-zA-Z_])2500(?![0-9])',
        r'(?<![0-9a-zA-Z_])0\.4(?![0-9])',
        r'(?<![0-9a-zA-Z_])70(?:\.00?)?(?![0-9])',
        r'(?<![0-9a-zA-Z_])50(?:\.00?)?(?![0-9])',
    ]

    violations = []
    for py_file in services_dir.rglob("*.py"):
        if py_file.name == "rules_config.py":
            continue
        content = py_file.read_text(encoding="utf-8")
        for line_num, line in enumerate(content.splitlines(), start=1):
            stripped = line.strip()
            if stripped.startswith("#"):
                continue
            for pat in business_number_patterns:
                if re.search(pat, line):
                    violations.append(f"{py_file.name}:{line_num}: {line}")
                    break

    assert not violations, f"Found business-number literals outside rules_config.py: {violations}"

