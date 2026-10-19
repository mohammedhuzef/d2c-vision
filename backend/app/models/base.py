import uuid
from datetime import datetime, timezone
from typing import Any, List
from sqlalchemy import DateTime, Uuid, JSON, Text, types
from sqlalchemy.dialects.postgresql import JSONB, ARRAY, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

UUID_TYPE = PG_UUID(as_uuid=True).with_variant(Uuid(as_uuid=True), "sqlite")
JSONB_TYPE = JSONB().with_variant(JSON(), "sqlite")


class SQLiteUUIDList(types.TypeDecorator):
    """Stores list of UUIDs as list of strings in SQLite JSON."""
    impl = JSON
    cache_ok = True

    def process_bind_param(self, value: Any, dialect: Any) -> Any:
        if value is None:
            return []
        return [str(v) for v in value]

    def process_result_value(self, value: Any, dialect: Any) -> Any:
        if not value:
            return []
        return [uuid.UUID(str(v)) for v in value]


ARRAY_UUID_TYPE = ARRAY(PG_UUID(as_uuid=True)).with_variant(SQLiteUUIDList(), "sqlite")
ARRAY_TEXT_TYPE = ARRAY(Text()).with_variant(JSON(), "sqlite")


from sqlalchemy import DateTime, Uuid, JSON, Text, func, types


class TimestampedUUIDMixin:
    id: Mapped[uuid.UUID] = mapped_column(
        UUID_TYPE,
        primary_key=True,
        default=uuid.uuid4,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
    )
