"""Standalone verification script for Gemini API key and model connectivity.

Checks:
1. Loads LLM_API_KEY and LLM_MODEL from backend settings.
2. Lists available models supporting generateContent from Google Gemini API.
3. Checks whether LLM_MODEL is supported.
4. Executes a minimal JSON generation test call to verify inference.
"""

import difflib
import json
from pathlib import Path
import sys

# Ensure repository root is on sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

import httpx

from backend.app.core.config import Settings


def main() -> None:
    settings = Settings()
    api_key = settings.LLM_API_KEY
    model = settings.LLM_MODEL

    # 1. Check API Key
    if not api_key or not api_key.strip():
        print("No key set: system will use MockResearchProvider")
        sys.exit(0)

    headers = {
        "x-goog-api-key": api_key.strip(),
        "Content-Type": "application/json",
    }

    # 2. Query models list
    models_url = "https://generativelanguage.googleapis.com/v1beta/models"
    try:
        with httpx.Client(timeout=float(settings.LLM_TIMEOUT_SECONDS)) as client:
            resp = client.get(models_url, headers=headers)
    except Exception as exc:
        print(f"Network error calling Gemini API: {exc}", file=sys.stderr)
        sys.exit(1)

    if resp.status_code != 200:
        try:
            err_json = resp.json()
            err_msg = err_json.get("error", {}).get("message", resp.text)
        except Exception:
            err_msg = resp.text
        print(f"HTTP Status: {resp.status_code}")
        print(f"Error: {err_msg}")
        sys.exit(1)

    try:
        data = resp.json()
    except Exception as exc:
        print(f"Failed to parse Gemini models response: {exc}", file=sys.stderr)
        sys.exit(1)

    available_models = []
    for m in data.get("models", []):
        methods = m.get("supportedGenerationMethods", [])
        if "generateContent" in methods:
            full_name = m.get("name", "")
            short_name = full_name.replace("models/", "")
            available_models.append(short_name)

    print("Available models supporting generateContent:")
    for name in sorted(available_models):
        print(f"  - {name}")

    # 3. Verify configured LLM_MODEL
    clean_model = model.replace("models/", "").strip()
    print(f"\nConfigured LLM_MODEL: {clean_model}")

    if clean_model in available_models:
        print(f"Status: '{clean_model}' is valid and available.")
        target_model = clean_model
    else:
        print(f"Status: '{clean_model}' was NOT found in the available models list.")
        matches = difflib.get_close_matches(clean_model, available_models, n=3, cutoff=0.4)
        if matches:
            print("Closest available models:")
            for match in matches:
                print(f"  - {match}")
            print(f"Recommendation: Set LLM_MODEL={matches[0]} in .env")
            target_model = matches[0]
        else:
            default_fallback = "gemini-1.5-flash"
            print(f"Recommendation: Set LLM_MODEL={default_fallback} in .env")
            target_model = default_fallback

    # 4. Test generateContent call
    print(f"\nTesting generateContent call with model '{target_model}'...")
    generate_url = f"https://generativelanguage.googleapis.com/v1beta/models/{target_model}:generateContent"
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": 'Respond ONLY with the JSON object {"ok": true}'}
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }

    try:
        with httpx.Client(timeout=float(settings.LLM_TIMEOUT_SECONDS)) as client:
            test_resp = client.post(generate_url, headers=headers, json=payload)
    except Exception as exc:
        print(f"Network error testing generateContent: {exc}", file=sys.stderr)
        sys.exit(1)

    print(f"HTTP Status: {test_resp.status_code}")

    if test_resp.status_code != 200:
        try:
            err_json = test_resp.json()
            err_msg = err_json.get("error", {}).get("message", test_resp.text)
        except Exception:
            err_msg = test_resp.text
        print(f"Error: {err_msg}")
        sys.exit(1)

    # Parse response
    try:
        resp_data = test_resp.json()
        candidates = resp_data.get("candidates", [])
        if candidates:
            parts = candidates[0].get("content", {}).get("parts", [])
            reply_text = parts[0].get("text", "").strip() if parts else ""
        else:
            reply_text = ""

        parsed_json = json.loads(reply_text)
        is_json = isinstance(parsed_json, dict) and parsed_json.get("ok") is True
        print(f"Parsed as JSON: {is_json}")
        print(f"Reply: {parsed_json}")
    except Exception as exc:
        print(f"Parsed as JSON: False (error: {exc})")
        print(f"Raw reply: {test_resp.text[:200]}")


if __name__ == "__main__":
    main()

