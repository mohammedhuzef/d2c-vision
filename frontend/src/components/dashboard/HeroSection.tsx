import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Zap,
  TrendingUp,
  Factory,
  DollarSign,
  ShieldCheck,
  ChevronRight,
  RotateCcw,
  Check,
  Search,
  Users,
  Building2,
  Sliders,
  Award,
  Layers,
  Flame,
} from 'lucide-react';

export interface HeroSectionProps {
  onOpenVideo?: () => void;
  onOpenValidate?: () => void;
}

interface ProductVerdict {
  id: string;
  name: string;
  category: string;
  badge: string;
  verdictType: 'GOOD' | 'CAUTION' | 'RISK';
  verdictLabel: string;
  verdictScore: number;
  headlineVerdict: string;
  explanation: string;
  mrp: number;
  cogs: number;
  shippingAndAds: number;
  netProfit: number;
  marginPercent: number;
  moqUnits: number;
  topSuppliers: { name: string; location: string; moq: string; cert: string }[];
  topCreators: { name: string; handle: string; followers: string; engagement: string }[];
}

const PRESET_PRODUCTS: Record<string, ProductVerdict> = {
  chocolate: {
    id: 'chocolate',
    name: 'Artisanal 70% Dark Chocolate',
    category: 'Gourmet Organic Food',
    badge: '🍫 Dark Chocolate',
    verdictType: 'GOOD',
    verdictLabel: 'GOOD TO LAUNCH',
    verdictScore: 92,
    headlineVerdict: 'High Customer Demand & 68% Profit Margin',
    explanation: 'Clean-label organic dark chocolate is growing at +22% yearly. Low competitor saturation and repeat orders every 28 days.',
    mrp: 299,
    cogs: 74,
    shippingAndAds: 96,
    netProfit: 129,
    marginPercent: 68,
    moqUnits: 500,
    topSuppliers: [
      { name: 'Campco Co-Op', location: 'Mangaluru, Karnataka', moq: '10 kg MOQ', cert: 'FSSAI Certified' },
      { name: 'CocoaCraft Labs', location: 'Kochi, Kerala', moq: '500 units MOQ', cert: 'ISO 22000' },
      { name: 'PureOrigins Foods', location: 'Pune, Maharashtra', moq: '250 units MOQ', cert: 'GMP Organic' },
    ],
    topCreators: [
      { name: 'Riya Sen', handle: '@riya_eats', followers: '184K', engagement: '6.2%' },
      { name: 'Chef Karan', handle: '@karancooks', followers: '320K', engagement: '5.1%' },
    ],
  },
  supplements: {
    id: 'supplements',
    name: 'Clean Pea & Brown Rice Protein',
    category: 'Health & Fitness',
    badge: '🌿 Plant Protein',
    verdictType: 'GOOD',
    verdictLabel: 'GOOD TO LAUNCH',
    verdictScore: 88,
    headlineVerdict: 'Exploding Category Demand & High Repeat Subscriptions',
    explanation: 'Rapid consumer shift away from whey to vegan protein. High average order value (₹1,499) allows strong marketing margins.',
    mrp: 1499,
    cogs: 410,
    shippingAndAds: 539,
    netProfit: 550,
    marginPercent: 64,
    moqUnits: 300,
    topSuppliers: [
      { name: 'NutraCaps Laboratories', location: 'Pune, Maharashtra', moq: '300 jars MOQ', cert: 'ISO 22000 & GMP' },
      { name: 'BioHerb Formulations', location: 'Solan, Himachal', moq: '500 jars MOQ', cert: 'WHO-GMP' },
    ],
    topCreators: [
      { name: 'Ankit Fitness', handle: '@ankit_lifts', followers: '520K', engagement: '7.1%' },
      { name: 'Pooja Yoga', handle: '@pooja_flow', followers: '210K', engagement: '5.8%' },
    ],
  },
  skincare: {
    id: 'skincare',
    name: 'Botanical Barrier Glow Serum',
    category: 'Clean Skincare',
    badge: '✨ Glow Serum',
    verdictType: 'GOOD',
    verdictLabel: 'GOOD TO LAUNCH',
    verdictScore: 86,
    headlineVerdict: 'Viral Beauty Fit & Massive 76% Gross Margin',
    explanation: 'High perceived cosmetic value gives 5.2x pricing power. Exceptional micro-influencer conversion rates on Instagram.',
    mrp: 799,
    cogs: 145,
    shippingAndAds: 194,
    netProfit: 460,
    marginPercent: 76,
    moqUnits: 1000,
    topSuppliers: [
      { name: 'Solan Cosmeceuticals', location: 'Solan, Himachal', moq: '500 pcs MOQ', cert: 'Eco-Cert' },
      { name: 'Arya Botanics Lab', location: 'Bengaluru, Karnataka', moq: '1,000 pcs MOQ', cert: 'GMP Certified' },
    ],
    topCreators: [
      { name: 'Meera Beauty', handle: '@meera_glow', followers: '410K', engagement: '6.9%' },
      { name: 'Dr. Tanya Skin', handle: '@drtanya_derm', followers: '190K', engagement: '8.4%' },
    ],
  },
  dropship: {
    id: 'dropship',
    name: 'Generic Phone Case / Cheap Gadget',
    category: 'Electronics Accessories',
    badge: '📱 Phone Cases',
    verdictType: 'RISK',
    verdictLabel: 'HIGH RISK — DO NOT LAUNCH',
    verdictScore: 32,
    headlineVerdict: 'Oversaturated Market & Ad Costs Higher Than Profit',
    explanation: 'Meta & Google ad costs for generic phone cases exceed selling prices. High return rates (28%+) will wipe out your bank balance.',
    mrp: 399,
    cogs: 160,
    shippingAndAds: 310,
    netProfit: -71,
    marginPercent: 18,
    moqUnits: 2000,
    topSuppliers: [
      { name: 'Shenzhen Importers Hub', location: 'New Delhi', moq: '2,000 units', cert: 'No Audited Warranty' },
    ],
    topCreators: [
      { name: 'Generic Tech', handle: '@techdeals', followers: '50K', engagement: '1.2%' },
    ],
  },
  kombucha: {
    id: 'kombucha',
    name: 'Craft Fermented Kombucha Drink',
    category: 'Beverages',
    badge: '🍹 Kombucha',
    verdictType: 'CAUTION',
    verdictLabel: 'PROCEED WITH CAUTION',
    verdictScore: 65,
    headlineVerdict: 'Good Demand But Difficult Cold-Chain Logistics',
    explanation: 'Customers love the taste, but nationwide shipping requires refrigerated cold-chain transit. High bottle breakage rates in courier.',
    mrp: 180,
    cogs: 62,
    shippingAndAds: 105,
    netProfit: 13,
    marginPercent: 42,
    moqUnits: 1000,
    topSuppliers: [
      { name: 'FermentLab India', location: 'Bengaluru, Karnataka', moq: '1,000 btls', cert: 'FSSAI' },
    ],
    topCreators: [
      { name: 'Kavya GutHealth', handle: '@gutwellness', followers: '95K', engagement: '4.2%' },
    ],
  },
};

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenValidate,
}) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [customInput, setCustomInput] = useState('');
  const [selectedProductKey, setSelectedProductKey] = useState<string>('chocolate');
  const [sellingPrice, setSellingPrice] = useState<number>(299);
  const [isTesting, setIsTesting] = useState(false);

  const product = PRESET_PRODUCTS[selectedProductKey] || PRESET_PRODUCTS.chocolate;

  const handleSelectPreset = (key: string) => {
    setSelectedProductKey(key);
    const p = PRESET_PRODUCTS[key];
    if (p) {
      setSellingPrice(p.mrp);
    }
  };

  const handleRunQuickTest = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      // If user typed a risky term or custom term
      const lower = customInput.toLowerCase();
      if (lower.includes('case') || lower.includes('cheap') || lower.includes('drop') || lower.includes('watch')) {
        handleSelectPreset('dropship');
      } else if (lower.includes('protein') || lower.includes('supplement') || lower.includes('creatine')) {
        handleSelectPreset('supplements');
      } else if (lower.includes('serum') || lower.includes('cream') || lower.includes('skin') || lower.includes('glow')) {
        handleSelectPreset('skincare');
      } else if (lower.includes('kombucha') || lower.includes('drink') || lower.includes('juice') || lower.includes('tea')) {
        handleSelectPreset('kombucha');
      } else {
        handleSelectPreset('chocolate');
      }
    }, 400);
  };

  // Dynamic profit calculation based on slider
  const cogs = product.cogs;
  const shippingAndAds = Math.round(sellingPrice * 0.32);
  const netProfit = sellingPrice - cogs - shippingAndAds;
  const marginPercent = Math.round(((sellingPrice - cogs) / sellingPrice) * 100);

  return (
    <section id="hero-section" className="space-y-4">
      {/* 1. Header Banner: Simple & Welcoming */}
      <div className="p-4 sm:p-5 rounded-2xl glass-panel border border-white/[0.08] relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] text-emerald-400 font-semibold tracking-wide">
            <Sparkles className="w-3 h-3" />
            <span>SIMPLE 3-STEP PRODUCT LAUNCH GUIDE</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Will Your D2C Product Make Money?
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Test any product idea in seconds. We check customer demand, calculate your exact profit margins, and connect you with certified factories.
          </p>
        </div>

        {/* 1-Click New Analysis button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => (onOpenValidate ? onOpenValidate() : navigate('/new-analysis'))}
            className="btn-primary-gradient px-4 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center gap-2 shadow-lg shadow-indigo-500/30 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Start New Analysis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. THE GUIDED 3-STEP WIZARD (Front & Center) */}
      <div className="rounded-3xl glass-panel border border-white/[0.1] shadow-2xl overflow-hidden">
        {/* Step Indicator Tabs */}
        <div className="grid grid-cols-3 border-b border-white/[0.08] bg-black/30">
          {/* Step 1 Tab */}
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`p-3 sm:p-4 flex items-center justify-center gap-2.5 text-xs font-bold transition-all border-r border-white/[0.06] cursor-pointer ${
              currentStep === 1
                ? 'bg-indigo-600/20 text-white border-b-2 border-indigo-500'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === 1 ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-300'
              }`}
            >
              1
            </div>
            <span className="hidden sm:inline">Step 1:</span>
            <span>Test Your Idea</span>
          </button>

          {/* Step 2 Tab */}
          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className={`p-3 sm:p-4 flex items-center justify-center gap-2.5 text-xs font-bold transition-all border-r border-white/[0.06] cursor-pointer ${
              currentStep === 2
                ? 'bg-indigo-600/20 text-white border-b-2 border-indigo-500'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === 2 ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-300'
              }`}
            >
              2
            </div>
            <span className="hidden sm:inline">Step 2:</span>
            <span>Check Profit</span>
          </button>

          {/* Step 3 Tab */}
          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            className={`p-3 sm:p-4 flex items-center justify-center gap-2.5 text-xs font-bold transition-all cursor-pointer ${
              currentStep === 3
                ? 'bg-indigo-600/20 text-white border-b-2 border-indigo-500'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === 3 ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-300'
              }`}
            >
              3
            </div>
            <span className="hidden sm:inline">Step 3:</span>
            <span>Find Factories</span>
          </button>
        </div>

        {/* WIZARD CONTENT AREA */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* ================= STEP 1: TEST YOUR PRODUCT IDEA ================= */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Question & Search */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white">
                      What product do you want to launch?
                    </h2>
                    <p className="text-xs text-slate-400">
                      Type your product name, or click any popular product to test its viability:
                    </p>
                  </div>
                </div>

                <form onSubmit={handleRunQuickTest} className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-indigo-400 absolute inset-y-0 my-auto left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="e.g. Artisanal 70% Dark Chocolate, Clean Plant Protein, Glow Serum..."
                      className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/[0.12] focus:border-indigo-500 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isTesting}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl btn-primary-gradient text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-lg shadow-indigo-600/30"
                  >
                    {isTesting ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin text-cyan-300" />
                        <span>Checking Market Data...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-amber-300" />
                        <span>Quick Test My Idea</span>
                      </>
                    )}
                  </button>
                </form>

                {/* 1-Click Preset Chips */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 text-xs">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                    Popular:
                  </span>
                  {[
                    { key: 'chocolate', label: '🍫 70% Dark Chocolate' },
                    { key: 'supplements', label: '🌿 Clean Plant Protein' },
                    { key: 'skincare', label: '✨ Barrier Glow Serum' },
                    { key: 'kombucha', label: '🍹 Craft Kombucha' },
                    { key: 'dropship', label: '📱 Generic Phone Case' },
                  ].map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => handleSelectPreset(p.key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer border ${
                        selectedProductKey === p.key
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                          : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] border-white/[0.08]'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* INSTANT CLEAR VERDICT CARD */}
              <div
                className={`p-5 sm:p-6 rounded-2xl border transition-all ${
                  product.verdictType === 'GOOD'
                    ? 'bg-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-950/30'
                    : product.verdictType === 'CAUTION'
                    ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-950/30'
                    : 'bg-rose-950/20 border-rose-500/40 shadow-lg shadow-rose-950/30'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        product.verdictType === 'GOOD'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : product.verdictType === 'CAUTION'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {product.verdictType === 'GOOD' ? (
                        <CheckCircle2 className="w-7 h-7" />
                      ) : product.verdictType === 'CAUTION' ? (
                        <AlertTriangle className="w-7 h-7" />
                      ) : (
                        <XCircle className="w-7 h-7" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full tracking-wide ${
                            product.verdictType === 'GOOD'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : product.verdictType === 'CAUTION'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {product.verdictLabel}
                        </span>
                        <span className="text-xs text-slate-400 font-mono-nums">
                          Viability Score: <strong>{product.verdictScore}/100</strong>
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
                        {product.headlineVerdict}
                      </h3>
                    </div>
                  </div>

                  {/* Next Step Button */}
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="btn-primary-gradient px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-md"
                  >
                    <span>Next: Check Profit Margins</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Explanation in plain English */}
                <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="md:col-span-2 space-y-1">
                    <span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider">
                      Why this verdict:
                    </span>
                    <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
                      {product.explanation}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                        Estimated Take-Home
                      </span>
                      <span
                        className={`text-xl font-extrabold font-mono-nums ${
                          product.netProfit > 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {product.netProfit > 0 ? `₹${product.netProfit}` : `-₹${Math.abs(product.netProfit)}`}
                        <span className="text-xs font-normal text-slate-400"> / unit</span>
                      </span>
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-lg ${
                        product.marginPercent > 50
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : product.marginPercent > 30
                          ? 'bg-amber-500/15 text-amber-300'
                          : 'bg-rose-500/15 text-rose-300'
                      }`}
                    >
                      {product.marginPercent}% Margin
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2: CHECK YOUR PROFIT MARGINS ================= */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    Step 2: How much profit will you make?
                  </h2>
                  <p className="text-xs text-slate-400">
                    Slide your target selling price to see how your clean take-home profit changes in real-time.
                  </p>
                </div>
                <div className="text-xs text-indigo-400 font-semibold">
                  Testing: {product.name}
                </div>
              </div>

              {/* Price Slider Card */}
              <div className="p-5 sm:p-6 rounded-2xl glass-panel-subtle border border-white/[0.08] space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Your Selling Price (MRP):</span>
                    <div className="text-3xl font-extrabold text-white font-mono-nums mt-0.5">
                      ₹{sellingPrice}
                    </div>
                  </div>

                  {/* Range Slider */}
                  <div className="flex-1 max-w-md space-y-1.5">
                    <input
                      type="range"
                      min={Math.round(cogs * 1.5)}
                      max={Math.round(cogs * 6)}
                      step={10}
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(Number(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer h-2 bg-white/10 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Low: ₹{Math.round(cogs * 1.5)}</span>
                      <span>Target: ₹{sellingPrice}</span>
                      <span>Premium: ₹{Math.round(cogs * 6)}</span>
                    </div>
                  </div>
                </div>

                {/* 3-Column Cost vs Profit Waterfall */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {/* Cost 1 */}
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06]">
                    <span className="text-[11px] text-slate-400 block font-medium">1. Factory Cost (COGS)</span>
                    <span className="text-xl font-bold text-slate-200 font-mono-nums mt-1 block">
                      ₹{cogs}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Ingredients, pouch & packing
                    </span>
                  </div>

                  {/* Cost 2 */}
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06]">
                    <span className="text-[11px] text-slate-400 block font-medium">2. Shipping & Ads (CAC)</span>
                    <span className="text-xl font-bold text-slate-200 font-mono-nums mt-1 block">
                      ₹{shippingAndAds}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Courier + Meta/Instagram ads
                    </span>
                  </div>

                  {/* Clean Profit */}
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <span className="text-[11px] text-emerald-300 block font-bold uppercase tracking-wider">
                      3. Clean Profit in Your Pocket
                    </span>
                    <span
                      className={`text-2xl font-extrabold font-mono-nums mt-1 block ${
                        netProfit > 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {netProfit > 0 ? `+₹${netProfit}` : `-₹${Math.abs(netProfit)}`}
                    </span>
                    <span className="text-[10px] text-emerald-300 font-semibold mt-0.5 block">
                      {marginPercent}% Gross Profit Margin
                    </span>
                  </div>
                </div>

                {/* Visual Ratio Bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-[11px] font-medium text-slate-400">
                    <span>Cost Breakdown Ratio:</span>
                    <span>100% of Selling Price</span>
                  </div>
                  <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${Math.round((cogs / sellingPrice) * 100)}%` }}
                      className="bg-slate-500 h-full"
                      title="Factory Cost"
                    />
                    <div
                      style={{ width: `${Math.round((shippingAndAds / sellingPrice) * 100)}%` }}
                      className="bg-indigo-500 h-full"
                      title="Shipping & Marketing"
                    />
                    <div
                      style={{ width: `${Math.max(0, Math.round((netProfit / sellingPrice) * 100))}%` }}
                      className="bg-emerald-500 h-full"
                      title="Clean Profit"
                    />
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-0.5">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-500" /> Factory ({Math.round((cogs / sellingPrice) * 100)}%)</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Ads & Shipping ({Math.round((shippingAndAds / sellingPrice) * 100)}%)</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Clean Profit ({Math.max(0, Math.round((netProfit / sellingPrice) * 100))}%)</span>
                  </div>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-white/[0.05] border border-white/[0.08] cursor-pointer"
                >
                  ← Back to Step 1
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="btn-primary-gradient px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <span>Next: Connect With Verified Factories</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: CONNECT FACTORIES & CREATORS ================= */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    Step 3: Who will make it and who will sell it?
                  </h2>
                  <p className="text-xs text-slate-400">
                    Here are verified contract manufacturers and micro-influencers matched to your product.
                  </p>
                </div>
                <div className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  Ready to Produce • Low MOQs
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Factories Column */}
                <div className="p-4 sm:p-5 rounded-2xl glass-panel-subtle border border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <Factory className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Verified Factories ({product.topSuppliers.length})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/manufacturers')}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      View All 42+ Factories →
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {product.topSuppliers.map((sup) => (
                      <div
                        key={sup.name}
                        className="p-3 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                            <span>{sup.name}</span>
                            <span className="text-[9px] text-emerald-400 font-normal">● Audited</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{sup.location}</div>
                          <div className="mt-1 flex items-center gap-2 text-[10px]">
                            <span className="text-cyan-300 font-mono font-medium">{sup.moq}</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-slate-300">{sup.cert}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => navigate('/manufacturers')}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold shrink-0 cursor-pointer shadow-xs"
                        >
                          Contact Factory
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Creators Column */}
                <div className="p-4 sm:p-5 rounded-2xl glass-panel-subtle border border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Matched Micro-Creators ({product.topCreators.length})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/influencers')}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      View All Creators →
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {product.topCreators.map((cr) => (
                      <div
                        key={cr.handle}
                        className="p-3 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{cr.name}</div>
                          <div className="text-[10px] text-purple-300 font-mono mt-0.5">{cr.handle}</div>
                          <div className="mt-1 flex items-center gap-2 text-[10px]">
                            <span className="text-slate-300">{cr.followers} followers</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-emerald-400 font-bold">{cr.engagement} Engagement</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => navigate('/influencers')}
                          className="px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-white text-[11px] font-semibold shrink-0 cursor-pointer"
                        >
                          View Profile
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Completion & Next Actions */}
              <div className="p-4 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold text-white">Validation Completed! </span>
                    <span className="text-slate-300">
                      Your product passed demand, unit economics, and supplier checks.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep(1);
                      setCustomInput('');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    Test Another Idea ↺
                  </button>
                  <button
                    type="button"
                    onClick={() => (onOpenValidate ? onOpenValidate() : navigate('/new-analysis'))}
                    className="btn-primary-gradient px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-md cursor-pointer"
                  >
                    Save to My Projects →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
