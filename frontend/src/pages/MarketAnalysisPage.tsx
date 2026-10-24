import React, { useState } from 'react';
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const MarketAnalysisPage: React.FC = () => {
  const [selectedGeo, setSelectedGeo] = useState<'Global' | 'India' | 'USA' | 'UK' | 'UAE'>('India');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Trend Data per Geo
  const trendData = [
    { year: '2023', marketSize: 42, d2cShare: 14 },
    { year: '2024', marketSize: 58, d2cShare: 21 },
    { year: '2025', marketSize: 76, d2cShare: 32 },
    { year: '2026', marketSize: 104, d2cShare: 46 },
    { year: '2027 (P)', marketSize: 138, d2cShare: 64 },
    { year: '2028 (P)', marketSize: 182, d2cShare: 88 },
  ];

  // Category Share Data
  const categoryShare = [
    { name: 'Food & Gourmet Snacks', value: 34, color: '#6366F1' },
    { name: 'Beauty & Skincare', value: 26, color: '#A855F7' },
    { name: 'Health & Supplements', value: 20, color: '#06B6D4' },
    { name: 'Beverages & Tonics', value: 12, color: '#10B981' },
    { name: 'Home & Wellness', value: 8, color: '#F59E0B' },
  ];

  // Competitor Matrix
  const competitors = [
    {
      brand: 'The Whole Truth',
      category: 'Food & Supplements',
      marketShare: '18%',
      avgPrice: '₹349',
      rating: '4.7 ★',
      moat: '100% Clean Label Transparency',
      vulnerability: 'Higher price point, premium retail only',
    },
    {
      brand: 'Yoga Bar',
      category: 'Snacks & Cereals',
      marketShare: '24%',
      avgPrice: '₹199',
      rating: '4.5 ★',
      moat: 'Deep Quick-Commerce Distribution',
      vulnerability: 'Perceived as mass market rather than clean luxury',
    },
    {
      brand: 'Plum Goodness',
      category: 'Personal Care',
      marketShare: '21%',
      avgPrice: '₹499',
      rating: '4.6 ★',
      moat: '100% Vegan & Cruelty-Free certification',
      vulnerability: 'Crowded peptide category, rising Facebook CAC',
    },
    {
      brand: 'Epigamia',
      category: 'Beverages & Dairy',
      marketShare: '16%',
      avgPrice: '₹120',
      rating: '4.4 ★',
      moat: 'Cold-chain cold storage infrastructure',
      vulnerability: 'Short shelf life restricts pan-India tier-2 shipping',
    },
  ];

  // Customer Segments
  const customerSegments = [
    {
      name: 'Clean-Label Millennials',
      share: '38%',
      age: '24 - 34',
      motivation: 'Zero refined sugar, honest ingredient lists, aesthetic packaging.',
      willingnessToPay: 'High (₹299 - ₹599)',
      topChannel: 'Instagram Reels & Blinkit 10-min delivery',
    },
    {
      name: 'Performance Biohackers',
      share: '26%',
      age: '22 - 40',
      motivation: 'High protein-to-calorie ratio, nootropics, adaptogenic herbs.',
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
      <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-2">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Real-Time Market Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Market Analysis & Competitor Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Deep dive into consumer spending patterns, competitor price architecture, category white space, and regional penetration across global D2C corridors.
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

      {/* Top 4 KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-4 border border-white/[0.08]">
          <span className="text-[11px] text-slate-400 block font-medium">Total Addressable Market (TAM)</span>
          <div className="text-2xl font-black text-white font-mono-nums mt-1">$104 Billion</div>
          <span className="text-[10px] text-emerald-400 font-bold mt-1 block">+26.4% CAGR (2024-2028)</span>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-white/[0.08]">
          <span className="text-[11px] text-slate-400 block font-medium">Average Consumer Order Value (AOV)</span>
          <div className="text-2xl font-black text-white font-mono-nums mt-1">₹890 / $38</div>
          <span className="text-[10px] text-cyan-400 font-bold mt-1 block">Quick-Commerce lifting basket sizes</span>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-white/[0.08]">
          <span className="text-[11px] text-slate-400 block font-medium">Customer Acquisition Cost (CAC)</span>
          <div className="text-2xl font-black text-purple-400 font-mono-nums mt-1">₹48 / unit</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Meta + Google blended benchmark</span>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-white/[0.08]">
          <span className="text-[11px] text-slate-400 block font-medium">White Space Opportunity</span>
          <div className="text-2xl font-black text-emerald-400 font-mono-nums mt-1">Grade 9.2/10</div>
          <span className="text-[10px] text-emerald-400 font-bold mt-1 block">Low saturation in Adaptogenic snacks</span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Market Size Projection Chart (7 cols) */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-5 border border-white/[0.08]">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
            <div>
              <h3 className="text-sm font-bold text-white">D2C Category Market Growth ({selectedGeo})</h3>
              <p className="text-[11px] text-slate-400">Total Market Size vs D2C Direct Share ($ Billion)</p>
            </div>
            <span className="text-xs text-indigo-400 font-mono-nums font-bold">2024 - 2028 Projections</span>
          </div>

          <div className="w-full h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="marketGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="d2cGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-2.5 glass-panel rounded-xl text-xs text-white border border-white/[0.1] shadow-xl">
                          <p className="font-bold">{payload[0].payload.year}</p>
                          <p className="text-indigo-300">Total Market: ${payload[0].value}B</p>
                          <p className="text-emerald-300">D2C Share: ${payload[1].value}B</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="marketSize" stroke="#818CF8" strokeWidth={2.5} fill="url(#marketGrad)" />
                <Area type="monotone" dataKey="d2cShare" stroke="#34D399" strokeWidth={2.5} fill="url(#d2cGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share Breakdown (5 cols) */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-5 border border-white/[0.08] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white pb-3 border-b border-white/[0.06] mb-3">
              Consumer Spend Distribution by Sector
            </h3>
            <div className="space-y-2.5">
              {categoryShare.map((cat) => (
                <div key={cat.name} className="text-xs">
                  <div className="flex justify-between items-center text-[11px] mb-1">
                    <span className="text-slate-300 font-medium flex items-center gap-2">
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

          <div className="mt-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[11px] text-slate-400">
            💡 Fastest accelerating niche: Functional Beverages (+52% YoY online search volume).
          </div>
        </div>
      </div>

      {/* Competitor Intelligence Matrix */}
      <div className="glass-panel rounded-2xl p-5 border border-white/[0.08]">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Competitor Benchmarking & Vulnerabilities</h3>
            <p className="text-[11px] text-slate-400">Dominant players, pricing architecture, and strategic opportunities</p>
          </div>
          <span className="text-xs text-indigo-400 font-semibold">Active Sector: FMCG & Wellness</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 border-b border-white/[0.06]">
              <tr>
                <th className="pb-3">Brand Name</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Avg Retail Price</th>
                <th className="pb-3">Market Share</th>
                <th className="pb-3">Core Strategic Moat</th>
                <th className="pb-3">Vulnerability to Exploit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-slate-300">
              {competitors.map((comp) => (
                <tr key={comp.brand} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 font-bold text-white flex items-center gap-1.5">
                    <span>{comp.brand}</span>
                    <span className="text-[10px] text-amber-400 font-normal">{comp.rating}</span>
                  </td>
                  <td className="py-3 text-slate-400">{comp.category}</td>
                  <td className="py-3 font-mono-nums font-bold text-white">{comp.avgPrice}</td>
                  <td className="py-3 font-mono-nums text-indigo-300">{comp.marketShare}</td>
                  <td className="py-3 text-emerald-400">{comp.moat}</td>
                  <td className="py-3 text-rose-300/90">{comp.vulnerability}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Segments & Demographics */}
      <div className="glass-panel rounded-2xl p-5 border border-white/[0.08]">
        <div className="pb-3 border-b border-white/[0.06] mb-4">
          <h3 className="text-sm font-bold text-white">Target Customer Persona Breakdown</h3>
          <p className="text-[11px] text-slate-400">Demographic profiles, buying triggers, and customer acquisition channels</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {customerSegments.map((seg) => (
            <div key={seg.name} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{seg.name}</span>
                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                  {seg.share} of Market
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                <strong>Age Cohort:</strong> {seg.age}
              </div>
              <div className="text-[11px] text-slate-300 leading-relaxed">
                <strong>Key Motivation:</strong> {seg.motivation}
              </div>
              <div className="text-[11px] text-emerald-400">
                <strong>WTP:</strong> {seg.willingnessToPay}
              </div>
              <div className="text-[10px] text-slate-400 pt-2 border-t border-white/[0.04]">
                <strong>Best Channel:</strong> {seg.topChannel}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
