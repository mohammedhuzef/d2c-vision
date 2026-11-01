import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Globe2,
  Users,
  Target,
  BarChart3,
  Layers,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  ChevronDown,
  DollarSign,
  Percent,
  CheckCircle2,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export const MarketAnalysisPage: React.FC = () => {
  const [selectedGeo, setSelectedGeo] = useState<'India' | 'USA' | 'UK' | 'UAE' | 'Global'>('India');
  const [selectedPricingTier, setSelectedPricingTier] = useState<'sweetspot' | 'mass' | 'premium' | 'luxury'>('sweetspot');

  // Geographic metrics
  const geoMetrics = useMemo(() => {
    switch (selectedGeo) {
      case 'USA':
        return {
          tam: '$385 Billion',
          cagr: '+18.2% CAGR',
          aov: '$48 / order',
          cac: '$32 blended CAC',
          whitespace: 'Grade 8.8/10',
          whitespaceNiche: 'Organic Nootropics & Clean Hydration',
          trendData: [
            { year: '2023', marketSize: 220, d2cShare: 68 },
            { year: '2024', marketSize: 260, d2cShare: 88 },
            { year: '2025', marketSize: 310, d2cShare: 112 },
            { year: '2026', marketSize: 385, d2cShare: 145 },
            { year: '2027 (P)', marketSize: 460, d2cShare: 185 },
            { year: '2028 (P)', marketSize: 550, d2cShare: 235 },
          ],
          competitors: [
            { brand: 'Liquid I.V.', category: 'Hydration & Wellness', marketShare: '28%', avgPrice: '$24.99', rating: '4.8 ★', moat: 'Cellular Transport Technology (CTT)', vulnerability: 'High sugar content in original formula' },
            { brand: 'Magic Spoon', category: 'High-Protein Cereal', marketShare: '19%', avgPrice: '$9.99', rating: '4.6 ★', moat: 'Nostalgic branding & high protein', vulnerability: 'High retail shelf price' },
            { brand: 'Olaplex', category: 'Haircare & Bonding', marketShare: '22%', avgPrice: '$30.00', rating: '4.7 ★', moat: 'Patented bis-aminopropyl diglycol dimaleate', vulnerability: 'Heavy salon channel dependency' },
            { brand: 'Athletic Greens (AG1)', category: 'Foundational Nutrition', marketShare: '15%', avgPrice: '$79.00', rating: '4.5 ★', moat: 'High subscriber LTV & podcast marketing', vulnerability: 'High upfront customer objection' },
          ],
        };
      case 'UK':
        return {
          tam: '£64 Billion ($78B)',
          cagr: '+16.5% CAGR',
          aov: '£36 / order',
          cac: '£18 blended CAC',
          whitespace: 'Grade 8.5/10',
          whitespaceNiche: 'Functional Cold Brew & Adaptogenic Tea',
          trendData: [
            { year: '2023', marketSize: 42, d2cShare: 12 },
            { year: '2024', marketSize: 52, d2cShare: 16 },
            { year: '2025', marketSize: 64, d2cShare: 22 },
            { year: '2026', marketSize: 78, d2cShare: 29 },
            { year: '2027 (P)', marketSize: 94, d2cShare: 38 },
            { year: '2028 (P)', marketSize: 112, d2cShare: 49 },
          ],
          competitors: [
            { brand: 'Huel', category: 'Complete Nutrition', marketShare: '32%', avgPrice: '£2.10/meal', rating: '4.6 ★', moat: 'Direct subscription flywheel', vulnerability: 'Taste fatigue over prolonged usage' },
            { brand: 'Trip Drinks', category: 'CBD & Botanical Drinks', marketShare: '26%', avgPrice: '£2.49/can', rating: '4.7 ★', moat: 'Aesthetic pastel branding in Sainsbury\'s', vulnerability: 'Regulatory restrictions across borders' },
            { brand: 'Wild Cosmetics', category: 'Refillable Deodorants', marketShare: '21%', avgPrice: '£12.00', rating: '4.8 ★', moat: 'Zero-plastic aluminum casing', vulnerability: 'Limited SKU expansion breadth' },
            { brand: 'Minor Figures', category: 'Oat Milk & Cold Brew', marketShare: '14%', avgPrice: '£2.20', rating: '4.5 ★', moat: 'Specialty cafe barista relationships', vulnerability: 'Lower margins in retail vs D2C' },
          ],
        };
      case 'UAE':
        return {
          tam: 'AED 125B ($34B)',
          cagr: '+24.8% CAGR',
          aov: 'AED 240 / order',
          cac: 'AED 55 blended CAC',
          whitespace: 'Grade 9.4/10',
          whitespaceNiche: 'Halal Luxury Skincare & Gourmet Snacks',
          trendData: [
            { year: '2023', marketSize: 18, d2cShare: 5 },
            { year: '2024', marketSize: 23, d2cShare: 7 },
            { year: '2025', marketSize: 28, d2cShare: 10 },
            { year: '2026', marketSize: 34, d2cShare: 13 },
            { year: '2027 (P)', marketSize: 42, d2cShare: 18 },
            { year: '2028 (P)', marketSize: 52, d2cShare: 24 },
          ],
          competitors: [
            { brand: 'Bateel', category: 'Luxury Organic Dates & Sweets', marketShare: '35%', avgPrice: 'AED 180', rating: '4.9 ★', moat: 'Prestige royal gifting brand equity', vulnerability: 'Traditional retail focus, limited D2C app' },
            { brand: 'Kibsons', category: 'Fresh Nutrition & Organic', marketShare: '24%', avgPrice: 'AED 120', rating: '4.7 ★', moat: 'Own refrigerated delivery fleet', vulnerability: 'Low product margin on fresh commodities' },
            { brand: 'Shiffa Dubai', category: 'Organic Luxury Skincare', marketShare: '18%', avgPrice: 'AED 350', rating: '4.8 ★', moat: 'Dermatologist founder & Middle East prestige', vulnerability: 'Exclusively high price tier' },
            { brand: 'Right Bite', category: 'Personalized Meal Plans', marketShare: '14%', avgPrice: 'AED 90/day', rating: '4.5 ★', moat: 'Nutritional clinical counseling', vulnerability: 'High churn after 90 days' },
          ],
        };
      case 'Global':
        return {
          tam: '$850 Billion',
          cagr: '+21.4% CAGR',
          aov: '$42 / order',
          cac: '$26 blended CAC',
          whitespace: 'Grade 9.1/10',
          whitespaceNiche: 'Clean Functional Wellness & Quick-Commerce',
          trendData: [
            { year: '2023', marketSize: 490, d2cShare: 140 },
            { year: '2024', marketSize: 590, d2cShare: 180 },
            { year: '2025', marketSize: 710, d2cShare: 235 },
            { year: '2026', marketSize: 850, d2cShare: 310 },
            { year: '2027 (P)', marketSize: 1020, d2cShare: 405 },
            { year: '2028 (P)', marketSize: 1240, d2cShare: 530 },
          ],
          competitors: [
            { brand: 'The Whole Truth (IN)', category: 'Clean Snacking', marketShare: '18%', avgPrice: '$4.20', rating: '4.7 ★', moat: '100% ingredient transparency', vulnerability: 'International shipping logistics' },
            { brand: 'Liquid I.V. (US)', category: 'Hydration', marketShare: '24%', avgPrice: '$24.99', rating: '4.8 ★', moat: 'Mass Unilever distribution muscle', vulnerability: 'Premium retail price' },
            { brand: 'Huel (UK/EU)', category: 'Complete Meal Replacements', marketShare: '20%', avgPrice: '$2.50/meal', rating: '4.6 ★', moat: 'D2C subscription scale', vulnerability: 'High barrier for casual consumers' },
            { brand: 'Plum Goodness (IN)', category: 'Vegan Skincare', marketShare: '16%', avgPrice: '$7.50', rating: '4.6 ★', moat: 'Cruelty-free PETA certification', vulnerability: 'Rising Meta CAC in Tier 1' },
          ],
        };
      default: // India
        return {
          tam: '₹8.6 Lakh Cr ($104B)',
          cagr: '+26.4% CAGR',
          aov: '₹890 / order',
          cac: '₹48 blended CAC',
          whitespace: 'Grade 9.2/10',
          whitespaceNiche: 'Clean Adaptogenic Snacks & Quick-Commerce',
          trendData: [
            { year: '2023', marketSize: 42, d2cShare: 14 },
            { year: '2024', marketSize: 58, d2cShare: 21 },
            { year: '2025', marketSize: 76, d2cShare: 32 },
            { year: '2026', marketSize: 104, d2cShare: 46 },
            { year: '2027 (P)', marketSize: 138, d2cShare: 64 },
            { year: '2028 (P)', marketSize: 182, d2cShare: 88 },
          ],
          competitors: [
            { brand: 'The Whole Truth', category: 'Clean Food & Cocoa', marketShare: '18%', avgPrice: '₹349', rating: '4.7 ★', moat: '100% Honest Clean Label Transparency', vulnerability: 'Higher price point, premium metro only' },
            { brand: 'Yoga Bar', category: 'Snacks & Cereals', marketShare: '24%', avgPrice: '₹199', rating: '4.5 ★', moat: 'Deep Quick-Commerce Distribution (Blinkit)', vulnerability: 'Perceived as mass rather than luxury' },
            { brand: 'Plum Goodness', category: 'Personal Care & Serums', marketShare: '21%', avgPrice: '₹499', rating: '4.6 ★', moat: '100% Vegan & Cruelty-Free certification', vulnerability: 'Crowded serum space, high Facebook ad costs' },
            { brand: 'Epigamia', category: 'Greek Yogurt & Beverages', marketShare: '16%', avgPrice: '₹120', rating: '4.4 ★', moat: 'Cold-chain refrigeration fleet', vulnerability: 'Short shelf life limits non-metro delivery' },
          ],
        };
    }
  }, [selectedGeo]);

  // Sector breakdown data
  const categoryShare = [
    { name: 'Food & Gourmet Snacks', value: 34, color: '#7547FF' },
    { name: 'Beauty & Skincare', value: 26, color: '#A855F7' },
    { name: 'Health & Supplements', value: 20, color: '#25D9E8' },
    { name: 'Beverages & Tonics', value: 12, color: '#28D7A0' },
    { name: 'Home & Lifestyle', value: 8, color: '#FFBE58' },
  ];

  // Pricing bands data
  const pricingTiers = [
    {
      id: 'mass' as const,
      name: 'Budget / Mass-Market',
      priceRange: '₹99 - ₹199 ($2 - $4)',
      marginExpectation: '25% - 35% Gross',
      description: 'Volume driven. Low margin necessitates quick-commerce or retail scale to cover packaging overhead.',
      adFeasibility: 'Low (cannot absorb >₹40 CAC without 3+ unit bundles)',
      verdict: 'Challenging for pure D2C website',
    },
    {
      id: 'sweetspot' as const,
      name: 'Core D2C Sweet-Spot (Recommended)',
      priceRange: '₹249 - ₹499 ($6 - $12)',
      marginExpectation: '50% - 65% Gross',
      description: 'Ideal sweet spot. Unit contribution easily covers ₹40-₹60 CAC while retaining attractive first-order margins.',
      adFeasibility: 'Optimal for Meta & Google ads',
      verdict: 'Highest investor appeal & scalability',
    },
    {
      id: 'premium' as const,
      name: 'Premium Craft & Adaptogenic',
      priceRange: '₹599 - ₹999 ($15 - $25)',
      marginExpectation: '65% - 75% Gross',
      description: 'High AOV. Perfect for functional superfoods, barrier skincare, and 3-pack discovery sets.',
      adFeasibility: 'High (allows up to ₹150 CAC)',
      verdict: 'Superior repeat customer LTV',
    },
    {
      id: 'luxury' as const,
      name: 'Ultra-Luxury Gifting & Reserve',
      priceRange: '₹1,200+ ($30+)',
      marginExpectation: '75%+ Gross',
      description: 'Exquisite wooden/tin packaging, single-origin botanical storytelling, and corporate festive gifting.',
      adFeasibility: 'Very High (influencer seeding primary)',
      verdict: 'High margin, lower purchase frequency',
    },
  ];

  // Customer Segments
  const customerSegments = [
    {
      name: 'Clean-Label Millennials',
      share: '38%',
      age: '24 - 34',
      motivation: 'Zero refined sugar, honest ingredient lists, sleek aesthetic packaging.',
      willingnessToPay: 'High (₹299 - ₹599)',
      topChannel: 'Instagram Reels & Blinkit 10-min delivery',
    },
    {
      name: 'Performance Biohackers',
      share: '26%',
      age: '22 - 40',
      motivation: 'High protein-to-calorie ratio, nootropics, adaptogenic herbs for focus.',
      willingnessToPay: 'Very High (₹599 - ₹1,499)',
      topChannel: 'YouTube Fitness Podcasts & Brand Website D2C',
    },
    {
      name: 'Mindful Family Shoppers',
      share: '22%',
      age: '30 - 48',
      motivation: 'Kid-friendly healthy snacking, chemical-free personal care.',
      willingnessToPay: 'Moderate (₹199 - ₹399)',
      topChannel: 'Amazon Prime Subscriptions & Word of Mouth',
    },
    {
      name: 'Gen-Z Aesthetic Seekers',
      share: '14%',
      age: '18 - 25',
      motivation: 'Trending superfoods, unboxing experience, TikTok/Reels viral hype.',
      willingnessToPay: 'Moderate-High (₹249 - ₹449)',
      topChannel: 'Micro-influencer TikTok & D2C Limited Drops',
    },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="rounded-2xl p-6 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#25D9E8]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#25D9E8]/15 border border-[#25D9E8]/30 text-[#25D9E8] text-xs font-semibold mb-2">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Real-Time Market Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFF] tracking-tight">
              Market Analysis & Pricing Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-[#9EADC2] mt-1 max-w-2xl">
              Deep dive into consumer spending patterns, competitor price architecture, category white space, and regional penetration across global D2C corridors.
            </p>
          </div>

          {/* Geo Selector */}
          <div className="flex items-center bg-[rgba(8,24,44,0.7)] p-1 rounded-xl border border-[rgba(161,190,230,0.2)]">
            {(['India', 'USA', 'UK', 'UAE', 'Global'] as const).map((geo) => (
              <button
                key={geo}
                type="button"
                onClick={() => setSelectedGeo(geo)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedGeo === geo
                    ? 'bg-gradient-to-r from-[#7547FF] to-[#278BFF] text-white shadow-sm'
                    : 'text-[#9EADC2] hover:text-[#F8FAFF]'
                }`}
              >
                {geo}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top 4 KPI Tiles (Dynamically driven by selectedGeo) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl p-4 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl shadow-md">
          <span className="text-[11px] text-[#9EADC2] block font-medium">Total Addressable Market (TAM)</span>
          <div className="text-2xl font-black text-white font-mono-nums mt-1">{geoMetrics.tam}</div>
          <span className="text-[10px] text-[#28D7A0] font-bold mt-1 block">{geoMetrics.cagr}</span>
        </div>

        <div className="rounded-2xl p-4 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl shadow-md">
          <span className="text-[11px] text-[#9EADC2] block font-medium">Average Consumer Basket (AOV)</span>
          <div className="text-2xl font-black text-[#25D9E8] font-mono-nums mt-1">{geoMetrics.aov}</div>
          <span className="text-[10px] text-[#9EADC2] mt-1 block">Quick-Commerce lifting bundle frequency</span>
        </div>

        <div className="rounded-2xl p-4 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl shadow-md">
          <span className="text-[11px] text-[#9EADC2] block font-medium">Customer Acquisition Cost (CAC)</span>
          <div className="text-2xl font-black text-[#A855F7] font-mono-nums mt-1">{geoMetrics.cac}</div>
          <span className="text-[10px] text-[#9EADC2] mt-1 block">Meta + Google blended digital benchmark</span>
        </div>

        <div className="rounded-2xl p-4 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl shadow-md">
          <span className="text-[11px] text-[#9EADC2] block font-medium">Whitespace Opportunity</span>
          <div className="text-2xl font-black text-[#28D7A0] font-mono-nums mt-1">{geoMetrics.whitespace}</div>
          <span className="text-[10px] text-[#28D7A0] font-bold mt-1 block truncate">{geoMetrics.whitespaceNiche}</span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Market Size Projection Chart (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl p-5 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(161,190,230,0.18)] mb-3">
            <div>
              <h3 className="text-sm font-bold text-white">D2C Category Market Trajectory ({selectedGeo})</h3>
              <p className="text-[11px] text-[#9EADC2]">Total Market Growth vs Direct-to-Consumer Digital Share</p>
            </div>
            <span className="text-xs text-[#25D9E8] font-mono-nums font-bold">2023 - 2028 Projections</span>
          </div>

          <div className="w-full h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={geoMetrics.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="marketGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7547FF" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#7547FF" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="d2cGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#25D9E8" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#25D9E8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" stroke="#9EADC2" fontSize={11} tickLine={false} />
                <YAxis stroke="#9EADC2" fontSize={11} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-2.5 rounded-xl text-xs text-white bg-[rgba(8,24,44,0.95)] border border-[rgba(161,190,230,0.25)] shadow-xl">
                          <p className="font-bold text-[#F8FAFF]">{payload[0].payload.year}</p>
                          <p className="text-[#A855F7]">Total Market Index: {payload[0].value}</p>
                          <p className="text-[#25D9E8]">D2C Direct Share: {payload[1].value}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="marketSize" stroke="#7547FF" strokeWidth={2.5} fill="url(#marketGrad)" />
                <Area type="monotone" dataKey="d2cShare" stroke="#25D9E8" strokeWidth={2.5} fill="url(#d2cGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share Breakdown (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl p-5 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white pb-3 border-b border-[rgba(161,190,230,0.18)] mb-3">
              Consumer Spend Distribution by Sector
            </h3>
            <div className="space-y-2.5">
              {categoryShare.map((cat) => (
                <div key={cat.name} className="text-xs">
                  <div className="flex justify-between items-center text-[11px] mb-1">
                    <span className="text-[#9EADC2] font-medium flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </span>
                    <span className="font-mono-nums font-bold text-white">{cat.value}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${cat.value}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-[rgba(8,24,44,0.5)] border border-[rgba(161,190,230,0.15)] text-[11px] text-[#9EADC2] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#25D9E8] shrink-0" />
            <span>Fastest accelerating niche in {selectedGeo}: Functional Beverages (+52% YoY online search volume).</span>
          </div>
        </div>
      </div>

      {/* Pricing Opportunities Corridor Matrix */}
      <div className="rounded-2xl p-5 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(161,190,230,0.18)] mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#28D7A0]" />
              <span>D2C Pricing Architecture & Margin Corridor</span>
            </h3>
            <p className="text-[11px] text-[#9EADC2]">Evaluate unit economics, CAC cushion, and ad viability across 4 distinct pricing tiers</p>
          </div>
          <span className="text-xs font-semibold text-[#25D9E8] bg-[#25D9E8]/10 px-2.5 py-1 rounded-full border border-[#25D9E8]/25">
            Sweet-Spot: ₹249 - ₹499
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {pricingTiers.map((tier) => (
            <div
              key={tier.id}
              onClick={() => setSelectedPricingTier(tier.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                selectedPricingTier === tier.id
                  ? 'bg-[rgba(8,24,44,0.85)] border-[#25D9E8] ring-2 ring-[#25D9E8]/40 shadow-lg'
                  : 'bg-[rgba(8,24,44,0.4)] border-[rgba(161,190,230,0.15)] hover:bg-[rgba(8,24,44,0.6)]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-white">{tier.name}</span>
                  {tier.id === 'sweetspot' && (
                    <span className="text-[9px] font-bold text-[#28D7A0] bg-[#28D7A0]/15 px-1.5 py-0.5 rounded">
                      Ideal
                    </span>
                  )}
                </div>

                <div className="text-sm font-black text-[#25D9E8] font-mono-nums mb-1">
                  {tier.priceRange}
                </div>
                <div className="text-[10px] font-semibold text-[#28D7A0] mb-2 font-mono-nums">
                  {tier.marginExpectation}
                </div>
                <p className="text-[11px] text-[#9EADC2] leading-relaxed mb-3">
                  {tier.description}
                </p>
              </div>

              <div className="pt-2 border-t border-[rgba(161,190,230,0.1)] text-[10px] space-y-1">
                <div className="text-slate-300">
                  <strong>Ad Cushion:</strong> {tier.adFeasibility}
                </div>
                <div className="text-[#25D9E8] font-semibold">
                  {tier.verdict}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Competitor Benchmarking Matrix (Filtered by Geo) */}
      <div className="rounded-2xl p-5 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(161,190,230,0.18)] mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Competitor Benchmarking & Strategic Moats ({selectedGeo})</h3>
            <p className="text-[11px] text-[#9EADC2]">Dominant players, price architecture, and vulnerabilities to exploit</p>
          </div>
          <span className="text-xs text-[#25D9E8] font-semibold">Active Geography: {selectedGeo}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[#9EADC2] border-b border-[rgba(161,190,230,0.18)]">
              <tr>
                <th className="pb-3">Brand Name</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Avg Retail Price</th>
                <th className="pb-3">Market Share</th>
                <th className="pb-3">Core Strategic Moat</th>
                <th className="pb-3">Vulnerability to Exploit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(161,190,230,0.1)] text-slate-300">
              {geoMetrics.competitors.map((comp) => (
                <tr key={comp.brand} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 font-bold text-white flex items-center gap-1.5">
                    <span>{comp.brand}</span>
                    <span className="text-[10px] text-amber-400 font-normal">{comp.rating}</span>
                  </td>
                  <td className="py-3 text-[#9EADC2]">{comp.category}</td>
                  <td className="py-3 font-mono-nums font-bold text-white">{comp.avgPrice}</td>
                  <td className="py-3 font-mono-nums text-[#25D9E8]">{comp.marketShare}</td>
                  <td className="py-3 text-[#28D7A0]">{comp.moat}</td>
                  <td className="py-3 text-[#F43F5E]">{comp.vulnerability}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Target Customer Segments & Demographics */}
      <div className="rounded-2xl p-5 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl shadow-lg">
        <div className="pb-3 border-b border-[rgba(161,190,230,0.18)] mb-4">
          <h3 className="text-sm font-bold text-white">Target Customer Persona Breakdown</h3>
          <p className="text-[11px] text-[#9EADC2]">Demographic profiles, buying triggers, and customer acquisition channels</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {customerSegments.map((seg) => (
            <div key={seg.name} className="p-4 rounded-xl bg-[rgba(8,24,44,0.5)] border border-[rgba(161,190,230,0.15)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{seg.name}</span>
                <span className="text-[10px] font-bold text-[#25D9E8] bg-[#25D9E8]/15 px-1.5 py-0.5 rounded border border-[#25D9E8]/30">
                  {seg.share} Share
                </span>
              </div>
              <div className="text-[11px] text-[#9EADC2]">
                <strong>Age Cohort:</strong> {seg.age}
              </div>
              <div className="text-[11px] text-slate-300 leading-relaxed">
                <strong>Key Motivation:</strong> {seg.motivation}
              </div>
              <div className="text-[11px] text-[#28D7A0]">
                <strong>Willingness to Pay:</strong> {seg.willingnessToPay}
              </div>
              <div className="text-[10px] text-[#9EADC2] pt-2 border-t border-[rgba(161,190,230,0.1)]">
                <strong>Best Channel:</strong> {seg.topChannel}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
