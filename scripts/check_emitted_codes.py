import os
import sys
from pathlib import Path

os.environ['DISABLE_SQLALCHEMY_CEXT'] = '1'
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.services.validation.stages import (
    customer,
    competitor,
    product_packaging,
    pricing,
    financial,
    marketing,
)
import backend.app.services.finance as fin

canonical_base = [
    "MISSING_INPUT",
    "CUSTOMER_INTERVIEWS_INSUFFICIENT",
    "CUSTOMER_INTERVIEWS_LOW",
    "COMPETITORS_INSUFFICIENT",
    "COMPETITOR_EVIDENCE_MISSING",
    "UNDIFFERENTIATED_PRODUCT",
    "NO_PRICE_DATA",
    "PACKAGING_COST_MISMATCH",
    "PACKAGING_COST_HIGH",
    "PACKAGING_COST_EXCESSIVE",
    "NO_COMPETITOR_BAND",
    "NEGATIVE_UNIT_ECONOMICS",
    "STAGE_ERROR",
]

stages = {
    "customer": customer,
    "competitor": competitor,
    "product_packaging": product_packaging,
    "pricing": pricing,
    "financial": financial,
    "marketing": marketing,
}

all_emitted = set()

print("=== EMITTED CODES PER STAGE ===")
for name, mod in stages.items():
    codes = getattr(mod, "EMITTED_CODES", None)
    if codes is not None:
        print(f"\n{name} ({len(codes)}):")
        for c in sorted(codes):
            print(f"  - {c}")
            all_emitted.add(c)
    else:
        print(f"\n{name}: No EMITTED_CODES attribute found!")

# Check finance issues
fin_issues = getattr(fin, "IssueCode", None)
if fin_issues:
    print(f"\nfinance IssueCode:")
    for item in fin_issues:
        print(f"  - {item.value}")
        all_emitted.add(item.value)

print("\n=== TOTAL UNIQUE EMITTED CODES ===")
for c in sorted(all_emitted):
    print(f" - {c}")

print("\n=== CANONICAL BASE COMPARISON ===")
for c in canonical_base:
    status = "PRESENT" if c in all_emitted else "MISSING"
    print(f" - {c}: {status}")

extras = all_emitted - set(canonical_base)
print(f"\nPricing / Financial / Marketing Specific Codes (beyond canonical base):")
for e in sorted(extras):
    print(f" + {e}")
