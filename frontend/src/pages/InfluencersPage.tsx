import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';

export interface CreatorProductFit {
  score: number;
  predictedRoi: string;
  rationale: string;
  suggestedHook: string;
}

export interface Influencer {
  id: string;
  name: string;
  handle: string;
  platform: 'Instagram' | 'YouTube' | 'TikTok';
  avatar: string;
  followers: string;
  rawFollowers: number;
  engagement: string;
  rawEngagement: number;
  avgViews: string;
  location: string;
  topAudience: string;
  audienceSplit: string;
  topCities: string[];
  estimatedCollabBudget: string;
  primaryProductTypes: string[];
  contentFormats: string[];
  pastBrandWins: string;
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

const CREATORS_DATABASE: Influencer[] = [
  {
    id: '1',
    name: 'Sneha Patel',
    handle: '@fitwithsneha',
    platform: 'Instagram',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
    followers: '412K',
    rawFollowers: 412000,
    engagement: '6.3%',
    rawEngagement: 6.3,
    avgViews: '185K views/reel',
    location: 'Mumbai & Bengaluru',
    topAudience: '72% Female • Age 21-35',
    audienceSplit: '72% Female, 28% Male (Urban Tier-1)',
    topCities: ['Mumbai', 'Bengaluru', 'Delhi NCR'],
    estimatedCollabBudget: '₹35,000 - ₹50,000 / Collab',
    primaryProductTypes: ['Health Foods & Snacks', 'Fitness & Sports Nutrition', 'Supplements & Daily Wellness'],
    contentFormats: ['What I Eat In A Day', 'Macro Breakdown', 'Guilt-Free Recipe Reels'],
    pastBrandWins: 'Drove 1,840+ starter pack orders for clean protein bars (4.3x ROAS)',
    productTypeFits: {
      'Health Foods & Snacks': {
        score: 96,
        predictedRoi: '4.5x ROAS',
        rationale: 'Audience actively buys clean-label snacks, roasted makhana & refined sugar-free dark chocolates.',
        suggestedHook: 'I tested this 70% single-origin dark chocolate so you don’t crash at 4 PM.',
      },
      'Fitness & Sports Nutrition': {
        score: 92,
        predictedRoi: '4.1x ROAS',
        rationale: 'Followers trust her ingredient vetting for clean plant protein without artificial thickeners.',
        suggestedHook: 'Why I switched from whey to this cold-pressed organic plant protein.',
      },
      'Supplements & Daily Wellness': {
        score: 89,
        predictedRoi: '3.8x ROAS',
        rationale: 'High receptivity to daily adaptogens, sleep gummies and gut health powders.',
        suggestedHook: 'The 3 non-negotiable morning supplements I actually take.',
      },
      'Gourmet Beverages & Tea': {
        score: 82,
        predictedRoi: '3.3x ROAS',
        rationale: 'Receptive audience for morning matcha rituals and functional herbal infusions.',
        suggestedHook: 'My calming 5-minute evening tea ritual to lower cortisol.',
      },
      default: {
        score: 78,
        predictedRoi: '3.0x ROAS',
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
    engagement: '8.4%',
    rawEngagement: 8.4,
    avgViews: '210K views/reel',
    location: 'Bengaluru & Hyderabad',
    topAudience: '64% Male • Age 24-42',
    audienceSplit: '64% Male, 36% Female (Engineers, Biohackers, Execs)',
    topCities: ['Bengaluru', 'Hyderabad', 'Pune'],
    estimatedCollabBudget: '₹45,000 - ₹65,000 / Collab',
    primaryProductTypes: ['Supplements & Daily Wellness', 'Fitness & Sports Nutrition', 'Personal Care & Grooming'],
    contentFormats: ['Clinical Ingredient Deep Dives', 'Myth-Busting Carousels', 'Lab Report Audits'],
    pastBrandWins: 'Generated ₹14L in launch sales for bio-available magnesium & omega-3 (4.8x ROAS)',
    productTypeFits: {
      'Supplements & Daily Wellness': {
        score: 98,
        predictedRoi: '5.2x ROAS',
        rationale: 'Clinical authority drives unmatched trust for science-backed formulations and certificates of analysis.',
        suggestedHook: 'Look at the clinical data behind this daily adaptogen before you buy cheap supplements.',
      },
      'Fitness & Sports Nutrition': {
        score: 91,
        predictedRoi: '4.2x ROAS',
        rationale: 'Followers purchase recommended electrolytes, creatine and organic protein.',
        suggestedHook: 'The truth about amino acid profiles and how this blend stacks up.',
      },
      'Personal Care & Grooming': {
        score: 84,
        predictedRoi: '3.5x ROAS',
        rationale: 'Strong engagement on dermatologist-reviewed hair loss & scalp care routines.',
        suggestedHook: 'What actual scalp trichology says about peptide hair growth serums.',
      },
      default: {
        score: 75,
        predictedRoi: '3.1x ROAS',
        rationale: 'High-intent analytical buyers seeking third-party tested products.',
        suggestedHook: 'Analyzing the label transparency of this emerging D2C brand.',
      },
    },
  },
  {
    id: '3',
    name: 'Rhea Sharma',
    handle: '@rheasharma_glow',
    platform: 'Instagram',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80',
    followers: '286K',
    rawFollowers: 286000,
    engagement: '7.2%',
    rawEngagement: 7.2,
    avgViews: '160K views/reel',
    location: 'Mumbai & Delhi NCR',
    topAudience: '84% Female • Age 19-32',
    audienceSplit: '84% Female, 16% Male (College & Early Career)',
    topCities: ['Mumbai', 'Delhi NCR', 'Chandigarh'],
    estimatedCollabBudget: '₹30,000 - ₹45,000 / Collab',
    primaryProductTypes: ['Skincare & Clean Beauty', 'Personal Care & Grooming', 'Eco-Living & Home Care'],
    contentFormats: ['Glass Skin Routine', '7-Day Glow Timelines', 'Aesthetic Vanity Unboxing'],
    pastBrandWins: 'Sold out 2,400 units of ceramide barrier cream in 72 hours (4.6x ROAS)',
    productTypeFits: {
      'Skincare & Clean Beauty': {
        score: 97,
        predictedRoi: '4.9x ROAS',
        rationale: 'Her followers religiously purchase serums, sunscreens, and face oils shown in her unfiltered morning routine.',
        suggestedHook: 'My barrier repair routine that saved my skin from chemical damage in 10 days.',
      },
      'Personal Care & Grooming': {
        score: 90,
        predictedRoi: '3.9x ROAS',
        rationale: 'Exceptional traction for sulphate-free haircare and body polishers.',
        suggestedHook: 'The botanical body scrub that smells like a 5-star Kerala resort.',
      },
      'Eco-Living & Home Care': {
        score: 85,
        predictedRoi: '3.4x ROAS',
        rationale: 'Loves sharing sustainable aesthetics, soy candles and clean linen sprays.',
        suggestedHook: 'Simple non-toxic swaps that upgraded my apartment’s calming aura.',
      },
      default: {
        score: 72,
        predictedRoi: '2.8x ROAS',
        rationale: 'Trend-conscious female audience eager for aesthetic, Instagrammable packaging.',
        suggestedHook: 'Unboxing an PR package that actually exceeded all expectations.',
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
    engagement: '5.8%',
    rawEngagement: 5.8,
    avgViews: '420K views/video',
    location: 'Delhi, Mumbai & Kolkata',
    topAudience: '58% Male • Age 18-34',
    audienceSplit: '58% Male, 42% Female (Foodies & Snack Lovers)',
    topCities: ['Delhi NCR', 'Mumbai', 'Kolkata', 'Jaipur'],
    estimatedCollabBudget: '₹75,000 - ₹1,10,000 / Collab',
    primaryProductTypes: ['Health Foods & Snacks', 'Gourmet Beverages & Tea'],
    contentFormats: ['Taste Test Challenges', 'Artisan Factory Tours', 'Blind Snack Shootouts'],
    pastBrandWins: 'Generated over 6,500 snack bundle orders via YouTube trackable link (3.9x ROAS)',
    productTypeFits: {
      'Health Foods & Snacks': {
        score: 95,
        predictedRoi: '4.2x ROAS',
        rationale: 'Massive scale for snacking; viewers buy immediately when he verifies crunch, texture and flavor balance.',
        suggestedHook: 'Is healthy roasted makhana actually better than deep-fried chips? Blind taste test!',
      },
      'Gourmet Beverages & Tea': {
        score: 88,
        predictedRoi: '3.6x ROAS',
        rationale: 'Great storytelling for artisanal craft brews, iced teas and kombuchas.',
        suggestedHook: 'I tried 10 artisanal cold brews to find the only one worth buying.',
      },
      default: {
        score: 70,
        predictedRoi: '2.6x ROAS',
        rationale: 'Huge entertainment reach with strong brand awareness across Tier 1 & 2 cities.',
        suggestedHook: 'Testing viral internet products so you don’t waste your money.',
      },
    },
  },
  {
    id: '5',
    name: 'Ananya Deshmukh',
    handle: '@ananyacurates',
    platform: 'Instagram',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&auto=format&fit=crop&q=80',
    followers: '194K',
    rawFollowers: 194000,
    engagement: '8.9%',
    rawEngagement: 8.9,
    avgViews: '125K views/reel',
    location: 'Pune & Bengaluru',
    topAudience: '76% Female • Age 22-38',
    audienceSplit: '76% Female, 24% Male (Designers, Architects, Homemakers)',
    topCities: ['Pune', 'Bengaluru', 'Chennai'],
    estimatedCollabBudget: '₹22,000 - ₹35,000 / Collab',
    primaryProductTypes: ['Eco-Living & Home Care', 'Gourmet Beverages & Tea', 'Personal Care & Grooming'],
    contentFormats: ['Slow Living Vlogs', 'Mindful Morning Rituals', 'Sustainable Pantry Restocks'],
    pastBrandWins: 'Drove 920 recurring subscriptions for organic herbal tea blends (4.4x ROAS)',
    productTypeFits: {
      'Eco-Living & Home Care': {
        score: 97,
        predictedRoi: '4.7x ROAS',
        rationale: 'Extremely loyal micro-community obsessed with non-toxic homes, beeswax candles and zero-waste soaps.',
        suggestedHook: '5 sustainable upgrades that made my morning coffee corner feel heavenly.',
      },
      'Gourmet Beverages & Tea': {
        score: 93,
        predictedRoi: '4.2x ROAS',
        rationale: 'Her calming tea steeping reels regularly generate comment floods asking for direct brand links.',
        suggestedHook: 'Why steeping whole loose-leaf lavender tea transformed my sleep routine.',
      },
      'Skincare & Clean Beauty': {
        score: 86,
        predictedRoi: '3.6x ROAS',
        rationale: 'High alignment with cold-pressed botanical oils and natural soaps.',
        suggestedHook: 'Simple cold-pressed oils I use instead of 10-step chemical skincare.',
      },
      default: {
        score: 76,
        predictedRoi: '3.1x ROAS',
        rationale: 'High trust, premium aesthetic and high repeat purchase conversion.',
        suggestedHook: 'The intentional lifestyle brand I fell in love with this season.',
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
    engagement: '6.7%',
    rawEngagement: 6.7,
    avgViews: '230K views/video',
    location: 'Delhi NCR & Chandigarh',
    topAudience: '82% Male • Age 18-32',
    audienceSplit: '82% Male, 18% Female (Gym Goers, Athletes, Calisthenics)',
    topCities: ['Delhi NCR', 'Chandigarh', 'Jaipur', 'Lucknow'],
    estimatedCollabBudget: '₹50,000 - ₹75,000 / Collab',
    primaryProductTypes: ['Fitness & Sports Nutrition', 'Health Foods & Snacks', 'Personal Care & Grooming'],
    contentFormats: ['Lab Certificate Teardown', 'Gym Bag Essentials', 'Full Day of Eating On A Budget'],
    pastBrandWins: 'Drove ₹22L in plant protein & peanut butter revenue with coupon code CLEANGAINS (4.7x ROAS)',
    productTypeFits: {
      'Fitness & Sports Nutrition': {
        score: 98,
        predictedRoi: '4.9x ROAS',
        rationale: 'The go-to voice for gym enthusiasts; strict about testing digestion, mixability and true protein yield.',
        suggestedHook: 'I sent this new plant protein to an independent lab. Here are the exact test results.',
      },
      'Health Foods & Snacks': {
        score: 89,
        predictedRoi: '3.9x ROAS',
        rationale: 'Converts high volumes of high-protein snacks, roasted seeds, and nut butters.',
        suggestedHook: 'The best high-protein snack for busy commuters that isn’t chalky.',
      },
      'Personal Care & Grooming': {
        score: 81,
        predictedRoi: '3.2x ROAS',
        rationale: 'Strong engagement on post-workout sweat prevention, active deodorant and beard hygiene.',
        suggestedHook: 'The only aluminum-free deodorant that survives a 90-minute leg day.',
      },
      default: {
        score: 72,
        predictedRoi: '2.9x ROAS',
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
    engagement: '7.8%',
    rawEngagement: 7.8,
    avgViews: '140K views/reel',
    location: 'Mumbai & Delhi NCR',
    topAudience: '79% Male • Age 21-36',
    audienceSplit: '79% Male, 21% Female (Grooming for Partners)',
    topCities: ['Mumbai', 'Delhi NCR', 'Bengaluru'],
    estimatedCollabBudget: '₹28,000 - ₹42,000 / Collab',
    primaryProductTypes: ['Personal Care & Grooming', 'Skincare & Clean Beauty'],
    contentFormats: ['Beard Transformation Timelines', 'Fragrance Layering Guides', 'Minimalist Men’s Skincare'],
    pastBrandWins: 'Drove 2,100 solid perfume & beard oil bundles during festive campaign (4.5x ROAS)',
    productTypeFits: {
      'Personal Care & Grooming': {
        score: 98,
        predictedRoi: '5.1x ROAS',
        rationale: 'Highest conversion rate for men’s beard oils, solid colognes, scalp treatments and face washes.',
        suggestedHook: '3 grooming mistakes that make men look scruffy (and how to fix them in 60 seconds).',
      },
      'Skincare & Clean Beauty': {
        score: 87,
        predictedRoi: '3.7x ROAS',
        rationale: 'Demystifies skincare for men who want a 2-step routine without greasy residues.',
        suggestedHook: 'A non-greasy matte sunscreen designed for men who hate the white cast.',
      },
      default: {
        score: 71,
        predictedRoi: '2.7x ROAS',
        rationale: 'Fastest-growing men’s lifestyle creators with strong urban metro penetration.',
        suggestedHook: 'Upgrade your daily grooming kit with this game-changer.',
      },
    },
  },
  {
    id: '8',
    name: 'Zoya Merchant (Tea & Botanicals)',
    handle: '@zoyabotanica',
    platform: 'Instagram',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
    followers: '145K',
    rawFollowers: 145000,
    engagement: '9.4%',
    rawEngagement: 9.4,
    avgViews: '110K views/reel',
    location: 'Bengaluru & Kochi',
    topAudience: '81% Female • Age 22-40',
    audienceSplit: '81% Female, 19% Male (Wellness & Herbology Lovers)',
    topCities: ['Bengaluru', 'Kochi', 'Mumbai'],
    estimatedCollabBudget: '₹18,000 - ₹28,000 / Collab',
    primaryProductTypes: ['Gourmet Beverages & Tea', 'Supplements & Daily Wellness', 'Eco-Living & Home Care'],
    contentFormats: ['Herbal Infusion Brewing', 'Ayurvedic Botanical Guides', 'Cozy Reading Nook Routines'],
    pastBrandWins: 'Generated 1,500 loose-leaf tea tin purchases with a 38% 60-day repeat rate (4.6x ROAS)',
    productTypeFits: {
      'Gourmet Beverages & Tea': {
        score: 99,
        predictedRoi: '5.4x ROAS',
        rationale: 'Niche authority in whole chamomile, rose petal green teas, and cold brew tisanes. Highest engagement in category.',
        suggestedHook: 'Stop drinking microplastics from bleached tea bags. Here is how real loose leaf looks.',
      },
      'Supplements & Daily Wellness': {
        score: 91,
        predictedRoi: '4.1x ROAS',
        rationale: 'High alignment for ashwagandha elixirs, mushroom coffee and sleep powders.',
        suggestedHook: 'How I replaced my afternoon anxiety coffee with this calming botanical adaptogen.',
      },
      'Eco-Living & Home Care': {
        score: 86,
        predictedRoi: '3.6x ROAS',
        rationale: 'Loves glass teaware, wooden spoons, and non-toxic ceramic mugs.',
        suggestedHook: 'The artisanal ceramic mug & infuser that made mornings my favorite part of the day.',
      },
      default: {
        score: 74,
        predictedRoi: '2.9x ROAS',
        rationale: 'Passionate micro-influencer with deep community intimacy and comments conversion.',
        suggestedHook: 'An artisanal Indian brand doing botanicals the right way.',
      },
    },
  },
];

export const InfluencersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Selected Product Type from URL or default
  const initialProductType = (searchParams.get('productType') as ProductType) || 'All Product Types';
  const [selectedProductType, setSelectedProductType] = useState<ProductType>(
    PRODUCT_TYPES.includes(initialProductType) ? initialProductType : 'All Product Types'
  );

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('All Platforms');
  const [selectedTier, setSelectedTier] = useState<string>('All Tiers');
  const [sortBy, setSortBy] = useState<'match' | 'roi' | 'followers' | 'engagement'>('match');

  // Interactive Product Matchmaker State
  const [matchmakerOpen, setMatchmakerOpen] = useState(true);
  const [customProductName, setCustomProductName] = useState('70% Single-Origin Dark Chocolate');
  const [customPricePoint, setCustomPricePoint] = useState('₹450 - ₹750');
  const [customTargetAudience, setCustomTargetAudience] = useState('Urban Health-Conscious (Age 22-38)');
  const [matchmakerCalculated, setMatchmakerCalculated] = useState(false);

  // Pitch Modal State
  const [activePitchCreator, setActivePitchCreator] = useState<Influencer | null>(null);
  const [pitchMessage, setPitchMessage] = useState('');
  const [pitchCopied, setPitchCopied] = useState(false);
  const [pitchSent, setPitchSent] = useState(false);

  // Profile Detail Modal State
  const [selectedProfile, setSelectedProfile] = useState<Influencer | null>(null);

  // Sync selected product type to URL
  const handleProductTypeChange = (type: ProductType) => {
    setSelectedProductType(type);
    if (type === 'All Product Types') {
      searchParams.delete('productType');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ productType: type });
    }
  };

  // Helper to get product fit for a creator based on active product type
  const getProductFit = (creator: Influencer, type: ProductType): CreatorProductFit => {
    if (type === 'All Product Types') {
      // Return highest fitting product score among their specialties
      const fits = Object.values(creator.productTypeFits);
      const topFit = fits.reduce((prev, curr) => (curr.score > prev.score ? curr : prev), fits[0]);
      return topFit || creator.productTypeFits.default;
    }
    return creator.productTypeFits[type] || creator.productTypeFits.default;
  };

  // Filtered and Sorted Creators
  const filteredCreators = useMemo(() => {
    return CREATORS_DATABASE.filter((creator) => {
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
  }, [selectedProductType, selectedPlatform, selectedTier, searchQuery, sortBy]);

  // Open Pitch Modal with tailored message for this product type
  const handleOpenPitch = (creator: Influencer) => {
    const fit = getProductFit(creator, selectedProductType);
    const activeCategoryLabel = selectedProductType === 'All Product Types' ? 'innovative D2C' : selectedProductType;

    const defaultPitch = `Hi ${creator.name}! 👋

We love your work on ${creator.handle} and your honest audience connection in the ${activeCategoryLabel} space.

We are launching a new product: "${customProductName}" (Target MSRP: ${customPricePoint}). 
Our concept is custom-tailored for ${customTargetAudience}.

Based on your content style ("${creator.contentFormats[0] || 'honest unboxing'}"), we'd love to gift you an exclusive Founder PR Kit with zero posting pressure, or collaborate on a paid partnership with a custom trackable community code.

Hook Angle we thought of for your audience:
"${fit.suggestedHook}"

Would love to send a complimentary package your way to get your genuine thoughts! What’s the best address for your team?

Best,
Adarsh Reddy | Founder, D2C Vision`;

    setPitchMessage(defaultPitch);
    setActivePitchCreator(creator);
    setPitchSent(false);
    setPitchCopied(false);
  };

  const handleCopyPitch = () => {
    navigator.clipboard.writeText(pitchMessage);
    setPitchCopied(true);
    setTimeout(() => setPitchCopied(false), 2000);
  };

  const handleSendPitch = (e: React.FormEvent) => {
    e.preventDefault();
    setPitchSent(true);
    setTimeout(() => {
      setPitchSent(false);
      setActivePitchCreator(null);
    }, 1800);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* ==================================================
          PAGE HEADER
          ================================================== */}
      <div className="rounded-2xl p-6 sm:p-7 bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="space-y-2 relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-xs font-semibold text-emerald-800">
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>Product-Led Creator Discovery</span>
            <span className="text-emerald-600/70">• Data-Driven ROAS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Influencer Finder <span className="text-emerald-600">by Product Type</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Match high-converting creators to your specific product category. Analyze verified product-type compatibility
            scores, audience buying power, and predicted campaign ROAS.
          </p>
        </div>

        {/* Quick KPI stats strip */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Vetted Creators</span>
            <span className="text-lg font-extrabold text-slate-900 font-mono-nums">1,240+</span>
          </div>
          <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-center">
            <span className="text-[10px] text-emerald-700 uppercase font-semibold block">Avg. Predicted ROAS</span>
            <span className="text-lg font-extrabold text-emerald-700 font-mono-nums">4.4x</span>
          </div>
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
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMatchmakerCalculated(true);
                    setTimeout(() => setMatchmakerCalculated(false), 2500);
                  }}
                  className="btn-primary-gradient px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-emerald-200" />
                  <span>
                    {matchmakerCalculated ? 'Calculated Matches!' : 'Calculate Best Product Matches'}
                  </span>
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
            Try switching to "All Product Types" or clearing your search filters to view more profiles.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedProductType('All Product Types');
              setSearchQuery('');
              setSelectedPlatform('All Platforms');
              setSelectedTier('All Tiers');
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

            return (
              <div
                key={creator.id}
                className="rounded-2xl p-5 bg-white border border-slate-200/90 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between group"
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
                        <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                          {creator.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-slate-500 font-mono">{creator.handle}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {creator.platform}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Product Fit Score Pill */}
                    <div className="flex flex-col items-end">
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-extrabold font-mono-nums">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span>{fit.score}% Fit</span>
                      </div>
                      <span className="text-[10px] text-slate-600 font-semibold mt-0.5 font-mono-nums">
                        {fit.predictedRoi}
                      </span>
                    </div>
                  </div>

                  {/* 3-Cell Metrics Bar */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center mb-3.5">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-medium">Followers</span>
                      <span className="text-xs font-bold text-slate-900 font-mono-nums">{creator.followers}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-medium">Engagement</span>
                      <span className="text-xs font-bold text-emerald-700 font-mono-nums">{creator.engagement}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-medium">Avg. Reach</span>
                      <span className="text-xs font-bold text-slate-800 font-mono-nums truncate block">
                        {creator.avgViews.split(' ')[0]}
                      </span>
                    </div>
                  </div>

                  {/* Product Type Rationale */}
                  <div className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-100/80 mb-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-emerald-900">
                      <span>Product Fit Rationale:</span>
                      <span className="text-emerald-700 font-mono-nums">Verified Match</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">{fit.rationale}</p>
                  </div>

                  {/* Audience & Location Details */}
                  <div className="space-y-1 text-[11px] text-slate-600 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Audience:</span>
                      <span className="text-slate-800 font-semibold truncate max-w-[190px]">{creator.topAudience}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Top Metro Hubs:</span>
                      <span className="text-slate-800 font-semibold truncate max-w-[190px]">
                        {creator.topCities.join(', ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Estimated Collab:</span>
                      <span className="text-slate-900 font-bold font-mono-nums">{creator.estimatedCollabBudget}</span>
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
                    <span>View Bio</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenPitch(creator)}
                    className="flex-1 btn-primary-gradient px-3 py-2 rounded-xl text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Send Pitch</span>
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
                <h4 className="text-sm font-bold text-slate-900">Pitch Delivered to Creator Manager!</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Your personalized brief for {customProductName} has been sent via direct agency integration.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendPitch} className="space-y-3.5">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    AI-Generated Brief for {selectedProductType}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPitch}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {pitchCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{pitchCopied ? 'Copied!' : 'Copy Brief'}</span>
                  </button>
                </div>

                <textarea
                  rows={9}
                  value={pitchMessage}
                  onChange={(e) => setPitchMessage(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 leading-relaxed focus:outline-none focus:border-emerald-500 focus:bg-white transition-all resize-none"
                />

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
          CREATOR PROFILE DETAILS MODAL
          ================================================== */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl p-6 bg-white border border-slate-200 shadow-2xl relative space-y-4">
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
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Engagement</span>
                <span className="text-sm font-bold text-emerald-700 font-mono-nums">{selectedProfile.engagement}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Avg. Reel Reach</span>
                <span className="text-sm font-bold text-slate-900 font-mono-nums">{selectedProfile.avgViews}</span>
              </div>
            </div>

            {/* Past Brand Wins */}
            <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-1">
              <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">
                Verified Past Brand Campaign Performance
              </span>
              <p className="text-xs text-slate-700 font-medium">{selectedProfile.pastBrandWins}</p>
            </div>

            {/* Audience Demographics */}
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Audience Breakdown & Metro Hubs
                </span>
                <p className="text-slate-800 font-semibold">{selectedProfile.audienceSplit}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedProfile.topCities.map((city, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] text-slate-600 font-medium">
                      {city}
                    </span>
                  ))}
                </div>
              </div>

              {/* Best Content Formats */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Top Converting Content Styles
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedProfile.contentFormats.map((fmt, idx) => (
                    <span key={idx} className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-800 font-semibold">
                      {fmt}
                    </span>
                  ))}
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

