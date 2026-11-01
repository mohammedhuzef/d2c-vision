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
      className="rounded-2xl p-4 sm:p-5 bg-[rgba(20,39,62,0.72)] backdrop-blur-xl border border-[rgba(161,190,230,0.25)] shadow-xl flex flex-col justify-between h-full relative overflow-hidden transition-all duration-300 hover:border-[#25D9E8]/40"
    >
      {/* Background ambient lighting */}
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#7547FF]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#25D9E8]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between pb-3 border-b border-[rgba(161,190,230,0.18)]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#7547FF] to-[#25D9E8] text-white flex items-center justify-center shadow-md shadow-[#7547FF]/30">
            <Globe2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#F8FAFF] tracking-tight">Market Insights</h3>
              <span className="text-[9px] font-medium text-[#25D9E8] bg-[#25D9E8]/10 px-1.5 py-0.5 rounded border border-[#25D9E8]/30">
                Sample Data
              </span>
            </div>
            <p className="text-[10px] text-[#9EADC2]">Global consumer appetite & demand velocities</p>
          </div>
        </div>

        {/* Region Selector (Global) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[rgba(8,24,44,0.7)] hover:bg-[rgba(20,39,62,0.9)] border border-[rgba(161,190,230,0.22)] text-[11px] font-medium text-[#F8FAFF] hover:border-[#25D9E8]/40 transition-all cursor-pointer"
          >
            <span>{selectedRegion}</span>
            <ChevronDown
              className={`w-3 h-3 text-[#9EADC2] transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180 text-[#25D9E8]' : ''
              }`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-1 w-32 py-1 bg-[#08182C] border border-[rgba(161,190,230,0.25)] rounded-xl shadow-xl z-30 text-[11px] backdrop-blur-xl animate-in fade-in duration-150">
              {['Global', 'Asia-Pacific', 'North America', 'Europe'].map((region) => (
                <button
                  key={region}
                  type="button"
                  onClick={() => {
                    setSelectedRegion(region);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 transition-colors ${
                    selectedRegion === region
                      ? 'text-[#25D9E8] font-bold bg-white/[0.06]'
                      : 'text-[#9EADC2] hover:text-[#F8FAFF] hover:bg-white/[0.04]'
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
        <div className="sm:col-span-6 relative aspect-[16/11] sm:aspect-square rounded-xl overflow-hidden bg-[#08182C] border border-[rgba(161,190,230,0.2)] group shadow-inner">
          <img
            src="/images/market-globe.jpg"
            alt="World Market Map with Glowing Regions"
            className="w-full h-full object-cover object-center brightness-90 group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071426]/85 via-transparent to-[#071426]/30 pointer-events-none" />

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
                  <span className="w-2.5 h-2.5 rounded-full bg-[#25D9E8] animate-ping opacity-75" />
                  <span
                    className={`absolute w-2 h-2 rounded-full transition-all ${
                      isHovered ? 'bg-[#FFBE58] scale-150 shadow-[0_0_12px_#FFBE58]' : 'bg-[#25D9E8] shadow-[0_0_8px_#25D9E8]'
                    }`}
                  />
                  {/* Floating tooltip on pin */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-[rgba(8,24,44,0.9)] border border-[rgba(161,190,230,0.3)] text-[9px] font-bold text-white whitespace-nowrap opacity-0 group-hover/pin:opacity-100 transition-opacity pointer-events-none shadow-lg">
                    {c.name}: {c.growth}
                  </div>
                </div>
              </div>
            );
          })}

          <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[9px] font-mono text-[#25D9E8]">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#28D7A0] animate-pulse" />
              <span>Cross-Border Demand</span>
            </span>
            <span className="text-[#9EADC2] text-[8.5px]">Sample Metrics</span>
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
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  isHovered
                    ? 'bg-[rgba(37,217,232,0.1)] border-[#25D9E8]/50 translate-x-1 shadow-sm'
                    : 'bg-[rgba(8,24,44,0.5)] hover:bg-[rgba(20,39,62,0.8)] border-[rgba(161,190,230,0.15)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm leading-none">{country.flag}</span>
                  <span className="text-xs font-semibold text-[#F8FAFF]">{country.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-[#28D7A0] font-mono-nums bg-[#28D7A0]/15 px-2 py-0.5 rounded-md border border-[#28D7A0]/25">
                    {country.growth}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer disclaimer */}
      <div className="relative z-10 pt-2.5 mt-3 border-t border-[rgba(161,190,230,0.12)] flex items-center justify-between text-[10px] text-[#9EADC2]">
        <span>Primary corridor: Direct-to-Consumer exports</span>
        <span className="text-[#25D9E8] font-medium flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-[#28D7A0]" />
          <span>Surging Asia & US</span>
        </span>
      </div>
    </div>
  );
};
