import React, { useState } from 'react';
import {
  Flame,
  TrendingUp,
  Globe2,
  Sparkles,
  ArrowUpRight,
  Filter,
  BarChart3,
  Zap,
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
  const [selectedGeo, setSelectedGeo] = useState<'India' | 'USA' | 'UK' | 'UAE' | 'Global'>('India');
  const [filterType, setFilterType] = useState<'all' | 'high-growth' | 'high-margin'>('all');

  // Trend Chart Data
  const trendHistory = [
    { month: 'Jul', 'Clean Snacking': 42, 'Functional Beverages': 30, 'Barrier Skincare': 50 },
    { month: 'Aug', 'Clean Snacking': 48, 'Functional Beverages': 38, 'Barrier Skincare': 55 },
    { month: 'Sep', 'Clean Snacking': 54, 'Functional Beverages': 46, 'Barrier Skincare': 62 },
    { month: 'Oct', 'Clean Snacking': 68, 'Functional Beverages': 58, 'Barrier Skincare': 70 },
    { month: 'Nov', 'Clean Snacking': 78, 'Functional Beverages': 72, 'Barrier Skincare': 82 },
    { month: 'Dec', 'Clean Snacking': 94, 'Functional Beverages': 89, 'Barrier Skincare': 96 },
  ];

  // Category Cards
  const trendCards = [
    {
      id: '1',
      title: 'Roasted Himalayan Makhana',
      category: 'Snacks & Savories',
      growth: '+82%',
      volume: '340K searches/mo',
      velocity: 'Surging',
      margin: '64%',
      image: '/images/cat-snacks.jpg',
      tags: ['Quick-Commerce', 'Clean Snack', 'Gluten Free'],
    },
    {
      id: '2',
      title: 'Adaptogenic Craft Cocoa (70%)',
      category: 'Food & Beverage',
      growth: '+65%',
      volume: '190K searches/mo',
      velocity: 'Fast Rising',
      margin: '58%',
      image: '/images/cat-chocolates.jpg',
      tags: ['Ashwagandha', 'Keto', 'Luxury Gifting'],
    },
    {
      id: '3',
      title: 'Fermented Botanical Serums',
      category: 'Personal Care',
      growth: '+48%',
      volume: '520K searches/mo',
      velocity: 'Steady High',
      margin: '72%',
      image: '/images/cat-personal-care.jpg',
      tags: ['Barrier Repair', 'Niacinamide', 'Korean Glass Skin'],
    },
    {
      id: '4',
      title: 'Cold Brew Sparkling Herbal Tonic',
      category: 'Beverages',
      growth: '+74%',
      volume: '160K searches/mo',
      velocity: 'Breakout',
      margin: '62%',
      image: '/images/cat-beverages.jpg',
      tags: ['Clean Energy', 'No Sugar', 'Canned D2C'],
    },
  ];

  // Filtered Cards
  const filteredCards = trendCards.filter((c) => {
    if (filterType === 'high-growth') return parseInt(c.growth) > 70;
    if (filterType === 'high-margin') return parseInt(c.margin) > 60;
    return true;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold mb-2">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Real-Time Category Momentum Tracker</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Trends & Consumer Insights
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Track breakout search velocity, rising purchase signals, and emerging consumer micro-trends across quick commerce and direct-to-consumer marketplaces.
            </p>
          </div>

          {/* Geo Selector */}
          <div className="flex items-center bg-white/[0.04] p-1 rounded-xl border border-white/[0.08]">
            {(['India', 'USA', 'UK', 'UAE', 'Global'] as const).map((geo) => (
              <button
                key={geo}
                type="button"
                onClick={() => setSelectedGeo(geo)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedGeo === geo ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                {geo}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Labelled Demo Banner */}
      <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            <strong>Simulated Macro Trends:</strong> Derived from Google Trends, Amazon BSR movers, and social consumer conversations.
          </span>
        </div>
        <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30">
          Labelled Demo Dataset
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {(['all', 'high-growth', 'high-margin'] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setFilterType(type)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
              filterType === type ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white/[0.03] text-slate-400 hover:text-white'
            }`}
          >
            {type.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Trend Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredCards.map((card) => (
          <div
            key={card.id}
            className="glass-panel-interactive rounded-2xl p-4 border border-white/[0.08] flex flex-col justify-between group"
          >
            <div>
              <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-black/40">
                <img src={card.image} alt={card.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent pointer-events-none" />
                <div className="absolute top-2 right-2">
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 backdrop-blur-md px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono-nums">
                    {card.growth} YoY
                  </span>
                </div>
                <div className="absolute bottom-2 left-2 text-[10px] text-slate-300 font-semibold">
                  {card.category}
                </div>
              </div>

              <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                {card.title}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Volume: <strong className="text-white">{card.volume}</strong>
              </p>

              <div className="mt-3 flex flex-wrap gap-1">
                {card.tags.map((tag) => (
                  <span key={tag} className="text-[9px] text-slate-400 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-400">Target Margin: <strong className="text-emerald-400">{card.margin}</strong></span>
              <span className="text-[10px] font-bold text-indigo-400 flex items-center gap-0.5">
                <span>Analyze</span>
                <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 6-Month Sector Search Volume Momentum Chart */}
      <div className="glass-panel rounded-2xl p-5 border border-white/[0.08]">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Category Search Interest Velocity (Last 6 Months)</h3>
            <p className="text-[11px] text-slate-400">Relative search query index (0-100) normalized for regional seasonality</p>
          </div>
          <span className="text-xs text-indigo-400 font-mono-nums font-bold">Region: {selectedGeo}</span>
        </div>

        <div className="w-full h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="snackGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A855F7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#A855F7" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="bevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} domain={[0, 100]} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="p-2.5 glass-panel rounded-xl text-xs text-white border border-white/[0.1] shadow-xl">
                        <p className="font-bold">{payload[0].payload.month}</p>
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
              <Area type="monotone" dataKey="Barrier Skincare" stroke="#10B981" strokeWidth={2} fill="url(#skinGrad)" />
              <Area type="monotone" dataKey="Clean Snacking" stroke="#A855F7" strokeWidth={2} fill="url(#snackGrad)" />
              <Area type="monotone" dataKey="Functional Beverages" stroke="#06B6D4" strokeWidth={2} fill="url(#bevGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
