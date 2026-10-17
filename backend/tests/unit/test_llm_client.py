import json
import pytest
import httpx

from backend.app.services.llm_client import (
    AnthropicClient,
    FakeLLMClient,
    GeminiClient,
    LLMError,
    get_llm_client,
)


def test_gemini_client_success():
    def handler(request: httpx.Request) -> httpx.Response:
        assert "models/gemini-pro:generateContent" in str(request.url)
        assert request.headers["x-goog-api-key"] == "test-key"
        body = json.loads(request.content)
        assert body["contents"][0]["parts"][0]["text"] == "Hello"
        return httpx.Response(
            200,
            json={
                "candidates": [
                    {
                        "content": {
                            "parts": [{"text": "Hello back!"}]
                        }
                    }
                ]
            },
        )

    transport = httpx.MockTransport(handler)
    client = GeminiClient(api_key="test-key", model="gemini-pro", transport=transport, backoff_seconds=0)
    result = client.complete(system="You are helpful", user="Hello")
    assert result == "Hello back!"


def test_anthropic_client_success():
    def handler(request: httpx.Request) -> httpx.Response:
        assert str(request.url) == "https://api.anthropic.com/v1/messages"
        assert request.headers["x-api-key"] == "claude-key"
        body = json.loads(request.content)
        assert body["model"] == "claude-3-sonnet"
        assert body["system"] == "System prompt"
        return httpx.Response(
            200,
            json={
                "content": [
                    {"type": "text", "text": "Claude response"}
                ]
            },
        )

    transport = httpx.MockTransport(handler)
    client = AnthropicClient(api_key="claude-key", model="claude-3-sonnet", transport=transport, backoff_seconds=0)
    result = client.complete(system="System prompt", user="User prompt")
    assert result == "Claude response"


def test_llm_client_retry_then_success():
    call_count = 0

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return httpx.Response(429, text="Rate limit exceeded")
        return httpx.Response(
            200,
            json={
                "candidates": [
                    {"content": {"parts": [{"text": "Recovered after retry"}]}}
                ]
            },
        )

    transport = httpx.MockTransport(handler)
    client = GeminiClient(api_key="gemini-key", model="gemini-1.5", transport=transport, backoff_seconds=0)
    result = client.complete(system="sys", user="usr")
    assert result == "Recovered after retry"
    assert call_count == 2


def test_llm_client_retry_then_llm_error():
    call_count = 0

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal call_count
        call_count += 1
        return httpx.Response(503, text="Service Unavailable")

    transport = httpx.MockTransport(handler)
    client = GeminiClient(api_key="gemini-key", model="gemini-1.5", transport=transport, backoff_seconds=0)
    with pytest.raises(LLMError) as exc_info:
        client.complete(system="sys", user="usr")
    assert "status 503" in str(exc_info.value)
    assert call_count == 2


def test_llm_client_key_never_appears_in_error_text():
    secret_key = "AIzaSySecretKey123456789"

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            500,
            text=f"Fatal server failure processing credentials AIzaSySecretKey123456789 on host",
        )

    transport = httpx.MockTransport(handler)
    client = GeminiClient(api_key=secret_key, model="gemini-1.5", transport=transport, backoff_seconds=0)
    with pytest.raises(LLMError) as exc_info:
        client.complete(system="sys", user="usr")

    error_message = str(exc_info.value)
    error_repr = repr(exc_info.value)

    assert secret_key not in error_message
    assert secret_key not in error_repr
    assert "[REDACTED_KEY]" in error_message


def test_fake_llm_client():
    fake = FakeLLMClient(["First answer", "Second answer"])
    res1 = fake.complete(system="sys1", user="usr1")
    res2 = fake.complete(system="sys2", user="usr2")

    assert res1 == "First answer"
    assert res2 == "Second answer"
    assert len(fake.calls) == 2
    assert fake.calls[0] == {"system": "sys1", "user": "usr1"}

    # Exhausted queue raises LLMError
    with pytest.raises(LLMError):
        fake.complete(system="sys3", user="usr3")


def test_get_llm_client_factory():
    client = get_llm_client(provider="gemini", api_key="test-key", model="test-model")
    assert isinstance(client, GeminiClient)

    client_anth = get_llm_client(provider="anthropic", api_key="test-key", model="test-model")
    assert isinstance(client_anth, AnthropicClient)

    with pytest.raises(LLMError):
        get_llm_client(provider="unknown", api_key="k", model="m")
