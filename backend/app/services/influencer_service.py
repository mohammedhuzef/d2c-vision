import re
from decimal import Decimal
from typing import Any, Dict, List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.influencer import Influencer
from backend.app.models.product import Product
from backend.app.schemas.influencer import (
    CustomMatchRequest,
    InfluencerMatchResult,
    InfluencerResponse,
    MatchScoreBreakdown,
    PitchResponse,
)


DEFAULT_INFLUENCER_CATALOG = [
    {
        "name": "Aarav Sharma (The Mindful Commuter)",
        "handle": "@aarav.ecolife",
        "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80",
        "platform": "instagram",
        "category": "Drinkware & Eco-Living",
        "bio": "Minimalist living, zero-waste daily habits & everyday carry for modern urban commuters 🌿☕",
        "location": "Bengaluru, India",
        "follower_count": 48500,
        "follower_tier": "micro",
        "engagement_rate": 4.6,
        "avg_views": 38000,
        "avg_likes": 2200,
        "niche_tags": ["#EcoLiving", "#ZeroWaste", "#Tumbler", "#EverydayCarry", "#Sustainability", "#WorkdayEssentials"],
        "audience_demographics": {
            "top_age_bracket": "22-34 (72%)",
            "female_pct": 54,
            "male_pct": 46,
            "top_cities": ["Bengaluru", "Mumbai", "Delhi NCR", "Pune"],
        },
        "estimated_cost_per_post": Decimal("16000.00"),
        "deliverables_summary": "1x Dedicated 45s Reel + 2x Story frames with custom discount sticker",
        "sample_content_url": "https://instagram.com/p/sample-eco-carry",
    },
    {
        "name": "Priya Nair | Habit & Hydration",
        "handle": "@priya.wellnessdaily",
        "avatar_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80",
        "platform": "instagram",
        "category": "Fitness & Active Lifestyle",
        "bio": "Morning routines, desk fitness, cold brew obsessed & hydration tracker addict ✨💪",
        "location": "Mumbai, India",
        "follower_count": 76000,
        "follower_tier": "micro",
        "engagement_rate": 5.1,
        "avg_views": 52000,
        "avg_likes": 3900,
        "niche_tags": ["#HydrationHabit", "#DeskEssentials", "#FitnessGirl", "#ActiveLife", "#ThermalFlask", "#DailyRoutine"],
        "audience_demographics": {
            "top_age_bracket": "18-30 (78%)",
            "female_pct": 68,
            "male_pct": 32,
            "top_cities": ["Mumbai", "Bengaluru", "Hyderabad"],
        },
        "estimated_cost_per_post": Decimal("22000.00"),
        "deliverables_summary": "1x Aesthetic Morning Routine Reel + 3x Link Stories + 10-day bio link",
        "sample_content_url": "https://instagram.com/p/sample-morning-routine",
    },
    {
        "name": "Rohan Deshmukh | Gear & Unbox",
        "handle": "@rohan_everydaygear",
        "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80",
        "platform": "youtube",
        "category": "Tech & Everyday Gear",
        "bio": "In-depth durability stress-tests: Everyday carry items, travel bottles, tech accessories & desk setups.",
        "location": "Pune / Remote",
        "follower_count": 142000,
        "follower_tier": "mid",
        "engagement_rate": 3.8,
        "avg_views": 85000,
        "avg_likes": 4800,
        "niche_tags": ["#EDCGear", "#DurabilityTest", "#DeskSetup", "#InsulatedBottle", "#ProductReview"],
        "audience_demographics": {
            "top_age_bracket": "20-38 (81%)",
            "female_pct": 31,
            "male_pct": 69,
            "top_cities": ["Delhi", "Bengaluru", "Mumbai", "Chennai"],
        },
        "estimated_cost_per_post": Decimal("38000.00"),
        "deliverables_summary": "1x Dedicated 90-second Mid-Roll Integration in EDC Round-Up + Pinned Comment Link",
        "sample_content_url": "https://youtube.com/watch?v=sample-edc-test",
    },
    {
        "name": "Sanya Kapoor | Zero Waste Student",
        "handle": "@sanyazero",
        "avatar_url": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80",
        "platform": "tiktok",
        "category": "Eco & Sustainability",
        "bio": "Budget college lifestyle: Swap this for that! Sustainable swaps that actually save you money ♻️📚",
        "location": "Delhi NCR, India",
        "follower_count": 29000,
        "follower_tier": "micro",
        "engagement_rate": 6.8,
        "avg_views": 44000,
        "avg_likes": 3100,
        "niche_tags": ["#SustainableSwaps", "#StudentBudget", "#ReusableBottle", "#EcoFriendly", "#ZeroWasteLiving"],
        "audience_demographics": {
            "top_age_bracket": "16-26 (84%)",
            "female_pct": 74,
            "male_pct": 26,
            "top_cities": ["Delhi", "Chandigarh", "Jaipur", "Kolkata"],
        },
        "estimated_cost_per_post": Decimal("8500.00"),
        "deliverables_summary": "2x Viral POV TikTok/Short videos + Promo Code in Bio",
        "sample_content_url": "https://tiktok.com/@sample-swap-test",
    },
    {
        "name": "Devansh Mehta | Nomad Desk",
        "handle": "@devansh.nomad",
        "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80",
        "platform": "instagram",
        "category": "Travel & Lifestyle",
        "bio": "Remote work from hill cafes & commuter trains. Good coffee & unbreakable gear.",
        "location": "Goa / Himachal",
        "follower_count": 62000,
        "follower_tier": "micro",
        "engagement_rate": 4.2,
        "avg_views": 39000,
        "avg_likes": 2600,
        "niche_tags": ["#DigitalNomad", "#CoffeeLovers", "#TravelGear", "#EcoFlask", "#WorkFromAnywhere"],
        "audience_demographics": {
            "top_age_bracket": "24-38 (76%)",
            "female_pct": 45,
            "male_pct": 55,
            "top_cities": ["Bengaluru", "Mumbai", "Goa", "Pune"],
        },
        "estimated_cost_per_post": Decimal("18500.00"),
        "deliverables_summary": "1x Travel Aesthetic Reel + 2x Story posts with swipe-up/link sticker",
        "sample_content_url": "https://instagram.com/p/sample-nomad-carry",
    },
    {
        "name": "Kavita Rao | Fit & Clean Kitchen",
        "handle": "@kavita.cleankitchen",
        "avatar_url": "https://images.unsplash.com/photo-1534751516642-a171ed27d057?auto=format&fit=crop&w=250&q=80",
        "platform": "instagram",
        "category": "Drinkware & Kitchen",
        "bio": "Non-toxic home swaps, organic meal prep & zero-plastic drinkware tips 🥑🥛",
        "location": "Chennai, India",
        "follower_count": 89000,
        "follower_tier": "micro",
        "engagement_rate": 4.9,
        "avg_views": 61000,
        "avg_likes": 4200,
        "niche_tags": ["#NonToxicLiving", "#CleanKitchen", "#StainlessSteel", "#HealthyHabits", "#FamilyHealth"],
        "audience_demographics": {
            "top_age_bracket": "25-42 (80%)",
            "female_pct": 82,
            "male_pct": 18,
            "top_cities": ["Chennai", "Bengaluru", "Coimbatore", "Hyderabad"],
        },
        "estimated_cost_per_post": Decimal("24000.00"),
        "deliverables_summary": "1x Kitchen Prep Reel highlighting thermal insulation + 2x Recipe stories",
        "sample_content_url": "https://instagram.com/p/sample-clean-kitchen",
    },
    {
        "name": "Aditya Verma | CrossFit & Trail",
        "handle": "@aditya.trailrun",
        "avatar_url": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=250&q=80",
        "platform": "youtube",
        "category": "Fitness & Active Lifestyle",
        "bio": "Marathon training, high-altitude hydration, and gear stress tests in extreme weather conditions 🏃‍♂️⛰️",
        "location": "Dehradun / Delhi",
        "follower_count": 210000,
        "follower_tier": "mid",
        "engagement_rate": 3.4,
        "avg_views": 110000,
        "avg_likes": 7500,
        "niche_tags": ["#MarathonPrep", "#HydrationTest", "#TrailRunning", "#ExtremeWeather", "#FitnessGear"],
        "audience_demographics": {
            "top_age_bracket": "21-36 (79%)",
            "female_pct": 38,
            "male_pct": 62,
            "top_cities": ["Delhi", "Dehradun", "Bengaluru", "Chandigarh"],
        },
        "estimated_cost_per_post": Decimal("45000.00"),
        "deliverables_summary": "1x Dedicated 120s Gear Review feature + YouTube Short demo + Track link in description",
        "sample_content_url": "https://youtube.com/watch?v=sample-trail-test",
    },
    {
        "name": "Ananya Joshi | Eco Aesthetic",
        "handle": "@ananya.eco",
        "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80",
        "platform": "instagram",
        "category": "Drinkware & Eco-Living",
        "bio": "Making sustainable choices effortless & visually satisfying. Daily commute rituals & coffee breaks ☕🌱",
        "location": "Bengaluru, India",
        "follower_count": 18500,
        "follower_tier": "micro",
        "engagement_rate": 6.2,
        "avg_views": 25000,
        "avg_likes": 1550,
        "niche_tags": ["#AestheticLiving", "#EcoTumbler", "#CoffeeRoutine", "#UrbanMinimalist", "#EarthFriendly"],
        "audience_demographics": {
            "top_age_bracket": "19-32 (85%)",
            "female_pct": 71,
            "male_pct": 29,
            "top_cities": ["Bengaluru", "Mumbai", "Pune"],
        },
        "estimated_cost_per_post": Decimal("9500.00"),
        "deliverables_summary": "1x High-production Reel + 3x Story frames showcasing leak-proof seal & color palette",
        "sample_content_url": "https://instagram.com/p/sample-aesthetic-tumbler",
    },
]


def seed_influencers_if_empty(db: Session) -> None:
    """Populates initial realistic creator library if none exist."""
    existing_count = db.scalar(select(Influencer).limit(1))
    if existing_count is not None:
        return

    for item in DEFAULT_INFLUENCER_CATALOG:
        inf = Influencer(
            name=item["name"],
            handle=item["handle"],
            avatar_url=item["avatar_url"],
            platform=item["platform"],
            category=item["category"],
            bio=item["bio"],
            location=item["location"],
            follower_count=item["follower_count"],
            follower_tier=item["follower_tier"],
            engagement_rate=item["engagement_rate"],
            avg_views=item["avg_views"],
            avg_likes=item["avg_likes"],
            niche_tags=item["niche_tags"],
            audience_demographics=item["audience_demographics"],
            estimated_cost_per_post=item["estimated_cost_per_post"],
            deliverables_summary=item["deliverables_summary"],
            sample_content_url=item["sample_content_url"],
            status="discovered",
        )
        db.add(inf)

    db.commit()


def calculate_match_analytics(
    influencer: Influencer,
    product_name: str,
    category: str,
    description: Optional[str] = None,
    target_market: Optional[str] = None,
    selling_price: float = 1299.0,
    target_cac: float = 400.0,
    marketing_budget: float = 50000.0,
) -> MatchScoreBreakdown:
    """
    Deterministic scoring of an influencer fit against D2C product assumptions.
    Evaluates Category overlap, Target Demographic alignment, Unit Economics / CAC,
    and Engagement quality.
    """
    prod_text = f"{product_name} {category} {description or ''} {target_market or ''}".lower()
    inf_text = f"{influencer.category} {influencer.bio or ''} {' '.join(influencer.niche_tags)}".lower()

    # 1. Category & Niche Relevance (0 - 100)
    category_tokens = set(re.findall(r"\w+", category.lower()))
    inf_cat_tokens = set(re.findall(r"\w+", influencer.category.lower()))
    cat_overlap = len(category_tokens.intersection(inf_cat_tokens))

    tag_hits = 0
    for tag in influencer.niche_tags:
        clean_tag = tag.replace("#", "").lower()
        if clean_tag in prod_text:
            tag_hits += 1

    base_cat_score = 55
    if cat_overlap > 0:
        base_cat_score += 25
    base_cat_score += min(20, tag_hits * 7)
    category_fit_score = min(99, max(40, base_cat_score))

    # 2. Audience Demographic Fit (0 - 100)
    audience_score = 65
    target_lower = (target_market or "").lower()
    if any(k in target_lower for k in ["eco", "green", "sustainable"]) and any(
        k in inf_text for k in ["eco", "sustain", "zero", "waste"]
    ):
        audience_score += 25
    if any(k in target_lower for k in ["fitness", "gym", "active", "athlete"]) and any(
        k in inf_text for k in ["fit", "gym", "run", "active"]
    ):
        audience_score += 25
    if any(k in target_lower for k in ["commuter", "office", "professional", "work"]) and any(
        k in inf_text for k in ["commute", "work", "minimal", "desk"]
    ):
        audience_score += 20
    if any(k in target_lower for k in ["student", "budget", "bargain", "cheap"]) and any(
        k in inf_text for k in ["student", "budget", "swap"]
    ):
        audience_score += 25
    audience_fit_score = min(98, max(45, audience_score))

    # 3. Unit Economics & CAC Feasibility (0 - 100)
    cost = float(influencer.estimated_cost_per_post)
    reach = int(influencer.avg_views * 0.85) if influencer.avg_views > 0 else int(influencer.follower_count * 0.35)
    click_rate = max(0.012, min(0.035, (influencer.engagement_rate / 100) * 0.45))
    predicted_clicks = max(10, int(reach * click_rate))
    
    # Conversion rate assumption for influencer traffic (2.2% - 3.2%)
    conv_rate = 0.026
    predicted_orders = max(1, int(predicted_clicks * conv_rate))
    
    implied_cac = round(cost / predicted_orders, 2)
    cac_difference = round(implied_cac - target_cac, 2)
    estimated_revenue = round(predicted_orders * selling_price, 2)
    estimated_roas = round(estimated_revenue / cost, 2) if cost > 0 else 1.0

    if implied_cac <= target_cac * 1.05:
        roi_verdict = "EXCELLENT_CAC"
        economics_fit_score = 95
    elif implied_cac <= target_cac * 1.35:
        roi_verdict = "VIABLE"
        economics_fit_score = 80
    else:
        roi_verdict = "HIGH_CAC_RISK"
        economics_fit_score = max(35, int(90 - ((implied_cac - target_cac) / max(1.0, target_cac)) * 40))

    # 4. Engagement Quality (0 - 100)
    if influencer.engagement_rate >= 5.0:
        engagement_fit_score = 96
    elif influencer.engagement_rate >= 3.8:
        engagement_fit_score = 88
    elif influencer.engagement_rate >= 2.5:
        engagement_fit_score = 75
    else:
        engagement_fit_score = 60

    # Composite Overall Match Score
    overall_match_score = int(
        (category_fit_score * 0.35)
        + (audience_fit_score * 0.25)
        + (economics_fit_score * 0.25)
        + (engagement_fit_score * 0.15)
    )
    overall_match_score = min(99, max(42, overall_match_score))

    # Why it matches reasons
    why_it_matches = []
    if category_fit_score >= 80:
        why_it_matches.append(f"Strong vertical alignment with '{influencer.category}'.")
    if tag_hits > 0:
        why_it_matches.append(f"Matching creator niche hashtags ({tag_hits} product-related tags).")
    if roi_verdict == "EXCELLENT_CAC":
        why_it_matches.append(f"Implied CAC (₹{implied_cac}) beats target CAC (₹{target_cac}) by ₹{abs(cac_difference):.0f}.")
    elif roi_verdict == "VIABLE":
        why_it_matches.append(f"Acceptable CAC range (₹{implied_cac}) with projected RoAS of {estimated_roas}x.")
    else:
        why_it_matches.append(f"Higher unit cost per order (₹{implied_cac}); negotiate gifted seeding or performance commission.")

    if influencer.engagement_rate >= 4.5:
        why_it_matches.append(f"Top-quartile engagement rate ({influencer.engagement_rate}%) indicates high audience buyer intent.")

    return MatchScoreBreakdown(
        overall_match_score=overall_match_score,
        category_fit_score=category_fit_score,
        audience_fit_score=audience_fit_score,
        economics_fit_score=economics_fit_score,
        engagement_fit_score=engagement_fit_score,
        roi_verdict=roi_verdict,
        implied_cac=implied_cac,
        target_cac=target_cac,
        cac_difference=cac_difference,
        predicted_reach=reach,
        predicted_clicks=predicted_clicks,
        predicted_orders=predicted_orders,
        estimated_revenue=estimated_revenue,
        estimated_roas=estimated_roas,
        why_it_matches=why_it_matches,
        suggested_deliverables=influencer.deliverables_summary,
    )


def generate_outreach_pitch(
    influencer: Influencer,
    product_name: str,
    category: str,
    description: Optional[str] = None,
    selling_price: float = 1299.0,
    target_market: Optional[str] = None,
    tone: str = "enthusiastic_founder",
) -> PitchResponse:
    """
    Generates tailored, high-converting outreach DM and Email pitch templates
    based on the creator's profile, platform, and product details.
    """
    handle = influencer.handle
    creator_name = influencer.name.split()[0]
    category_clean = category.lower()

    if tone == "creative_story":
        dm_template = (
            f"Hey {creator_name}! 👋 Love your recent content on {influencer.niche_tags[0] if influencer.niche_tags else 'daily essentials'}. "
            f"I'm the founder behind {product_name}. We designed this specifically for {target_market or 'conscious everyday consumers'} "
            f"who are tired of generic {category_clean}. "
            f"We'd love to send you one to test out for your daily routine. If you genuinely love it, we can collaborate on a {influencer.deliverables_summary} "
            f"with a custom discount code & affiliate perks for your community. Would you be open to checking out a sample?"
        )
    elif tone == "professional_direct":
        dm_template = (
            f"Hi {creator_name}, hope you're having a productive week! "
            f"I'm reaching out from the team at {product_name} ({category}). "
            f"Your audience demographics and focus on {', '.join(influencer.niche_tags[:2])} strongly match our brand values. "
            f"We'd like to book a paid collaboration ({influencer.deliverables_summary}) for our upcoming launch. "
            f"Could you share your updated media kit or rate card, or let us know the best email to send over our brief?"
        )
    else:  # enthusiastic_founder
        dm_template = (
            f"Hey {creator_name}! Huge fan of your work on {influencer.platform.capitalize()} 🙌 "
            f"I'm building {product_name} ({category}), solving {description or 'everyday utility with sustainable design'}. "
            f"Seeing how engaged your community is with {influencer.niche_tags[0] if influencer.niche_tags else 'lifestyle products'}, "
            f"I knew you were the ideal creator to partner with. "
            f"We'd love to sponsor a dedicated post + gift you our flagship model. Can I send you the details?"
        )

    email_template = f"""Subject: Partnership with {product_name} — Paid Collaboration & Gifting for {creator_name}

Hi {creator_name},

I hope this email finds you well!

My name is Adarsh, founder of {product_name}. I’ve been following your journey on {influencer.platform.capitalize()} ({handle}) and particularly admire your authentic recommendations around {', '.join(influencer.niche_tags[:3])}.

We are currently gearing up for our D2C launch of {product_name}—a premium {category_clean} crafted for {target_market or 'modern consumers'}. 

Why we think this is a natural fit for your audience:
• Product Focus: {description or 'High-performance design built for durability, aesthetics, and everyday reliability.'}
• Retail Price Point: ₹{selling_price:,.0f}
• Organic Audience Alignment: Your followers in {influencer.location or 'India'} actively value quality, sustainable lifestyle upgrades.

Proposed Scope of Collaboration:
• Deliverables: {influencer.deliverables_summary}
• Commercials: Flat sponsorship fee + complimentary product suite + 15% revenue share on all tracked orders generated via your custom code.
• Timeline: Flexible over the next 2-3 weeks.

If this sounds like something you'd be excited to share with your audience, please let me know your delivery address so we can ship your complimentary unit, along with our formal creative brief!

Looking forward to creating something impactful together,

Warm regards,
Founder & Product Lead, {product_name}
"""

    return PitchResponse(
        influencer_id=influencer.id,
        influencer_name=influencer.name,
        influencer_handle=influencer.handle,
        dm_template=dm_template.strip(),
        email_template=email_template.strip(),
        suggested_offer=f"Flat Fee (₹{influencer.estimated_cost_per_post:,.0f}) + 15% Affiliate RevShare + Free Product Seeding",
        key_talking_points=[
            f"Highlight unique value proposition: {description or 'High durability & premium finish'}",
            f"Focus on practical daily use case for {target_market or 'everyday consumers'}",
            "Demonstrate hands-on test (thermal retention / leak proof / ergonomics)",
            "Call-to-action: Limited-time launch discount code",
        ],
        subject_lines=[
            f"Partnership with {product_name} for {creator_name} ({handle})",
            f"Paid collaboration enquiry for {influencer.name} x {product_name}",
            f"Gifting + Sponsorship: {product_name} launch campaign",
        ],
    )
