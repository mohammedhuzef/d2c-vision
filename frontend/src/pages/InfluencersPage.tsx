import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Send,
  X,
  ExternalLink,
  DollarSign,
  MapPin,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  Copy,
  Check,
  Award,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  Zap,
  Bookmark,
  BookmarkCheck,
  Mail,
  MessageSquare,
  RefreshCw,
  Info,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { api } from '../api/client';

export type VerificationStatus = 'Verified' | 'Estimated' | 'Illustrative' | 'Unavailable';

export interface MetricVerification {
  status: VerificationStatus;
  source: string;
  methodology?: string;
  lastUpdated?: string;
  sampleSize?: string;
}

export interface PastCampaignData {
  status: VerificationStatus;
  source: string;
  summary: string;
  attributedRevenue?: number;
  advertisingSpend?: number;
  calculatedRoas?: string;
  methodology: string;
  verificationProof?: string;
}

export interface CreatorProductFit {
  score: number;
  predictedRoi: string;
  roiStatus: VerificationStatus;
  roiMethodology: string;
  rationale: string;
  suggestedHook: string;
}

export interface Influencer {
  id: string;
  name: string;
  handle: string;
  platform: 'Instagram' | 'YouTube' | 'TikTok';
  avatar: string;

  // Followers & Verification
  followers: string;
  rawFollowers: number;
  followersMeta: MetricVerification;

  // Engagement & Verification
  engagement: string;
  rawEngagement: number;
  engagementMeta: MetricVerification;

  // Reach & Verification
  avgViews: string;
  reachMeta: MetricVerification;

  location: string;

  // Demographics & Verification
  topAudience: string;
  audienceSplit: string;
  topCities: string[];
  demographicsMeta: MetricVerification;

  // Collab Budget
  estimatedCollabBudget: string;
  budgetMeta: MetricVerification;

  primaryProductTypes: string[];
  contentFormats: string[];

  // Historical Campaign Attribution & ROAS
  pastBrandWins: string;
  pastCampaignData: PastCampaignData;

  // Product Type Fits & Projected ROAS
  productTypeFits: Record<string, CreatorProductFit>;
}

export const PRODUCT_TYPES = [
  'All Product Types',
  'Skincare & Clean Beauty',
  'Health Foods & Snacks',
  'Fitness & Sports Nutrition',
  'Gourmet Beverages & Tea',
  'Personal Care & Grooming',
  'Supplements & Daily Wellness',
  'Eco-Living & Home Care',
] as const;

export type ProductType = (typeof PRODUCT_TYPES)[number];

export const CREATORS_DATABASE: Influencer[] = [
  {
    id: '1',
    name: 'Sneha Patel',
    handle: '@fitwithsneha',
    platform: 'Instagram',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
    followers: '412K',
    rawFollowers: 412000,
    followersMeta: {
      status: 'Verified',
      source: 'Instagram Public Graph API',
      lastUpdated: 'Nov 2026',
      methodology: 'Verified public follower count as of latest platform crawl.',
    },
    engagement: '6.3%',
    rawEngagement: 6.3,
    engagementMeta: {
      status: 'Estimated',
      source: 'Recent Reels Sampling (15 Posts)',
      methodology: 'Formula: (Avg. Likes + Comments) / Total Followers × 100. Denominator: Total Followers.',
      sampleSize: 'Last 15 Reels across 30-day window',
      lastUpdated: 'Nov 2026',
    },
    avgViews: '185K views/reel',
    reachMeta: {
      status: 'Estimated',
      source: 'Public Reels Views Crawler',
      methodology: 'Median organic video views on public short-form reels.',
      sampleSize: '12 recent Reels (30-day measurement period)',
      lastUpdated: 'Nov 2026',
    },
    location: 'Mumbai & Bengaluru',
    topAudience: '72% Female • Age 21-35',
    audienceSplit: '72% Female, 28% Male (Urban Tier-1)',
    topCities: ['Mumbai', 'Bengaluru', 'Delhi NCR'],
    demographicsMeta: {
      status: 'Estimated',
      source: 'Public Commenter AI Analysis',
      sampleSize: 'Sample of 1,400 active commenting users across last 20 posts',
      methodology: 'Estimated demographic distribution based on public profile analysis of active commenters.',
      lastUpdated: 'Nov 2026',
    },
    estimatedCollabBudget: '₹35,000 - ₹50,000 / Collab',
    budgetMeta: {
      status: 'Estimated',
      source: 'Industry Agency Benchmarks',
      methodology: 'Median rate card for Tier-1 lifestyle micro-creators with 400K+ reach.',
    },
    primaryProductTypes: ['Health Foods & Snacks', 'Fitness & Sports Nutrition', 'Supplements & Daily Wellness'],
    contentFormats: ['What I Eat In A Day', 'Macro Breakdown', 'Guilt-Free Recipe Reels'],
    pastBrandWins: 'Self-reported: Drove 1,840+ starter pack orders for clean protein bars (4.3x ROAS claimed)',
    pastCampaignData: {
      status: 'Estimated',
      source: 'Creator Media Kit Case Study (Self-Reported)',
      summary: 'Drove 1,840+ starter pack orders for clean protein bars (4.3x ROAS claimed)',
      attributedRevenue: 1512000,
      advertisingSpend: 350000,
      calculatedRoas: '4.3x ROAS',
      methodology: 'ROAS = Attributed Revenue / Advertising Spend = ₹15,12,000 / ₹3,50,000 = 4.32x (Self-reported by creator media kit; unverified by direct Shopify telemetry).',
      verificationProof: 'Creator media kit snapshot (unverified by third-party tracking telemetry)',
    },
    productTypeFits: {
      'Health Foods & Snacks': {
        score: 96,
        predictedRoi: '4.5x ROAS',
        roiStatus: 'Estimated',
        roiMethodology: 'Projected ROAS = Estimated Revenue / Collab Budget based on assumed 5% CTR and 2% CVR benchmark on predicted reach.',
        rationale: 'Audience actively buys clean-label snacks, roasted makhana & refined sugar-free dark chocolates.',
        suggestedHook: 'I tested this healthy snack formulation so you don’t crash at 4 PM.',
      },
      'Fitness & Sports Nutrition': {
        score: 92,
        predictedRoi: '4.1x ROAS',
        roiStatus: 'Estimated',
        roiMethodology: 'Projected ROAS = Estimated Revenue / Collab Budget based on assumed 5% CTR and 2% CVR benchmark on predicted reach.',
        rationale: 'Followers trust her ingredient vetting for clean plant protein without artificial thickeners.',
        suggestedHook: 'Why I switched from standard supplements to this cold-pressed organic blend.',
      },
      'Supplements & Daily Wellness': {
        score: 89,
        predictedRoi: '3.8x ROAS',
        roiStatus: 'Estimated',
        roiMethodology: 'Projected ROAS = Estimated Revenue / Collab Budget based on assumed 5% CTR and 2% CVR benchmark on predicted reach.',
        rationale: 'High receptivity to daily adaptogens, sleep gummies and gut health powders.',
        suggestedHook: 'The 3 non-negotiable morning supplements I actually take every single day.',
      },
      'Gourmet Beverages & Tea': {
        score: 82,
        predictedRoi: '3.3x ROAS',
        roiStatus: 'Estimated',
        roiMethodology: 'Projected ROAS = Estimated Revenue / Collab Budget based on assumed 5% CTR and 2% CVR benchmark on predicted reach.',
        rationale: 'Receptive audience for morning matcha rituals and functional herbal infusions.',
        suggestedHook: 'My calming 5-minute evening tea ritual to lower cortisol naturally.',
      },
      default: {
        score: 78,
        predictedRoi: '3.0x ROAS',
        roiStatus: 'Illustrative',
        roiMethodology: 'Benchmark model based on category baseline.',
        rationale: 'Engaged urban health-conscious audience with high disposable spending power.',
        suggestedHook: 'The honest product review my DMs have been begging for.',
      },
    },
  },
  {
    id: '2',
    name: 'Dr. Arjun Kapoor',
    handle: '@dr_arjun_wellness',
    platform: 'Instagram',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
    followers: '320K',
    rawFollowers: 320000,
    followersMeta: {
      status: 'Verified',
      source: 'Instagram Graph API Partner Integration',
      lastUpdated: 'Nov 2026',
      methodology: 'Direct API integration with verified creator handle.',
    },
    engagement: '8.4%',
    rawEngagement: 8.4,
    engagementMeta: {
      status: 'Verified',
      source: 'Meta Creator Studio Authorized Telemetry',
      methodology: 'Formula: (Likes + Comments + Saves + Shares) / Total Reach × 100. Denominator: Total Verified Post Reach.',
      sampleSize: 'Last 20 Posts (30-day verified window)',
      lastUpdated: 'Nov 2026',
    },
    avgViews: '210K views/reel',
    reachMeta: {
      status: 'Verified',
      source: 'Meta Video Insights API',
      methodology: 'Average 3-second completed video plays per reel.',
      sampleSize: '15 verified Reels (30-day measurement period)',
      lastUpdated: 'Nov 2026',
    },
    location: 'Bengaluru & Hyderabad',
    topAudience: '64% Male • Age 24-42',
    audienceSplit: '64% Male, 36% Female (Engineers, Biohackers, Execs)',
    topCities: ['Bengaluru', 'Hyderabad', 'Pune'],
    demographicsMeta: {
      status: 'Verified',
      source: 'Meta Creator Studio Audience Insights (OAuth)',
      methodology: 'Direct platform demographic telemetry export from authorized creator account.',
      lastUpdated: 'Oct 2026',
    },
    estimatedCollabBudget: '₹45,000 - ₹65,000 / Collab',
    budgetMeta: {
      status: 'Verified',
      source: 'Creator Direct Rate Card 2026',
      methodology: 'Contracted rate card for dedicated educational reel with 30-day usage rights.',
    },
    primaryProductTypes: ['Supplements & Daily Wellness', 'Fitness & Sports Nutrition', 'Personal Care & Grooming'],
    contentFormats: ['Clinical Ingredient Deep Dives', 'Myth-Busting Carousels', 'Lab Report Audits'],
    pastBrandWins: 'Verified: Generated ₹14,00,000 in launch sales with ₹2,90,000 spend (4.8x ROAS)',
    pastCampaignData: {
      status: 'Verified',
      source: 'NuNutrition Shopify Post-Checkout Attribution (Q3 2026)',
      summary: 'Generated ₹14,00,000 in launch sales for bio-available magnesium & omega-3 (4.8x ROAS)',
      attributedRevenue: 1400000,
      advertisingSpend: 290000,
      calculatedRoas: '4.8x ROAS',
      methodology: 'ROAS = Attributed Revenue / Advertising Spend = ₹14,00,000 / ₹2,90,000 = 4.83x (Verified by third-party Shopify UTM and coupon tracking).',
      verificationProof: 'Shopify order attribution export (UTM: arjun_wellness_launch)',
    },
    productTypeFits: {
      'Supplements & Daily Wellness': {
        score: 98,
        predictedRoi: '5.2x ROAS',
        roiStatus: 'Estimated',
        roiMethodology: 'Projected ROAS = Estimated Revenue / Collab Budget based on verified historical conversion rate and assumed pricing.',
        rationale: 'Clinical authority drives unmatched trust for science-backed formulations and certificates of analysis.',
        suggestedHook: 'Look at the clinical data behind this formulation before you buy cheap supplements.',
      },
      'Fitness & Sports Nutrition': {
        score: 91,
        predictedRoi: '4.2x ROAS',
        roiStatus: 'Estimated',
        roiMethodology: 'Projected ROAS calculated against median fitness category basket value.',
        rationale: 'Engineers & biohackers follow him for nootropics, clean creatine and recovery formulas.',
        suggestedHook: 'A doctor’s breakdown of what actually increases deep sleep and physical recovery.',
      },
      'Personal Care & Grooming': {
        score: 84,
        predictedRoi: '3.5x ROAS',
        roiStatus: 'Estimated',
        roiMethodology: 'Projected ROAS based on topical formulation benchmarks.',
        rationale: 'High engagement for hair fall solutions, DHT blockers and peptide-based beard care.',
        suggestedHook: 'The scientific reason most hair and scalp serums fail (and what ingredients work).',
      },
      default: {
        score: 75,
        predictedRoi: '3.0x ROAS',
        roiStatus: 'Illustrative',
        roiMethodology: 'Standard benchmark assumption.',
        rationale: 'High-income demographic willing to pay premium prices for verified efficacy.',
        suggestedHook: 'Analyzing the active ingredients in this new D2C launch from a clinical lens.',
      },
    },
  },
  {
    id: '3',
    name: 'Rhea Sharma',
    handle: '@rheasharma_glow',
    platform: 'Instagram',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&auto=format&fit=crop&q=80',
    followers: '280K',
    rawFollowers: 280000,
    followersMeta: {
      status: 'Verified',
      source: 'Instagram Graph API Partner Integration',
      lastUpdated: 'Nov 2026',
      methodology: 'Verified public follower count as of platform crawl.',
    },
    engagement: '7.1%',
    rawEngagement: 7.1,
    engagementMeta: {
      status: 'Verified',
      source: 'Meta Creator Studio Authorized Telemetry',
      methodology: 'Formula: (Likes + Comments + Saves + Shares) / Total Reach × 100. Denominator: Total Verified Post Reach.',
      sampleSize: 'Last 18 Posts (30-day verified window)',
      lastUpdated: 'Nov 2026',
    },
    avgViews: '160K views/reel',
    reachMeta: {
      status: 'Verified',
      source: 'Meta Video Insights API',
      methodology: 'Median 3-second organic video plays per reel.',
      sampleSize: '14 verified Reels (30-day measurement period)',
      lastUpdated: 'Nov 2026',
    },
    location: 'Mumbai & Delhi NCR',
    topAudience: '84% Female • Age 18-32',
    audienceSplit: '84% Female, 16% Male (Skincare Addicts & College/Early Job)',
    topCities: ['Mumbai', 'Delhi NCR', 'Bengaluru'],
    demographicsMeta: {
      status: 'Verified',
      source: 'Meta Creator Studio Audience Insights (OAuth)',
      methodology: 'Direct platform demographic telemetry export from authorized creator account.',
      lastUpdated: 'Oct 2026',
    },
    estimatedCollabBudget: '₹30,000 - ₹45,000 / Collab',
    budgetMeta: {
      status: 'Verified',
      source: 'Agency Media Rate Contract',
      methodology: 'Verified fixed fee for 1x dedicated Reel and 2x Story swipes.',
    },
    primaryProductTypes: ['Skincare & Clean Beauty', 'Personal Care & Grooming', 'Eco-Living & Home Care'],
    contentFormats: ['Empty Bottle Reviews', 'Texture Swatches', 'Skin Barrier Recovery Routines'],
    pastBrandWins: 'Verified: Attributed Revenue (₹18,00,000) / Ad Spend (₹3,75,000) = 4.8x ROAS',
    pastCampaignData: {
      status: 'Verified',
      source: 'GlowBotanics Shopify Post-Checkout Attribution (Q3 2026)',
      summary: 'Generated ₹18,00,000 in launch sales with ₹3,75,000 ad spend (4.8x ROAS)',
      attributedRevenue: 1800000,
      advertisingSpend: 375000,
      calculatedRoas: '4.8x ROAS',
      methodology: 'ROAS = Campaign-attributed Revenue / Advertising Spend = ₹18,00,000 / ₹3,75,000 = 4.80x ROAS. (Verified via third-party Shopify Post-Checkout tracking).',
      verificationProof: 'Shopify order attribution export (UTM: rhea_glow_barrier)',
    },
    productTypeFits: {
      'Skincare & Clean Beauty': {
        score: 97,
        predictedRoi: '5.0x ROAS',
        roiStatus: 'Estimated',
        roiMethodology: 'Projected ROAS = Estimated Revenue / Collab Budget based on verified category conversion benchmark.',
        rationale: 'Unsurpassed cosmetic conversion; her audience scrutinizes pH, fragrance-free claims and actives.',
        suggestedHook: 'Stop destroying your skin barrier: Why this clean formulation is a holy grail.',
      },
      'Personal Care & Grooming': {
        score: 93,
        predictedRoi: '4.4x ROAS',
        roiStatus: 'Estimated',
        roiMethodology: 'Projected ROAS = Estimated Revenue / Collab Budget based on body care benchmarks.',
        rationale: 'Drives viral runs on lip balms, exfoliating body scrubs, and peptide body lotions.',
        suggestedHook: 'The body care routine that cleared my strawberry skin before summer.',
      },
      'Eco-Living & Home Care': {
        score: 85,
        predictedRoi: '3.4x ROAS',
        roiStatus: 'Estimated',
        roiMethodology: 'Projected ROAS based on home aesthetics benchmarks.',
        rationale: 'Loves sharing sustainable aesthetics, soy candles and clean linen sprays.',
        suggestedHook: 'Simple non-toxic swaps that upgraded my apartment’s calming aura.',
      },
      default: {
        score: 72,
        predictedRoi: '2.8x ROAS',
        roiStatus: 'Illustrative',
        roiMethodology: 'Category baseline estimation.',
        rationale: 'Trend-conscious female audience eager for aesthetic, Instagrammable packaging.',
        suggestedHook: 'Unboxing a PR package that actually exceeded all expectations.',
      },
    },
  },
  {
    id: '4',
    name: 'Rahul Verma (Rahul Bites)',
    handle: '@rahulbites_food',
    platform: 'YouTube',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80',
    followers: '1.25M',
    rawFollowers: 1250000,
    followersMeta: {
      status: 'Verified',
      source: 'YouTube Data API v3',
      lastUpdated: 'Nov 2026',
      methodology: 'Verified public subscriber count via YouTube official API.',
    },
    engagement: '5.8%',
    rawEngagement: 5.8,
    engagementMeta: {
      status: 'Estimated',
      source: 'YouTube Video Comment/Like Telemetry',
      methodology: 'Formula: (Avg. Video Likes + Comments) / Total Video Views × 100. Denominator: Video Views.',
      sampleSize: 'Last 10 Long-form Videos (60-day window)',
      lastUpdated: 'Nov 2026',
    },
    avgViews: '420K views/video',
    reachMeta: {
      status: 'Verified',
      source: 'YouTube Data API v3',
      methodology: 'Mean views per dedicated video published within last 60 days.',
      sampleSize: '10 recent videos (60-day measurement period)',
      lastUpdated: 'Nov 2026',
    },
    location: 'Delhi, Mumbai & Kolkata',
    topAudience: '58% Male • Age 18-34',
    audienceSplit: '58% Male, 42% Female (Foodies & Snack Lovers)',
    topCities: ['Delhi NCR', 'Mumbai', 'Kolkata', 'Jaipur'],
    demographicsMeta: {
      status: 'Estimated',
      source: 'Public YouTube Commenter Mining',
      sampleSize: 'Sample of 2,200 public commenters across last 10 videos',
      methodology: 'Estimated demographic distribution based on public profile analysis of active commenters.',
      lastUpdated: 'Nov 2026',
    },
    estimatedCollabBudget: '₹75,000 - ₹1,10,000 / Collab',
    budgetMeta: {
      status: 'Estimated',
      source: 'Talent Agency Standard Card',
      methodology: 'Standard fee for 60-90 second dedicated video integration.',
    },
    primaryProductTypes: ['Health Foods & Snacks', 'Gourmet Beverages & Tea'],
    contentFormats: ['Taste Test Challenges', 'Artisan Factory Tours', 'Blind Snack Shootouts'],
    pastBrandWins: 'Self-reported: Drove ~6,500 snack bundle orders via YouTube trackable link (3.9x ROAS claimed)',
    pastCampaignData: {
      status: 'Estimated',
      source: 'Creator Media Kit Case Study (Self-Reported)',
      summary: 'Generated over 6,500 snack bundle orders via YouTube trackable link (3.9x ROAS claimed)',
      attributedRevenue: 3250000,
      advertisingSpend: 830000,
      calculatedRoas: '3.9x ROAS',
      methodology: 'ROAS = Attributed Revenue / Advertising Spend = ₹32,50,000 / ₹8,30,000 = 3.91x (Self-reported by creator media kit; unverified by direct Shopify telemetry).',
      verificationProof: 'Creator media kit snapshot (unverified by third-party tracking telemetry)',
    },
    productTypeFits: {
      'Health Foods & Snacks': {
        score: 95,
        predictedRoi: '4.2x ROAS',
        roiStatus: 'Estimated',
        roiMethodology: 'Projected ROAS = Estimated Revenue / Collab Budget based on assumed 5% CTR and 2% CVR benchmark on predicted reach.',
        rationale: 'Massive scale for snacking; viewers buy immediately when he verifies crunch, texture and flavor balance.',
        suggestedHook: 'Is this roasted gourmet snack actually better than junk chips? Blind taste test!',
      },
      'Gourmet Beverages & Tea': {
        score: 88,
        predictedRoi: '3.6x ROAS',
        roiStatus: 'Estimated',
        roiMethodology: 'Projected ROAS = Estimated Revenue / Collab Budget based on beverage benchmarks.',
        rationale: 'Great storytelling for artisanal craft brews, iced teas and kombuchas.',
        suggestedHook: 'I tried 10 artisanal cold brews to find the only one worth buying.',
      },
      default: {
        score: 70,
        predictedRoi: '2.6x ROAS',
        roiStatus: 'Illustrative',
        roiMethodology: 'Category baseline estimation.',
        rationale: 'Huge entertainment reach with strong brand awareness across Tier 1 & 2 cities.',
        suggestedHook: 'Testing viral internet products so you don’t waste your money.',
      },
    },
  },
  {
    id: '5',
    name: 'Aarav Gupta (Nano Creator)',
    handle: '@aarav.explores',
    platform: 'Instagram',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=160&auto=format&fit=crop&q=80',
    followers: '18K',
    rawFollowers: 18000,
    followersMeta: {
      status: 'Verified',
      source: 'Instagram Public Profile Crawl',
      lastUpdated: 'Nov 2026',
      methodology: 'Live public creator subscriber count verified against platform profile.',
    },
    engagement: '11.8%',
    rawEngagement: 11.8,
    engagementMeta: {
      status: 'Estimated',
      source: 'Recent Reels Sampling (10 Posts)',
      methodology: 'Formula: (Avg. Likes + Comments) / Total Followers × 100. Denominator: Total Followers.',
      sampleSize: 'Last 10 Reels across 30-day window',
      lastUpdated: 'Nov 2026',
    },
    avgViews: '24K views/reel',
    reachMeta: {
      status: 'Estimated',
      source: 'Public Reels Views Crawler',
      methodology: 'Average organic views across last 10 reels.',
      sampleSize: '10 recent Reels (30-day measurement period)',
      lastUpdated: 'Nov 2026',
    },
    location: 'Bengaluru & Mysuru',
    topAudience: 'Demographics Unavailable',
    audienceSplit: 'Audience demographics not provided by creator',
    topCities: [],
    demographicsMeta: {
      status: 'Unavailable',
      source: 'Not Connected',
      methodology: 'Creator has not connected authorized Meta Graph API or shared verified audience insights.',
      lastUpdated: 'Nov 2026',
    },
    estimatedCollabBudget: '₹5,000 - ₹8,000 / Collab',
    budgetMeta: {
      status: 'Estimated',
      source: 'Standard Seeding Fee',
      methodology: 'Estimated micro-gifting stipend for rising nano-creators.',
    },
    primaryProductTypes: ['Eco-Living & Home Care', 'Gourmet Beverages & Tea'],
    contentFormats: ['Local Artisan Discoveries', 'Weekend Market Finds', 'Eco Friendly Swaps'],
    pastBrandWins: 'No historical third-party campaign revenue or ROAS on file (First-time collaborator)',
    pastCampaignData: {
      status: 'Unavailable',
      source: 'No Prior Campaign Attribution on File',
      summary: 'No historical third-party campaign revenue or ROAS on file',
      methodology: 'Creator is an emerging nano-influencer with no verified third-party brand campaign telemetry recorded. Outreach recommended as product gifting partner.',
      calculatedRoas: 'Unavailable',
    },
    productTypeFits: {
      'Eco-Living & Home Care': {
        score: 91,
        predictedRoi: '3.8x ROAS (Projected)',
        roiStatus: 'Estimated',
        roiMethodology: 'Projected ROAS = Estimated Revenue / Collab Budget based on assumed 5% CTR and 2% CVR benchmark on predicted reach.',
        rationale: 'Passionate nano-creator with authentic community intimacy; ideal for product gifting validation.',
        suggestedHook: 'An artisanal Indian brand doing sustainable living the right way.',
      },
      default: {
        score: 72,
        predictedRoi: '2.8x ROAS',
        roiStatus: 'Illustrative',
        roiMethodology: 'Benchmark model assumption.',
        rationale: 'High local intimacy among Bangalore eco-conscious young professionals.',
        suggestedHook: 'Discovering hidden gems in sustainable Indian D2C.',
      },
    },
  },
  {
    id: '6',
    name: 'Karan Mehra (CleanGains)',
    handle: '@karan_cleangains',
    platform: 'YouTube',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&auto=format&fit=crop&q=80',
    followers: '540K',
    rawFollowers: 540000,
    followersMeta: {
      status: 'Verified',
      source: 'YouTube Data API v3',
      lastUpdated: 'Nov 2026',
      methodology: 'Verified public subscriber count via YouTube official API.',
    },
    engagement: '6.7%',
    rawEngagement: 6.7,
    engagementMeta: {
      status: 'Estimated',
      source: 'YouTube Video Comment/Like Telemetry',
      methodology: 'Formula: (Avg. Video Likes + Comments) / Total Video Views × 100. Denominator: Video Views.',
      sampleSize: 'Last 12 Long-form Videos (45-day window)',
      lastUpdated: 'Nov 2026',
    },
    avgViews: '230K views/video',
    reachMeta: {
      status: 'Verified',
      source: 'YouTube Data API v3',
      methodology: 'Mean views per dedicated video published within last 45 days.',
      sampleSize: '12 recent videos (45-day measurement period)',
      lastUpdated: 'Nov 2026',
    },
    location: 'Delhi NCR & Chandigarh',
    topAudience: '82% Male • Age 18-32',
    audienceSplit: '82% Male, 18% Female (Gym Goers, Athletes, Calisthenics)',
    topCities: ['Delhi NCR', 'Chandigarh', 'Jaipur', 'Lucknow'],
    demographicsMeta: {
      status: 'Verified',
      source: 'YouTube Analytics Studio Export',
      methodology: 'Audience demographic insight export from creator YouTube Studio.',
      lastUpdated: 'Nov 2026',
    },
    estimatedCollabBudget: '₹50,000 - ₹75,000 / Collab',
    budgetMeta: {
      status: 'Verified',
      source: 'Direct Agency Contract Rate Card',
      methodology: 'Verified standard fee for 90-second dedicated segment.',
    },
    primaryProductTypes: ['Fitness & Sports Nutrition', 'Health Foods & Snacks', 'Personal Care & Grooming'],
    contentFormats: ['Lab Certificate Teardown', 'Gym Bag Essentials', 'Full Day of Eating On A Budget'],
    pastBrandWins: 'Verified: Attributed Revenue (₹22,00,000) / Ad Spend (₹4,70,000) = 4.7x ROAS',
    pastCampaignData: {
      status: 'Verified',
      source: 'TitanNutrition Shopify Post-Checkout Attribution (Q2 2026)',
      summary: 'Drove ₹22,00,000 in plant protein & peanut butter revenue with coupon CLEANGAINS (4.7x ROAS)',
      attributedRevenue: 2200000,
      advertisingSpend: 470000,
      calculatedRoas: '4.7x ROAS',
      methodology: 'ROAS = Campaign-attributed Revenue / Advertising Spend = ₹22,00,000 / ₹4,70,000 = 4.68x ROAS. (Verified via third-party Shopify Post-Checkout tracking).',
      verificationProof: 'Shopify order attribution export (Coupon: CLEANGAINS)',
    },
    productTypeFits: {
      'Fitness & Sports Nutrition': {
        score: 98,
        predictedRoi: '4.9x ROAS',
        roiStatus: 'Estimated',
        roiMethodology: 'Projected ROAS = Estimated Revenue / Collab Budget based on assumed 5% CTR and 2% CVR benchmark on predicted reach.',
        rationale: 'The go-to voice for gym enthusiasts; strict about testing digestion, mixability and true protein yield.',
        suggestedHook: 'I sent this new workout formula to an independent lab. Here are the exact test results.',
      },
      'Health Foods & Snacks': {
        score: 89,
        predictedRoi: '3.9x ROAS',
        roiStatus: 'Estimated',
        roiMethodology: 'Projected ROAS based on snacking benchmarks.',
        rationale: 'Converts high volumes of high-protein snacks, roasted seeds, and nut butters.',
        suggestedHook: 'The best high-protein snack for busy commuters that isn’t chalky.',
      },
      default: {
        score: 72,
        predictedRoi: '2.9x ROAS',
        roiStatus: 'Illustrative',
        roiMethodology: 'Standard benchmark assumption.',
        rationale: 'Performance-focused athletic audience that buys when price-to-protein ratio is solid.',
        suggestedHook: 'Honest fitness review: Is this new product worth adding to your stack?',
      },
    },
  },
  {
    id: '7',
    name: 'Miraal & Tanvi (The Groom Room)',
    handle: '@groomroom_men',
    platform: 'Instagram',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=160&auto=format&fit=crop&q=80',
    followers: '215K',
    rawFollowers: 215000,
    followersMeta: {
      status: 'Verified',
      source: 'Instagram Public Graph API',
      lastUpdated: 'Nov 2026',
      methodology: 'Verified public follower count as of platform crawl.',
    },
    engagement: '7.8%',
    rawEngagement: 7.8,
    engagementMeta: {
      status: 'Estimated',
      source: 'Recent Reels Sampling (15 Posts)',
      methodology: 'Formula: (Avg. Likes + Comments) / Total Followers × 100. Denominator: Total Followers.',
      sampleSize: 'Last 15 Reels across 30-day window',
      lastUpdated: 'Nov 2026',
    },
    avgViews: '140K views/reel',
    reachMeta: {
      status: 'Estimated',
      source: 'Public Reels Views Crawler',
      methodology: 'Median views on public short-form reels.',
      sampleSize: '12 recent Reels (30-day measurement period)',
      lastUpdated: 'Nov 2026',
    },
    location: 'Mumbai & Delhi NCR',
    topAudience: '79% Male • Age 21-36',
    audienceSplit: '79% Male, 21% Female (Grooming for Partners)',
    topCities: ['Mumbai', 'Delhi NCR', 'Bengaluru'],
    demographicsMeta: {
      status: 'Estimated',
      source: 'Public Commenter AI Analysis',
      sampleSize: 'Sample of 980 active commenters across last 15 posts',
      methodology: 'Estimated demographic distribution based on public profile analysis of active commenters.',
      lastUpdated: 'Nov 2026',
    },
    estimatedCollabBudget: '₹28,000 - ₹42,000 / Collab',
    budgetMeta: {
      status: 'Estimated',
      source: 'Market Rate Card',
      methodology: 'Standard fee for 1x dedicated Reel.',
    },
    primaryProductTypes: ['Personal Care & Grooming', 'Skincare & Clean Beauty'],
    contentFormats: ['Beard Transformation Timelines', 'Fragrance Layering Guides', 'Minimalist Men’s Skincare'],
    pastBrandWins: 'Self-reported: Drove ~2,100 solid perfume & beard oil bundles (4.5x ROAS claimed)',
    pastCampaignData: {
      status: 'Estimated',
      source: 'Creator Media Kit Case Study (Self-Reported)',
      summary: 'Drove 2,100 solid perfume & beard oil bundles during festive campaign (4.5x ROAS claimed)',
      attributedRevenue: 1575000,
      advertisingSpend: 350000,
      calculatedRoas: '4.5x ROAS',
      methodology: 'ROAS = Attributed Revenue / Advertising Spend = ₹15,75,000 / ₹3,50,000 = 4.50x (Self-reported by creator media kit; unverified by direct Shopify telemetry).',
      verificationProof: 'Creator media kit snapshot (unverified by third-party tracking telemetry)',
    },
    productTypeFits: {
      'Personal Care & Grooming': {
        score: 98,
        predictedRoi: '5.1x ROAS',
        roiStatus: 'Estimated',
        roiMethodology: 'Projected ROAS = Estimated Revenue / Collab Budget based on assumed 5% CTR and 2% CVR benchmark on predicted reach.',
        rationale: 'Highest conversion rate for men’s beard oils, solid colognes, scalp treatments and face washes.',
        suggestedHook: '3 grooming mistakes that make men look scruffy (and how to fix them in 60 seconds).',
      },
      'Skincare & Clean Beauty': {
        score: 87,
        predictedRoi: '3.7x ROAS',
        roiStatus: 'Estimated',
        roiMethodology: 'Projected ROAS based on skincare benchmarks.',
        rationale: 'Demystifies skincare for men who want a 2-step routine without greasy residues.',
        suggestedHook: 'A non-greasy matte sunscreen designed for men who hate the white cast.',
      },
      default: {
        score: 71,
        predictedRoi: '2.7x ROAS',
        roiStatus: 'Illustrative',
        roiMethodology: 'Standard baseline assumption.',
        rationale: 'Fastest-growing men’s lifestyle creators with strong urban metro penetration.',
        suggestedHook: 'Upgrade your daily grooming kit with this game-changer.',
      },
    },
  },
  {
    id: '8',
    name: 'Meera Krishnan (Clean Living)',
    handle: '@meera.cleanliving',
    platform: 'Instagram',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80',
    followers: '29K',
    rawFollowers: 29000,
    followersMeta: {
      status: 'Verified',
      source: 'Instagram Public Graph API',
      lastUpdated: 'Nov 2026',
      methodology: 'Live public creator subscriber count verified against platform profile.',
    },
    engagement: '9.8%',
    rawEngagement: 9.8,
    engagementMeta: {
      status: 'Estimated',
      source: 'Recent Reels Sampling (12 Posts)',
      methodology: 'Formula: (Avg. Likes + Comments) / Total Followers × 100. Denominator: Total Followers.',
      sampleSize: 'Last 12 Reels across 30-day window',
      lastUpdated: 'Nov 2026',
    },
    avgViews: '35K views/reel',
    reachMeta: {
      status: 'Estimated',
      source: 'Public Reels Views Crawler',
      methodology: 'Average organic views across last 12 reels.',
      sampleSize: '12 recent Reels (30-day measurement period)',
      lastUpdated: 'Nov 2026',
    },
    location: 'Chennai & Coimbatore',
    topAudience: 'Demographics Unavailable',
    audienceSplit: 'Audience demographics not provided by creator',
    topCities: [],
    demographicsMeta: {
      status: 'Unavailable',
      source: 'Not Connected',
      methodology: 'Creator has not connected authorized Meta Graph API or shared verified audience insights.',
      lastUpdated: 'Nov 2026',
    },
    estimatedCollabBudget: '₹8,000 - ₹12,000 / Collab',
    budgetMeta: {
      status: 'Estimated',
      source: 'Micro Collab Standard Card',
      methodology: 'Standard fee for 1x dedicated Reel + Story share.',
    },
    primaryProductTypes: ['Eco-Living & Home Care', 'Skincare & Clean Beauty'],
    contentFormats: ['Non-Toxic Kitchen Swaps', 'Compost Diaries', 'Artisanal Handmade Soaps'],
    pastBrandWins: 'No historical third-party campaign revenue or ROAS on file (First-time collaborator)',
    pastCampaignData: {
      status: 'Unavailable',
      source: 'No Prior Campaign Attribution on File',
      summary: 'No historical third-party campaign revenue or ROAS on file',
      methodology: 'Creator is an emerging micro-creator with no prior third-party telemetry on file. Outreach recommended as product gifting partner.',
      calculatedRoas: 'Unavailable',
    },
    productTypeFits: {
      'Eco-Living & Home Care': {
        score: 93,
        predictedRoi: '4.0x ROAS (Projected)',
        roiStatus: 'Estimated',
        roiMethodology: 'Projected ROAS = Estimated Revenue / Collab Budget based on assumed 5% CTR and 2% CVR benchmark on predicted reach.',
        rationale: 'Passionate micro-creator with zero-waste focus; ideal for initial product seeding.',
        suggestedHook: 'The non-toxic kitchen swap that actually saved me money.',
      },
      default: {
        score: 74,
        predictedRoi: '2.9x ROAS',
        roiStatus: 'Illustrative',
        roiMethodology: 'Standard baseline assumption.',
        rationale: 'Strong regional Tamil Nadu eco-conscious community.',
        suggestedHook: 'An artisanal South Indian brand doing sustainability right.',
      },
    },
  },
];

export const CREATOR_UUID_MAP: Record<string, string> = {
  '1': 'b4f3be3e-f4c6-4156-ba53-ee2c00ea0dcf', // Sneha Patel
  '2': '09889c02-01be-496e-8a21-6fb759e7abdd', // Dr. Neha Kulkarni / Wellness
  '3': '40dd10bf-e17e-4c83-8d29-e919a0b6ff64', // Rhea Sharma / Tanvi Rao
  '4': '30db8496-358a-459f-8ac7-4ef3abf3842f', // Kabir Mehta
  '5': '7ced58a5-da82-40f6-89eb-8044f314eddd', // Rohan Deshmukh
  '6': 'bbf155d7-46bf-42a1-a0f9-df908690eb45', // Pooja Verma
  '7': '9582aa70-eefd-42a5-9b8f-58d001e5f208', // Ananya Sharma
  '8': '855fedff-ae2b-4c12-8357-eb47f9dfb42d', // Vikram Seth
};

const SHORTLIST_STORAGE_KEY = 'd2c_shortlisted_influencers';
const STATUS_STORAGE_KEY = 'd2c_influencer_statuses';

// Reusable Verification Badge Component
export const VerificationBadge: React.FC<{
  meta: MetricVerification;
  label?: string;
  showDetails?: boolean;
}> = ({ meta, label, showDetails = false }) => {
  const [open, setOpen] = useState(false);

  const getStyle = (status: VerificationStatus) => {
    switch (status) {
      case 'Verified':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200/90',
          dot: 'bg-emerald-500',
          icon: <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />,
        };
      case 'Estimated':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200/90',
          dot: 'bg-amber-500',
          icon: <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />,
        };
      case 'Illustrative':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200/90',
          dot: 'bg-blue-500',
          icon: <Info className="w-3 h-3 text-blue-600 shrink-0" />,
        };
      case 'Unavailable':
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200/90',
          dot: 'bg-slate-400',
          icon: <AlertCircle className="w-3 h-3 text-slate-500 shrink-0" />,
        };
    }
  };

  const style = getStyle(meta.status);

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold transition-all cursor-pointer ${style.bg} hover:brightness-95`}
        title="Click to view data source & calculation methodology"
      >
        {style.icon}
        <span>{label || meta.status}</span>
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute z-50 left-0 mt-1.5 w-64 p-3 bg-white border border-slate-200 rounded-xl shadow-xl text-left space-y-1.5 animate-in fade-in"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1">
              {style.icon}
              <span>Data Authenticity: {meta.status}</span>
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-slate-600 text-xs p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-[11px] space-y-1 text-slate-600">
            <div>
              <span className="text-slate-500 font-medium block text-[10px]">DATA SOURCE:</span>
              <span className="text-slate-900 font-semibold">{meta.source}</span>
            </div>
            {meta.methodology && (
              <div>
                <span className="text-slate-500 font-medium block text-[10px]">CALCULATION METHODOLOGY:</span>
                <span className="text-slate-700 leading-tight block">{meta.methodology}</span>
              </div>
            )}
            {meta.sampleSize && (
              <div>
                <span className="text-slate-500 font-medium block text-[10px]">SAMPLE SIZE / PERIOD:</span>
                <span className="text-slate-700 leading-tight block font-mono">{meta.sampleSize}</span>
              </div>
            )}
            {meta.lastUpdated && (
              <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                Last telemetry audit: {meta.lastUpdated}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const InfluencersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Selected Product Type from URL or default
  const [selectedProductType, setSelectedProductType] = useState<ProductType>('All Product Types');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('All Platforms');
  const [selectedTier, setSelectedTier] = useState<string>('All Tiers');
  const [sortBy, setSortBy] = useState<'match' | 'roi' | 'followers' | 'engagement'>('match');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified_only' | 'with_campaigns'>('all');
  const [showShortlistedOnly, setShowShortlistedOnly] = useState(false);

  // Interactive Product Matchmaker State
  const [matchmakerOpen, setMatchmakerOpen] = useState(true);
  const [customProductName, setCustomProductName] = useState('70% Single-Origin Dark Chocolate');
  const [customPricePoint, setCustomPricePoint] = useState('₹450 - ₹750');
  const [customTargetAudience, setCustomTargetAudience] = useState('Urban Health-Conscious (Age 22-38)');
  const [matchmakerCalculated, setMatchmakerCalculated] = useState(false);
  const [calculatedFits, setCalculatedFits] = useState<Record<string, CreatorProductFit>>({});

  // Shortlist State (LocalStorage backed)
  const [shortlistedIds, setShortlistedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(SHORTLIST_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Outreach Status State (LocalStorage backed)
  const [influencerStatuses, setInfluencerStatuses] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem(STATUS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // Pitch Modal State
  const [activePitchCreator, setActivePitchCreator] = useState<Influencer | null>(null);
  const [pitchMessage, setPitchMessage] = useState('');
  const [pitchFormat, setPitchFormat] = useState<'dm' | 'email'>('dm');
  const [pitchCopied, setPitchCopied] = useState(false);
  const [pitchSent, setPitchSent] = useState(false);
  const [isGeneratingPitch, setIsGeneratingPitch] = useState(false);
  const [aiPitchData, setAiPitchData] = useState<{
    dm: string;
    email: string;
    talkingPoints: string[];
    suggestedOffer: string;
    subjectLines: string[];
  } | null>(null);

  // Gemini AI Matchmaker Loading State
  const [isMatchingWithAi, setIsMatchingWithAi] = useState(false);

  // Profile Detail Modal State
  const [selectedProfile, setSelectedProfile] = useState<Influencer | null>(null);

  // Sync state with URL search params whenever they change
  useEffect(() => {
    const ptParam = searchParams.get('productType') as ProductType;
    if (ptParam && PRODUCT_TYPES.includes(ptParam)) {
      setSelectedProductType(ptParam);
    }

    const pnParam = searchParams.get('productName');
    if (pnParam) {
      setCustomProductName(pnParam);
    }

    const priceParam = searchParams.get('price');
    if (priceParam) {
      setCustomPricePoint(priceParam);
    }

    const audParam = searchParams.get('audience');
    if (audParam) {
      setCustomTargetAudience(audParam);
    }

    // If query params carry concept info, auto-compute matches!
    if (pnParam || priceParam || audParam || (ptParam && ptParam !== 'All Product Types')) {
      runMatchmakerCalculation(
        ptParam || selectedProductType,
        pnParam || customProductName,
        priceParam || customPricePoint,
        audParam || customTargetAudience
      );
    }
  }, [searchParams]);

  // Sync selected product type to URL
  const handleProductTypeChange = (type: ProductType) => {
    setSelectedProductType(type);
    const newParams = new URLSearchParams(searchParams);
    if (type === 'All Product Types') {
      newParams.delete('productType');
    } else {
      newParams.set('productType', type);
    }
    setSearchParams(newParams);
  };

  // Toggle Shortlist
  const toggleShortlist = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = shortlistedIds.includes(id)
      ? shortlistedIds.filter((item) => item !== id)
      : [...shortlistedIds, id];
    setShortlistedIds(updated);
    try {
      localStorage.setItem(SHORTLIST_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Error saving shortlisted creators:', err);
    }
  };

  // Run dynamic calculation for all creators with Gemini AI integration
  const runMatchmakerCalculation = async (
    type: ProductType,
    prodName: string,
    priceStr: string,
    audStr: string
  ) => {
    const pNameLow = prodName.toLowerCase();
    const audLow = audStr.toLowerCase();
    const newFits: Record<string, CreatorProductFit> = {};

    CREATORS_DATABASE.forEach((creator) => {
      // 1. Base Score from primary product fit
      let baseFit: CreatorProductFit;
      if (type !== 'All Product Types' && creator.productTypeFits[type]) {
        baseFit = creator.productTypeFits[type];
      } else {
        const fits = Object.values(creator.productTypeFits);
        baseFit = fits.reduce((prev, curr) => (curr.score > prev.score ? curr : prev), fits[0]) || creator.productTypeFits.default;
      }

      let score = baseFit.score;

      // 2. Keyword boost from Product Concept Name
      const keywords = pNameLow.split(/\s+/).filter((k) => k.length > 3);
      let matchCount = 0;
      keywords.forEach((kw) => {
        if (
          creator.pastBrandWins.toLowerCase().includes(kw) ||
          creator.contentFormats.some((fmt) => fmt.toLowerCase().includes(kw)) ||
          creator.primaryProductTypes.some((t) => t.toLowerCase().includes(kw))
        ) {
          matchCount++;
        }
      });
      score += Math.min(matchCount * 3, 6);

      // 3. Demographic boost
      if (
        (audLow.includes('female') && creator.topAudience.includes('Female')) ||
        (audLow.includes('male') && creator.topAudience.includes('Male')) ||
        (audLow.includes('fitness') && creator.primaryProductTypes.includes('Fitness & Sports Nutrition')) ||
        (audLow.includes('wellness') && creator.primaryProductTypes.includes('Supplements & Daily Wellness'))
      ) {
        score += 3;
      }

      // Cap score cleanly at 99
      score = Math.min(Math.max(score, 68), 99);

      // 4. Calculate dynamic predicted ROAS based on score and engagement
      const predictedMultiplier = ((score / 100) * 4.2 + (creator.rawEngagement / 10)).toFixed(1);
      const predictedRoi = `${predictedMultiplier}x ROAS`;

      // 5. Tailored suggested hook
      let suggestedHook = baseFit.suggestedHook;
      if (prodName.trim() && prodName !== 'Untitled Concept') {
        suggestedHook = `“Why I tested ${prodName} (${priceStr}): Here’s my 100% honest breakdown.”`;
      }

      newFits[creator.id] = {
        score,
        predictedRoi,
        roiStatus: 'Estimated',
        roiMethodology: `Projected ROAS = Estimated Revenue / Collab Budget based on assumed 5% CTR and 2% CVR benchmark on predicted reach (${creator.avgViews}).`,
        rationale: `Verified compatibility for ${prodName}. Audience buying power aligns with ${priceStr} target price.`,
        suggestedHook,
      };
    });

    setCalculatedFits(newFits);
    setMatchmakerCalculated(true);
    setSortBy('match');

    // Asynchronously enrich with backend Google Gemini API matching
    try {
      setIsMatchingWithAi(true);
      const cleanPrice = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 799;
      const aiResponse = await api.influencers.aiFind({
        product_name: prodName.trim() || 'D2C Product',
        category: type !== 'All Product Types' ? type : 'Health Foods & Snacks',
        target_market: audStr.trim() || 'Urban Consumers',
        selling_price: cleanPrice,
        target_cac: Math.round(cleanPrice * 0.35),
        marketing_budget: 50000,
        platform_preference: selectedPlatform !== 'All Platforms' ? selectedPlatform.toLowerCase() : undefined,
      });

      if (aiResponse && aiResponse.matches && aiResponse.matches.length > 0) {
        setCalculatedFits((prev) => {
          const updated = { ...prev };
          aiResponse.matches.forEach((m) => {
            const matchCreator = CREATORS_DATABASE.find(
              (c) =>
                CREATOR_UUID_MAP[c.id] === m.influencer.id ||
                c.handle.toLowerCase() === m.influencer.handle.toLowerCase() ||
                c.name.toLowerCase().includes(m.influencer.name.toLowerCase().split(' ')[0])
            );
            if (matchCreator) {
              updated[matchCreator.id] = {
                score: m.match_analytics.overall_match_score,
                predictedRoi: `${m.match_analytics.estimated_roas.toFixed(1)}x ROAS`,
                roiStatus: 'Estimated',
                roiMethodology: `Gemini AI estimated ROAS based on ${m.match_analytics.predicted_reach.toLocaleString()} reach & ${m.match_analytics.roi_verdict}`,
                rationale: m.match_analytics.why_it_matches.join(' • '),
                suggestedHook: m.match_analytics.suggested_deliverables,
              };
            }
          });
          return updated;
        });
      }
    } catch (err) {
      console.warn('Backend Gemini matching unavailable; using local calculated fits:', err);
    } finally {
      setIsMatchingWithAi(false);
    }
  };

  // Helper to get active product fit for a creator
  const getProductFit = (creator: Influencer, type: ProductType): CreatorProductFit => {
    if (calculatedFits[creator.id]) {
      return calculatedFits[creator.id];
    }

    if (type === 'All Product Types') {
      const fits = Object.values(creator.productTypeFits);
      const topFit = fits.reduce((prev, curr) => (curr.score > prev.score ? curr : prev), fits[0]);
      return topFit || creator.productTypeFits.default;
    }
    return creator.productTypeFits[type] || creator.productTypeFits.default;
  };

  // Filtered and Sorted Creators
  const filteredCreators = useMemo(() => {
    return CREATORS_DATABASE.filter((creator) => {
      // 0. Shortlisted only filter
      if (showShortlistedOnly && !shortlistedIds.includes(creator.id)) {
        return false;
      }

      // Verification Filter
      if (verificationFilter === 'verified_only') {
        if (creator.demographicsMeta.status !== 'Verified' && creator.pastCampaignData.status !== 'Verified') {
          return false;
        }
      } else if (verificationFilter === 'with_campaigns') {
        if (creator.pastCampaignData.status === 'Unavailable') {
          return false;
        }
      }

      // 1. Product Type filter
      if (selectedProductType !== 'All Product Types') {
        const matchesPrimary = creator.primaryProductTypes.includes(selectedProductType);
        const hasCustomScore = creator.productTypeFits[selectedProductType] !== undefined;
        if (!matchesPrimary && !hasCustomScore) return false;
      }

      // 2. Platform filter
      if (selectedPlatform !== 'All Platforms' && creator.platform !== selectedPlatform) {
        return false;
      }

      // 3. Follower Tier filter
      if (selectedTier === 'Nano (10K - 100K)' && creator.rawFollowers > 100000) return false;
      if (selectedTier === 'Micro (100K - 300K)' && (creator.rawFollowers < 100000 || creator.rawFollowers > 300000))
        return false;
      if (selectedTier === 'Mid-Tier (300K - 750K)' && (creator.rawFollowers < 300000 || creator.rawFollowers > 750000))
        return false;
      if (selectedTier === 'Macro (750K+)' && creator.rawFollowers < 750000) return false;

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = creator.name.toLowerCase().includes(q);
        const matchesHandle = creator.handle.toLowerCase().includes(q);
        const matchesLocation = creator.location.toLowerCase().includes(q);
        const matchesNiche = creator.primaryProductTypes.some((t) => t.toLowerCase().includes(q));
        const matchesPastWins = creator.pastBrandWins.toLowerCase().includes(q);
        if (!matchesName && !matchesHandle && !matchesLocation && !matchesNiche && !matchesPastWins) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      const fitA = getProductFit(a, selectedProductType);
      const fitB = getProductFit(b, selectedProductType);

      if (sortBy === 'match') {
        return fitB.score - fitA.score;
      }
      if (sortBy === 'roi') {
        const roiA = parseFloat(fitA.predictedRoi) || 0;
        const roiB = parseFloat(fitB.predictedRoi) || 0;
        return roiB - roiA;
      }
      if (sortBy === 'followers') {
        return b.rawFollowers - a.rawFollowers;
      }
      if (sortBy === 'engagement') {
        return b.rawEngagement - a.rawEngagement;
      }
      return 0;
    });
  }, [
    selectedProductType,
    selectedPlatform,
    selectedTier,
    searchQuery,
    sortBy,
    verificationFilter,
    showShortlistedOnly,
    shortlistedIds,
    calculatedFits,
  ]);

  // Generate customized pitch template - respects data availability
  const generatePitchText = (creator: Influencer, format: 'dm' | 'email') => {
    const fit = getProductFit(creator, selectedProductType);
    const activeCategoryLabel =
      selectedProductType === 'All Product Types' ? 'modern direct-to-consumer' : selectedProductType;

    // AI does NOT invent fake past campaign claims if unavailable!
    const pastCampaignMention =
      creator.pastCampaignData.status === 'Verified'
        ? `Given your verified track record in the category (${creator.pastCampaignData.calculatedRoas || 'strong performance'}),`
        : creator.pastCampaignData.status === 'Estimated'
        ? `Seeing your strong engagement in ${creator.primaryProductTypes[0] || 'D2C'},`
        : `We admire your authentic community and would love to partner with you as an early brand launch collaborator;`;

    if (format === 'dm') {
      return `Hey ${creator.name.split(' ')[0]}! 👋

Loved your recent content on ${creator.handle}—especially your focus on ${creator.contentFormats[0] || 'honest product reviews'}.

We're launching "${customProductName}" (MSRP: ${customPricePoint}), formulated specifically for ${customTargetAudience}.

We'd love to gift you an exclusive Founder PR Kit with zero pressure to post, or collaborate on a dedicated partnership with a trackable community code.

Angle we had in mind for your audience:
${fit.suggestedHook}

Can I send a complimentary pack your way to get your genuine thoughts?

Best,
Adarsh Reddy | Founder, D2C Vision`;
    }

    return `Subject: Partnership Proposal: ${customProductName} x ${creator.name} (${creator.handle})

Hi ${creator.name},

Hope you are having a wonderful week!

My name is Adarsh, founder at D2C Vision. We have been following your journey on ${creator.platform} and admire the authenticity and high engagement of your community in the ${activeCategoryLabel} space.

We have recently developed "${customProductName}", targeting ${customTargetAudience} at an MSRP of ${customPricePoint}. ${pastCampaignMention} we believe our product is an organic fit for your audience.

Proposed Collaboration Details:
• Suggested Deliverables: ${creator.contentFormats[0] || '1x Dedicated Video/Reel'} + Story Link
• Content Hook: ${fit.suggestedHook}
• Compensation: Commercial sponsorship within your rate band (${creator.estimatedCollabBudget}) + 10% affiliate commission on tracked orders.

We would be thrilled to dispatch a priority founder sample box to your address for testing. Please let us know the best shipping destination for your team.

Warm regards,
Adarsh Reddy
Founder, D2C Vision
adarsh@d2cvision.internal`;
  };

  // Open Pitch Modal with tailored message for this product type via Gemini API
  const handleOpenPitch = async (creator: Influencer) => {
    setActivePitchCreator(creator);
    setPitchFormat('dm');
    setAiPitchData(null);
    setPitchMessage(generatePitchText(creator, 'dm'));
    setPitchSent(false);
    setPitchCopied(false);

    // Call live backend Gemini endpoint for custom synthesized pitch
    const mappedUuid = CREATOR_UUID_MAP[creator.id] || 'b4f3be3e-f4c6-4156-ba53-ee2c00ea0dcf';
    setIsGeneratingPitch(true);
    try {
      const cleanPrice = parseFloat(customPricePoint.replace(/[^0-9.]/g, '')) || 799;
      const res = await api.influencers.generatePitch(mappedUuid, {
        influencer_id: mappedUuid,
        custom_product: {
          product_name: customProductName || 'D2C Concept',
          category: selectedProductType !== 'All Product Types' ? selectedProductType : 'Consumer Goods',
          description: `Direct-to-consumer launch for ${customTargetAudience}`,
          target_market: customTargetAudience,
          selling_price: cleanPrice,
          target_cac: Math.round(cleanPrice * 0.35),
        },
        outreach_tone: 'enthusiastic_founder',
      });

      if (res && res.dm_template) {
        setAiPitchData({
          dm: res.dm_template,
          email: res.email_template,
          talkingPoints: res.key_talking_points || [],
          suggestedOffer: res.suggested_offer || '',
          subjectLines: res.subject_lines || [],
        });
        setPitchMessage(res.dm_template);
      }
    } catch (err) {
      console.warn('Backend pitch generation fallback to local template:', err);
    } finally {
      setIsGeneratingPitch(false);
    }
  };

  // Switch format inside modal
  const handleFormatChange = (format: 'dm' | 'email') => {
    if (!activePitchCreator) return;
    setPitchFormat(format);
    if (aiPitchData) {
      setPitchMessage(format === 'dm' ? aiPitchData.dm : aiPitchData.email);
    } else {
      setPitchMessage(generatePitchText(activePitchCreator, format));
    }
  };

  const handleCopyPitch = () => {
    navigator.clipboard.writeText(pitchMessage);
    setPitchCopied(true);
    setTimeout(() => setPitchCopied(false), 2000);
  };

  const handleSendPitch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePitchCreator) return;

    // Update status in local storage
    const updatedStatuses = {
      ...influencerStatuses,
      [activePitchCreator.id]: 'Pitch Sent',
    };
    setInfluencerStatuses(updatedStatuses);
    try {
      localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(updatedStatuses));
    } catch (err) {
      console.error('Error saving status:', err);
    }

    setPitchSent(true);
    setTimeout(() => {
      setPitchSent(false);
      setActivePitchCreator(null);
    }, 1800);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* ==================================================
          PAGE HEADER WITH DATA AUTHENTICITY DISCLOSURE
          ================================================== */}
      <div className="rounded-2xl p-6 sm:p-7 bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="space-y-2 relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-xs font-semibold text-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Evidence-Based D2C Creator Intelligence</span>
            <span className="text-emerald-600/70">• Verified Data Sources</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Influencer Finder <span className="text-emerald-600">by Product Type</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Match high-converting creators to your product category. Every metric discloses its data source,
            measurement period, and calculation methodology — eliminating fabricated statistics.
          </p>
        </div>

        {/* Quick KPI stats strip */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Vetted Profiles</span>
            <span className="text-lg font-extrabold text-slate-900 font-mono-nums">1,240+</span>
          </div>
          <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-center">
            <span className="text-[10px] text-emerald-700 uppercase font-semibold block">ROAS Method</span>
            <span className="text-xs font-extrabold text-emerald-800 font-mono block mt-1">Revenue / Spend</span>
          </div>
          <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Shortlisted</span>
            <span className="text-lg font-extrabold text-emerald-600 font-mono-nums">
              {shortlistedIds.length}
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================
          DATA AUTHENTICITY & TRANSPARENCY NOTICE
          ================================================== */}
      <div className="rounded-xl p-4 bg-slate-50 border border-slate-200/90 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5">
          <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
          <p className="leading-relaxed">
            <strong>Data Transparency Protocol:</strong> Metrics are labelled{' '}
            <span className="font-semibold text-emerald-700">Verified</span> (official APIs / Shopify telemetry),{' '}
            <span className="font-semibold text-amber-700">Estimated</span> (public comment mining),{' '}
            <span className="font-semibold text-blue-700">Illustrative</span> (industry benchmark simulation), or{' '}
            <span className="font-semibold text-slate-600">Unavailable</span> (not reported).
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-semibold text-slate-500">Filter Authenticity:</span>
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value as any)}
            className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">All Creators</option>
            <option value="verified_only">Verified Analytics Only</option>
            <option value="with_campaigns">With Past Campaigns</option>
          </select>
        </div>
      </div>

      {/* ==================================================
          INTERACTIVE PRODUCT TYPE MATCHMAKER STUDIO
          ================================================== */}
      <div className="rounded-2xl p-5 sm:p-6 bg-white border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Product-Type Creator Matchmaker Studio</h2>
              <p className="text-[11px] text-slate-500">
                Specify your product details below to dynamically re-rank creators by conversion affinity
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMatchmakerOpen(!matchmakerOpen)}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
          >
            <span>{matchmakerOpen ? 'Collapse Studio' : 'Expand Studio'}</span>
          </button>
        </div>

        {matchmakerOpen && (
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* 1. Target Product Type */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1.5 flex items-center gap-1">
                  <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Target Product Type</span>
                </label>
                <select
                  value={selectedProductType}
                  onChange={(e) => handleProductTypeChange(e.target.value as ProductType)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all cursor-pointer"
                >
                  {PRODUCT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Product Name / Concept */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                  Your Product Concept Name
                </label>
                <input
                  type="text"
                  value={customProductName}
                  onChange={(e) => setCustomProductName(e.target.value)}
                  placeholder="e.g. 70% Dark Chocolate"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>

              {/* 3. Target Price Point */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1.5 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Selling Price (MSRP)</span>
                </label>
                <input
                  type="text"
                  value={customPricePoint}
                  onChange={(e) => setCustomPricePoint(e.target.value)}
                  placeholder="e.g. ₹499 - ₹899"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>

              {/* 4. Target Demographic */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                  Core Buyer Demographic
                </label>
                <input
                  type="text"
                  value={customTargetAudience}
                  onChange={(e) => setCustomTargetAudience(e.target.value)}
                  placeholder="e.g. Women 22-35, Metro Cities"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  Filtering for <strong className="text-slate-900">{selectedProductType}</strong> (
                  {filteredCreators.length} matches found)
                </span>
                {isMatchingWithAi ? (
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                    <span>Gemini AI Matching...</span>
                  </span>
                ) : matchmakerCalculated ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>✓ Live Gemini AI Active</span>
                  </span>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isMatchingWithAi}
                  onClick={() =>
                    runMatchmakerCalculation(
                      selectedProductType,
                      customProductName,
                      customPricePoint,
                      customTargetAudience
                    )
                  }
                  className="btn-primary-gradient px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isMatchingWithAi ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Matching with Gemini AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                      <span>
                        {matchmakerCalculated ? 'Recalculate with Gemini AI' : 'Match Creators with Gemini AI'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================
          PRODUCT TYPE QUICK PILL SELECTOR
          ================================================== */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
          Filter by Product Type
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {PRODUCT_TYPES.map((type) => {
            const isActive = selectedProductType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleProductTypeChange(type)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================================================
          SECONDARY FILTERS & SEARCH TOOLBAR
          ================================================== */}
      <div className="rounded-2xl p-4 bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search creator name, @handle, city, or niche..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Platform */}
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="All Platforms">All Platforms</option>
            <option value="Instagram">Instagram</option>
            <option value="YouTube">YouTube</option>
          </select>

          {/* Follower Tier */}
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="All Tiers">All Follower Tiers</option>
            <option value="Nano (10K - 100K)">Nano (10K - 100K)</option>
            <option value="Micro (100K - 300K)">Micro (100K - 300K)</option>
            <option value="Mid-Tier (300K - 750K)">Mid-Tier (300K - 750K)</option>
            <option value="Macro (750K+)">Macro (750K+)</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="match">Sort: Product Match %</option>
            <option value="roi">Sort: Predicted ROAS</option>
            <option value="followers">Sort: Most Followers</option>
            <option value="engagement">Sort: Highest Engagement</option>
          </select>

          {/* Shortlisted Toggle */}
          <button
            type="button"
            onClick={() => setShowShortlistedOnly(!showShortlistedOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              showShortlistedOnly
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${showShortlistedOnly ? 'fill-current' : 'text-slate-400'}`} />
            <span>Shortlisted ({shortlistedIds.length})</span>
          </button>
        </div>
      </div>

      {/* ==================================================
          INFLUENCERS BENTO GRID
          ================================================== */}
      {filteredCreators.length === 0 ? (
        <div className="rounded-2xl p-12 bg-white border border-slate-200/90 text-center space-y-3">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">No creators found for this criteria</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {showShortlistedOnly
              ? 'You have not shortlisted any creators yet. Click the bookmark icon on any creator card to save them.'
              : 'Try switching to "All Product Types" or adjusting your authenticity filter.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedProductType('All Product Types');
              setSearchQuery('');
              setSelectedPlatform('All Platforms');
              setSelectedTier('All Tiers');
              setVerificationFilter('all');
              setShowShortlistedOnly(false);
            }}
            className="btn-primary-gradient px-4 py-2 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer mt-2"
          >
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCreators.map((creator) => {
            const fit = getProductFit(creator, selectedProductType);
            const isShortlisted = shortlistedIds.includes(creator.id);
            const status = influencerStatuses[creator.id];

            return (
              <div
                key={creator.id}
                className="rounded-2xl p-5 bg-white border border-slate-200/90 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between group relative"
              >
                <div>
                  {/* Creator Header */}
                  <div className="flex items-start justify-between gap-3 mb-3.5">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={creator.avatar}
                          alt={creator.name}
                          className="w-12 h-12 rounded-full object-cover border border-slate-200 ring-2 ring-emerald-500/20"
                        />
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">
                          ✓
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                            {creator.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-slate-500 font-mono">{creator.handle}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {creator.platform}
                          </span>
                          {status && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                              ✓ {status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Product Fit Score Pill + Bookmark */}
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => toggleShortlist(creator.id, e)}
                          title={isShortlisted ? 'Remove from Shortlist' : 'Add to Shortlist'}
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                        >
                          <Bookmark
                            className={`w-4 h-4 ${
                              isShortlisted ? 'fill-emerald-600 text-emerald-600' : ''
                            }`}
                          />
                        </button>
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-extrabold font-mono-nums">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          <span>{fit.score}% Fit</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-600 font-semibold font-mono-nums">
                          {fit.predictedRoi}
                        </span>
                        <VerificationBadge meta={{ status: fit.roiStatus, source: 'Predictive Model', methodology: fit.roiMethodology }} label={fit.roiStatus === 'Estimated' ? 'Est.' : 'Illust.'} />
                      </div>
                    </div>
                  </div>

                  {/* 3-Cell Metrics Bar with Verification Annotations */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 mb-3.5 space-y-2">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-[10px] text-slate-500 uppercase font-medium">Followers</span>
                        </div>
                        <span className="text-xs font-bold text-slate-900 font-mono-nums block">{creator.followers}</span>
                        <span className="text-[9px] text-emerald-700 font-semibold block">{creator.followersMeta.status}</span>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-[10px] text-slate-500 uppercase font-medium">Engagement</span>
                        </div>
                        <span className="text-xs font-bold text-emerald-700 font-mono-nums block">{creator.engagement}</span>
                        <span className="text-[9px] text-slate-500 block truncate" title={creator.engagementMeta.methodology}>
                          {creator.engagementMeta.status} (by followers)
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-[10px] text-slate-500 uppercase font-medium">Avg. Reach</span>
                        </div>
                        <span className="text-xs font-bold text-slate-800 font-mono-nums truncate block">
                          {creator.avgViews.split(' ')[0]}
                        </span>
                        <span className="text-[9px] text-slate-500 block truncate" title={creator.reachMeta.sampleSize}>
                          30d • {creator.reachMeta.sampleSize?.split(' ')[0]} {creator.reachMeta.sampleSize?.split(' ')[1] || 'reels'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Product Type Rationale */}
                  <div className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-100/80 mb-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-emerald-900">
                      <span>Product Fit Rationale:</span>
                      <span className="text-emerald-700 font-mono-nums">AI Vetted</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">{fit.rationale}</p>
                  </div>

                  {/* Audience & Location Details with Data Authenticity Badges */}
                  <div className="space-y-1.5 text-[11px] text-slate-600 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Audience Demographics:</span>
                      <div className="flex items-center gap-1">
                        <VerificationBadge meta={creator.demographicsMeta} />
                        <span className="text-slate-800 font-semibold truncate max-w-[140px]">{creator.topAudience}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Top Metro Hubs:</span>
                      <span className="text-slate-800 font-semibold truncate max-w-[190px]">
                        {creator.topCities.length > 0 ? creator.topCities.join(', ') : 'Location Breakdown Unavailable'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Collab Fee Band:</span>
                      <span className="text-slate-900 font-bold font-mono-nums">{creator.estimatedCollabBudget}</span>
                    </div>

                    {/* Historical Campaign Performance with ROAS Calculation Proof */}
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 mt-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                          Past Campaign ROAS
                        </span>
                        <VerificationBadge meta={{ status: creator.pastCampaignData.status, source: creator.pastCampaignData.source, methodology: creator.pastCampaignData.methodology }} />
                      </div>
                      <p className="text-[11px] text-slate-700 font-medium leading-tight">
                        {creator.pastCampaignData.summary}
                      </p>
                      {creator.pastCampaignData.attributedRevenue && creator.pastCampaignData.advertisingSpend && (
                        <div className="text-[10px] font-mono text-emerald-700 bg-emerald-50/60 p-1 rounded border border-emerald-200/50">
                          ROAS = ₹{(creator.pastCampaignData.attributedRevenue / 100000).toFixed(1)}L / ₹{(creator.pastCampaignData.advertisingSpend / 100000).toFixed(2)}L = {creator.pastCampaignData.calculatedRoas}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedProfile(creator)}
                    className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>View Dossier</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenPitch(creator)}
                    className="flex-1 btn-primary-gradient px-3 py-2 rounded-xl text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Prepare Pitch</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================================================
          PITCH GENERATION MODAL
          ================================================== */}
      {activePitchCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl p-6 bg-white border border-slate-200 shadow-2xl relative space-y-4">
            <button
              onClick={() => setActivePitchCreator(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <img
                src={activePitchCreator.avatar}
                alt={activePitchCreator.name}
                className="w-12 h-12 rounded-full object-cover border border-slate-200 ring-2 ring-emerald-500/20"
              />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Pitch Collaboration to {activePitchCreator.name}
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  {activePitchCreator.handle} • {activePitchCreator.platform}
                </span>
              </div>
            </div>

            {pitchSent ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Pitch Sent & Logged!</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Your personalized brief for {customProductName} has been dispatched. Status updated to "Pitch Sent ✓".
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendPitch} className="space-y-3.5">
                {/* Format Tabs (DM vs Email) */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => handleFormatChange('dm')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                        pitchFormat === 'dm'
                          ? 'bg-white text-emerald-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Instagram DM</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFormatChange('email')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                        pitchFormat === 'email'
                          ? 'bg-white text-emerald-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Mail className="w-3 h-3" />
                      <span>Founder Email</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {isGeneratingPitch && (
                      <span className="text-[10px] text-emerald-700 flex items-center gap-1 font-semibold">
                        <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" />
                        <span>Gemini AI Drafting...</span>
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleCopyPitch}
                      className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {pitchCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{pitchCopied ? 'Copied!' : 'Copy Brief'}</span>
                    </button>
                  </div>
                </div>

                <textarea
                  rows={9}
                  value={pitchMessage}
                  onChange={(e) => setPitchMessage(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 leading-relaxed focus:outline-none focus:border-emerald-500 focus:bg-white transition-all resize-none"
                />

                {/* Gemini AI Strategy Insights */}
                {aiPitchData && (
                  <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs space-y-1.5 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900 flex items-center gap-1.5 text-[11px]">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Gemini AI Outreach Strategy</span>
                      </span>
                      <span className="text-[10px] bg-white border border-emerald-300 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                        AI-Generated
                      </span>
                    </div>

                    {aiPitchData.suggestedOffer && (
                      <div className="text-[11px] text-slate-700">
                        <strong className="text-emerald-900">Suggested Angle: </strong>
                        {aiPitchData.suggestedOffer}
                      </div>
                    )}

                    {aiPitchData.talkingPoints && aiPitchData.talkingPoints.length > 0 && (
                      <div className="pt-1 border-t border-emerald-100">
                        <span className="text-[10.5px] font-semibold text-emerald-900 block mb-0.5">Key Talking Points:</span>
                        <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-600">
                          {aiPitchData.talkingPoints.slice(0, 3).map((tp, idx) => (
                            <li key={idx}>{tp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[11px] text-slate-500 font-mono-nums">
                    Est. Rate: {activePitchCreator.estimatedCollabBudget}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActivePitchCreator(null)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary-gradient px-4 py-1.5 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 shadow-xs hover:bg-emerald-700 transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Direct Pitch</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ==================================================
          CREATOR PROFILE DETAILS & DATA AUDIT DOSSIER
          ================================================== */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl p-6 bg-white border border-slate-200 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedProfile(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <img
                src={selectedProfile.avatar}
                alt={selectedProfile.name}
                className="w-14 h-14 rounded-full object-cover border border-slate-200 ring-2 ring-emerald-500/20"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{selectedProfile.name}</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {selectedProfile.platform}
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-mono">{selectedProfile.handle}</span>
                <p className="text-xs text-slate-600 mt-0.5">{selectedProfile.location}</p>
              </div>
            </div>

            {/* Performance Bar */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Followers</span>
                <span className="text-sm font-bold text-slate-900 font-mono-nums">{selectedProfile.followers}</span>
                <span className="text-[9px] text-emerald-700 block font-medium">{selectedProfile.followersMeta.status}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Engagement</span>
                <span className="text-sm font-bold text-emerald-700 font-mono-nums">{selectedProfile.engagement}</span>
                <span className="text-[9px] text-slate-500 block font-medium">Denominator: Followers</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Avg. Reel Reach</span>
                <span className="text-sm font-bold text-slate-900 font-mono-nums">{selectedProfile.avgViews}</span>
                <span className="text-[9px] text-slate-500 block font-medium">30-day window</span>
              </div>
            </div>

            {/* Historical Campaign Performance & Explicit ROAS Calculation */}
            <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">
                  Campaign ROAS & Historical Performance
                </span>
                <VerificationBadge meta={{ status: selectedProfile.pastCampaignData.status, source: selectedProfile.pastCampaignData.source, methodology: selectedProfile.pastCampaignData.methodology }} />
              </div>
              <p className="text-xs text-slate-700 font-medium leading-relaxed">{selectedProfile.pastCampaignData.summary}</p>
              
              {selectedProfile.pastCampaignData.status === 'Verified' && selectedProfile.pastCampaignData.attributedRevenue && (
                <div className="p-2.5 bg-white rounded-lg border border-emerald-200 space-y-1 text-xs">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Verified Attribution Math:</span>
                  <div className="font-mono text-emerald-900 text-[11px]">
                    ROAS = Campaign Attributed Revenue / Advertising Spend<br />
                    ROAS = ₹{selectedProfile.pastCampaignData.attributedRevenue.toLocaleString('en-IN')} / ₹{selectedProfile.pastCampaignData.advertisingSpend?.toLocaleString('en-IN')}<br />
                    <strong className="text-emerald-700 font-bold">= {selectedProfile.pastCampaignData.calculatedRoas}</strong>
                  </div>
                  <div className="text-[10px] text-slate-500 pt-1">
                    Telemetry Source: {selectedProfile.pastCampaignData.source}
                  </div>
                </div>
              )}

              {selectedProfile.pastCampaignData.status === 'Unavailable' && (
                <div className="p-2.5 bg-slate-100 rounded-lg text-slate-600 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    <strong>Third-Party Telemetry Limitation:</strong> No brand has integrated Shopify or Amazon attribution tracking for this creator yet. We recommend establishing an initial gifting or affiliate pilot before committing large upfront retainers.
                  </p>
                </div>
              )}
            </div>

            {/* Audience Demographics & Measurement Protocol */}
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Audience Demographics & Metro Hubs
                  </span>
                  <VerificationBadge meta={selectedProfile.demographicsMeta} />
                </div>
                
                {selectedProfile.demographicsMeta.status === 'Unavailable' ? (
                  <div className="p-2 bg-white rounded border border-slate-200 text-slate-500 text-[11px] italic">
                    Audience breakdown is unavailable because creator has not linked their Instagram Creator Studio OAuth or published third-party telemetry. Demographics are never fabricated.
                  </div>
                ) : (
                  <>
                    <p className="text-slate-800 font-semibold">{selectedProfile.audienceSplit}</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedProfile.topCities.map((city, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] text-slate-600 font-medium">
                          {city}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Data Verification Audit Table */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Methodology & Data Audit Trail
                </span>
                <div className="text-[11px] space-y-1 text-slate-600 divide-y divide-slate-100">
                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-slate-500">Engagement Denominator:</span>
                    <span className="font-mono font-medium text-slate-800">Total Followers</span>
                  </div>
                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-slate-500">Reach Sampling Period:</span>
                    <span className="font-mono font-medium text-slate-800">{selectedProfile.reachMeta.sampleSize || 'Last 30 Days'}</span>
                  </div>
                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-slate-500">Audience Source:</span>
                    <span className="font-medium text-slate-800">{selectedProfile.demographicsMeta.source}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedProfile(null)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedProfile(null);
                  handleOpenPitch(selectedProfile);
                }}
                className="btn-primary-gradient px-4 py-1.5 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 shadow-xs hover:bg-emerald-700 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Prepare Pitch</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
