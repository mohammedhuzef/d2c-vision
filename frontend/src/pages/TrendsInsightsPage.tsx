import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  TrendingUp,
  Globe2,
  Sparkles,
  ArrowUpRight,
  Filter,
  BarChart3,
  Zap,
  ArrowRight,
  ShieldCheck,
  Tag,
  Star,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export const TrendsInsightsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedGeo, setSelectedGeo] = useState<'India' | 'USA' | 'UK' | 'UAE' | 'Global'>('India');
  const [filterType, setFilterType] = useState<'all' | 'high-growth' | 'high-margin'>('all');
  const [activeNicheModal, setActiveNicheModal] = useState<any | null>(null);

  // Dynamic Trend Chart Data per Geo
  const trendHistory = useMemo(() => {
    switch (selectedGeo) {
      case 'USA':
        return [
          { month: 'Jul', 'Clean Snacking': 55, 'Functional Beverages': 62, 'Barrier Skincare': 68 },
          { month: 'Aug', 'Clean Snacking': 60, 'Functional Beverages': 69, 'Barrier Skincare': 74 },
          { month: 'Sep', 'Clean Snacking': 68, 'Functional Beverages': 78, 'Barrier Skincare': 80 },
          { month: 'Oct', 'Clean Snacking': 75, 'Functional Beverages': 86, 'Barrier Skincare': 89 },
          { month: 'Nov', 'Clean Snacking': 84, 'Functional Beverages': 94, 'Barrier Skincare': 95 },
          { month: 'Dec', 'Clean Snacking': 92, 'Functional Beverages': 100, 'Barrier Skincare': 98 },
        ];
      case 'UK':
        return [
          { month: 'Jul', 'Clean Snacking': 40, 'Functional Beverages': 45, 'Barrier Skincare': 52 },
          { month: 'Aug', 'Clean Snacking': 46, 'Functional Beverages': 53, 'Barrier Skincare': 58 },
          { month: 'Sep', 'Clean Snacking': 52, 'Functional Beverages': 62, 'Barrier Skincare': 66 },
          { month: 'Oct', 'Clean Snacking': 61, 'Functional Beverages': 70, 'Barrier Skincare': 74 },
          { month: 'Nov', 'Clean Snacking': 72, 'Functional Beverages': 81, 'Barrier Skincare': 83 },
          { month: 'Dec', 'Clean Snacking': 85, 'Functional Beverages': 92, 'Barrier Skincare': 91 },
        ];
      case 'UAE':
        return [
          { month: 'Jul', 'Clean Snacking': 48, 'Functional Beverages': 50, 'Barrier Skincare': 58 },
          { month: 'Aug', 'Clean Snacking': 54, 'Functional Beverages': 58, 'Barrier Skincare': 65 },
          { month: 'Sep', 'Clean Snacking': 62, 'Functional Beverages': 67, 'Barrier Skincare': 72 },
          { month: 'Oct', 'Clean Snacking': 71, 'Functional Beverages': 76, 'Barrier Skincare': 82 },
          { month: 'Nov', 'Clean Snacking': 83, 'Functional Beverages': 88, 'Barrier Skincare': 92 },
          { month: 'Dec', 'Clean Snacking': 96, 'Functional Beverages': 95, 'Barrier Skincare': 99 },
        ];
      default: // India & Global
        return [
          { month: 'Jul', 'Clean Snacking': 42, 'Functional Beverages': 30, 'Barrier Skincare': 50 },
          { month: 'Aug', 'Clean Snacking': 48, 'Functional Beverages': 38, 'Barrier Skincare': 55 },
          { month: 'Sep', 'Clean Snacking': 54, 'Functional Beverages': 46, 'Barrier Skincare': 62 },
          { month: 'Oct', 'Clean Snacking': 68, 'Functional Beverages': 58, 'Barrier Skincare': 70 },
          { month: 'Nov', 'Clean Snacking': 78, 'Functional Beverages': 72, 'Barrier Skincare': 82 },
          { month: 'Dec', 'Clean Snacking': 94, 'Functional Beverages': 89, 'Barrier Skincare': 96 },
        ];
    }
  }, [selectedGeo]);

  // Category Cards
  const trendCards = [
    {
      id: '1',
      title: 'Roasted Himalayan Makhana',
      category: 'Snacks & Savories',
      growth: '+82%',
      growthNum: 82,
      volume: '340K searches/mo',
      velocity: 'Surging',
      margin: '64%',
      marginNum: 64,
      image: '/images/cat-snacks.jpg',
      tags: ['Quick-Commerce', 'Clean Snack', 'Gluten Free'],
      insight: 'Overnight shift from traditional fried potato chips to vacuum-roasted lotus seeds in Tier 1 metros.',
    },
    {
      id: '2',
      title: 'Adaptogenic Craft Cocoa (70%)',
      category: 'Food & Beverage',
      growth: '+65%',
      growthNum: 65,
      volume: '190K searches/mo',
      velocity: 'Fast Rising',
      margin: '58%',
      marginNum: 58,
      image: '/images/cat-chocolates.jpg',
      tags: ['Ashwagandha', 'Keto', 'Luxury Gifting'],
      insight: 'Single-origin South Indian cocoa paired with ayurvedic adaptogens replacing commercial sugar bars.',
    },
    {
      id: '3',
      title: 'Fermented Rice Water Serums',
      category: 'Personal Care',
      growth: '+48%',
      growthNum: 48,
      volume: '520K searches/mo',
      velocity: 'Steady High',
      margin: '72%',
      marginNum: 72,
      image: '/images/cat-personal-care.jpg',
      tags: ['Barrier Repair', 'Niacinamide', 'Korean Glass Skin'],
      insight: 'South Asian consumers adopting fermented bio-ferments to combat air pollution and hyperpigmentation.',
    },
    {
      id: '4',
      title: 'Cold Brew Botanical Tonics',
      category: 'Beverages',
      growth: '+74%',
      growthNum: 74,
      volume: '160K searches/mo',
      velocity: 'Breakout',
      margin: '62%',
      marginNum: 62,
      image: '/images/cat-beverages.jpg',
      tags: ['Clean Energy', 'No Sugar', 'Canned D2C'],
      insight: 'Zero-sugar hibiscus and green tea spritzers seeing 3x velocity on Blinkit and Zepto during afternoon peak hours.',
    },
  ];

  // Emerging Opportunities
  const emergingOpportunities = [
    {
      id: 'opp-1',
      title: "Lion's Mane Functional Cocoa",
      category: 'Nootropic Wellness',
      velocity: '+142%',
      whitespaceScore: '9.4/10',
      pricePoint: '₹399 / $14',
      rationale: 'Tech workers seeking jitter-free afternoon focus with zero sugar crash.',
    },
    {
      id: 'opp-2',
      title: 'Electrolyte Fizzy Micro-Drops',
      category: 'Hydration & Fitness',
      velocity: '+98%',
      whitespaceScore: '8.9/10',
      pricePoint: '₹449 / $18',
      rationale: 'Portable hydration tabs replacing sugary sports drinks for urban gym-goers.',
    },
    {
      id: 'opp-3',
      title: 'Himalayan Pink Salt Peri-Peri Popped Chips',
      category: 'Healthy Snacking',
      velocity: '+86%',
      whitespaceScore: '9.1/10',
      pricePoint: '₹199 / $6',
      rationale: 'Direct competitor to Doritos with 70% less fat and zero palm oil.',
    },
  ];

  // Filtered Cards
  const filteredCards = trendCards.filter((c) => {
    if (filterType === 'high-growth') return c.growthNum > 70;
    if (filterType === 'high-margin') return c.marginNum > 60;
    return true;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="rounded-2xl p-6 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#F43F5E]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F43F5E]/15 border border-[#F43F5E]/30 text-rose-300 text-xs font-semibold mb-2">
              <Flame className="w-3.5 h-3.5 text-[#F43F5E]" />
              <span>Real-Time Category Momentum Tracker</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFF] tracking-tight">
              Trends & Consumer Insights
            </h1>
            <p className="text-xs sm:text-sm text-[#9EADC2] mt-1 max-w-2xl">
              Track breakout search velocity, rising purchase signals, and emerging consumer micro-trends across quick commerce and direct-to-consumer marketplaces.
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

      {/* Labelled Demo Banner */}
      <div className="p-3.5 rounded-xl bg-[#7547FF]/10 border border-[#7547FF]/25 text-xs text-indigo-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#25D9E8] shrink-0" />
          <span className="text-[#F8FAFF]">
            <strong>Macro Category Signals:</strong> Derived from Google Trends, Amazon BSR movers, and social consumer conversations. (Labelled Demo Dataset)
          </span>
        </div>
        <span className="text-[10px] font-bold text-[#25D9E8] bg-[#25D9E8]/15 px-2 py-0.5 rounded-full border border-[#25D9E8]/30 shrink-0 self-start sm:self-auto">
          Demo Dataset
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          {[
            { id: 'all', label: 'All Categories' },
            { id: 'high-growth', label: 'High Growth (>70% YoY)' },
            { id: 'high-margin', label: 'High Margin (>60%)' },
          ].map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setFilterType(type.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterType === type.id
                  ? 'bg-gradient-to-r from-[#7547FF] to-[#278BFF] text-white shadow-sm'
                  : 'bg-[rgba(8,24,44,0.6)] text-[#9EADC2] hover:text-white border border-[rgba(161,190,230,0.15)]'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        <span className="text-[11px] text-[#9EADC2]">
          Region: <strong className="text-white">{selectedGeo}</strong> • 4 Tracked Macro Verticals
        </span>
      </div>

      {/* Trend Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredCards.map((card) => (
          <div
            key={card.id}
            className="rounded-2xl p-4 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl shadow-lg flex flex-col justify-between group hover:border-[#25D9E8]/40 transition-all"
          >
            <div>
              <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-black/40 border border-[rgba(161,190,230,0.15)]">
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />
                <div className="absolute top-2 right-2">
                  <span className="text-[10px] font-bold text-[#28D7A0] bg-[#28D7A0]/20 backdrop-blur-md px-2 py-0.5 rounded-full border border-[#28D7A0]/30 font-mono-nums">
                    {card.growth} YoY
                  </span>
                </div>
                <div className="absolute bottom-2 left-2 text-[10px] text-slate-300 font-semibold">
                  {card.category}
                </div>
              </div>

              <h3 className="text-sm font-bold text-white group-hover:text-[#25D9E8] transition-colors">
                {card.title}
              </h3>
              <p className="text-[11px] text-[#9EADC2] mt-1">
                Volume: <strong className="text-white font-mono-nums">{card.volume}</strong>
              </p>
              <p className="text-[11px] text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                {card.insight}
              </p>

              <div className="mt-3 flex flex-wrap gap-1">
                {card.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[9px] text-[#9EADC2] bg-white/[0.04] px-1.5 py-0.5 rounded border border-[rgba(161,190,230,0.15)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[rgba(161,190,230,0.15)] flex items-center justify-between text-xs">
              <span className="text-[10px] text-[#9EADC2]">
                Target Margin: <strong className="text-[#28D7A0] font-mono-nums">{card.margin}</strong>
              </span>
              <button
                type="button"
                onClick={() => navigate('/market-analysis')}
                className="text-[10px] font-bold text-[#25D9E8] hover:text-white flex items-center gap-0.5 cursor-pointer"
              >
                <span>Analyze</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Emerging Opportunities Panel */}
      <div className="rounded-2xl p-5 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(161,190,230,0.18)] mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#FFBE58]" />
            <h3 className="text-sm font-bold text-white">Breakout Micro-Niche Opportunities</h3>
          </div>
          <span className="text-xs text-[#25D9E8] font-semibold">Verified Low-Competition Whitespaces</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {emergingOpportunities.map((opp) => (
            <div
              key={opp.id}
              className="p-4 rounded-xl bg-[rgba(8,24,44,0.5)] border border-[rgba(161,190,230,0.15)] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-[#FFBE58] bg-[#FFBE58]/15 px-2 py-0.5 rounded-full border border-[#FFBE58]/30">
                    {opp.velocity} Velocity
                  </span>
                  <span className="text-[10px] font-semibold text-[#28D7A0] font-mono-nums">
                    Score: {opp.whitespaceScore}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white mb-1">{opp.title}</h4>
                <p className="text-[11px] text-[#9EADC2] leading-relaxed mb-3">{opp.rationale}</p>
              </div>

              <div className="pt-2 border-t border-[rgba(161,190,230,0.1)] flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Sweet-Spot Price:</span>
                <span className="text-[#25D9E8] font-bold font-mono-nums">{opp.pricePoint}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6-Month Sector Search Volume Momentum Chart */}
      <div className="rounded-2xl p-5 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(161,190,230,0.18)] mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Category Search Interest Velocity (Last 6 Months)</h3>
            <p className="text-[11px] text-[#9EADC2]">Relative search query index (0-100) normalized for regional seasonality</p>
          </div>
          <span className="text-xs text-[#25D9E8] font-mono-nums font-bold">Region: {selectedGeo}</span>
        </div>

        <div className="w-full h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="snackGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7547FF" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#7547FF" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="bevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#25D9E8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#25D9E8" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#28D7A0" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#28D7A0" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#9EADC2" fontSize={11} tickLine={false} />
              <YAxis stroke="#9EADC2" fontSize={11} tickLine={false} domain={[0, 100]} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="p-2.5 rounded-xl text-xs text-white bg-[rgba(8,24,44,0.95)] border border-[rgba(161,190,230,0.25)] shadow-xl">
                        <p className="font-bold text-[#F8FAFF]">{payload[0].payload.month}</p>
                        {payload.map((p) => (
                          <p key={p.name} style={{ color: p.color }}>
                            {p.name}: {p.value} index
                          </p>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area type="monotone" dataKey="Barrier Skincare" stroke="#28D7A0" strokeWidth={2} fill="url(#skinGrad)" />
              <Area type="monotone" dataKey="Clean Snacking" stroke="#7547FF" strokeWidth={2} fill="url(#snackGrad)" />
              <Area type="monotone" dataKey="Functional Beverages" stroke="#25D9E8" strokeWidth={2} fill="url(#bevGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
