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
    <div className="rounded-2xl p-4 sm:p-5 bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all">
      {/* Header: Title and Period Selector */}
      <div className="flex items-center justify-between gap-2 mb-3.5 relative z-10 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
            Your D2C Journey
          </h3>
        </div>

        {/* Period Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
          >
            <span>{periodLabels[period]}</span>
            <ChevronDown
              className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180 text-emerald-600' : ''
              }`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-1 w-28 rounded-xl bg-white border border-slate-200 shadow-lg py-1 z-20 text-xs animate-in fade-in duration-150">
              {(['7', '30', '90'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setPeriod(key);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-[11px] font-medium transition-colors ${
                    period === key
                      ? 'text-emerald-700 font-semibold bg-emerald-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {periodLabels[key]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2x2 Bento KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-2.5 relative z-10">
        {/* KPI 1: Products Validated */}
        <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-all group">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900 font-mono-nums tracking-tight">
              3
            </span>
            <span className="inline-flex items-center text-[10.5px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
              <TrendingUp className="w-2.5 h-2.5 mr-0.5 text-emerald-600" />
              +50%
            </span>
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-1 truncate">
            Products Validated
          </div>
        </div>

        {/* KPI 2: Avg. Gross Margin */}
        <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-all group">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900 font-mono-nums tracking-tight">
              64%
            </span>
            <span className="inline-flex items-center text-[10.5px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
              <TrendingUp className="w-2.5 h-2.5 mr-0.5 text-emerald-600" />
              +18%
            </span>
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-1 truncate">
            Avg. Gross Margin
          </div>
        </div>

        {/* KPI 3: Active Projects */}
        <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-all group">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900 font-mono-nums tracking-tight">
              2
            </span>
            <span className="inline-flex items-center text-[10.5px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
              <TrendingUp className="w-2.5 h-2.5 mr-0.5 text-emerald-600" />
              +100%
            </span>
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-1 truncate">
            Active Projects
          </div>
        </div>

        {/* KPI 4: Avg. Viability Score */}
        <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-all group">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900 font-mono-nums tracking-tight">
              78%
            </span>
            <span className="inline-flex items-center text-[10.5px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
              <TrendingUp className="w-2.5 h-2.5 mr-0.5 text-emerald-600" />
              +12%
            </span>
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-1 truncate">
            Avg. Viability Score
          </div>
        </div>
      </div>
    </div>
  );
};
