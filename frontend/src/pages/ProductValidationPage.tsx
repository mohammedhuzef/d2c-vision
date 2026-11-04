import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  BookmarkPlus,
  RefreshCw,
  ExternalLink,
  Target,
  DollarSign,
  PieChart,
  Layers,
  Building,
  Info,
  MapPin,
  Tag,
  FileCheck,
  Users,
} from 'lucide-react';
import { getStoredProjects, saveStoredProjects, Project } from '../utils/storage';

export const ProductValidationPage: React.FC = () => {
  const navigate = useNavigate();

  // Form State with initial realistic defaults
  const [productName, setProductName] = useState('Cold Brew Hibiscus Energy Tonic');
  const [category, setCategory] = useState('Beverages');
  const [description, setDescription] = useState(
    'Naturally caffeinated sparkling botanical beverage with organic hibiscus, green tea extract, and zero refined sugar.'
  );
  const [targetAudience, setTargetAudience] = useState(
    'Urban professionals aged 22-35 looking for clean, jitter-free afternoon focus and hydration.'
  );
  const [sellingPrice, setSellingPrice] = useState<number>(149);
  const [mfgCost, setMfgCost] = useState<number>(38);
  const [marketingBudget, setMarketingBudget] = useState<number>(50000);
  const [location, setLocation] = useState('India (Tier 1 Metros)');
  const [image, setImage] = useState('/images/cat-beverages.jpg');

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasReport, setHasReport] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Preset images
  const presetImages = [
    { label: 'Beverages', path: '/images/cat-beverages.jpg' },
    { label: 'Chocolates', path: '/images/cat-chocolates.jpg' },
    { label: 'Snacks', path: '/images/cat-snacks.jpg' },
    { label: 'Supplements', path: '/images/cat-supplements.jpg' },
    { label: 'Personal Care', path: '/images/cat-personal-care.jpg' },
    { label: 'Stationery', path: '/images/cat-stationery.jpg' },
  ];

  // Calculated margin
  const grossMarginPct = useMemo(() => {
    if (sellingPrice <= 0) return 0;
    return Math.round(((sellingPrice - mfgCost) / sellingPrice) * 100);
  }, [sellingPrice, mfgCost]);

  // Dynamically computed Viability Score based on inputs
  const viabilityScore = useMemo(() => {
    let score = 50;

    // Margin factor (up to +25)
    if (grossMarginPct >= 65) score += 25;
    else if (grossMarginPct >= 50) score += 18;
    else if (grossMarginPct >= 35) score += 10;
    else if (grossMarginPct < 20) score -= 20;

    // Marketing budget sufficiency (up to +15)
    if (marketingBudget >= 100000) score += 15;
    else if (marketingBudget >= 50000) score += 10;
    else if (marketingBudget >= 20000) score += 5;
    else score -= 5;

    // Description & audience completeness
    if (description.length > 40) score += 5;
    if (targetAudience.length > 25) score += 5;

    return Math.min(96, Math.max(28, score));
  }, [grossMarginPct, marketingBudget, description, targetAudience]);

  // Viability Grade label
  const viabilityGrade = useMemo(() => {
    if (viabilityScore >= 85) return { grade: 'Grade A+', text: 'High Commercial Viability', color: '#047857', bg: '#ECFDF5' };
    if (viabilityScore >= 70) return { grade: 'Grade A', text: 'Viable - Launch Candidate', color: '#0284C7', bg: '#F0F9FF' };
    if (viabilityScore >= 55) return { grade: 'Grade B', text: 'Moderate - Needs Optimization', color: '#D97706', bg: '#FFFBEB' };
    return { grade: 'Grade C', text: 'High Risk - Low Margins', color: '#E11D48', bg: '#FFF1F2' };
  }, [viabilityScore]);

  // Dynamic insights per category
  const categoryIntel = useMemo(() => {
    switch (category) {
      case 'Beverages':
        return {
          demand: '+48% YoY',
          searchVol: '142,000 / mo',
          competition: 'Medium-High',
          compText: 'Incumbents focus on sugary sodas; sparkling functional energy has whitespace.',
          copackers: '18 Verified Bottlers in MH, KA & DL with minimum pilot MOQ of 500 units.',
          risks: ['Liquid shipping weight increases logistics costs', 'Requires FSSAI beverage license'],
          recommendations: ['Sell in 4-pack or 12-pack bundles to absorb logistics', 'Use aluminium cans for 100% recyclability branding'],
        };
      case 'Chocolates':
        return {
          demand: '+82% YoY',
          searchVol: '280,000 / mo',
          competition: 'Medium',
          compText: 'Mass market is milk chocolate; artisanal dark cocoa with clean sugar is booming.',
          copackers: '12 Verified artisanal chocolatiers in South India with low pilot MOQs.',
          risks: ['Cold-chain shipping required during summer months (₹45/unit insulated liner)', 'Shelf life sensitivity'],
          recommendations: ['Target gifting seasons (Diwali, Valentine, New Year)', 'Offer luxury multi-origin variety boxes'],
        };
      case 'Snacks':
        return {
          demand: '+65% YoY',
          searchVol: '310,000 / mo',
          competition: 'High',
          compText: 'Roasted makhana and vacuum-fried veggies replace fried potato crisps.',
          copackers: '34 Verified OEM snack processors across Bihar, MP & Gujarat.',
          risks: ['High volumetric weight requires nitrogen flushing', 'Low single-unit price requires bundle economics'],
          recommendations: ['Bundle with dip pairings or office snack boxes', 'Partner with quick-commerce platforms (Blinkit/Zepto)'],
        };
      default:
        return {
          demand: '+40% YoY',
          searchVol: '190,000 / mo',
          competition: 'Moderate',
          compText: 'Growing consumer shift towards premium clean-label formulations.',
          copackers: '25+ Verified co-manufacturers with GMP / ISO certification ready.',
          risks: ['Customer acquisition cost inflation on Meta / Google', 'Reorder frequency takes 60 days to stabilize'],
          recommendations: ['Launch pre-order waitlist landing page before full production run', 'Target 60%+ gross margin to survive initial CAC learning phase'],
        };
    }
  }, [category]);

  // Save to My Projects handler
  const handleSaveToProjects = () => {
    const existing = getStoredProjects();
    const newProj: Project = {
      id: `proj-${Date.now()}`,
      name: productName,
      category,
      status: 'In Progress',
      viabilityScore,
      sellingPrice,
      mfgCost,
      margin: grossMarginPct,
      image,
      description,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    saveStoredProjects([newProj, ...existing]);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleRunValidation = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setHasReport(true);
    }, 1000);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="rounded-2xl p-6 bg-white border border-slate-200/90 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Multi-Stage AI Gatekeeper</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Product Validation Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Submit your product concept specifications to generate an instant feasibility audit analyzing customer demand, competitor whitespace, margin viability, and go-to-market risks.
            </p>
          </div>
        </div>
      </div>

      {/* Main Validation Form & Live Concept Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Column (7 cols) */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleRunValidation}
            className="rounded-2xl p-6 bg-white border border-slate-200/90 shadow-xs space-y-4"
          >
            <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Product Concept Specifications</span>
              </span>
              <span className="text-[11px] text-slate-500 font-normal">9 parameters for viability engine</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. Product Name */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  1. Product Name <span className="text-emerald-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Organic Adaptogenic Cocoa Bar"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none transition-all"
                />
              </div>

              {/* 2. Category */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  2. Product Category <span className="text-emerald-600">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    const newCat = e.target.value;
                    setCategory(newCat);
                    const match = presetImages.find((p) => p.label === newCat);
                    if (match) setImage(match.path);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-xl text-xs text-slate-900 outline-none cursor-pointer"
                >
                  <option value="Beverages">Beverages & Functional Tonics</option>
                  <option value="Chocolates">Chocolates & Confectionery</option>
                  <option value="Snacks">Snacks & Savories</option>
                  <option value="Supplements">Supplements & Nutrition</option>
                  <option value="Personal Care">Personal Care & Skincare</option>
                  <option value="Stationery">Stationery & Lifestyle</option>
                </select>
              </div>

              {/* 3. Location */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  3. Target Launch Market <span className="text-emerald-600">*</span>
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-xl text-xs text-slate-900 outline-none cursor-pointer"
                >
                  <option value="India (Tier 1 Metros)">India (Tier 1 Metros)</option>
                  <option value="India (Pan-India D2C)">India (Pan-India D2C)</option>
                  <option value="United States (Amazon + D2C)">United States (Amazon + D2C)</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="United Arab Emirates (Dubai)">United Arab Emirates (Dubai)</option>
                  <option value="Singapore & SE Asia">Singapore & SE Asia</option>
                </select>
              </div>

              {/* 4. Selling Price */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  4. Target Selling Price (₹) <span className="text-emerald-600">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 rounded-xl text-xs text-slate-900 font-mono-nums outline-none"
                />
              </div>

              {/* 5. Manufacturing Cost */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  5. Estimated Unit Mfg Cost (₹) <span className="text-emerald-600">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={mfgCost}
                  onChange={(e) => setMfgCost(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 rounded-xl text-xs text-slate-900 font-mono-nums outline-none"
                />
              </div>

              {/* 6. Marketing Budget */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  6. Initial Launch Marketing Budget (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={marketingBudget}
                  onChange={(e) => setMarketingBudget(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 rounded-xl text-xs text-slate-900 font-mono-nums outline-none"
                />
              </div>

              {/* 7. Description & UVP */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  7. Product Concept & Unique Value Proposition
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail ingredients, packaging, benefits..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none"
                />
              </div>

              {/* 8. Target Audience */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  8. Target Consumer Demographic & ICP
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g. Gym goers, busy mothers, vegan enthusiasts"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none"
                />
              </div>

              {/* 9. Image Selection */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  9. Packaging & Hero Image
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {presetImages.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setImage(p.path)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        image === p.path ? 'border-emerald-600 ring-2 ring-emerald-500/20' : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={p.path} alt={p.label} className="w-full h-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-slate-900/80 text-[9px] text-white text-center py-0.5 truncate px-1 font-medium">
                        {p.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isAnalyzing}
                className="w-full btn-primary-gradient py-3 rounded-xl text-xs sm:text-sm font-bold text-white flex items-center justify-center gap-2 shadow-xs cursor-pointer hover:bg-emerald-700 transition-all active:scale-[0.99]"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Running AI Feasibility Engine & Sourcing Models...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                    <span>Validate Product & Generate Feasibility Report</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Live Concept Preview Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl p-5 bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Live Concept Preview</h3>
              <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-semibold">
                Dynamic Preview
              </span>
            </div>

            <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 mb-3 bg-slate-100">
              <img src={image} alt={productName} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />
              <div className="absolute top-2.5 left-2.5">
                <span className="text-[10px] font-bold text-white bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20">
                  {category}
                </span>
              </div>
              <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs">
                <span className="text-slate-300 text-[11px] truncate mr-2">{location.split(' ')[0]}</span>
                <span className="text-emerald-400 font-black text-base font-mono-nums">₹{sellingPrice}</span>
              </div>
            </div>

            <h4 className="text-sm font-bold text-slate-900">{productName}</h4>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{description}</p>

            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] text-slate-500 block font-medium">Gross Margin</span>
                <span
                  className={`text-sm font-black font-mono-nums ${
                    grossMarginPct >= 50 ? 'text-emerald-700' : grossMarginPct >= 30 ? 'text-amber-600' : 'text-rose-600'
                  }`}
                >
                  {grossMarginPct}%
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] text-slate-500 block font-medium">Unit COGS</span>
                <span className="text-xs font-bold text-slate-800 font-mono-nums">₹{mfgCost}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] text-slate-500 block font-medium">Marketing Spend</span>
                <span className="text-xs font-bold text-slate-800 font-mono-nums">
                  ₹{(marketingBudget / 1000).toFixed(0)}k
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generated Feasibility Report Section */}
      {hasReport && (
        <div className="space-y-6 pt-4 border-t border-slate-200 animate-in slide-in-from-bottom-2 duration-300">
          {/* Labelled Demo Banner */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>AI Validation Report:</strong> Synthesized from search volume index, competitive density benchmarks, and contract manufacturing parameters.
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-white px-2.5 py-0.5 rounded-full border border-emerald-300 shrink-0 self-start sm:self-auto shadow-2xs">
              Labelled Demo Report
            </span>
          </div>

          {/* Top Score Banner */}
          <div className="rounded-2xl p-6 bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-emerald-50 border-2 border-emerald-300 flex flex-col items-center justify-center text-emerald-700 shadow-xs shrink-0">
                <span className="text-2xl font-black font-mono-nums leading-none">{viabilityScore}</span>
                <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-600 mt-1">Viability</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{viabilityGrade.text}</h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      viabilityScore >= 70
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}
                  >
                    {viabilityGrade.grade}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                  {productName} exhibits strong unit economics ({grossMarginPct}% gross margin), solid commercial demand ({categoryIntel.demand}), and high repeat-purchase index in {location}.
                </p>
              </div>
            </div>

            {/* Save to My Projects CTA */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveToProjects}
                disabled={savedSuccess}
                className="btn-primary-gradient px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-xs cursor-pointer hover:bg-emerald-700 transition-all"
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Saved to My Projects!</span>
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="w-4 h-4" />
                    <span>Save to My Projects</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 4 Detail Report Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Demand Signals */}
            <div className="rounded-2xl p-5 bg-white border border-slate-200/90 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Demand & Momentum</span>
              </div>
              <div className="text-xl font-extrabold text-slate-900 font-mono-nums mb-1">{categoryIntel.demand}</div>
              <p className="text-xs text-slate-500">
                Monthly consumer search query index reached {categoryIntel.searchVol} in {location}.
              </p>
              <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-emerald-700 font-semibold">
                Search Intent: High Commercial Purchase
              </div>
            </div>

            {/* 2. Competition & Saturation */}
            <div className="rounded-2xl p-5 bg-white border border-slate-200/90 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-2">
                <Target className="w-4 h-4 text-slate-800" />
                <span>Competitive Density</span>
              </div>
              <div className="text-xl font-extrabold text-slate-900 font-mono-nums mb-1">{categoryIntel.competition}</div>
              <p className="text-xs text-slate-500">{categoryIntel.compText}</p>
              <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-700 font-semibold">
                Whitespace: Premium Clean-Label
              </div>
            </div>

            {/* 3. Margin & Economics */}
            <div className="rounded-2xl p-5 bg-white border border-slate-200/90 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Unit Margin Viability</span>
              </div>
              <div className="text-xl font-extrabold text-emerald-700 font-mono-nums mb-1">
                {grossMarginPct}% Margin
              </div>
              <p className="text-xs text-slate-500">
                Unit gross contribution of ₹{(sellingPrice - mfgCost).toFixed(0)} comfortably allows up to ₹{Math.round((sellingPrice - mfgCost) * 0.4)} CAC.
              </p>
              <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-emerald-700 font-semibold">
                Target Pack: 3-Unit Starter Bundle (₹{Math.round(sellingPrice * 2.8)})
              </div>
            </div>

            {/* 4. Supply Chain Feasibility */}
            <div className="rounded-2xl p-5 bg-white border border-slate-200/90 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-2">
                <Building className="w-4 h-4 text-slate-800" />
                <span>Contract Co-packers</span>
              </div>
              <div className="text-xl font-extrabold text-slate-900 font-mono-nums mb-1">Verified Suppliers</div>
              <p className="text-xs text-slate-500">{categoryIntel.copackers}</p>
              <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-700 font-semibold">
                Pilot Lead Time: 4-6 Weeks
              </div>
            </div>
          </div>

          {/* Dynamic Risks & Recommendations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Key Risks */}
            <div className="rounded-2xl p-5 bg-white border border-slate-200/90 shadow-xs space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <span>Identified Commercial & Supply Chain Risks</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-600">
                {categoryIntel.risks.map((risk, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Strategic Recommendations */}
            <div className="rounded-2xl p-5 bg-white border border-slate-200/90 shadow-xs space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Actionable Launch & GTM Recommendations</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-600">
                {categoryIntel.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Product-Led Creator Acquisition Callout */}
          <div className="rounded-2xl p-5 bg-emerald-50/60 border border-emerald-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Ready to Acquire Customers? Find Creators for {category}
                </h4>
                <p className="text-xs text-slate-600">
                  Discover verified influencers with high buying intent for {productName} based on your category economics.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const mappedType =
                  category === 'Beverages'
                    ? 'Gourmet Beverages & Tea'
                    : category === 'Chocolates' || category === 'Snacks'
                    ? 'Health Foods & Snacks'
                    : 'All Product Types';
                navigate(`/influencers?productType=${encodeURIComponent(mappedType)}`);
              }}
              className="btn-primary-gradient px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span>Find Creators for this Product</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
