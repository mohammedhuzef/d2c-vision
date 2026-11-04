import React, { useState } from 'react';
import { Globe2, ChevronDown, TrendingUp, Sparkles, MapPin } from 'lucide-react';

interface CountryMetric {
  name: string;
  flag: string;
  growth: string;
  coords: { x: string; y: string };
  region: string;
}

export const MarketInsightsCard: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState('Global');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  const countries: CountryMetric[] = [
    { name: 'India', flag: '🇮🇳', growth: '+42%', coords: { x: '68%', y: '52%' }, region: 'Asia-Pacific' },
    { name: 'USA', flag: '🇺🇸', growth: '+28%', coords: { x: '24%', y: '38%' }, region: 'North America' },
    { name: 'UK', flag: '🇬🇧', growth: '+18%', coords: { x: '47%', y: '30%' }, region: 'Europe' },
    { name: 'UAE', flag: '🇦🇪', growth: '+16%', coords: { x: '58%', y: '46%' }, region: 'Middle East' },
    { name: 'Singapore', flag: '🇸🇬', growth: '+14%', coords: { x: '75%', y: '62%' }, region: 'Asia-Pacific' },
  ];

  const filteredCountries = selectedRegion === 'Global'
    ? countries
    : countries.filter((c) => c.region === selectedRegion);

  return (
    <div
      id="market-insights"
      className="rounded-2xl p-4 sm:p-5 bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between h-full relative overflow-hidden transition-all duration-200 hover:border-slate-300"
    >
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shadow-xs">
            <Globe2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Market Insights</h3>
              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70">
                Sample Data
              </span>
            </div>
            <p className="text-[10.5px] text-slate-500">Global consumer appetite & demand velocities</p>
          </div>
        </div>

        {/* Region Selector (Global) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700 transition-all cursor-pointer"
          >
            <span>{selectedRegion}</span>
            <ChevronDown
              className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180 text-emerald-600' : ''
              }`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-1 w-32 py-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 text-[11px] animate-in fade-in duration-150">
              {['Global', 'Asia-Pacific', 'North America', 'Europe'].map((region) => (
                <button
                  key={region}
                  type="button"
                  onClick={() => {
                    setSelectedRegion(region);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 font-medium transition-colors ${
                    selectedRegion === region
                      ? 'text-emerald-700 font-bold bg-emerald-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content: Map + Country Indicators */}
      <div className="relative z-10 mt-4 grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center">
        {/* World Map Visualization with Glowing Market Regions */}
        <div className="sm:col-span-6 relative aspect-[16/11] sm:aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-200 group shadow-xs">
          <img
            src="/images/market-globe.jpg"
            alt="World Market Map with Glowing Regions"
            className="w-full h-full object-cover object-center brightness-90 group-hover:scale-105 transition-transform duration-500 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-slate-950/20 pointer-events-none" />

          {/* Glowing Map Hotspots */}
          {countries.map((c) => {
            const isHovered = hoveredCountry === c.name;
            return (
              <div
                key={c.name}
                style={{ top: c.coords.y, left: c.coords.x }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group/pin"
                onMouseEnter={() => setHoveredCountry(c.name)}
                onMouseLeave={() => setHoveredCountry(null)}
              >
                <div className="relative flex items-center justify-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
                  <span
                    className={`absolute w-2 h-2 rounded-full transition-all ${
                      isHovered ? 'bg-amber-400 scale-150 shadow-[0_0_12px_#F59E0B]' : 'bg-emerald-400 shadow-[0_0_8px_#10B981]'
                    }`}
                  />
                  {/* Floating tooltip on pin */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-slate-900/95 border border-slate-700 text-[9px] font-bold text-white whitespace-nowrap opacity-0 group-hover/pin:opacity-100 transition-opacity pointer-events-none shadow-md">
                    {c.name}: {c.growth}
                  </div>
                </div>
              </div>
            );
          })}

          <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[9px] font-mono text-emerald-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Cross-Border Demand</span>
            </span>
            <span className="text-slate-400 text-[8.5px]">Sample Metrics</span>
          </div>
        </div>

        {/* Country-Level Indicators List */}
        <div className="sm:col-span-6 space-y-1.5">
          {filteredCountries.map((country) => {
            const isHovered = hoveredCountry === country.name;
            return (
              <div
                key={country.name}
                onMouseEnter={() => setHoveredCountry(country.name)}
                onMouseLeave={() => setHoveredCountry(null)}
                className={`flex items-center justify-between px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  isHovered
                    ? 'bg-emerald-50/60 border-emerald-300 translate-x-0.5 shadow-2xs'
                    : 'bg-slate-50/70 hover:bg-slate-100/70 border-slate-200/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm leading-none">{country.flag}</span>
                  <span className="text-xs font-semibold text-slate-800">{country.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-emerald-700 font-mono-nums bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {country.growth}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer disclaimer */}
      <div className="relative z-10 pt-2.5 mt-3 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-500">
        <span>Primary corridor: Direct-to-Consumer exports</span>
        <span className="text-emerald-700 font-medium flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-emerald-600" />
          <span>Surging Asia & US</span>
        </span>
      </div>
    </div>
  );
};
