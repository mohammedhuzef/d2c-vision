import React, { useState } from 'react';
import { TrendingUp, ChevronDown, Sparkles } from 'lucide-react';

export const HeroAnalytics: React.FC = () => {
  const [period, setPeriod] = useState<'30' | '7' | '90'>('30');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const periodLabels = {
    '7': 'Last 7 Days',
    '30': 'Last 30 Days',
    '90': 'Last 90 Days',
  };

  return (
    <div className="rounded-2xl p-4 bg-[rgba(20,39,62,0.72)] backdrop-blur-xl border border-[rgba(161,190,230,0.25)] shadow-xl relative overflow-hidden transition-all duration-200">
      {/* Subtle background ambient corner glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#7547FF]/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header: Title and Period Selector */}
      <div className="flex items-center justify-between gap-2 mb-3.5 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#25D9E8] shadow-[0_0_8px_#25D9E8]" />
          <h3 className="text-sm font-bold text-[#F8FAFF] tracking-tight">
            Your D2C Journey
          </h3>
        </div>

        {/* Period Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[rgba(8,24,44,0.6)] border border-[rgba(161,190,230,0.2)] text-[11px] font-medium text-[#9EADC2] hover:text-[#F8FAFF] hover:border-[rgba(161,190,230,0.35)] transition-all cursor-pointer"
          >
            <span>{periodLabels[period]}</span>
            <ChevronDown
              className={`w-3 h-3 transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180 text-[#25D9E8]' : ''
              }`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-1 w-28 rounded-lg bg-[#08182C] border border-[rgba(161,190,230,0.25)] shadow-lg py-1 z-20 text-xs">
              {(['7', '30', '90'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setPeriod(key);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-[11px] transition-colors ${
                    period === key
                      ? 'text-[#25D9E8] font-semibold bg-white/[0.04]'
                      : 'text-[#9EADC2] hover:text-[#F8FAFF] hover:bg-white/[0.04]'
                  }`}
                >
                  {periodLabels[key]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2x2 KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-2.5 relative z-10">
        {/* KPI 1: Products Validated */}
        <div className="p-3 rounded-xl bg-[rgba(8,24,44,0.6)] border border-[rgba(161,190,230,0.18)] hover:border-[#7547FF]/50 transition-all group">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-[#F8FAFF] font-mono-nums tracking-tight group-hover:text-white">
              3
            </span>
            <span className="inline-flex items-center text-[10.5px] font-semibold text-[#7547FF] bg-[#7547FF]/15 px-1.5 py-0.5 rounded-md">
              <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
              +50%
            </span>
          </div>
          <div className="text-[11px] font-medium text-[#9EADC2] mt-1 truncate">
            Products Validated
          </div>
        </div>

        {/* KPI 2: Influencers Found */}
        <div className="p-3 rounded-xl bg-[rgba(8,24,44,0.6)] border border-[rgba(161,190,230,0.18)] hover:border-[#25D9E8]/50 transition-all group">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-[#F8FAFF] font-mono-nums tracking-tight group-hover:text-white">
              12
            </span>
            <span className="inline-flex items-center text-[10.5px] font-semibold text-[#25D9E8] bg-[#25D9E8]/15 px-1.5 py-0.5 rounded-md">
              <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
              +33%
            </span>
          </div>
          <div className="text-[11px] font-medium text-[#9EADC2] mt-1 truncate">
            Influencers Found
          </div>
        </div>

        {/* KPI 3: Active Projects */}
        <div className="p-3 rounded-xl bg-[rgba(8,24,44,0.6)] border border-[rgba(161,190,230,0.18)] hover:border-[#28D7A0]/50 transition-all group">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-[#F8FAFF] font-mono-nums tracking-tight group-hover:text-white">
              2
            </span>
            <span className="inline-flex items-center text-[10.5px] font-semibold text-[#28D7A0] bg-[#28D7A0]/15 px-1.5 py-0.5 rounded-md">
              <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
              +100%
            </span>
          </div>
          <div className="text-[11px] font-medium text-[#9EADC2] mt-1 truncate">
            Active Projects
          </div>
        </div>

        {/* KPI 4: Avg. Viability Score */}
        <div className="p-3 rounded-xl bg-[rgba(8,24,44,0.6)] border border-[rgba(161,190,230,0.18)] hover:border-[#FFBE58]/50 transition-all group">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-[#F8FAFF] font-mono-nums tracking-tight group-hover:text-white">
              78%
            </span>
            <span className="inline-flex items-center text-[10.5px] font-semibold text-[#FFBE58] bg-[#FFBE58]/15 px-1.5 py-0.5 rounded-md">
              <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
              +12%
            </span>
          </div>
          <div className="text-[11px] font-medium text-[#9EADC2] mt-1 truncate">
            Avg. Viability Score
          </div>
        </div>
      </div>
    </div>
  );
};

