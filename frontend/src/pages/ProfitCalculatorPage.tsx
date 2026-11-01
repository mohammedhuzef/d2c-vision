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
  Sliders,
  Package,
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
    { name: 'Manufacturing (COGS)', value: mfgCost, color: '#7547FF' },
    { name: 'Packaging & Labeling', value: packCost, color: '#25D9E8' },
    { name: 'Advertising (CAC)', value: adSpend, color: '#A855F7' },
    { name: 'Shipping & Logistics', value: shippingCost, color: '#FFBE58' },
    { name: 'Platform & Gateway', value: Number((paymentFee + marketplaceFee).toFixed(1)), color: '#278BFF' },
    { name: 'Unit Contribution Profit', value: Math.max(0, contributionProfitPerUnit), color: '#28D7A0' },
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

  const isProfitable = contributionProfitPerUnit > 0;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="rounded-2xl p-6 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#25D9E8]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#25D9E8]/15 border border-[#25D9E8]/30 text-[#25D9E8] text-xs font-semibold mb-2">
              <Calculator className="w-3.5 h-3.5" />
              <span>Unit Economics Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFF] tracking-tight">
              D2C Profit & Break-Even Calculator
            </h1>
            <p className="text-xs sm:text-sm text-[#9EADC2] mt-1 max-w-2xl">
              Model your target selling price, cost of goods, advertising customer acquisition cost (CAC), and monthly operational overhead to find your exact break-even threshold and net profitability.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Currency selector */}
            <div className="flex items-center bg-[rgba(8,24,44,0.7)] p-1 rounded-xl border border-[rgba(161,190,230,0.2)]">
              {(['₹', '$', '€'] as const).map((curr) => (
                <button
                  key={curr}
                  type="button"
                  onClick={() => setCurrencySymbol(curr)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currencySymbol === curr
                      ? 'bg-gradient-to-r from-[#7547FF] to-[#278BFF] text-white shadow-sm'
                      : 'text-[#9EADC2] hover:text-[#F8FAFF]'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={resetDefaults}
              className="p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-[rgba(161,190,230,0.2)] text-[#9EADC2] hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset to default benchmark"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Defaults</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Inputs on Left, Real-time Dashboard on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Variable & Fixed Cost Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section 1: Per-Unit Variable Costs */}
          <div className="rounded-2xl p-5 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(161,190,230,0.18)] mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#7547FF] shadow-[0_0_8px_#7547FF]" />
                <span>1. Per-Unit Variable Economics</span>
              </h2>
              <span className="text-xs text-[#9EADC2]">Direct costs incurred per sale</span>
            </div>

            <div className="space-y-4">
              {/* Selling Price */}
              <div className="p-3.5 rounded-xl bg-[rgba(8,24,44,0.7)] border border-[rgba(161,190,230,0.15)]">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-white">Target Selling Price (MRP / Retail)</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[#9EADC2]">{currencySymbol}</span>
                    <input
                      type="number"
                      min="0"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(Math.max(0, Number(e.target.value)))}
                      className="w-20 px-2 py-1 bg-white/[0.08] border border-[rgba(161,190,230,0.25)] rounded-lg text-right font-bold text-white font-mono-nums focus:outline-none focus:border-[#7547FF]"
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
                  className="w-full h-1.5 bg-white/[0.1] rounded-lg appearance-none cursor-pointer accent-[#7547FF]"
                />
              </div>

              {/* Manufacturing Cost */}
              <div className="p-3.5 rounded-xl bg-[rgba(8,24,44,0.7)] border border-[rgba(161,190,230,0.15)]">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-200">Manufacturing Cost / COGS</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[#9EADC2]">{currencySymbol}</span>
                    <input
                      type="number"
                      min="0"
                      value={mfgCost}
                      onChange={(e) => setMfgCost(Math.max(0, Number(e.target.value)))}
                      className="w-20 px-2 py-1 bg-white/[0.08] border border-[rgba(161,190,230,0.25)] rounded-lg text-right font-bold text-white font-mono-nums focus:outline-none focus:border-[#25D9E8]"
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
                  className="w-full h-1.5 bg-white/[0.1] rounded-lg appearance-none cursor-pointer accent-[#25D9E8]"
                />
              </div>

              {/* Packaging Cost */}
              <div className="p-3.5 rounded-xl bg-[rgba(8,24,44,0.7)] border border-[rgba(161,190,230,0.15)]">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-200">Primary & Secondary Packaging</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[#9EADC2]">{currencySymbol}</span>
                    <input
                      type="number"
                      min="0"
                      value={packCost}
                      onChange={(e) => setPackCost(Math.max(0, Number(e.target.value)))}
                      className="w-20 px-2 py-1 bg-white/[0.08] border border-[rgba(161,190,230,0.25)] rounded-lg text-right font-bold text-white font-mono-nums focus:outline-none focus:border-[#28D7A0]"
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
                  className="w-full h-1.5 bg-white/[0.1] rounded-lg appearance-none cursor-pointer accent-[#28D7A0]"
                />
              </div>

              {/* Advertising Spend / CAC */}
              <div className="p-3.5 rounded-xl bg-[rgba(8,24,44,0.7)] border border-[rgba(161,190,230,0.15)]">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-200">Ad Spend / Customer Acquisition Cost (CAC)</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[#9EADC2]">{currencySymbol}</span>
                    <input
                      type="number"
                      min="0"
                      value={adSpend}
                      onChange={(e) => setAdSpend(Math.max(0, Number(e.target.value)))}
                      className="w-20 px-2 py-1 bg-white/[0.08] border border-[rgba(161,190,230,0.25)] rounded-lg text-right font-bold text-white font-mono-nums focus:outline-none focus:border-[#A855F7]"
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
                  className="w-full h-1.5 bg-white/[0.1] rounded-lg appearance-none cursor-pointer accent-[#A855F7]"
                />
              </div>

              {/* Other Variable Costs: Shipping & Payment gateway */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-[rgba(8,24,44,0.5)] border border-[rgba(161,190,230,0.12)]">
                  <span className="text-[11px] text-[#9EADC2] block font-medium">Shipping / Courier</span>
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-xs text-[#9EADC2]">{currencySymbol}</span>
                    <input
                      type="number"
                      min="0"
                      value={shippingCost}
                      onChange={(e) => setShippingCost(Math.max(0, Number(e.target.value)))}
                      className="w-full p-1 bg-white/[0.05] border border-[rgba(161,190,230,0.2)] rounded text-xs text-white font-bold font-mono-nums"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[rgba(8,24,44,0.5)] border border-[rgba(161,190,230,0.12)]">
                  <span className="text-[11px] text-[#9EADC2] block font-medium">Payment Gateway %</span>
                  <div className="mt-1 flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      value={paymentGatewayFeePct}
                      onChange={(e) => setPaymentGatewayFeePct(Math.max(0, Number(e.target.value)))}
                      className="w-full p-1 bg-white/[0.05] border border-[rgba(161,190,230,0.2)] rounded text-xs text-white font-bold font-mono-nums"
                    />
                    <span className="text-xs text-[#9EADC2]">%</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[rgba(8,24,44,0.5)] border border-[rgba(161,190,230,0.12)]">
                  <span className="text-[11px] text-[#9EADC2] block font-medium">Marketplace Cut %</span>
                  <div className="mt-1 flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="30"
                      step="1"
                      value={marketplaceCutPct}
                      onChange={(e) => setMarketplaceCutPct(Math.max(0, Number(e.target.value)))}
                      className="w-full p-1 bg-white/[0.05] border border-[rgba(161,190,230,0.2)] rounded text-xs text-white font-bold font-mono-nums"
                    />
                    <span className="text-xs text-[#9EADC2]">%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Fixed Monthly Overhead */}
          <div className="rounded-2xl p-5 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(161,190,230,0.18)] mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#A855F7] shadow-[0_0_8px_#A855F7]" />
                <span>2. Fixed Monthly Overhead</span>
              </h2>
              <span className="text-xs text-[#25D9E8] font-mono-nums font-bold">
                Total: {currencySymbol}{totalFixedCosts.toLocaleString()} / mo
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] text-[#9EADC2] block mb-1">Rent & Storage</label>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[#9EADC2]">{currencySymbol}</span>
                  <input
                    type="number"
                    min="0"
                    value={fixedRent}
                    onChange={(e) => setFixedRent(Math.max(0, Number(e.target.value)))}
                    className="w-full p-1.5 bg-[rgba(8,24,44,0.6)] border border-[rgba(161,190,230,0.2)] rounded-lg text-xs text-white font-mono-nums font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-[#9EADC2] block mb-1">Core Team Salaries</label>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[#9EADC2]">{currencySymbol}</span>
                  <input
                    type="number"
                    min="0"
                    value={fixedSalaries}
                    onChange={(e) => setFixedSalaries(Math.max(0, Number(e.target.value)))}
                    className="w-full p-1.5 bg-[rgba(8,24,44,0.6)] border border-[rgba(161,190,230,0.2)] rounded-lg text-xs text-white font-mono-nums font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-[#9EADC2] block mb-1">SaaS & Shopify Apps</label>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[#9EADC2]">{currencySymbol}</span>
                  <input
                    type="number"
                    min="0"
                    value={fixedSoftware}
                    onChange={(e) => setFixedSoftware(Math.max(0, Number(e.target.value)))}
                    className="w-full p-1.5 bg-[rgba(8,24,44,0.6)] border border-[rgba(161,190,230,0.2)] rounded-lg text-xs text-white font-mono-nums font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-[#9EADC2] block mb-1">Agency Retainers</label>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[#9EADC2]">{currencySymbol}</span>
                  <input
                    type="number"
                    min="0"
                    value={fixedMarketingBase}
                    onChange={(e) => setFixedMarketingBase(Math.max(0, Number(e.target.value)))}
                    className="w-full p-1.5 bg-[rgba(8,24,44,0.6)] border border-[rgba(161,190,230,0.2)] rounded-lg text-xs text-white font-mono-nums font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Monthly Volume Simulator */}
          <div className="rounded-2xl p-5 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(161,190,230,0.18)] mb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#28D7A0] shadow-[0_0_8px_#28D7A0]" />
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
              className="w-full h-1.5 bg-white/[0.1] rounded-lg appearance-none cursor-pointer accent-[#28D7A0] mt-2"
            />
            <div className="flex justify-between text-[10px] text-[#9EADC2] mt-1 font-mono-nums">
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
            <div className="rounded-2xl p-4 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl shadow-md">
              <span className="text-[11px] text-[#9EADC2] block font-medium">Contribution Profit</span>
              <div
                className={`text-2xl sm:text-3xl font-black font-mono-nums mt-1 ${
                  isProfitable ? 'text-[#28D7A0]' : 'text-[#F43F5E]'
                }`}
              >
                {currencySymbol}
                {contributionProfitPerUnit.toFixed(1)}
              </div>
              <span className="text-[10px] text-[#9EADC2] mt-1 block">per unit sold</span>
            </div>

            {/* Contribution Margin % */}
            <div className="rounded-2xl p-4 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl shadow-md">
              <span className="text-[11px] text-[#9EADC2] block font-medium">Contribution Margin</span>
              <div
                className={`text-2xl sm:text-3xl font-black font-mono-nums mt-1 ${
                  contributionMarginPct >= 30
                    ? 'text-[#28D7A0]'
                    : contributionMarginPct > 15
                    ? 'text-amber-400'
                    : 'text-[#F43F5E]'
                }`}
              >
                {contributionMarginPct.toFixed(1)}%
              </div>
              <span className="text-[10px] text-[#9EADC2] mt-1 block">
                {contributionMarginPct >= 30 ? 'Healthy D2C margin' : 'Thin margin alert'}
              </span>
            </div>

            {/* Break-Even Units */}
            <div className="rounded-2xl p-4 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl shadow-md">
              <span className="text-[11px] text-[#9EADC2] block font-medium">Break-Even Volume</span>
              <div className="text-2xl sm:text-3xl font-black text-[#25D9E8] font-mono-nums mt-1">
                {breakEvenUnits !== null ? `${breakEvenUnits.toLocaleString()} units` : 'Impossible'}
              </div>
              <span className="text-[10px] text-[#9EADC2] mt-1 block">to cover fixed costs</span>
            </div>

            {/* Net Monthly Profit at simulated volume */}
            <div className="rounded-2xl p-4 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl shadow-md">
              <span className="text-[11px] text-[#9EADC2] block font-medium">Net Monthly Profit</span>
              <div
                className={`text-2xl sm:text-3xl font-black font-mono-nums mt-1 ${
                  netMonthlyProfit >= 0 ? 'text-[#F8FAFF]' : 'text-[#F43F5E]'
                }`}
              >
                {netMonthlyProfit < 0 ? '-' : ''}
                {currencySymbol}
                {Math.abs(Math.round(netMonthlyProfit)).toLocaleString()}
              </div>
              <span className="text-[10px] text-[#9EADC2] mt-1 block">
                Net Margin: {netMarginPct.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Warning / Success Banner */}
          {contributionProfitPerUnit <= 0 ? (
            <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#F43F5E] mt-0.5" />
              <div>
                <p className="font-bold text-white">Negative Unit Economics Alert</p>
                <p className="mt-0.5 text-[11px]">
                  Total variable costs ({currencySymbol}{totalVariableCosts.toFixed(1)}) exceed your target price ({currencySymbol}{sellingPrice}). Increase selling price or renegotiate COGS and ad spend.
                </p>
              </div>
            </div>
          ) : monthlyUnits < (breakEvenUnits || 0) ? (
            <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Below Monthly Break-Even Volume</p>
                <p className="mt-0.5 text-[11px]">
                  At {monthlyUnits} units/mo, you need {(breakEvenUnits! - monthlyUnits).toLocaleString()} more units to clear fixed overhead of {currencySymbol}{totalFixedCosts.toLocaleString()}.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#28D7A0] mt-0.5" />
              <div>
                <p className="font-semibold text-white">Cash Flow Positive Simulation</p>
                <p className="mt-0.5 text-[11px]">
                  Simulated volume exceeds break-even threshold by {(monthlyUnits - breakEvenUnits!).toLocaleString()} units, generating {currencySymbol}{Math.round(netMonthlyProfit).toLocaleString()} in net monthly cash flow.
                </p>
              </div>
            </div>
          )}

          {/* Per-Unit Cost Breakdown Chart */}
          <div className="rounded-2xl p-5 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl shadow-lg">
            <h3 className="text-xs font-bold text-white mb-3 flex items-center justify-between">
              <span>Unit Price Waterfall Breakdown</span>
              <span className="text-[10px] text-[#9EADC2] font-mono-nums">
                100% of {currencySymbol}{sellingPrice}
              </span>
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
          <div className="p-4 rounded-xl bg-[rgba(8,24,44,0.7)] border border-[rgba(161,190,230,0.18)] text-xs space-y-2">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-[#25D9E8]" />
              <span>D2C Founder Rule of Thumb</span>
            </h4>
            <p className="text-[11px] text-[#9EADC2] leading-relaxed">
              <strong className="text-slate-200">Contribution Profit</strong> is what remains after paying direct costs (COGS, packaging, shipping, CAC). It funds your fixed salaries, software, and growth experiments.
            </p>
            <p className="text-[11px] text-[#9EADC2] leading-relaxed">
              <strong className="text-slate-200">Net Profit</strong> is what remains in the company bank account after all fixed monthly overheads are cleared. Target &gt;35% contribution margin to withstand seasonal CAC volatility.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
