"""
Gemini REST LLM Client.

Handles structured content generation with Google Gemini REST API.
Enforces security rules:
- API key passed solely in x-goog-api-key header (never in URL, never logged).
- Secret masking on all error messages and exceptions.
- Temperature 0 and structured JSON schema.
- Per-run call budget from settings.
- Bounded retries with backoff on 429 and 5xx.
- Helpful error messages on 404 model not found pointing to scripts/check_gemini.py.
"""

import json
import logging
import os
import time
from typing import Any, Dict, Optional
import httpx

from backend.app.core.config import settings

logger = logging.getLogger("launchtwin.llm_client")


class LLMError(Exception):
    """Base exception for all LLM errors. Sanitized against credential leaks."""
    def __init__(self, message: str, sanitized_secret: Optional[str] = None):
        if sanitized_secret and sanitized_secret.strip():
            message = message.replace(sanitized_secret.strip(), "[REDACTED_API_KEY]")
        super().__init__(message)


class LLMQuotaExceededError(LLMError):
    """Raised when the per-run call budget is exhausted."""
    pass


class LLMModelNotFoundError(LLMError):
    """Raised when the specified Gemini model returns HTTP 404."""
    pass


class LLMAuthenticationError(LLMError):
    """Raised when Gemini rejects the API key (401/403) or key is missing."""
    pass


class LLMClient:
    """
    Client for Google Gemini REST API generateContent endpoint.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        timeout_seconds: Optional[int] = None,
        call_budget: Optional[int] = None,
        max_retries: Optional[int] = None,
    ):
        self.api_key = (
            api_key
            if api_key is not None
            else (
                settings.LLM_API_KEY
                or os.environ.get("GEMINI_API_KEY")
                or os.environ.get("GOOGLE_API_KEY")
            )
        )
        self.model = model or getattr(settings, "LLM_MODEL", "gemini-2.5-flash")
        self.timeout_seconds = timeout_seconds or settings.LLM_TIMEOUT_SECONDS
        self.call_budget = (
            call_budget
            if call_budget is not None
            else getattr(settings, "LLM_CALL_BUDGET_PER_RUN", 10)
        )
        self.max_retries = (
            max_retries
            if max_retries is not None
            else getattr(settings, "LLM_MAX_RETRIES", 3)
        )
        self.calls_made: int = 0

    def _sanitize(self, msg: str) -> str:
        if self.api_key and self.api_key.strip():
            return msg.replace(self.api_key.strip(), "[REDACTED_API_KEY]")
        return msg

    def generate_json(
        self,
        prompt: str,
        schema: Optional[Dict[str, Any]] = None,
        system_instruction: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Sends structured JSON generation request to Gemini REST API.
        Never embeds API key in the URL.
        """
        if not self.api_key or not self.api_key.strip():
            raise LLMAuthenticationError("LLM_API_KEY is not configured or empty")

        if self.calls_made >= self.call_budget:
            raise LLMQuotaExceededError(
                f"LLM call budget exceeded: maximum of {self.call_budget} calls allowed per run"
            )

        clean_model = self.model.replace("models/", "").strip()
        endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{clean_model}:generateContent"

        headers = {
            "x-goog-api-key": self.api_key.strip(),
            "Content-Type": "application/json",
        }

        # Temperature 0 and structured JSON schema
        gen_config: Dict[str, Any] = {
            "temperature": 0,
            "responseMimeType": "application/json",
        }
        if schema:
            gen_config["responseSchema"] = schema

        payload: Dict[str, Any] = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt}
                    ]
                }
            ],
            "generationConfig": gen_config,
        }

        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [
                    {"text": system_instruction}
                ]
            }

        last_error: Optional[Exception] = None

        for attempt in range(1, self.max_retries + 1):
            self.calls_made += 1
            try:
                with httpx.Client(timeout=self.timeout_seconds) as client:
                    resp = client.post(endpoint, headers=headers, json=payload)

                if resp.status_code == 200:
                    try:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if not candidates:
                            raise LLMError("Gemini returned empty candidates list", self.api_key)

                        content_parts = candidates[0].get("content", {}).get("parts", [])
                        if not content_parts:
                            raise LLMError("Gemini candidate has no content parts", self.api_key)

                        text_body = content_parts[0].get("text", "").strip()
                        if not text_body:
                            raise LLMError("Gemini candidate returned empty text", self.api_key)

                        parsed_json = json.loads(text_body)
                        if not isinstance(parsed_json, dict):
                            raise LLMError(
                                f"Expected JSON object from LLM, got {type(parsed_json).__name__}",
                                self.api_key,
                            )
                        return parsed_json

                    except json.JSONDecodeError as jde:
                        raise LLMError(
                            f"LLM returned malformed JSON: {self._sanitize(str(jde))}",
                            self.api_key,
                        )

                # HTTP 404: Model Not Found
                if resp.status_code == 404:
                    raise LLMModelNotFoundError(
                        f"Gemini model '{clean_model}' was not found (404). "
                        "Run 'python scripts/check_gemini.py' to list available models and update LLM_MODEL in .env.",
                        self.api_key,
                    )

                # HTTP 401 or 403: Auth failure
                if resp.status_code in (401, 403):
                    raise LLMAuthenticationError(
                        f"Gemini API authentication failed (HTTP {resp.status_code}). Verify your LLM_API_KEY.",
                        self.api_key,
                    )

                # HTTP 429 or 5xx: Transient error eligible for bounded retry
                if resp.status_code == 429 or 500 <= resp.status_code <= 599:
                    safe_msg = f"Gemini API returned status {resp.status_code} on attempt {attempt}/{self.max_retries}"
                    logger.warning(safe_msg)
                    last_error = LLMError(safe_msg, self.api_key)
                    if attempt < self.max_retries:
                        # Exponential backoff (1s, 2s)
                        backoff_delay = 1 if attempt == 1 else 2
                        time.sleep(backoff_delay)
                        continue
                    else:
                        raise last_error

                # Other HTTP errors
                raise LLMError(
                    f"Gemini API request failed with status {resp.status_code}",
                    self.api_key,
                )

            except httpx.TimeoutException as te:
                safe_timeout_msg = f"Gemini API call timed out after {self.timeout_seconds}s"
                logger.warning(safe_timeout_msg)
                last_error = LLMError(safe_timeout_msg, self.api_key)
                if attempt < self.max_retries:
                    time.sleep(1)
                    continue
                else:
                    raise last_error

            except httpx.RequestError as re:
                safe_req_msg = f"Gemini API network error: {self._sanitize(str(re))}"
                logger.warning(safe_req_msg)
                last_error = LLMError(safe_req_msg, self.api_key)
                if attempt < self.max_retries:
                    time.sleep(1)
                    continue
                else:
                    raise last_error

        if last_error:
            raise last_error
        raise LLMError("Gemini request failed without specific error", self.api_key)
