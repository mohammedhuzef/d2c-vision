import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calculator,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Package,
  Sparkles,
  Info,
} from 'lucide-react';

export const ProfitCalculatorCard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'costs' | 'pricing' | 'results' | 'product'>('costs');

  // Input states
  const [sellingPrice, setSellingPrice] = useState<number>(299);
  const [mfgCost, setMfgCost] = useState<number>(80);
  const [packCost, setPackCost] = useState<number>(20);
  const [adSpend, setAdSpend] = useState<number>(50);
  const [shippingAndGateway, setShippingAndGateway] = useState<number>(35);

  // Estimated fixed monthly overhead for break-even calculation
  const fixedOverhead = 100000; // ₹1,00,000 / mo (team, rent, SaaS)

  // Calculations
  const totalVariableCosts = useMemo(() => {
    return Math.max(0, mfgCost) + Math.max(0, packCost) + Math.max(0, adSpend) + Math.max(0, shippingAndGateway);
  }, [mfgCost, packCost, adSpend, shippingAndGateway]);

  // Contribution profit per unit: Selling Price - Total Variable Costs
  const contributionProfit = useMemo(() => {
    return sellingPrice - totalVariableCosts;
  }, [sellingPrice, totalVariableCosts]);

  // Contribution margin %: (Contribution Profit / Selling Price) * 100
  const contributionMarginPct = useMemo(() => {
    if (sellingPrice <= 0) return 0;
    return (contributionProfit / sellingPrice) * 100;
  }, [contributionProfit, sellingPrice]);

  // Break-even units: Fixed Costs / Contribution Profit per Unit
  const breakEvenUnits = useMemo(() => {
    if (contributionProfit <= 0) return null;
    return Math.ceil(fixedOverhead / contributionProfit);
  }, [fixedOverhead, contributionProfit]);

  // Monthly projection at 1,500 units
  const simulatedUnits = 1500;
  const totalMonthlyContribution = contributionProfit * simulatedUnits;
  const netMonthlyProfit = totalMonthlyContribution - fixedOverhead;

  // Presets handler for product tab
  const applyPreset = (preset: {
    name: string;
    price: number;
    mfg: number;
    pack: number;
    ad: number;
    ship: number;
  }) => {
    setSellingPrice(preset.price);
    setMfgCost(preset.mfg);
    setPackCost(preset.pack);
    setAdSpend(preset.ad);
    setShippingAndGateway(preset.ship);
  };

  const setTargetMargin = (marginPct: number) => {
    const targetPrice = Math.round(totalVariableCosts / (1 - marginPct / 100));
    setSellingPrice(Math.max(10, targetPrice));
  };

  const isProfitable = contributionProfit > 0;

  return (
    <div
      id="profit-calculator"
      className="rounded-2xl p-4 sm:p-5 flex flex-col justify-between h-full bg-white border border-slate-200/90 shadow-xs relative overflow-hidden transition-all duration-200 hover:border-slate-300"
    >
      {/* Header */}
      <div className="relative z-10">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shadow-xs">
              <Calculator className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                  Unit Economics & Profit Engine
                </span>
                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70">
                  Live Model
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 mt-0.5">
                Contribution margin, variable costs & break-even simulator.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/profit-calculator')}
            className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors cursor-pointer bg-emerald-50 hover:bg-emerald-100/60 px-2.5 py-1 rounded-lg border border-emerald-200"
            title="Open Full Break-Even Calculator"
          >
            <span>Full Tool</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-3 flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/60">
          {[
            { id: 'costs', label: '1. Unit Costs' },
            { id: 'pricing', label: '2. Pricing & Markup' },
            { id: 'results', label: '3. Break-Even' },
            { id: 'product', label: '4. Benchmarks' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-1 rounded-lg text-[10.5px] font-medium transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Dynamic View: Left Financial Metric Card, Right Interactive Control Area */}
      <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-stretch relative z-10">
        {/* Left Column: Real-Time Unit Economics Summary (5 cols) */}
        <div className="sm:col-span-5 p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-slate-500">Contribution Profit</span>
              <span
                className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded border ${
                  isProfitable
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : 'text-rose-700 bg-rose-50 border-rose-200'
                }`}
              >
                {isProfitable ? 'Positive Unit Margin' : 'Negative Margin'}
              </span>
            </div>

            <div
              className={`text-2xl font-black font-mono-nums tracking-tight mt-1 ${
                isProfitable ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              ₹{contributionProfit.toFixed(1)}
              <span className="text-[10px] font-normal text-slate-500 ml-1">/ unit</span>
            </div>

            <div className="mt-2 text-[10.5px] text-slate-500 space-y-1 pt-2 border-t border-slate-200/60">
              <div className="flex justify-between">
                <span>Selling Price:</span>
                <span className="text-slate-900 font-bold font-mono-nums">₹{sellingPrice}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Variable Costs:</span>
                <span className="text-slate-700 font-bold font-mono-nums">₹{totalVariableCosts.toFixed(1)}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-slate-500">Contribution Margin %</span>
              <span
                className={`text-sm font-black font-mono-nums ${
                  contributionMarginPct >= 35
                    ? 'text-emerald-700'
                    : contributionMarginPct > 15
                    ? 'text-amber-600'
                    : 'text-rose-600'
                }`}
              >
                {contributionMarginPct.toFixed(1)}%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-slate-500">Break-Even Volume</span>
              <span className="text-xs font-bold text-slate-800 font-mono-nums">
                {breakEvenUnits ? `${breakEvenUnits.toLocaleString()} units` : 'N/A (Loss)'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Tab-Dependent Control Panels (7 cols) */}
        <div className="sm:col-span-7 flex flex-col justify-center">
          {/* TAB 1: VARIABLE COSTS */}
          {activeTab === 'costs' && (
            <div className="space-y-2">
              {/* Mfg Cost */}
              <div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-600 font-medium">Manufacturing COGS</span>
                  <span className="font-bold text-slate-900 font-mono-nums">₹{mfgCost}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="5"
                  value={mfgCost}
                  onChange={(e) => setMfgCost(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 mt-1"
                />
              </div>

              {/* Packaging */}
              <div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-600 font-medium">Packaging & Labeling</span>
                  <span className="font-bold text-slate-900 font-mono-nums">₹{packCost}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="2"
                  value={packCost}
                  onChange={(e) => setPackCost(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 mt-1"
                />
              </div>

              {/* Ad Spend / CAC */}
              <div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-600 font-medium">Ad Spend / CAC per Sale</span>
                  <span className="font-bold text-slate-900 font-mono-nums">₹{adSpend}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="300"
                  step="5"
                  value={adSpend}
                  onChange={(e) => setAdSpend(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 mt-1"
                />
              </div>

              {/* Shipping & Payment */}
              <div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-600 font-medium">Shipping & Gateway Fee</span>
                  <span className="font-bold text-slate-900 font-mono-nums">₹{shippingAndGateway}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="120"
                  step="5"
                  value={shippingAndGateway}
                  onChange={(e) => setShippingAndGateway(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 mt-1"
                />
              </div>
            </div>
          )}

          {/* TAB 2: PRICING & MARKUP */}
          {activeTab === 'pricing' && (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-slate-600 font-medium">Selling Price (MRP)</span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400 text-xs">₹</span>
                    <input
                      type="number"
                      min="10"
                      max="3000"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(Math.max(0, Number(e.target.value)))}
                      className="w-16 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-right font-bold text-slate-900 text-xs font-mono-nums outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1500"
                  step="10"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              {/* Margin Shortcuts */}
              <div>
                <span className="text-[10px] text-slate-500 block mb-1.5 font-medium">
                  Auto-Set Target Margin:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTargetMargin(35)}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10.5px] font-semibold text-slate-700 transition-all cursor-pointer text-center"
                  >
                    35% (Mass)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetMargin(50)}
                    className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100/60 border border-emerald-200 text-[10.5px] font-semibold text-emerald-800 transition-all cursor-pointer text-center"
                  >
                    50% (D2C)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetMargin(65)}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10.5px] font-semibold text-slate-700 transition-all cursor-pointer text-center"
                  >
                    65% (Luxury)
                  </button>
                </div>
              </div>

              {/* Price Waterfall Indicator */}
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[10px]">
                <div className="flex justify-between text-slate-500 mb-1">
                  <span>Costs (₹{totalVariableCosts.toFixed(0)})</span>
                  <span className="text-emerald-700 font-bold">
                    Profit (₹{Math.max(0, contributionProfit).toFixed(0)})
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-slate-400"
                    style={{
                      width: `${Math.min(100, sellingPrice > 0 ? (totalVariableCosts / sellingPrice) * 100 : 100)}%`,
                    }}
                  />
                  <div
                    className="h-full bg-emerald-500"
                    style={{
                      width: `${Math.max(0, Math.min(100, contributionMarginPct))}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BREAK-EVEN & NET PROFIT */}
          {activeTab === 'results' && (
            <div className="space-y-2.5">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Fixed Monthly Overhead:</span>
                  <span className="text-slate-900 font-bold font-mono-nums">₹{fixedOverhead.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Break-Even Threshold:</span>
                  <span className="text-slate-900 font-bold font-mono-nums">
                    {breakEvenUnits ? `${breakEvenUnits.toLocaleString()} units` : 'Impossible'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500">Simulated Volume:</span>
                  <span className="text-slate-900 font-bold font-mono-nums">{simulatedUnits.toLocaleString()} units/mo</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Estimated Net Profit:</span>
                  <span
                    className={`font-black font-mono-nums ${
                      netMonthlyProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {netMonthlyProfit < 0 ? '-' : ''}₹{Math.abs(Math.round(netMonthlyProfit)).toLocaleString()}
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 leading-relaxed">
                <strong className="text-slate-800">Distinction:</strong> Contribution Profit covers variable COGS & CAC. Net Profit is what remains after clearing the ₹1L/mo fixed overhead.
              </p>
            </div>
          )}

          {/* TAB 4: BENCHMARK PRESETS */}
          {activeTab === 'product' && (
            <div className="space-y-2">
              <span className="text-[10px] text-slate-500 block font-medium">
                Load D2C Industry Cost Models:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { name: 'Healthy Chocolate', price: 299, mfg: 80, pack: 20, ad: 50, ship: 35 },
                  { name: 'Roasted Makhana', price: 199, mfg: 45, pack: 15, ad: 35, ship: 25 },
                  { name: 'Cold Brew Tonic', price: 149, mfg: 38, pack: 14, ad: 28, ship: 22 },
                  { name: 'Barrier Serum', price: 599, mfg: 110, pack: 30, ad: 95, ship: 40 },
                ].map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => applyPreset(item)}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50/40 border border-slate-200 text-left transition-all cursor-pointer group"
                  >
                    <span className="text-[11px] font-bold text-slate-900 group-hover:text-emerald-700 block truncate">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono-nums">
                      ₹{item.price} • {Math.round(((item.price - (item.mfg + item.pack + item.ad + item.ship)) / item.price) * 100)}% margin
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
