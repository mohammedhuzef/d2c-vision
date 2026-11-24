"""Influencer outreach pitch generation service for LaunchTwin AI.

Adheres strictly to FROZEN RULES:
- Zero floating-point conversions
- Gemini writes WORDS ONLY (outreach copy).
- Never invents prices or financial metrics not provided in inputs.
- Always falls back to a deterministic, high-quality template when the API key
  is absent, invalid, or when any network/LLM error occurs.
"""

import json
import logging
import os
from typing import Any, Dict, List, Optional
from uuid import UUID

from backend.app.core.config import settings

logger = logging.getLogger("launchtwin.pitch_generator")

PITCH_SCHEMA: Dict[str, Any] = {
    "type": "OBJECT",
    "properties": {
        "dm_template": {"type": "STRING"},
        "email_template": {"type": "STRING"},
        "suggested_offer": {"type": "STRING"},
        "key_talking_points": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
        },
        "subject_lines": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
        },
    },
    "required": [
        "dm_template",
        "email_template",
        "suggested_offer",
        "key_talking_points",
        "subject_lines",
    ],
}


def generate_fallback_pitch(
    influencer: Dict[str, Any],
    product: Dict[str, Any],
    outreach_tone: Optional[str] = "enthusiastic_founder",
) -> Dict[str, Any]:
    """Generates a high-quality deterministic pitch copy without calling any LLM."""
    inf_id = influencer.get("id")
    inf_name = str(influencer.get("name") or "Creator")
    inf_handle = str(influencer.get("handle") or "@creator")
    first_name = inf_name.split()[0] if inf_name else "there"
    platform = str(influencer.get("platform") or "Instagram").capitalize()
    category = str(influencer.get("category") or "your vertical")
    deliverables = str(influencer.get("deliverables_summary") or "1x Dedicated Reel + 2x Stories")
    cost = str(influencer.get("estimated_cost_per_post") or "15,000")

    prod_name = str(product.get("product_name") or "our product")
    selling_price = str(product.get("selling_price") or "999")
    target_market = str(product.get("target_market") or "health-conscious consumers")
    description = str(product.get("description") or f"A high-quality product in {category}")

    tone = (outreach_tone or "enthusiastic_founder").lower()

    if "direct" in tone or "corporate" in tone:
        greeting_dm = f"Hi {first_name},"
        dm_body = (
            f"{greeting_dm} I'm the founder of {prod_name}. We admire your focus on {category} on {platform}. "
            f"We designed {prod_name} for {target_market} and would love to partner with you on a sponsored collab "
            f"covering {deliverables} at your standard rate (approx ₹{cost}). "
            f"Would you be open to trying a complimentary sample and reviewing our brief?"
        )
        email_subject = f"Collaboration Proposal: {prod_name} x {inf_name}"
        email_body = (
            f"Dear {inf_name},\n\n"
            f"My name is the founder of {prod_name}. We've followed your work closely in {category} on {platform} "
            f"and think your audience would genuinely appreciate what we've built.\n\n"
            f"About {prod_name}:\n"
            f"- {description}\n"
            f"- Retail price: ₹{selling_price}\n\n"
            f"We are looking to sponsor {deliverables} to introduce our brand to your community. "
            f"We respect your rate (approx ₹{cost}) and would love to send a product package for your honest review first.\n\n"
            f"Please let me know if this aligns with your current collaboration calendar.\n\n"
            f"Best regards,\nFounder, {prod_name}"
        )
    else:
        greeting_dm = f"Hey {first_name}! 👋"
        dm_body = (
            f"{greeting_dm} Huge fan of your content on {platform}! "
            f"I'm the founder behind {prod_name} ({description}). "
            f"We built this specifically for {target_market}, and your authentic approach to {category} feels like the absolute dream fit. "
            f"We'd love to sponsor {deliverables} and send over a VIP sample package for you to test out. "
            f"Let me know if you're open to checking it out!"
        )
        email_subject = f"{first_name} x {prod_name} Partnership"
        email_body = (
            f"Hi {first_name},\n\n"
            f"I hope you're having a fantastic week! I've been following your journey in {category} on {platform} "
            f"and love how engaged and thoughtful your community is.\n\n"
            f"I'm reaching out because we just launched {prod_name}: {description}. "
            f"Given your audience's interest in genuine recommendations, we believe this partnership would deliver "
            f"exceptional value to your followers.\n\n"
            f"We'd love to partner on {deliverables} (budgeting ₹{cost} + gift package) and give your followers an exclusive offer.\n\n"
            f"Can I send a sample package to your preferred shipping address?\n\n"
            f"Warmly,\nFounder, {prod_name}"
        )

    return {
        "influencer_id": inf_id,
        "influencer_name": inf_name,
        "influencer_handle": inf_handle,
        "dm_template": dm_body,
        "email_template": email_body,
        "suggested_offer": f"Complimentary {prod_name} product kit + ₹{cost} fee for {deliverables}",
        "key_talking_points": [
            f"Authentic integration in {category}",
            f"Engineered specifically for {target_market}",
            f"Premium retail quality (₹{selling_price})",
            f"Full creative freedom on storytelling",
        ],
        "subject_lines": [
            email_subject,
            f"Quick question for {first_name} ({prod_name} partnership)",
            f"{prod_name} x {inf_handle} collaboration inquiry",
        ],
    }


def generate_pitch(
    influencer: Dict[str, Any],
    product: Dict[str, Any],
    outreach_tone: Optional[str] = "enthusiastic_founder",
) -> Dict[str, Any]:
    """Generates pitch copy using Gemini when configured, or deterministic fallback.

    Gemini writes WORDS ONLY and never alters numerical metrics.
    """
    fallback = generate_fallback_pitch(influencer, product, outreach_tone)

    api_key = (
        settings.LLM_API_KEY
        or os.environ.get("GEMINI_API_KEY")
        or os.environ.get("GOOGLE_API_KEY")
    )
    if not api_key or not api_key.strip():
        logger.info("No LLM_API_KEY configured; returning deterministic fallback pitch.")
        return fallback

    try:
        from backend.app.services.llm_client import LLMClient

        client = LLMClient(api_key=api_key)
        system_instruction = (
            "You are an expert outreach copywriter for direct-to-consumer brand founders. "
            "Write authentic, tailored creator collaboration outreach copy based strictly on the provided facts. "
            "STRICT RULES: Generate WORDS ONLY. Do NOT invent prices, dates, or performance guarantees. "
            "Return valid JSON matching the schema with dm_template, email_template, suggested_offer, "
            "key_talking_points, and subject_lines."
        )
        prompt = (
            f"CREATOR FACTS:\n"
            f"- Name: {influencer.get('name')}\n"
            f"- Handle: {influencer.get('handle')}\n"
            f"- Platform: {influencer.get('platform')}\n"
            f"- Category: {influencer.get('category')}\n"
            f"- Deliverables: {influencer.get('deliverables_summary')}\n\n"
            f"PRODUCT FACTS:\n"
            f"- Product Name: {product.get('product_name')}\n"
            f"- Category: {product.get('category')}\n"
            f"- Description: {product.get('description')}\n"
            f"- Target Market: {product.get('target_market')}\n"
            f"- Tone: {outreach_tone}\n"
        )

        data = client.generate_json(
            prompt,
            schema=PITCH_SCHEMA,
            system_instruction=system_instruction,
        )
        return {
            "influencer_id": influencer.get("id"),
            "influencer_name": influencer.get("name"),
            "influencer_handle": influencer.get("handle"),
            "dm_template": str(data.get("dm_template") or fallback["dm_template"]),
            "email_template": str(data.get("email_template") or fallback["email_template"]),
            "suggested_offer": str(data.get("suggested_offer") or fallback["suggested_offer"]),
            "key_talking_points": list(data.get("key_talking_points") or fallback["key_talking_points"]),
            "subject_lines": list(data.get("subject_lines") or fallback["subject_lines"]),
        }
    except Exception as exc:
        logger.warning(f"Gemini pitch generation failed: {exc}; falling back to deterministic template.")
        return fallback
