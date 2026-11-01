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

    // Category momentum bonus
    if (category === 'Beverages' || category === 'Snacks') score += 5;
    if (category === 'Personal Care') score += 3;

    return Math.min(96, Math.max(35, score));
  }, [grossMarginPct, marketingBudget, description, targetAudience, category]);

  // Dynamic Grade
  const viabilityGrade = useMemo(() => {
    if (viabilityScore >= 85) return { grade: 'Grade A', text: 'High Commercial Feasibility', color: 'text-[#28D7A0]' };
    if (viabilityScore >= 70) return { grade: 'Grade B', text: 'Strong Market Viability', color: 'text-[#25D9E8]' };
    if (viabilityScore >= 55) return { grade: 'Grade C', text: 'Moderate Viability / CAC Risk', color: 'text-amber-400' };
    return { grade: 'Grade D', text: 'High Economic Risk', color: 'text-[#F43F5E]' };
  }, [viabilityScore]);

  // Dynamic Category Intelligence
  const categoryIntel = useMemo(() => {
    switch (category) {
      case 'Beverages':
        return {
          demand: '+54% YoY Search Growth',
          searchVol: '240,000 queries/mo',
          competition: 'Moderate (3 Majors)',
          compText: 'Legacy players sell high-sugar sodas. Premium clean-label sparkling formulations are under-indexed.',
          copackers: '8 FSSAI-certified aseptic copackers in Pune and Bengaluru.',
          risks: [
            'Cold-chain vs shelf-stable distribution friction for single units.',
            'Liquid shipping weight requires enforcing a multi-pack minimum order value.',
            'Taste-profile educational hurdle with sour botanical notes.',
          ],
          recommendations: [
            'Launch with 2 hero SKUs in sleek 250ml recyclable aluminium cans.',
            'Enforce a 6-can or 12-can discovery sampler to maintain basket size above ₹799.',
            'Seed micro-influencer fitness coaches and boutique wellness gyms.',
          ],
        };
      case 'Chocolates':
        return {
          demand: '+65% YoY Search Growth',
          searchVol: '380,000 queries/mo',
          competition: 'Rising (4 Clean-Label Brands)',
          compText: 'Mass brands use compound fats and palm oil. Single-origin bean-to-bar dark chocolate holds strong pricing power.',
          copackers: '6 temper-controlled craft chocolatiers in Karnataka & Kerala.',
          risks: [
            'Summer temperature melt risk during pan-India courier transit.',
            'Cocoa bean commodity price fluctuations impact quarterly gross margins.',
            'Higher sugar tax tariffs if formulation crosses sweetness thresholds.',
          ],
          recommendations: [
            'Adopt insulated cold-gel thermal shipping packaging for warm weather.',
            'Position as an adaptogenic afternoon focus ritual with ashwagandha or lion’s mane.',
            'Introduce festive corporate luxury gifting boxes (₹1,499 price point).',
          ],
        };
      case 'Snacks':
        return {
          demand: '+78% YoY Search Growth',
          searchVol: '510,000 queries/mo',
          competition: 'Competitive (5 Majors)',
          compText: 'Quick-commerce adoption is soaring; customers demand gluten-free roasted alternatives to fried chips.',
          copackers: '12 vacuum-frying & slow-roasting facilities in Gujarat and Delhi-NCR.',
          risks: [
            'Moisture-sensitive packaging requires nitrogen flushing for 9-month shelf life.',
            'Quick-commerce margin pressure (25-30% platform take rate).',
            'Low price point per pouch requires 4-pack bundles to absorb logistics.',
          ],
          recommendations: [
            'Bundle pouches into ₹399 trial packs with 3 distinct spice profiles.',
            'Prioritize 10-minute dark store placement in metro zip codes.',
            'Highlight "Zero Palm Oil & Roasted Not Fried" prominent front-of-pack stamps.',
          ],
        };
      case 'Personal Care':
        return {
          demand: '+46% YoY Search Growth',
          searchVol: '620,000 queries/mo',
          competition: 'High Saturation',
          compText: 'Saturated with generic vitamin C and niacinamide; high demand for microbiome and fermented peptides.',
          copackers: '15 GMP & ISO-certified cosmetics labs in Himachal & Maharashtra.',
          risks: [
            'Escalating Meta ad CAC due to intense beauty brand competition.',
            'Clinical efficacy claims require dermatological safety test certifications.',
            'Long repeat purchase purchase cycle (45 to 60 days).',
          ],
          recommendations: [
            'Focus on specific micro-concerns (e.g. urban pollution barrier repair).',
            'Invest in 60-day before-and-after UGC video testimonials.',
            'Implement an automated 45-day replenishment WhatsApp subscription discount.',
          ],
        };
      default:
        return {
          demand: '+42% YoY Search Growth',
          searchVol: '180,000 queries/mo',
          competition: 'Moderate Saturation',
          compText: 'Growing consumer appetite for verified purity and direct manufacturer transparency.',
          copackers: '7 contract manufacturing partners ready for pilot production batches.',
          risks: [
            'Customer acquisition costs must be carefully monitored against lifetime value.',
            'Initial MOQ constraints require inventory buffer planning.',
            'Packaging supplier lead times during peak festive quarter.',
          ],
          recommendations: [
            'Validate initial demand via a VIP waitlist before running 5,000 unit production batches.',
            'Leverage founder-led storytelling videos on TikTok and Instagram Reels.',
            'Maintain a target contribution margin above 45% to ensure self-sustaining growth.',
          ],
        };
    }
  }, [category]);

  // Run or refresh analysis
  const handleRunValidation = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    setHasReport(false);
    setTimeout(() => {
      setIsAnalyzing(false);
      setHasReport(true);
      window.scrollTo({ top: 480, behavior: 'smooth' });
    }, 900);
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
      viabilityScore,
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
      <div className="rounded-2xl p-6 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#7547FF]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7547FF]/15 border border-[#7547FF]/30 text-[#A855F7] text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#A855F7]" />
              <span>Multi-Stage AI Gatekeeper</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFF] tracking-tight">
              Product Validation Studio
            </h1>
            <p className="text-xs sm:text-sm text-[#9EADC2] mt-1 max-w-2xl">
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
            className="rounded-2xl p-6 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl shadow-lg space-y-4"
          >
            <h2 className="text-sm font-bold text-[#F8FAFF] pb-3 border-b border-[rgba(161,190,230,0.18)] flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#25D9E8]" />
                <span>Product Concept Specifications</span>
              </span>
              <span className="text-[11px] text-[#9EADC2] font-normal">9 parameters for viability engine</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. Product Name */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-[#F8FAFF] block mb-1">
                  1. Product Name <span className="text-[#25D9E8]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Organic Adaptogenic Cocoa Bar"
                  className="w-full px-3 py-2 bg-[rgba(8,24,44,0.7)] border border-[rgba(161,190,230,0.2)] focus:border-[#7547FF] rounded-xl text-xs text-[#F8FAFF] placeholder-[#9EADC2]/50 focus:outline-none"
                />
              </div>

              {/* 2. Category */}
              <div>
                <label className="text-xs font-semibold text-[#F8FAFF] block mb-1">
                  2. Product Category <span className="text-[#25D9E8]">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    const newCat = e.target.value;
                    setCategory(newCat);
                    const match = presetImages.find((p) => p.label === newCat);
                    if (match) setImage(match.path);
                  }}
                  className="w-full px-3 py-2 bg-[#08182C] border border-[rgba(161,190,230,0.2)] focus:border-[#7547FF] rounded-xl text-xs text-[#F8FAFF] focus:outline-none cursor-pointer"
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
                <label className="text-xs font-semibold text-[#F8FAFF] block mb-1">
                  3. Target Launch Market <span className="text-[#25D9E8]">*</span>
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-[#08182C] border border-[rgba(161,190,230,0.2)] focus:border-[#7547FF] rounded-xl text-xs text-[#F8FAFF] focus:outline-none cursor-pointer"
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
                <label className="text-xs font-semibold text-[#F8FAFF] block mb-1">
                  4. Target Selling Price (₹) <span className="text-[#25D9E8]">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-[rgba(8,24,44,0.7)] border border-[rgba(161,190,230,0.2)] focus:border-[#7547FF] rounded-xl text-xs text-[#F8FAFF] font-mono-nums focus:outline-none"
                />
              </div>

              {/* 5. Manufacturing Cost */}
              <div>
                <label className="text-xs font-semibold text-[#F8FAFF] block mb-1">
                  5. Estimated Unit Mfg Cost (₹) <span className="text-[#25D9E8]">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={mfgCost}
                  onChange={(e) => setMfgCost(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-[rgba(8,24,44,0.7)] border border-[rgba(161,190,230,0.2)] focus:border-[#7547FF] rounded-xl text-xs text-[#F8FAFF] font-mono-nums focus:outline-none"
                />
              </div>

              {/* 6. Marketing Budget */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-[#F8FAFF] block mb-1">
                  6. Initial Launch Marketing Budget (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={marketingBudget}
                  onChange={(e) => setMarketingBudget(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-[rgba(8,24,44,0.7)] border border-[rgba(161,190,230,0.2)] focus:border-[#7547FF] rounded-xl text-xs text-[#F8FAFF] font-mono-nums focus:outline-none"
                />
              </div>

              {/* 7. Description & UVP */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-[#F8FAFF] block mb-1">
                  7. Product Concept & Unique Value Proposition
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what makes your product unique and why consumers will buy it..."
                  className="w-full px-3 py-2 bg-[rgba(8,24,44,0.7)] border border-[rgba(161,190,230,0.2)] focus:border-[#7547FF] rounded-xl text-xs text-[#F8FAFF] placeholder-[#9EADC2]/50 focus:outline-none"
                />
              </div>

              {/* 8. Target Audience */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-[#F8FAFF] block mb-1">
                  8. Target Customer Demographic
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g. Health-conscious urban professionals aged 22-35..."
                  className="w-full px-3 py-2 bg-[rgba(8,24,44,0.7)] border border-[rgba(161,190,230,0.2)] focus:border-[#7547FF] rounded-xl text-xs text-[#F8FAFF] placeholder-[#9EADC2]/50 focus:outline-none"
                />
              </div>

              {/* 9. Product Visual Asset */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-[#F8FAFF] block mb-1.5">
                  9. Product Visual Asset (Select Image)
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {presetImages.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setImage(p.path)}
                      className={`relative w-14 h-14 rounded-xl overflow-hidden border shrink-0 transition-all cursor-pointer ${
                        image === p.path
                          ? 'border-[#25D9E8] ring-2 ring-[#25D9E8]/50 scale-105 shadow-md'
                          : 'border-[rgba(161,190,230,0.2)] opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={p.path} alt={p.label} className="w-full h-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-black/70 text-[8px] text-white text-center py-0.5 truncate px-0.5">
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
                className="w-full btn-primary-gradient py-3 rounded-xl text-xs sm:text-sm font-bold text-white flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-transform active:scale-[0.99]"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Running AI Feasibility Engine & Sourcing Models...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-200" />
                    <span>Validate Product & Generate Feasibility Report</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Live Concept Preview Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl p-5 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-[#F8FAFF] uppercase tracking-wider">Live Concept Preview</h3>
              <span className="text-[10px] text-[#25D9E8] bg-[#25D9E8]/15 px-2 py-0.5 rounded-full border border-[#25D9E8]/30 font-semibold">
                Dynamic Preview
              </span>
            </div>

            <div className="relative aspect-video rounded-xl overflow-hidden border border-[rgba(161,190,230,0.2)] mb-3 bg-black/40">
              <img src={image} alt={productName} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />
              <div className="absolute top-2.5 left-2.5">
                <span className="text-[10px] font-bold text-white bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20">
                  {category}
                </span>
              </div>
              <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs">
                <span className="text-[#9EADC2] text-[11px] truncate mr-2">{location.split(' ')[0]}</span>
                <span className="text-[#28D7A0] font-black text-base font-mono-nums">₹{sellingPrice}</span>
              </div>
            </div>

            <h4 className="text-sm font-bold text-[#F8FAFF]">{productName}</h4>
            <p className="text-xs text-[#9EADC2] mt-1 line-clamp-2 leading-relaxed">{description}</p>

            <div className="mt-4 pt-3 border-t border-[rgba(161,190,230,0.18)] grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-xl bg-white/[0.03] border border-[rgba(161,190,230,0.1)]">
                <span className="text-[10px] text-[#9EADC2] block">Gross Margin</span>
                <span
                  className={`text-sm font-black font-mono-nums ${
                    grossMarginPct >= 50 ? 'text-[#28D7A0]' : grossMarginPct >= 30 ? 'text-amber-400' : 'text-[#F43F5E]'
                  }`}
                >
                  {grossMarginPct}%
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.03] border border-[rgba(161,190,230,0.1)]">
                <span className="text-[10px] text-[#9EADC2] block">Unit COGS</span>
                <span className="text-xs font-bold text-[#F8FAFF] font-mono-nums">₹{mfgCost}</span>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.03] border border-[rgba(161,190,230,0.1)]">
                <span className="text-[10px] text-[#9EADC2] block">Marketing Spend</span>
                <span className="text-xs font-bold text-[#25D9E8] font-mono-nums">
                  ₹{(marketingBudget / 1000).toFixed(0)}k
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generated Feasibility Report Section */}
      {hasReport && (
        <div className="space-y-6 pt-4 border-t border-[rgba(161,190,230,0.2)] animate-in slide-in-from-bottom-4 duration-500">
          {/* Labelled Demo Banner */}
          <div className="p-3.5 rounded-xl bg-[#7547FF]/10 border border-[#7547FF]/25 text-xs text-indigo-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-[#25D9E8] shrink-0" />
              <span className="text-[#F8FAFF]">
                <strong>AI Validation Report:</strong> Synthesized from search volume index, competitive density benchmarks, and contract manufacturing parameters.
              </span>
            </div>
            <span className="text-[10px] font-bold text-[#25D9E8] bg-[#25D9E8]/15 px-2.5 py-0.5 rounded-full border border-[#25D9E8]/30 shrink-0 self-start sm:self-auto">
              Labelled Demo Report
            </span>
          </div>

          {/* Top Score Banner */}
          <div className="rounded-2xl p-6 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#28D7A0]/20 to-[#25D9E8]/10 border-2 border-[#28D7A0]/40 flex flex-col items-center justify-center text-[#28D7A0] shadow-[0_0_30px_rgba(40,215,160,0.25)] shrink-0">
                <span className="text-2xl font-black font-mono-nums leading-none">{viabilityScore}</span>
                <span className="text-[9px] uppercase font-bold tracking-wider text-[#28D7A0]/80 mt-1">Viability</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">{viabilityGrade.text}</h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      viabilityScore >= 70
                        ? 'bg-[#28D7A0]/15 border-[#28D7A0]/30 text-[#28D7A0]'
                        : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                    }`}
                  >
                    {viabilityGrade.grade}
                  </span>
                </div>
                <p className="text-xs text-[#9EADC2] mt-1 max-w-xl">
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
            <div className="rounded-2xl p-5 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl shadow-md">
              <div className="flex items-center gap-2 text-xs font-bold text-white mb-2">
                <TrendingUp className="w-4 h-4 text-[#25D9E8]" />
                <span>Demand & Momentum</span>
              </div>
              <div className="text-xl font-extrabold text-white font-mono-nums mb-1">{categoryIntel.demand}</div>
              <p className="text-xs text-[#9EADC2]">
                Monthly consumer search query index reached {categoryIntel.searchVol} in {location}.
              </p>
              <div className="mt-3 pt-2 border-t border-[rgba(161,190,230,0.15)] text-[10px] text-[#25D9E8] font-semibold">
                Search Intent: High Commercial Purchase
              </div>
            </div>

            {/* 2. Competition & Saturation */}
            <div className="rounded-2xl p-5 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl shadow-md">
              <div className="flex items-center gap-2 text-xs font-bold text-white mb-2">
                <Target className="w-4 h-4 text-[#A855F7]" />
                <span>Competitive Density</span>
              </div>
              <div className="text-xl font-extrabold text-white font-mono-nums mb-1">{categoryIntel.competition}</div>
              <p className="text-xs text-[#9EADC2]">{categoryIntel.compText}</p>
              <div className="mt-3 pt-2 border-t border-[rgba(161,190,230,0.15)] text-[10px] text-[#A855F7] font-semibold">
                Whitespace: Premium Clean-Label
              </div>
            </div>

            {/* 3. Margin & Economics */}
            <div className="rounded-2xl p-5 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl shadow-md">
              <div className="flex items-center gap-2 text-xs font-bold text-white mb-2">
                <DollarSign className="w-4 h-4 text-[#28D7A0]" />
                <span>Unit Margin Viability</span>
              </div>
              <div className="text-xl font-extrabold text-[#28D7A0] font-mono-nums mb-1">
                {grossMarginPct}% Margin
              </div>
              <p className="text-xs text-[#9EADC2]">
                Unit gross contribution of ₹{(sellingPrice - mfgCost).toFixed(0)} comfortably allows up to ₹{Math.round((sellingPrice - mfgCost) * 0.4)} CAC.
              </p>
              <div className="mt-3 pt-2 border-t border-[rgba(161,190,230,0.15)] text-[10px] text-[#28D7A0] font-semibold">
                Target Pack: 3-Unit Starter Bundle (₹{Math.round(sellingPrice * 2.8)})
              </div>
            </div>

            {/* 4. Supply Chain Feasibility */}
            <div className="rounded-2xl p-5 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl shadow-md">
              <div className="flex items-center gap-2 text-xs font-bold text-white mb-2">
                <Building className="w-4 h-4 text-amber-400" />
                <span>Contract Co-packers</span>
              </div>
              <div className="text-xl font-extrabold text-white font-mono-nums mb-1">Verified Suppliers</div>
              <p className="text-xs text-[#9EADC2]">{categoryIntel.copackers}</p>
              <div className="mt-3 pt-2 border-t border-[rgba(161,190,230,0.15)] text-[10px] text-amber-400 font-semibold">
                Pilot Lead Time: 4-6 Weeks
              </div>
            </div>
          </div>

          {/* Dynamic Risks & Recommendations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Key Risks */}
            <div className="rounded-2xl p-5 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl shadow-lg space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#F43F5E]" />
                <span>Identified Commercial & Supply Chain Risks</span>
              </h4>
              <ul className="space-y-2 text-xs text-[#9EADC2]">
                {categoryIntel.risks.map((risk, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F43F5E] mt-1.5 shrink-0" />
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Strategic Recommendations */}
            <div className="rounded-2xl p-5 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl shadow-lg space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#28D7A0]" />
                <span>Actionable Launch & GTM Recommendations</span>
              </h4>
              <ul className="space-y-2 text-xs text-[#9EADC2]">
                {categoryIntel.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#28D7A0] mt-1.5 shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
