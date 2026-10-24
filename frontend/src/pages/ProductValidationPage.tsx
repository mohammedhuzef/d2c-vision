import React, { useState } from 'react';
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
} from 'lucide-react';
import { getStoredProjects, saveStoredProjects, Project } from '../utils/storage';

export const ProductValidationPage: React.FC = () => {
  const navigate = useNavigate();

  // Form State
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
  const grossMarginPct = sellingPrice > 0 ? Math.round(((sellingPrice - mfgCost) / sellingPrice) * 100) : 0;

  // Run or refresh analysis
  const handleRunValidation = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    setHasReport(false);
    setTimeout(() => {
      setIsAnalyzing(false);
      setHasReport(true);
      window.scrollTo({ top: 500, behavior: 'smooth' });
    }, 1000);
  };

  // Save to My Projects in localStorage
  const handleSaveToProjects = () => {
    const existing = getStoredProjects();
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: productName,
      category,
      description,
      targetAudience,
      status: 'In Progress',
      viabilityScore: 86,
      sellingPrice,
      mfgCost,
      margin: grossMarginPct,
      image,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    saveStoredProjects([newProject, ...existing]);
    setSavedSuccess(true);
    setTimeout(() => {
      navigate('/projects');
    }, 1200);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Multi-Stage AI Gatekeeper</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Product Validation Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Submit your product concept to generate an instant multi-dimensional feasibility report covering consumer demand, competitive density, margin viability, and go-to-market risks.
            </p>
          </div>
        </div>
      </div>

      {/* Main Validation Form & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Column (7 cols) */}
        <div className="lg:col-span-7">
          <form onSubmit={handleRunValidation} className="glass-panel rounded-2xl p-6 border border-white/[0.08] space-y-4">
            <h2 className="text-sm font-bold text-white pb-3 border-b border-white/[0.06] flex items-center justify-between">
              <span>Product Concept Specifications</span>
              <span className="text-[11px] text-slate-400 font-normal">All fields used in validation model</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Product Name */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-200 block mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Plant-based High Protein Crisps"
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.1] focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">Product Category</label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    const match = presetImages.find((p) => p.label === e.target.value);
                    if (match) setImage(match.path);
                  }}
                  className="w-full px-3 py-2 bg-[#090D18] border border-white/[0.1] focus:border-indigo-500 rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value="Beverages">Beverages</option>
                  <option value="Chocolates">Chocolates</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Supplements">Supplements & Nutrition</option>
                  <option value="Personal Care">Personal Care & Skincare</option>
                  <option value="Home & Living">Home & Living</option>
                  <option value="Stationery">Stationery</option>
                </select>
              </div>

              {/* Target Location */}
              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">Primary Launch Market</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-[#090D18] border border-white/[0.1] focus:border-indigo-500 rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value="India (Tier 1 Metros)">India (Tier 1 Metros)</option>
                  <option value="India (Pan-India D2C)">India (Pan-India D2C)</option>
                  <option value="United States (Amazon + D2C)">United States (Amazon + D2C)</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="United Arab Emirates (Dubai)">United Arab Emirates (Dubai)</option>
                </select>
              </div>

              {/* Selling Price */}
              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">Target Selling Price (₹)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.1] focus:border-indigo-500 rounded-xl text-xs text-white font-mono-nums focus:outline-none"
                />
              </div>

              {/* Manufacturing Cost */}
              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">Estimated Unit Mfg Cost (₹)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={mfgCost}
                  onChange={(e) => setMfgCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.1] focus:border-indigo-500 rounded-xl text-xs text-white font-mono-nums focus:outline-none"
                />
              </div>

              {/* Marketing Budget */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-200 block mb-1">Initial Launch Marketing Budget (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={marketingBudget}
                  onChange={(e) => setMarketingBudget(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.1] focus:border-indigo-500 rounded-xl text-xs text-white font-mono-nums focus:outline-none"
                />
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-200 block mb-1">Product Concept & Unique Value Prop</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.1] focus:border-indigo-500 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              {/* Target Audience */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-200 block mb-1">Target Customer Profile</label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.1] focus:border-indigo-500 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              {/* Image Selector */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-200 block mb-1.5">Product Visual Asset</label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {presetImages.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setImage(p.path)}
                      className={`relative w-14 h-14 rounded-xl overflow-hidden border shrink-0 transition-all ${
                        image === p.path ? 'border-indigo-400 ring-2 ring-indigo-500/50 scale-105' : 'border-white/[0.1] opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={p.path} alt={p.label} className="w-full h-full object-cover" />
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
                className="w-full btn-primary-gradient py-3 rounded-xl text-xs sm:text-sm font-bold text-white flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Analyzing Consumer Signals & Competitors...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Validate Product & Generate Feasibility Report</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel rounded-2xl p-5 border border-white/[0.08]">
            <h3 className="text-xs font-bold text-white mb-3">Live Concept Card</h3>
            <div className="relative aspect-video rounded-xl overflow-hidden border border-white/[0.1] mb-3">
              <img src={image} alt={productName} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs">
                <span className="font-bold text-white">{category}</span>
                <span className="text-emerald-400 font-bold font-mono-nums">₹{sellingPrice}</span>
              </div>
            </div>

            <h4 className="text-sm font-bold text-white">{productName}</h4>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{description}</p>

            <div className="mt-4 pt-3 border-t border-white/[0.06] grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-white/[0.02]">
                <span className="text-[10px] text-slate-400 block">Gross Margin</span>
                <span className="text-sm font-extrabold text-emerald-400 font-mono-nums">{grossMarginPct}%</span>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.02]">
                <span className="text-[10px] text-slate-400 block">Market</span>
                <span className="text-[11px] font-bold text-white truncate block">{location.split(' ')[0]}</span>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.02]">
                <span className="text-[10px] text-slate-400 block">Launch Budget</span>
                <span className="text-xs font-extrabold text-white font-mono-nums">₹{(marketingBudget / 1000).toFixed(0)}k</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generated Feasibility Report Section */}
      {hasReport && (
        <div className="space-y-6 pt-4 border-t border-white/[0.08] animate-in slide-in-from-bottom-4 duration-500">
          {/* Labelled Demo Banner */}
          <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                <strong>AI Validation Report:</strong> Synthesized from category search volume, Amazon BSR velocity, and contract manufacturing benchmarks.
              </span>
            </div>
            <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30">
              Demo Mode Active
            </span>
          </div>

          {/* Top Score Banner */}
          <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 border-2 border-emerald-500/40 flex flex-col items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.25)]">
                <span className="text-2xl font-black font-mono-nums leading-none">86</span>
                <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-400/80 mt-1">Viability</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">High Commercial Feasibility</h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-400">
                    Grade A
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  {productName} demonstrates strong unit economics ({grossMarginPct}% gross margin), surging search interest (+42% YoY), and high repeat potential in metropolitan markets.
                </p>
              </div>
            </div>

            {/* Save to My Projects CTA */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveToProjects}
                disabled={savedSuccess}
                className="btn-primary-gradient px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-lg cursor-pointer"
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
            <div className="glass-panel rounded-2xl p-5 border border-white/[0.08]">
              <div className="flex items-center gap-2 text-xs font-bold text-white mb-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>Demand & Momentum</span>
              </div>
              <div className="text-xl font-extrabold text-white font-mono-nums mb-1">+48% Growth</div>
              <p className="text-xs text-slate-300">
                Monthly consumer search query volume reached 185,000 in Tier-1 metros. High seasonal lift projected for Q2-Q3.
              </p>
              <div className="mt-3 pt-2 border-t border-white/[0.06] text-[10px] text-cyan-300 font-medium">
                Search Intent: High Commercial Purchase
              </div>
            </div>

            {/* 2. Competition & Saturation */}
            <div className="glass-panel rounded-2xl p-5 border border-white/[0.08]">
              <div className="flex items-center gap-2 text-xs font-bold text-white mb-2">
                <Target className="w-4 h-4 text-purple-400" />
                <span>Competitive Density</span>
              </div>
              <div className="text-xl font-extrabold text-white font-mono-nums mb-1">Moderate (3 Majors)</div>
              <p className="text-xs text-slate-300">
                Incumbents focus on sugary sodas. Premium clean-label functional formulations are underrepresented at the ₹149 price point.
              </p>
              <div className="mt-3 pt-2 border-t border-white/[0.06] text-[10px] text-purple-300 font-medium">
                Whitespace: Organic Functional Wellness
              </div>
            </div>

            {/* 3. Margin & Economics */}
            <div className="glass-panel rounded-2xl p-5 border border-white/[0.08]">
              <div className="flex items-center gap-2 text-xs font-bold text-white mb-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Unit Economics</span>
              </div>
              <div className="text-xl font-extrabold text-emerald-400 font-mono-nums mb-1">
                {grossMarginPct}% Gross Margin
              </div>
              <p className="text-xs text-slate-300">
                Unit contribution allows up to ₹45 CAC while maintaining a healthy 30%+ net contribution margin per bottle or multi-pack.
              </p>
              <div className="mt-3 pt-2 border-t border-white/[0.06] text-[10px] text-emerald-300 font-medium">
                Target Pack: 6-Can Starter Bundle (₹899)
              </div>
            </div>

            {/* 4. Supply Chain Feasibility */}
            <div className="glass-panel rounded-2xl p-5 border border-white/[0.08]">
              <div className="flex items-center gap-2 text-xs font-bold text-white mb-2">
                <Building className="w-4 h-4 text-amber-400" />
                <span>Manufacturer Readiness</span>
              </div>
              <div className="text-xl font-extrabold text-white font-mono-nums mb-1">8 Verified Co-packers</div>
              <p className="text-xs text-slate-300">
                FSSAI-certified aseptic beverage copackers in Bengaluru and Pune ready with 1,000-liter pilot batch capacities.
              </p>
              <div className="mt-3 pt-2 border-t border-white/[0.06] text-[10px] text-amber-300 font-medium">
                Lead Time: 4-6 Weeks for Pilot
              </div>
            </div>
          </div>

          {/* Risks & Recommendations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Key Risks */}
            <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Identified Commercial Risks</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                  <span>
                    <strong>Cold-Chain & Ambient Stability:</strong> Ensure natural hibiscus antioxidants remain shelf-stable for 6 months without artificial sodium benzoate.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                  <span>
                    <strong>D2C Shipping Liquid Weight:</strong> High single-can shipping friction. Strongly enforce a 6-pack minimum order threshold on your brand website.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                  <span>
                    <strong>Taste-Profile Educational Curve:</strong> Tart hibiscus flavor profile requires clear flavor messaging (e.g., "Crisp Berry Spritz").
                  </span>
                </li>
              </ul>
            </div>

            {/* Strategic Recommendations */}
            <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Actionable Launch Strategy</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>
                    <strong>Hero SKU Positioning:</strong> Launch with "Hibiscus Citrus Rush" and "Berry Ginger Focus" in sleek 250ml slim aluminium cans.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>
                    <strong>Micro-Influencer Gifting:</strong> Seed 50 fitness instructors and tech office wellness lounges across Bengaluru and Mumbai.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>
                    <strong>Quick-Commerce Rollout:</strong> Target Blinkit & Zepto dark stores in high-income postal codes within 60 days of D2C validation.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
