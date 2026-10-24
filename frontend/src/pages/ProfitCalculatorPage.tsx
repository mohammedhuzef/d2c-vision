import React, { useState, useMemo } from 'react';
import {
  Calculator,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  IndianRupee,
  DollarSign,
  PieChart as PieIcon,
  BarChart3,
  Sparkles,
  Info,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

export const ProfitCalculatorPage: React.FC = () => {
  // Currency selection
  const [currencySymbol, setCurrencySymbol] = useState<'₹' | '$' | '€'>('₹');

  // Per-unit variable inputs
  const [sellingPrice, setSellingPrice] = useState<number>(299);
  const [mfgCost, setMfgCost] = useState<number>(80);
  const [packCost, setPackCost] = useState<number>(20);
  const [adSpend, setAdSpend] = useState<number>(50);
  const [shippingCost, setShippingCost] = useState<number>(35);
  const [paymentGatewayFeePct, setPaymentGatewayFeePct] = useState<number>(2); // 2%
  const [marketplaceCutPct, setMarketplaceCutPct] = useState<number>(0); // 0% for D2C website, 15% for Amazon

  // Fixed monthly costs
  const [fixedRent, setFixedRent] = useState<number>(25000);
  const [fixedSalaries, setFixedSalaries] = useState<number>(60000);
  const [fixedSoftware, setFixedSoftware] = useState<number>(15000);
  const [fixedMarketingBase, setFixedMarketingBase] = useState<number>(10000);

  // Volume projection
  const [monthlyUnits, setMonthlyUnits] = useState<number>(1500);

  // Derived variable cost calculations
  const paymentFee = useMemo(() => {
    return Math.max(0, (sellingPrice * paymentGatewayFeePct) / 100);
  }, [sellingPrice, paymentGatewayFeePct]);

  const marketplaceFee = useMemo(() => {
    return Math.max(0, (sellingPrice * marketplaceCutPct) / 100);
  }, [sellingPrice, marketplaceCutPct]);

  const otherVariableCosts = useMemo(() => {
    return shippingCost + paymentFee + marketplaceFee;
  }, [shippingCost, paymentFee, marketplaceFee]);

  const totalVariableCosts = useMemo(() => {
    return Math.max(0, mfgCost) + Math.max(0, packCost) + Math.max(0, adSpend) + otherVariableCosts;
  }, [mfgCost, packCost, adSpend, otherVariableCosts]);

  // Contribution profit per unit: Selling Price - Total Variable Costs
  const contributionProfitPerUnit = useMemo(() => {
    return sellingPrice - totalVariableCosts;
  }, [sellingPrice, totalVariableCosts]);

  // Contribution margin %: (Contribution Profit / Selling Price) * 100
  const contributionMarginPct = useMemo(() => {
    if (sellingPrice <= 0) return 0;
    return (contributionProfitPerUnit / sellingPrice) * 100;
  }, [contributionProfitPerUnit, sellingPrice]);

  // Total Fixed Costs
  const totalFixedCosts = useMemo(() => {
    return (
      Math.max(0, fixedRent) +
      Math.max(0, fixedSalaries) +
      Math.max(0, fixedSoftware) +
      Math.max(0, fixedMarketingBase)
    );
  }, [fixedRent, fixedSalaries, fixedSoftware, fixedMarketingBase]);

  // Break-even units: Fixed Costs / Contribution Profit per Unit
  const breakEvenUnits = useMemo(() => {
    if (contributionProfitPerUnit <= 0) return null; // Can never break even if variable cost exceeds price
    return Math.ceil(totalFixedCosts / contributionProfitPerUnit);
  }, [totalFixedCosts, contributionProfitPerUnit]);

  // Monthly financials at target volume
  const totalMonthlyRevenue = useMemo(() => {
    return Math.max(0, sellingPrice) * Math.max(0, monthlyUnits);
  }, [sellingPrice, monthlyUnits]);

  const totalMonthlyVariableCost = useMemo(() => {
    return totalVariableCosts * Math.max(0, monthlyUnits);
  }, [totalVariableCosts, monthlyUnits]);

  const totalContributionProfit = useMemo(() => {
    return contributionProfitPerUnit * Math.max(0, monthlyUnits);
  }, [contributionProfitPerUnit, monthlyUnits]);

  const netMonthlyProfit = useMemo(() => {
    return totalContributionProfit - totalFixedCosts;
  }, [totalContributionProfit, totalFixedCosts]);

  const netMarginPct = useMemo(() => {
    if (totalMonthlyRevenue <= 0) return 0;
    return (netMonthlyProfit / totalMonthlyRevenue) * 100;
  }, [netMonthlyProfit, totalMonthlyRevenue]);

  // Cost composition data for visual breakdown
  const costChartData = [
    { name: 'Manufacturing (COGS)', value: mfgCost, color: '#6366F1' },
    { name: 'Packaging', value: packCost, color: '#06B6D4' },
    { name: 'Advertising (CAC)', value: adSpend, color: '#A855F7' },
    { name: 'Shipping & Logistics', value: shippingCost, color: '#F59E0B' },
    { name: 'Platform & Gateway', value: Number((paymentFee + marketplaceFee).toFixed(1)), color: '#EC4899' },
    { name: 'Unit Contribution Profit', value: Math.max(0, contributionProfitPerUnit), color: '#10B981' },
  ];

  const resetDefaults = () => {
    setSellingPrice(299);
    setMfgCost(80);
    setPackCost(20);
    setAdSpend(50);
    setShippingCost(35);
    setPaymentGatewayFeePct(2);
    setMarketplaceCutPct(0);
    setFixedRent(25000);
    setFixedSalaries(60000);
    setFixedSoftware(15000);
    setFixedMarketingBase(10000);
    setMonthlyUnits(1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold mb-2">
              <Calculator className="w-3.5 h-3.5" />
              <span>Unit Economics Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              D2C Profit & Break-Even Calculator
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Model your pricing strategy, cost of goods, advertising customer acquisition, and monthly operational overhead to find your exact break-even threshold and net profitability.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Currency selector */}
            <div className="flex items-center bg-white/[0.05] p-1 rounded-xl border border-white/[0.08]">
              {(['₹', '$', '€'] as const).map((curr) => (
                <button
                  key={curr}
                  type="button"
                  onClick={() => setCurrencySymbol(curr)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    currencySymbol === curr ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={resetDefaults}
              className="p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Reset to default benchmark"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Inputs on Left, Real-time Dashboard on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Variable & Fixed Cost Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section 1: Per-Unit Variable Costs */}
          <div className="glass-panel rounded-2xl p-5 border border-white/[0.08]">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span>1. Per-Unit Variable Economics</span>
              </h2>
              <span className="text-xs text-slate-400">Direct costs per sale</span>
            </div>

            <div className="space-y-4">
              {/* Selling Price */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-white">Target Selling Price (MRP / Retail)</span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">{currencySymbol}</span>
                    <input
                      type="number"
                      min="0"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(Number(e.target.value))}
                      className="w-20 px-2 py-1 bg-white/[0.08] border border-white/[0.15] rounded-lg text-right font-bold text-white font-mono-nums focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min="50"
                  max="2000"
                  step="10"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/[0.1] rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              {/* Manufacturing Cost */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-200">Manufacturing Cost / COGS</span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">{currencySymbol}</span>
                    <input
                      type="number"
                      min="0"
                      value={mfgCost}
                      onChange={(e) => setMfgCost(Number(e.target.value))}
                      className="w-20 px-2 py-1 bg-white/[0.08] border border-white/[0.15] rounded-lg text-right font-bold text-white font-mono-nums focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min="10"
                  max="600"
                  step="5"
                  value={mfgCost}
                  onChange={(e) => setMfgCost(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/[0.1] rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              {/* Packaging Cost */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-200">Primary & Secondary Packaging</span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">{currencySymbol}</span>
                    <input
                      type="number"
                      min="0"
                      value={packCost}
                      onChange={(e) => setPackCost(Number(e.target.value))}
                      className="w-20 px-2 py-1 bg-white/[0.08] border border-white/[0.15] rounded-lg text-right font-bold text-white font-mono-nums focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="150"
                  step="2"
                  value={packCost}
                  onChange={(e) => setPackCost(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/[0.1] rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
              </div>

              {/* Advertising Spend / CAC */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-200">Ad Spend / Customer Acquisition (CAC)</span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">{currencySymbol}</span>
                    <input
                      type="number"
                      min="0"
                      value={adSpend}
                      onChange={(e) => setAdSpend(Number(e.target.value))}
                      className="w-20 px-2 py-1 bg-white/[0.08] border border-white/[0.15] rounded-lg text-right font-bold text-white font-mono-nums focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="5"
                  value={adSpend}
                  onChange={(e) => setAdSpend(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/[0.1] rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              {/* Other Variable Costs: Shipping & Payment gateway */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-[11px] text-slate-300 block font-medium">Shipping / Courier</span>
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-xs text-slate-400">{currencySymbol}</span>
                    <input
                      type="number"
                      min="0"
                      value={shippingCost}
                      onChange={(e) => setShippingCost(Number(e.target.value))}
                      className="w-full p-1 bg-white/[0.05] border border-white/[0.1] rounded text-xs text-white font-bold"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-[11px] text-slate-300 block font-medium">Payment Gateway %</span>
                  <div className="mt-1 flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      value={paymentGatewayFeePct}
                      onChange={(e) => setPaymentGatewayFeePct(Number(e.target.value))}
                      className="w-full p-1 bg-white/[0.05] border border-white/[0.1] rounded text-xs text-white font-bold"
                    />
                    <span className="text-xs text-slate-400">%</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-[11px] text-slate-300 block font-medium">Marketplace Cut %</span>
                  <div className="mt-1 flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="30"
                      step="1"
                      value={marketplaceCutPct}
                      onChange={(e) => setMarketplaceCutPct(Number(e.target.value))}
                      className="w-full p-1 bg-white/[0.05] border border-white/[0.1] rounded text-xs text-white font-bold"
                    />
                    <span className="text-xs text-slate-400">%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Fixed Monthly Overhead */}
          <div className="glass-panel rounded-2xl p-5 border border-white/[0.08]">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span>2. Fixed Monthly Overhead</span>
              </h2>
              <span className="text-xs text-slate-400">Total: {currencySymbol}{totalFixedCosts.toLocaleString()} / mo</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Rent & Storage</label>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400">{currencySymbol}</span>
                  <input
                    type="number"
                    min="0"
                    value={fixedRent}
                    onChange={(e) => setFixedRent(Number(e.target.value))}
                    className="w-full p-1.5 bg-white/[0.05] border border-white/[0.1] rounded-lg text-xs text-white font-mono-nums font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Core Team Salaries</label>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400">{currencySymbol}</span>
                  <input
                    type="number"
                    min="0"
                    value={fixedSalaries}
                    onChange={(e) => setFixedSalaries(Number(e.target.value))}
                    className="w-full p-1.5 bg-white/[0.05] border border-white/[0.1] rounded-lg text-xs text-white font-mono-nums font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">SaaS & Shopify Apps</label>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400">{currencySymbol}</span>
                  <input
                    type="number"
                    min="0"
                    value={fixedSoftware}
                    onChange={(e) => setFixedSoftware(Number(e.target.value))}
                    className="w-full p-1.5 bg-white/[0.05] border border-white/[0.1] rounded-lg text-xs text-white font-mono-nums font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Brand & Retainers</label>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400">{currencySymbol}</span>
                  <input
                    type="number"
                    min="0"
                    value={fixedMarketingBase}
                    onChange={(e) => setFixedMarketingBase(Number(e.target.value))}
                    className="w-full p-1.5 bg-white/[0.05] border border-white/[0.1] rounded-lg text-xs text-white font-mono-nums font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Monthly Volume Simulator */}
          <div className="glass-panel rounded-2xl p-5 border border-white/[0.08]">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>3. Monthly Sales Volume Simulation</span>
              </h2>
              <span className="text-xs font-bold text-white font-mono-nums">
                {monthlyUnits.toLocaleString()} units / month
              </span>
            </div>

            <input
              type="range"
              min="100"
              max="10000"
              step="100"
              value={monthlyUnits}
              onChange={(e) => setMonthlyUnits(Number(e.target.value))}
              className="w-full h-1.5 bg-white/[0.1] rounded-lg appearance-none cursor-pointer accent-emerald-500 mt-2"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono-nums">
              <span>100 units</span>
              <span>2,500 units</span>
              <span>5,000 units</span>
              <span>10,000 units</span>
            </div>
          </div>
        </div>

        {/* Right Column: Key Outputs & Financial Breakdown (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Main Key Metric Cards */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* Contribution Profit Per Unit */}
            <div className="glass-panel rounded-2xl p-4 border border-white/[0.08]">
              <span className="text-[11px] text-slate-400 block font-medium">Contribution Profit</span>
              <div
                className={`text-2xl sm:text-3xl font-black font-mono-nums mt-1 ${
                  contributionProfitPerUnit > 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {currencySymbol}
                {contributionProfitPerUnit.toFixed(1)}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">per unit sold</span>
            </div>

            {/* Contribution Margin % */}
            <div className="glass-panel rounded-2xl p-4 border border-white/[0.08]">
              <span className="text-[11px] text-slate-400 block font-medium">Contribution Margin</span>
              <div
                className={`text-2xl sm:text-3xl font-black font-mono-nums mt-1 ${
                  contributionMarginPct >= 30
                    ? 'text-emerald-400'
                    : contributionMarginPct > 15
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {contributionMarginPct.toFixed(1)}%
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {contributionMarginPct >= 30 ? 'Healthy D2C margin' : 'Thin margin alert'}
              </span>
            </div>

            {/* Break-Even Units */}
            <div className="glass-panel rounded-2xl p-4 border border-white/[0.08]">
              <span className="text-[11px] text-slate-400 block font-medium">Break-Even Volume</span>
              <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono-nums mt-1">
                {breakEvenUnits !== null ? `${breakEvenUnits.toLocaleString()} units` : 'Impossible'}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">to cover fixed costs</span>
            </div>

            {/* Net Monthly Profit at simulated volume */}
            <div className="glass-panel rounded-2xl p-4 border border-white/[0.08]">
              <span className="text-[11px] text-slate-400 block font-medium">Net Monthly Profit</span>
              <div
                className={`text-2xl sm:text-3xl font-black font-mono-nums mt-1 ${
                  netMonthlyProfit >= 0 ? 'text-white' : 'text-rose-400'
                }`}
              >
                {netMonthlyProfit < 0 ? '-' : ''}
                {currencySymbol}
                {Math.abs(Math.round(netMonthlyProfit)).toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Net Margin: {netMarginPct.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Warning Banner if Margin is negative or low */}
          {contributionProfitPerUnit <= 0 ? (
            <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <p className="font-bold text-white">Negative Unit Economics!</p>
                <p className="mt-0.5 text-[11px]">
                  Total variable costs ({currencySymbol}{totalVariableCosts.toFixed(1)}) exceed your selling price ({currencySymbol}{sellingPrice}). Increase selling price or renegotiate COGS/ad spend immediately.
                </p>
              </div>
            </div>
          ) : monthlyUnits < (breakEvenUnits || 0) ? (
            <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Below Break-Even Volume</p>
                <p className="mt-0.5 text-[11px]">
                  At {monthlyUnits} units/mo, you need {(breakEvenUnits! - monthlyUnits).toLocaleString()} more units to clear fixed overhead of {currencySymbol}{totalFixedCosts.toLocaleString()}.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Cash Flow Positive</p>
                <p className="mt-0.5 text-[11px]">
                  Simulated volume exceeds break-even by {(monthlyUnits - breakEvenUnits!).toLocaleString()} units, generating {currencySymbol}{Math.round(netMonthlyProfit).toLocaleString()} net profit.
                </p>
              </div>
            </div>
          )}

          {/* Per-Unit Cost Breakdown Chart */}
          <div className="glass-panel rounded-2xl p-5 border border-white/[0.08]">
            <h3 className="text-xs font-bold text-white mb-3 flex items-center justify-between">
              <span>Unit Price Waterfall Breakdown</span>
              <span className="text-[10px] text-slate-400 font-mono-nums">100% of {currencySymbol}{sellingPrice}</span>
            </h3>

            <div className="space-y-2">
              {costChartData.map((item) => {
                const pct = sellingPrice > 0 ? (item.value / sellingPrice) * 100 : 0;
                return (
                  <div key={item.name} className="text-xs">
                    <div className="flex justify-between items-center text-[11px] mb-1">
                      <span className="text-slate-300 font-medium flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        {item.name}
                      </span>
                      <span className="font-mono-nums font-bold text-white">
                        {currencySymbol}{item.value} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Educational Note: Contribution vs Net Profit */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs space-y-2">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>D2C Founder Rule of Thumb</span>
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              <strong className="text-slate-200">Contribution Profit</strong> is what remains after paying direct costs (COGS, shipping, ad spend). It funds your fixed salaries and growth.
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              <strong className="text-slate-200">Net Profit</strong> is what stays in the bank after all fixed monthly overheads are subtracted. Target &gt;35% contribution margin to withstand CAC volatility.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
