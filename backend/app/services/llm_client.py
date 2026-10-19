import json
import logging
import time
from typing import Any, Dict, List, Optional, Protocol, Union
import httpx

from backend.app.core.config import settings

logger = logging.getLogger(__name__)


class LLMError(Exception):
    """Typed exception for LLM provider errors. Never leaks API keys."""

    def __init__(self, message: str, api_key_to_scrub: Optional[str] = None):
        clean_msg = str(message)
        if api_key_to_scrub and api_key_to_scrub in clean_msg:
            clean_msg = clean_msg.replace(api_key_to_scrub, "[REDACTED_KEY]")
        super().__init__(clean_msg)


class LLMClient(Protocol):
    def complete(self, system: str, user: str) -> str:
        """Completes a prompt with system and user messages."""
        ...


def _scrub_key(text: str, key: Optional[str]) -> str:
    if not key or not text:
        return text
    return text.replace(key, "[REDACTED_KEY]")


def _execute_with_retry(
    client: httpx.Client,
    method: str,
    url: str,
    headers: Dict[str, str],
    json_data: Dict[str, Any],
    api_key: str,
    backoff_seconds: int = 1,
) -> httpx.Response:
    max_attempts = 2
    for attempt in range(1, max_attempts + 1):
        try:
            resp = client.request(method, url, headers=headers, json=json_data)
            if resp.status_code in (429, 500, 502, 503, 504):
                if attempt < max_attempts:
                    if backoff_seconds > 0:
                        time.sleep(backoff_seconds)
                    continue
                err_text = _scrub_key(resp.text, api_key)
                raise LLMError(
                    f"LLM request failed with status {resp.status_code}: {err_text}",
                    api_key_to_scrub=api_key,
                )
            elif resp.status_code >= 400:
                err_text = _scrub_key(resp.text, api_key)
                raise LLMError(
                    f"LLM request failed with status {resp.status_code}: {err_text}",
                    api_key_to_scrub=api_key,
                )
            return resp
        except (httpx.TimeoutException, httpx.RequestError) as exc:
            if attempt < max_attempts:
                if backoff_seconds > 0:
                    time.sleep(backoff_seconds)
                continue
            err_msg = _scrub_key(str(exc), api_key)
            raise LLMError(
                f"LLM network failure ({type(exc).__name__}): {err_msg}",
                api_key_to_scrub=api_key,
            ) from None


class GeminiClient:
    """REST client for Google Gemini (Generative Language API v1beta)."""

    def __init__(
        self,
        api_key: str,
        model: str,
        timeout_seconds: Optional[int] = None,
        transport: Optional[httpx.BaseTransport] = None,
        backoff_seconds: int = 1,
    ):
        self.api_key = api_key
        self.model = model
        self.timeout_seconds = timeout_seconds or settings.LLM_TIMEOUT_SECONDS
        self.transport = transport
        self.backoff_seconds = backoff_seconds

    def complete(self, system: str, user: str) -> str:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": self.api_key,
        }
        body: Dict[str, Any] = {
            "system_instruction": {
                "parts": [{"text": system}]
            },
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": user}],
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
            },
        }

        with httpx.Client(timeout=self.timeout_seconds, transport=self.transport) as client:
            resp = _execute_with_retry(
                client=client,
                method="POST",
                url=url,
                headers=headers,
                json_data=body,
                api_key=self.api_key,
                backoff_seconds=self.backoff_seconds,
            )

        try:
            data = resp.json()
        except Exception as e:
            raise LLMError(f"Failed to parse Gemini JSON: {e}", api_key_to_scrub=self.api_key)

        candidates = data.get("candidates", [])
        if not candidates:
            raise LLMError("Gemini response contained no candidates", api_key_to_scrub=self.api_key)

        parts = candidates[0].get("content", {}).get("parts", [])
        if not parts or "text" not in parts[0]:
            raise LLMError("Gemini response candidate contained no text parts", api_key_to_scrub=self.api_key)

        return str(parts[0]["text"])


class AnthropicClient:
    """REST client for Anthropic Messages API v1."""

    def __init__(
        self,
        api_key: str,
        model: str,
        timeout_seconds: Optional[int] = None,
        transport: Optional[httpx.BaseTransport] = None,
        backoff_seconds: int = 1,
    ):
        self.api_key = api_key
        self.model = model
        self.timeout_seconds = timeout_seconds or settings.LLM_TIMEOUT_SECONDS
        self.transport = transport
        self.backoff_seconds = backoff_seconds

    def complete(self, system: str, user: str) -> str:
        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "Content-Type": "application/json",
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
        }
        body: Dict[str, Any] = {
            "model": self.model,
            "max_tokens": 4096,
            "system": system,
            "messages": [
                {"role": "user", "content": user}
            ],
            "temperature": 0.2,
        }

        with httpx.Client(timeout=self.timeout_seconds, transport=self.transport) as client:
            resp = _execute_with_retry(
                client=client,
                method="POST",
                url=url,
                headers=headers,
                json_data=body,
                api_key=self.api_key,
                backoff_seconds=self.backoff_seconds,
            )

        try:
            data = resp.json()
        except Exception as e:
            raise LLMError(f"Failed to parse Anthropic JSON: {e}", api_key_to_scrub=self.api_key)

        content_blocks = data.get("content", [])
        if not content_blocks:
            raise LLMError("Anthropic response contained no content blocks", api_key_to_scrub=self.api_key)

        texts = [b["text"] for b in content_blocks if b.get("type") == "text" and "text" in b]
        if not texts:
            raise LLMError("Anthropic response contained no text blocks", api_key_to_scrub=self.api_key)

        return "".join(texts)


class FakeLLMClient:
    """Deterministic queued in-memory LLM client for tests."""

    def __init__(self, responses: Optional[List[Union[str, Exception]]] = None):
        self.responses: List[Union[str, Exception]] = list(responses) if responses else []
        self.calls: List[Dict[str, str]] = []

    def queue_response(self, response: Union[str, Exception]) -> None:
        self.responses.append(response)

    def complete(self, system: str, user: str) -> str:
        self.calls.append({"system": system, "user": user})
        if not self.responses:
            raise LLMError("FakeLLMClient has no queued responses remaining")
        resp = self.responses.pop(0)
        if isinstance(resp, Exception):
            raise resp
        return resp


def get_llm_client(
    provider: Optional[str] = None,
    api_key: Optional[str] = None,
    model: Optional[str] = None,
    timeout_seconds: Optional[int] = None,
    transport: Optional[httpx.BaseTransport] = None,
    backoff_seconds: int = 1,
) -> LLMClient:
    """Factory creating an LLMClient based on provider selection and credentials."""
    prov = (provider or settings.LLM_PROVIDER or "gemini").lower()
    key = api_key or settings.LLM_API_KEY
    mdl = model or settings.LLM_MODEL
    timeout = timeout_seconds or settings.LLM_TIMEOUT_SECONDS

    if not key:
        raise LLMError("LLM_API_KEY is not configured")
    if not mdl:
        raise LLMError("LLM_MODEL is not configured")

    if prov == "gemini":
        return GeminiClient(
            api_key=key,
            model=mdl,
            timeout_seconds=timeout,
            transport=transport,
            backoff_seconds=backoff_seconds,
        )
    elif prov == "anthropic":
        return AnthropicClient(
            api_key=key,
            model=mdl,
            timeout_seconds=timeout,
            transport=transport,
            backoff_seconds=backoff_seconds,
        )
    else:
        raise LLMError(f"Unsupported LLM provider: {prov}", api_key_to_scrub=key)
