from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional
from pydantic import BaseModel


def round_money(val: Optional[Decimal]) -> Optional[float]:
    if val is None:
        return None
    return float(Decimal(str(val)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def round_rate(val: Optional[Decimal]) -> Optional[float]:
    if val is None:
        return None
    return float(Decimal(str(val)).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP))


from backend.app.schemas.error import ErrorBody, ErrorDetail, ErrorResponse
