from decimal import Decimal
from typing import Any, List, Literal, Optional, Union
import json
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    PROJECT_NAME: str = "LaunchTwin AI Backend"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/launchtwin"
    RESEARCH_PROVIDER: Literal["mock", "ai"] = "mock"
    ENVIRONMENT: Literal["development", "testing", "production"] = "development"
    LOG_LEVEL: str = "INFO"
    CORS_ORIGINS: Union[List[str], str] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://localhost:3000"]
    )

    # LLM Provider Configuration
    LLM_PROVIDER: str = "gemini"
    LLM_API_KEY: Optional[str] = None
    LLM_MODEL: Optional[str] = None
    LLM_TIMEOUT_SECONDS: int = 30

    # Page Fetcher Configuration
    RESEARCH_FETCH_TIMEOUT_SECONDS: int = 10
    RESEARCH_MAX_PAGE_BYTES: int = 1048576  # 1 MB
    RESEARCH_MAX_TEXT_LENGTH: int = 50000
    RESEARCH_MAX_REDIRECTS: int = 3
    RESEARCH_USER_AGENT: str = "LaunchTwinBot/1.0 (+https://launchtwin.example.com/bot)"

    # AI Research Limits & Caps
    RESEARCH_MAX_COMPETITORS: int = 5
    RESEARCH_TIME_BUDGET_SECONDS: int = 60
    RESEARCH_CONFIDENCE_CAP: Decimal = Decimal("0.8")
    RESEARCH_MAX_EVIDENCE_PER_COMPETITOR: int = 10
    RESEARCH_MAX_STRENGTHS: int = 10
    RESEARCH_MAX_WEAKNESSES: int = 10

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            v_clean = v.strip()
            if v_clean.startswith("[") and v_clean.endswith("]"):
                try:
                    parsed = json.loads(v_clean)
                    if isinstance(parsed, list):
                        return [str(i).strip() for i in parsed if str(i).strip()]
                except Exception:
                    pass
            return [i.strip() for i in v_clean.split(",") if i.strip()]
        elif isinstance(v, (list, tuple)):
            return [str(i).strip() for i in v if str(i).strip()]
        return ["http://localhost:5173", "http://localhost:3000"]


settings = Settings()

