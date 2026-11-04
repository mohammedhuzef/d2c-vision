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

  const totalVariableCostPerUnit = useMemo(() => {
    return (
      Math.max(0, mfgCost) +
      Math.max(0, packCost) +
      Math.max(0, adSpend) +
      Math.max(0, shippingCost) +
      paymentFee +
      marketplaceFee
    );
  }, [mfgCost, packCost, adSpend, shippingCost, paymentFee, marketplaceFee]);

  // Contribution profit per unit: Selling Price - Variable Costs
  const contributionProfitPerUnit = useMemo(() => {
    return sellingPrice - totalVariableCostPerUnit;
  }, [sellingPrice, totalVariableCostPerUnit]);

  // Contribution Margin %
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
    { name: 'Manufacturing (COGS)', value: mfgCost, color: '#059669' },
    { name: 'Packaging & Labeling', value: packCost, color: '#0F172A' },
    { name: 'Advertising (CAC)', value: adSpend, color: '#0284C7' },
    { name: 'Shipping & Logistics', value: shippingCost, color: '#D97706' },
    { name: 'Platform & Gateway', value: Number((paymentFee + marketplaceFee).toFixed(1)), color: '#64748B' },
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

  const isProfitable = contributionProfitPerUnit > 0;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="rounded-2xl p-6 bg-white border border-slate-200/90 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-2">
              <Calculator className="w-3.5 h-3.5 text-emerald-600" />
              <span>Unit Economics Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              D2C Profit & Break-Even Calculator
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Model your target selling price, cost of goods, advertising customer acquisition cost (CAC), and monthly operational overhead to find your exact break-even threshold and net profitability.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Currency selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              {(['₹', '$', '€'] as const).map((curr) => (
                <button
                  key={curr}
                  type="button"
                  onClick={() => setCurrencySymbol(curr)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currencySymbol === curr
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={resetDefaults}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
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
          <div className="rounded-2xl p-5 bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>1. Per-Unit Variable Economics</span>
              </h2>
              <span className="text-xs text-slate-500">Direct costs incurred per sale</span>
            </div>

            <div className="space-y-4">
              {/* Selling Price */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-900">Target Selling Price (MRP / Retail)</span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">{currencySymbol}</span>
                    <input
                      type="number"
                      min="0"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(Math.max(0, Number(e.target.value)))}
                      className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-right font-bold text-slate-900 font-mono-nums focus:outline-none focus:border-emerald-500"
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
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              {/* Manufacturing Cost */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-700">Manufacturing Cost / COGS</span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">{currencySymbol}</span>
                    <input
                      type="number"
                      min="0"
                      value={mfgCost}
                      onChange={(e) => setMfgCost(Math.max(0, Number(e.target.value)))}
                      className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-right font-bold text-slate-900 font-mono-nums focus:outline-none focus:border-emerald-500"
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
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              {/* Packaging Cost */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-700">Primary & Secondary Packaging</span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">{currencySymbol}</span>
                    <input
                      type="number"
                      min="0"
                      value={packCost}
                      onChange={(e) => setPackCost(Math.max(0, Number(e.target.value)))}
                      className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-right font-bold text-slate-900 font-mono-nums focus:outline-none focus:border-emerald-500"
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
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              {/* Marketing CAC */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-700">Blended Ad Spend / CAC per Unit</span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">{currencySymbol}</span>
                    <input
                      type="number"
                      min="0"
                      value={adSpend}
                      onChange={(e) => setAdSpend(Math.max(0, Number(e.target.value)))}
                      className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-right font-bold text-slate-900 font-mono-nums focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="400"
                  step="5"
                  value={adSpend}
                  onChange={(e) => setAdSpend(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              {/* Shipping */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-700">Shipping & Fulfillment (3PL)</span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">{currencySymbol}</span>
                    <input
                      type="number"
                      min="0"
                      value={shippingCost}
                      onChange={(e) => setShippingCost(Math.max(0, Number(e.target.value)))}
                      className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-right font-bold text-slate-900 font-mono-nums focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="150"
                  step="5"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              {/* Payment Gateway & Marketplace fees */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[11px] text-slate-600 block mb-1">Payment Gateway Fee</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      value={paymentGatewayFeePct}
                      onChange={(e) => setPaymentGatewayFeePct(Math.max(0, Number(e.target.value)))}
                      className="w-full p-1 bg-white border border-slate-200 rounded text-xs text-slate-900 font-bold font-mono-nums"
                    />
                    <span className="text-xs text-slate-500">%</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[11px] text-slate-600 block mb-1">Marketplace Commission</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="50"
                      step="1"
                      value={marketplaceCutPct}
                      onChange={(e) => setMarketplaceCutPct(Math.max(0, Number(e.target.value)))}
                      className="w-full p-1 bg-white border border-slate-200 rounded text-xs text-slate-900 font-bold font-mono-nums"
                    />
                    <span className="text-xs text-slate-500">%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Fixed Monthly Overhead */}
          <div className="rounded-2xl p-5 bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-800" />
                <span>2. Fixed Monthly Overhead</span>
              </h2>
              <span className="text-xs text-emerald-700 font-mono-nums font-bold">
                Total: {currencySymbol}{totalFixedCosts.toLocaleString()} / mo
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Rent & Storage</label>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-500">{currencySymbol}</span>
                  <input
                    type="number"
                    min="0"
                    value={fixedRent}
                    onChange={(e) => setFixedRent(Math.max(0, Number(e.target.value)))}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono-nums font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Core Team Salaries</label>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-500">{currencySymbol}</span>
                  <input
                    type="number"
                    min="0"
                    value={fixedSalaries}
                    onChange={(e) => setFixedSalaries(Math.max(0, Number(e.target.value)))}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono-nums font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-500 block mb-1">SaaS & Shopify Apps</label>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-500">{currencySymbol}</span>
                  <input
                    type="number"
                    min="0"
                    value={fixedSoftware}
                    onChange={(e) => setFixedSoftware(Math.max(0, Number(e.target.value)))}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono-nums font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Agency Retainers</label>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-500">{currencySymbol}</span>
                  <input
                    type="number"
                    min="0"
                    value={fixedMarketingBase}
                    onChange={(e) => setFixedMarketingBase(Math.max(0, Number(e.target.value)))}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono-nums font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Monthly Volume Simulator */}
          <div className="rounded-2xl p-5 bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>3. Monthly Sales Volume Simulation</span>
              </h2>
              <span className="text-xs font-bold text-slate-900 font-mono-nums">
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
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 mt-2"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono-nums">
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
            <div className="rounded-2xl p-4 bg-white border border-slate-200/90 shadow-xs">
              <span className="text-[11px] text-slate-500 block font-medium">Contribution Profit</span>
              <div
                className={`text-2xl sm:text-3xl font-black font-mono-nums mt-1 ${
                  isProfitable ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {currencySymbol}
                {contributionProfitPerUnit.toFixed(1)}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">per unit sold</span>
            </div>

            {/* Contribution Margin % */}
            <div className="rounded-2xl p-4 bg-white border border-slate-200/90 shadow-xs">
              <span className="text-[11px] text-slate-500 block font-medium">Contribution Margin</span>
              <div
                className={`text-2xl sm:text-3xl font-black font-mono-nums mt-1 ${
                  contributionMarginPct >= 30
                    ? 'text-emerald-700'
                    : contributionMarginPct > 15
                    ? 'text-amber-600'
                    : 'text-rose-600'
                }`}
              >
                {contributionMarginPct.toFixed(1)}%
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                {contributionMarginPct >= 30 ? 'Healthy D2C margin' : 'Thin margin alert'}
              </span>
            </div>

            {/* Break-Even Units */}
            <div className="rounded-2xl p-4 bg-white border border-slate-200/90 shadow-xs">
              <span className="text-[11px] text-slate-500 block font-medium">Break-Even Volume</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono-nums mt-1">
                {breakEvenUnits !== null ? `${breakEvenUnits.toLocaleString()} units` : 'Impossible'}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">to cover fixed costs</span>
            </div>

            {/* Net Monthly Profit at simulated volume */}
            <div className="rounded-2xl p-4 bg-white border border-slate-200/90 shadow-xs">
              <span className="text-[11px] text-slate-500 block font-medium">Net Monthly Profit</span>
              <div
                className={`text-2xl sm:text-3xl font-black font-mono-nums mt-1 ${
                  netMonthlyProfit >= 0 ? 'text-slate-900' : 'text-rose-600'
                }`}
              >
                {netMonthlyProfit < 0 ? '-' : ''}
                {currencySymbol}
                {Math.abs(Math.round(netMonthlyProfit)).toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Net Margin: {netMarginPct.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Warning / Success Banner */}
          {contributionProfitPerUnit <= 0 ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900">Negative Unit Economics Alert</p>
                <p className="mt-0.5 text-[11px] text-slate-600">
                  Total variable costs ({currencySymbol}{totalVariableCostPerUnit.toFixed(1)}) exceed your target price ({currencySymbol}{sellingPrice}). Increase selling price or renegotiate COGS and ad spend.
                </p>
              </div>
            </div>
          ) : monthlyUnits < (breakEvenUnits || 0) ? (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">Below Monthly Break-Even Volume</p>
                <p className="mt-0.5 text-[11px] text-slate-600">
                  At {monthlyUnits} units/mo, you need {(breakEvenUnits! - monthlyUnits).toLocaleString()} more units to clear fixed overhead of {currencySymbol}{totalFixedCosts.toLocaleString()}.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">Cash Flow Positive Simulation</p>
                <p className="mt-0.5 text-[11px] text-slate-600">
                  Simulated volume exceeds break-even threshold by {(monthlyUnits - breakEvenUnits!).toLocaleString()} units, generating {currencySymbol}{Math.round(netMonthlyProfit).toLocaleString()} in net monthly cash flow.
                </p>
              </div>
            </div>
          )}

          {/* Per-Unit Cost Breakdown Chart */}
          <div className="rounded-2xl p-5 bg-white border border-slate-200/90 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 mb-3 flex items-center justify-between">
              <span>Unit Price Waterfall Breakdown</span>
              <span className="text-[10px] text-slate-500 font-mono-nums">
                100% of {currencySymbol}{sellingPrice}
              </span>
            </h3>

            <div className="space-y-2">
              {costChartData.map((item) => {
                const pct = sellingPrice > 0 ? (item.value / sellingPrice) * 100 : 0;
                return (
                  <div key={item.name} className="text-xs">
                    <div className="flex justify-between items-center text-[11px] mb-1">
                      <span className="text-slate-600 font-medium flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        {item.name}
                      </span>
                      <span className="font-mono-nums font-bold text-slate-900">
                        {currencySymbol}{item.value} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
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
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>D2C Founder Rule of Thumb</span>
            </h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              <strong className="text-slate-800">Contribution Profit</strong> is what remains after paying direct costs (COGS, packaging, shipping, CAC). It funds your fixed salaries, software, and growth experiments.
            </p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              <strong className="text-slate-800">Net Profit</strong> is what remains in the company bank account after all fixed monthly overheads are cleared. Target &gt;35% contribution margin to withstand seasonal CAC volatility.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
