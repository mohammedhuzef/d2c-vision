import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, ArrowRight } from 'lucide-react';

export const ProfitCalculatorCard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'product' | 'costs' | 'pricing' | 'results'>('costs');
  const [sellingPrice, setSellingPrice] = useState<number>(299);
  const [mfgCost, setMfgCost] = useState<number>(80);
  const [packCost, setPackCost] = useState<number>(20);
  const [adSpend, setAdSpend] = useState<number>(50);
  const shippingAndPlatform = 40; // logistics & gateway fee

  const totalCost = mfgCost + packCost + adSpend + shippingAndPlatform;
  const estimatedProfit = Math.max(0, sellingPrice - totalCost);
  const profitMargin = sellingPrice > 0 ? Math.round((estimatedProfit / sellingPrice) * 100) : 0;

  return (
    <div id="profit-calculator" className="glass-panel rounded-2xl p-4 border border-white/[0.08] flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Calculator className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white tracking-tight">Profit Calculator</span>
              <p className="text-[10px] text-slate-400">Estimate your costs, pricing and profit margins.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/profit-calculator')}
            className="text-[11px] font-medium text-slate-400 hover:text-teal-300 flex items-center gap-1 transition-colors cursor-pointer"
            title="Open Full Break-Even Calculator"
          >
            <span>Full Tool</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-2.5 flex items-center gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.05]">
          {(['product', 'costs', 'pricing', 'results'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1 rounded-lg text-[10px] font-semibold capitalize transition-all ${
                activeTab === tab
                  ? 'bg-white/[0.1] text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main calculation view */}
      <div className="mt-3 grid grid-cols-12 gap-3 items-center">
        {/* Left: Profit Metrics */}
        <div className="col-span-5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-col justify-center">
          <span className="text-[10px] text-slate-400 block font-medium">Estimated Profit</span>
          <div className="text-2xl font-black text-white font-mono-nums tracking-tight mt-0.5">
            ₹{estimatedProfit}
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Per Unit</span>

          <div className="mt-3 pt-2 border-t border-white/[0.06]">
            <div className="text-lg font-black text-emerald-400 font-mono-nums">
              {profitMargin}%
            </div>
            <span className="text-[10px] font-semibold text-emerald-400/90 block">
              Profit Margin
            </span>
          </div>
        </div>

        {/* Right: Sliders & Inputs */}
        <div className="col-span-7 space-y-2">
          {/* Selling Price */}
          <div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-300 font-medium">Selling Price (₹)</span>
              <span className="font-bold text-white font-mono-nums">₹{sellingPrice}</span>
            </div>
            <input
              type="range"
              min="100"
              max="1500"
              step="10"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(Number(e.target.value))}
              className="w-full h-1 bg-white/[0.1] rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-1"
            />
          </div>

          {/* Manufacturing Cost */}
          <div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-300 font-medium">Manufacturing Cost (₹)</span>
              <span className="font-bold text-white font-mono-nums">₹{mfgCost}</span>
            </div>
            <input
              type="range"
              min="20"
              max="500"
              step="5"
              value={mfgCost}
              onChange={(e) => setMfgCost(Number(e.target.value))}
              className="w-full h-1 bg-white/[0.1] rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-1"
            />
          </div>

          {/* Packaging Cost */}
          <div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-300 font-medium">Packaging Cost (₹)</span>
              <span className="font-bold text-white font-mono-nums">₹{packCost}</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              step="1"
              value={packCost}
              onChange={(e) => setPackCost(Number(e.target.value))}
              className="w-full h-1 bg-white/[0.1] rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-1"
            />
          </div>

          {/* Ad Spend */}
          <div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-300 font-medium">Ad Spend (₹)</span>
              <span className="font-bold text-white font-mono-nums">₹{adSpend}</span>
            </div>
            <input
              type="range"
              min="10"
              max="300"
              step="5"
              value={adSpend}
              onChange={(e) => setAdSpend(Number(e.target.value))}
              className="w-full h-1 bg-white/[0.1] rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
