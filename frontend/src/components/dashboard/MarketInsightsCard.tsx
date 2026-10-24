import React, { useState } from 'react';
import { Globe2, ChevronDown, TrendingUp } from 'lucide-react';

export const MarketInsightsCard: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState('Global');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const countries = [
    { name: 'India', flag: '🇮🇳', growth: '+42%', active: true },
    { name: 'USA', flag: '🇺🇸', growth: '+28%', active: false },
    { name: 'UK', flag: '🇬🇧', growth: '+18%', active: false },
    { name: 'UAE', flag: '🇦🇪', growth: '+15%', active: false },
    { name: 'Singapore', flag: '🇸🇬', growth: '+14%', active: false },
  ];

  return (
    <div id="market-insights" className="glass-panel rounded-2xl p-4 border border-white/[0.08] flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
            <Globe2 className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-white tracking-tight">Market Insights</span>
        </div>

        {/* Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-[11px] text-slate-300 transition-colors"
          >
            <span>{selectedRegion}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-1 w-28 py-1 glass-panel rounded-xl shadow-xl z-20 text-[11px]">
              {['Global', 'Asia-Pacific', 'North America', 'Europe'].map((region) => (
                <button
                  key={region}
                  type="button"
                  onClick={() => {
                    setSelectedRegion(region);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-slate-300 hover:text-white hover:bg-white/[0.08]"
                >
                  {region}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content: Globe visual + Country List */}
      <div className="mt-3 grid grid-cols-12 gap-3 items-center">
        {/* Left: 3D Holographic Cybernetic Globe */}
        <div className="col-span-6 relative aspect-square rounded-xl overflow-hidden bg-black/40 border border-white/[0.06] flex items-center justify-center group">
          <img
            src="/images/market-globe.jpg"
            alt="3D Holographic Globe Map"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080C15]/70 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[9px] text-cyan-300 font-mono">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              Realtime Demand
            </span>
          </div>
        </div>

        {/* Right: Country List */}
        <div className="col-span-6 space-y-2">
          {countries.map((country) => (
            <div
              key={country.name}
              className="flex items-center justify-between p-1.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] transition-all"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{country.flag}</span>
                <span className="text-[11px] font-medium text-slate-200">{country.name}</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 font-mono-nums bg-emerald-500/10 px-1.5 py-0.5 rounded">
                {country.growth}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
