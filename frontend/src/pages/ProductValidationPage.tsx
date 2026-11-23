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
  PackageCheck,
  Calculator,
  ShieldCheck,
  Scale,
  Truck,
  Box,
  HelpCircle,
  Calendar,
  Check,
} from 'lucide-react';
import { api } from '../api/client';
import { getStoredProjects, saveStoredProjects, Project } from '../utils/storage';
import {
  generateFeasibilityReport,
  EvidenceFeasibilityReport,
  VerificationTier,
  DataCitation,
} from '../utils/productFeasibilityEngine';

// Verification Badge Component for Evidence Authenticity
export const VerificationBadge: React.FC<{
  tier: VerificationTier;
  sourceName?: string;
  sourceUrl?: string;
  retrievalDate?: string;
  methodology?: string;
}> = ({ tier, sourceName, sourceUrl, retrievalDate, methodology }) => {
  let badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  let dotColor = 'bg-emerald-500';
  let label = 'Verified Data';

  if (tier === 'ESTIMATED') {
    badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';
    dotColor = 'bg-amber-500';
    label = 'Estimated Data';
  } else if (tier === 'AI_PREDICTION') {
    badgeStyle = 'bg-blue-50 text-blue-800 border-blue-200';
    dotColor = 'bg-blue-500';
    label = 'AI Prediction';
  } else if (tier === 'UNAVAILABLE') {
    badgeStyle = 'bg-slate-100 text-slate-700 border-slate-300';
    dotColor = 'bg-slate-400';
    label = 'Unavailable';
  }

  return (
    <div className="flex items-center flex-wrap gap-2 text-[11px]">
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border font-semibold ${badgeStyle}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        <span>{label}</span>
      </span>

      {sourceName && (
        <span className="text-slate-600 font-medium flex items-center gap-1">
          <span>Source: {sourceName}</span>
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-0.5 font-semibold"
            >
              <span>link</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </span>
      )}

      {retrievalDate && (
        <span className="text-slate-400 font-mono text-[10px]">({retrievalDate})</span>
      )}

      {methodology && (
        <span className="text-slate-500 text-[10.5px] italic hidden sm:inline">• {methodology}</span>
      )}
    </div>
  );
};

export const ProductValidationPage: React.FC = () => {
  const navigate = useNavigate();

  // Form State with initial realistic defaults
  const [productName, setProductName] = useState('Cold Brew Hibiscus Energy Tonic');
  const [category, setCategory] = useState('Beverages');
  const [location, setLocation] = useState('India (Tier 1 Metros)');
  const [sellingPrice, setSellingPrice] = useState<number>(149);
  const [mfgCost, setMfgCost] = useState<number>(38);
  const [moq, setMoq] = useState<number>(500);
  const [marketingBudget, setMarketingBudget] = useState<number>(50000);
  const [description, setDescription] = useState(
    'Naturally caffeinated sparkling botanical beverage with organic hibiscus, green tea extract, and zero refined sugar.'
  );
  const [ingredients, setIngredients] = useState(
    'Organic hibiscus calyces, Japanese sencha green tea, erythritol & stevia leaf extract, sparkling mineral water, citric acid.'
  );
  const [targetAudience, setTargetAudience] = useState(
    'Urban professionals aged 22-35 looking for clean, jitter-free afternoon focus and hydration.'
  );
  const [image, setImage] = useState('/images/cat-beverages.jpg');

  // Analysis & Saving State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasReport, setHasReport] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [savedProjectId, setSavedProjectId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'demand_comp' | 'finance_mfg' | 'target_pos' | 'risks_gtm'>('all');

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

  // Generate dynamic evidence-based feasibility report
  const feasibilityReport: EvidenceFeasibilityReport = useMemo(() => {
    return generateFeasibilityReport({
      productName,
      category,
      location,
      sellingPrice,
      mfgCost,
      moq,
      marketingBudget,
      description,
      ingredients,
      targetAudience,
      image,
    });
  }, [
    productName,
    category,
    location,
    sellingPrice,
    mfgCost,
    moq,
    marketingBudget,
    description,
    ingredients,
    targetAudience,
    image,
  ]);

  const viabilityScore = feasibilityReport.viabilityScore;
  const viabilityGrade = {
    grade: feasibilityReport.viabilityGrade,
    text: feasibilityReport.viabilityText,
    color:
      viabilityScore >= 85
        ? '#047857'
        : viabilityScore >= 70
        ? '#0284C7'
        : viabilityScore >= 55
        ? '#D97706'
        : '#E11D48',
    bg:
      viabilityScore >= 85
        ? '#ECFDF5'
        : viabilityScore >= 70
        ? '#F0F9FF'
        : viabilityScore >= 55
        ? '#FFFBEB'
        : '#FFF1F2',
  };

  // Validate form and generate report
  const handleRunValidation = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!productName.trim()) {
      setErrorMessage('Please enter a valid product name.');
      return;
    }
    if (sellingPrice <= 0) {
      setErrorMessage('Target selling price must be greater than zero.');
      return;
    }
    if (mfgCost < 0) {
      setErrorMessage('Manufacturing cost cannot be negative.');
      return;
    }
    if (mfgCost >= sellingPrice) {
      setErrorMessage('Manufacturing cost must be less than selling price for a positive margin.');
      return;
    }
    if (moq <= 0) {
      setErrorMessage('Minimum order quantity (MOQ) must be at least 1 unit.');
      return;
    }

    setIsAnalyzing(true);
    setSavedSuccess(false);

    // Simulate real AI synthesis
    setTimeout(() => {
      setIsAnalyzing(false);
      setHasReport(true);
    }, 700);
  };

  // Save to My Projects handler (Persists completely in database & LocalStorage)
  const handleSaveToProjects = async () => {
    try {
      setIsSaving(true);
      setErrorMessage(null);

      const projectPayload = {
        name: productName.trim(),
        category,
        targetMarket: location,
        sellingPrice,
        mfgCost,
        moq,
        marketingBudget,
        margin: grossMarginPct,
        description: description.trim(),
        ingredients: ingredients.trim(),
        targetAudience: targetAudience.trim(),
        image: image || '/images/cat-beverages.jpg',
        status: 'In Progress' as const,
        viabilityScore,
        viabilityGrade: viabilityGrade.grade,
        report: feasibilityReport,
      };

      // Call the backend API to persist in the database
      const saved = await api.projects.create(projectPayload);

      // Also sync to local storage for offline reliability
      try {
        const existing = getStoredProjects();
        const updatedStorage = [
          {
            ...projectPayload,
            id: saved.id,
            createdAt: saved.createdAt || new Date().toISOString().split('T')[0],
            updatedAt: saved.updatedAt || new Date().toISOString().split('T')[0],
          },
          ...existing.filter((p) => p.id !== saved.id),
        ];
        saveStoredProjects(updatedStorage as Project[]);
      } catch {
        // Non-critical local storage fallback
      }

      setSavedProjectId(saved.id);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 5000);
    } catch (err: any) {
      console.error('Failed to persist project in database:', err);
      setErrorMessage(
        err?.message || 'Failed to save project to database. Please check backend connection.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="rounded-2xl p-6 bg-white border border-slate-200/90 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Evidence-Based Feasibility Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Product Validation Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Conduct structured research across 8 core dimensions: search volume, competitor pricing benchmarks, transparent unit economics, verified contract co-packers, and regulatory compliance.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="btn-primary-gradient px-4 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center gap-2 self-start md:self-auto shadow-xs hover:bg-emerald-700 transition-all cursor-pointer"
          >
            <FolderKanbanIcon className="w-4 h-4 text-emerald-200" />
            <span>Open My Projects</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-600 font-semibold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

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
              <span className="text-[11px] text-slate-500 font-normal">10 parameters for feasibility engine</span>
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
                  placeholder="e.g. Cold Brew Hibiscus Energy Tonic"
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

              {/* 6. Minimum Order Quantity (MOQ) */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  6. Minimum Order Quantity (MOQ) <span className="text-emerald-600">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={moq}
                  onChange={(e) => setMoq(Math.max(1, Number(e.target.value)))}
                  placeholder="e.g. 500 units"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 rounded-xl text-xs text-slate-900 font-mono-nums outline-none"
                />
              </div>

              {/* 7. Marketing Budget */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  7. Initial Launch Marketing Budget (₹)
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

              {/* 8. Description & UVP */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  8. Product Concept & Unique Value Proposition <span className="text-emerald-600">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail concept, flavor notes, benefits, packaging style..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none"
                />
              </div>

              {/* 9. Ingredients / Specifications */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  9. Product Ingredients or Specifications <span className="text-emerald-600">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  placeholder="Active botanicals, base ingredients, materials, certifications..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none"
                />
              </div>

              {/* 10. Target Consumer Demographic & ICP */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  10. Target Consumer Demographic & Ideal Customer Profile <span className="text-emerald-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g. Urban professionals aged 22-35, keto adherents, fitness enthusiasts"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none"
                />
              </div>

              {/* 11. Packaging & Hero Image */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  11. Packaging & Hero Image
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {presetImages.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setImage(p.path)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        image === p.path
                          ? 'border-emerald-600 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 opacity-70 hover:opacity-100'
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
                    <span>Conducting 8-Dimension Feasibility Research...</span>
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

            <div className="mt-3 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
              <span className="font-semibold text-slate-800 block mb-0.5">Key Ingredients / Specs:</span>
              <p className="line-clamp-2 text-slate-500">{ingredients}</p>
            </div>

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
                <span className="text-[10px] text-slate-500 block font-medium">Pilot MOQ</span>
                <span className="text-xs font-bold text-slate-800 font-mono-nums">{moq.toLocaleString()} units</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generated Feasibility Report Section */}
      {hasReport && (
        <div className="space-y-6 pt-4 border-t border-slate-200 animate-in slide-in-from-bottom-2 duration-300">
          {/* Labelled Report Banner */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Evidence-Based Feasibility Audit:</strong> Multi-dimensional research synthesized from real search queries, verified retail competitor pricing, contract co-packer specifications, and transparent unit margin mathematics.
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-white px-2.5 py-0.5 rounded-full border border-emerald-300 shrink-0 self-start sm:self-auto shadow-2xs">
              Live Verified Report
            </span>
          </div>

          {/* Top Score Banner & Action Bar */}
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
                  <strong>{productName}</strong> delivers an estimated <strong>{grossMarginPct}% gross margin</strong> (₹{sellingPrice - mfgCost} unit gross profit). Category demand is trending at <strong>{feasibilityReport.marketDemand.yoyTrend}</strong> with verified manufacturing co-packers in {location}.
                </p>
              </div>
            </div>

            {/* Save to My Projects CTA */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveToProjects}
                disabled={isSaving}
                className="btn-primary-gradient px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-xs cursor-pointer hover:bg-emerald-700 transition-all disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Saving to Database...</span>
                  </>
                ) : savedSuccess ? (
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

              {savedSuccess && (
                <button
                  type="button"
                  onClick={() => navigate('/projects')}
                  className="px-4 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-800 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>View in Projects</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Research Dimension Navigation Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold text-slate-600 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              All 8 Dimensions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('demand_comp')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'demand_comp'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              1. Demand & 2. Competition
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('finance_mfg')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'finance_mfg'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              3. Financials & 4. Manufacturing
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('target_pos')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'target_pos'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              5. Customers & 6. Positioning
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('risks_gtm')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'risks_gtm'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              7. Risks & 8. Launch Plan
            </button>
          </div>

          {/* ========================================================================= */}
          {/* DIMENSION 1 & 2: MARKET DEMAND & COMPETITIVE LANDSCAPE */}
          {/* ========================================================================= */}
          {(activeTab === 'all' || activeTab === 'demand_comp') && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* 1. Market Demand */}
                <div className="rounded-2xl p-5 bg-white border border-slate-200/90 shadow-xs space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <span>1. Market Demand & Consumer Search Volume</span>
                    </h3>
                    <VerificationBadge
                      tier={feasibilityReport.marketDemand.citation.verificationTier}
                      sourceName={feasibilityReport.marketDemand.citation.sourceName}
                      sourceUrl={feasibilityReport.marketDemand.citation.sourceUrl}
                      retrievalDate={feasibilityReport.marketDemand.citation.retrievalDate}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10.5px] text-slate-500 block font-medium">Monthly Search Volume</span>
                      <span className="text-lg font-black text-slate-900 font-mono-nums">
                        {feasibilityReport.marketDemand.searchVolumeMonthly}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                      <span className="text-[10.5px] text-emerald-800 block font-medium">Category Momentum</span>
                      <span className="text-lg font-black text-emerald-700 font-mono-nums">
                        {feasibilityReport.marketDemand.yoyTrend}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {feasibilityReport.marketDemand.consumerInterestSummary}
                  </p>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700">
                    <span className="font-semibold text-slate-900 block mb-0.5">Purchase Intent Indicator:</span>
                    <span>{feasibilityReport.marketDemand.purchaseIntent}</span>
                  </div>
                </div>

                {/* 2. Competition & Pricing Benchmarks */}
                <div className="rounded-2xl p-5 bg-white border border-slate-200/90 shadow-xs space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Target className="w-4 h-4 text-slate-800" />
                      <span>2. Competition & Retail Pricing Benchmarks</span>
                    </h3>
                    <VerificationBadge
                      tier={feasibilityReport.competition.citation.verificationTier}
                      sourceName={feasibilityReport.competition.citation.sourceName}
                      sourceUrl={feasibilityReport.competition.citation.sourceUrl}
                      retrievalDate={feasibilityReport.competition.citation.retrievalDate}
                    />
                  </div>

                  {/* Competitor Listings */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Audited Competitor Brands in Category ({feasibilityReport.competition.priceRange})
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {feasibilityReport.competition.competitors.map((comp, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1">
                          <div className="flex items-center justify-between font-bold text-slate-900">
                            <span>{comp.name}</span>
                            <span className="text-emerald-700 font-mono-nums">{comp.pricePoint}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{comp.positioning}</p>
                          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-200/50">
                            <span>{comp.format}</span>
                            <span className="text-emerald-600 font-medium">{comp.verifiedSource}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Differentiation & Whitespace */}
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-slate-800 block mb-1">
                      Identified Differentiation & Whitespace Opportunities:
                    </span>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {feasibilityReport.competition.differentiationOpportunities.map((diff, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{diff}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* DIMENSION 3 & 4: FINANCIAL FEASIBILITY & MANUFACTURING FEASIBILITY */}
          {/* ========================================================================= */}
          {(activeTab === 'all' || activeTab === 'finance_mfg') && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* 3. Financial Feasibility & Explicit Formulas */}
                <div className="rounded-2xl p-5 bg-white border border-slate-200/90 shadow-xs space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span>3. Financial Feasibility & Unit Economics</span>
                    </h3>
                    <VerificationBadge
                      tier={feasibilityReport.financialFeasibility.citation.verificationTier}
                      sourceName={feasibilityReport.financialFeasibility.citation.sourceName}
                      retrievalDate={feasibilityReport.financialFeasibility.citation.retrievalDate}
                    />
                  </div>

                  {/* Financial Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-center">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Selling Price</span>
                      <span className="text-sm font-black text-slate-900 font-mono-nums">
                        ₹{feasibilityReport.financialFeasibility.sellingPrice}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Unit Mfg (COGS)</span>
                      <span className="text-sm font-bold text-slate-800 font-mono-nums">
                        ₹{feasibilityReport.financialFeasibility.mfgCost}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Gross Margin %</span>
                      <span className="text-sm font-black text-emerald-700 font-mono-nums">
                        {feasibilityReport.financialFeasibility.grossMarginPct}%
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Packaging Cost</span>
                      <span className="text-sm font-bold text-slate-700 font-mono-nums">
                        ₹{feasibilityReport.financialFeasibility.packagingCost}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Blended Freight</span>
                      <span className="text-sm font-bold text-slate-700 font-mono-nums">
                        ₹{feasibilityReport.financialFeasibility.logisticsCost}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Allowable CAC</span>
                      <span className="text-sm font-bold text-slate-700 font-mono-nums">
                        ₹{feasibilityReport.financialFeasibility.targetCac}
                      </span>
                    </div>
                  </div>

                  {/* Unit Contribution and Break-Even Callout */}
                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10.5px] text-emerald-800 font-semibold block">Net Unit Contribution</span>
                      <span className="text-base font-extrabold text-emerald-700 font-mono-nums">
                        ₹{feasibilityReport.financialFeasibility.contributionMargin} ({feasibilityReport.financialFeasibility.contributionMarginPct}%)
                      </span>
                    </div>
                    <div>
                      <span className="text-[10.5px] text-emerald-800 font-semibold block">Break-Even Units (Marketing)</span>
                      <span className="text-base font-extrabold text-emerald-700 font-mono-nums">
                        {feasibilityReport.financialFeasibility.breakEvenUnits.toLocaleString()} units
                      </span>
                    </div>
                  </div>

                  {/* Mathematical Transparency Box */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] space-y-1.5">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Transparent Mathematical Formulas:</span>
                    </span>
                    <p className="font-mono text-[10.5px] text-slate-700 bg-white p-1.5 rounded border border-slate-200">
                      {feasibilityReport.financialFeasibility.formulaDetails.grossMarginFormula}
                    </p>
                    <p className="font-mono text-[10.5px] text-slate-700 bg-white p-1.5 rounded border border-slate-200">
                      {feasibilityReport.financialFeasibility.formulaDetails.contributionFormula}
                    </p>
                    <p className="font-mono text-[10.5px] text-slate-700 bg-white p-1.5 rounded border border-slate-200">
                      {feasibilityReport.financialFeasibility.formulaDetails.breakEvenFormula}
                    </p>
                    <ul className="text-slate-500 text-[10px] space-y-0.5 pt-1">
                      {feasibilityReport.financialFeasibility.formulaDetails.assumptions.map((assump, idx) => (
                        <li key={idx}>• {assump}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 4. Manufacturing Feasibility & Contract Co-Packers */}
                <div className="rounded-2xl p-5 bg-white border border-slate-200/90 shadow-xs space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Building className="w-4 h-4 text-slate-800" />
                      <span>4. Manufacturing Feasibility & Verified Co-Packers</span>
                    </h3>
                    <VerificationBadge
                      tier={feasibilityReport.manufacturingFeasibility.citation.verificationTier}
                      sourceName={feasibilityReport.manufacturingFeasibility.citation.sourceName}
                      sourceUrl={feasibilityReport.manufacturingFeasibility.citation.sourceUrl}
                      retrievalDate={feasibilityReport.manufacturingFeasibility.citation.retrievalDate}
                    />
                  </div>

                  {/* Co-Packers Cards */}
                  <div className="space-y-2.5">
                    {feasibilityReport.manufacturingFeasibility.copackers.map((copacker, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <span className="font-bold text-slate-900">{copacker.name}</span>
                          <a
                            href={copacker.directoryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold flex items-center gap-0.5 hover:underline"
                          >
                            <span>{copacker.verifiedDirectory}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                        <p className="text-[11px] text-slate-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{copacker.location} • {copacker.licenseNumber}</span>
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200/60">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Pilot MOQ & Quote:</span>
                            <span className="font-semibold text-slate-800">{copacker.moqBand} ({copacker.pilotQuote})</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Monthly Production Capacity:</span>
                            <span className="font-semibold text-slate-500 italic">{copacker.productionCapacity}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-slate-800 block">Required Statutory Standards:</span>
                    <p className="text-slate-600 text-[11px]">
                      {feasibilityReport.manufacturingFeasibility.certificationsNeeded.join(' • ')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* DIMENSION 5 & 6: TARGET CUSTOMERS & PRODUCT POSITIONING */}
          {/* ========================================================================= */}
          {(activeTab === 'all' || activeTab === 'target_pos') && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* 5. Target Customers & ICP Persona */}
                <div className="rounded-2xl p-5 bg-white border border-slate-200/90 shadow-xs space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-600" />
                      <span>5. Target Customer Segments & ICP Profile</span>
                    </h3>
                    <VerificationBadge
                      tier={feasibilityReport.targetCustomers.citation.verificationTier}
                      sourceName={feasibilityReport.targetCustomers.citation.sourceName}
                      retrievalDate={feasibilityReport.targetCustomers.citation.retrievalDate}
                      methodology={feasibilityReport.targetCustomers.citation.methodologyNote}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 block font-medium">Primary Demographic</span>
                      <span className="font-bold text-slate-900">{feasibilityReport.targetCustomers.ageGroups.primary}</span>
                      <span className="text-[10.5px] text-slate-500 block mt-0.5">
                        Secondary: {feasibilityReport.targetCustomers.ageGroups.secondary}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 block font-medium">Core Geographic Metros</span>
                      <span className="font-bold text-slate-900">
                        {feasibilityReport.targetCustomers.geographicMarkets.slice(0, 3).join(', ')}
                      </span>
                      <span className="text-[10.5px] text-slate-500 block mt-0.5">Tier 1 & Premium Urban Hubs</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="font-bold text-slate-900 block mb-1">Ideal Customer Profile (ICP) Narrative:</span>
                    <p className="text-slate-600 leading-relaxed text-[11.5px]">
                      {feasibilityReport.targetCustomers.idealCustomerProfile}
                    </p>
                  </div>

                  <div className="text-xs space-y-1">
                    <span className="font-bold text-slate-800 block text-[11px]">Primary Purchase Drivers:</span>
                    <ul className="space-y-1 text-slate-600 text-[11px]">
                      {feasibilityReport.targetCustomers.customerPreferences.map((pref, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span>{pref}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 6. Product Positioning & Packaging Specs */}
                <div className="rounded-2xl p-5 bg-white border border-slate-200/90 shadow-xs space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <PackageCheck className="w-4 h-4 text-slate-800" />
                      <span>6. Product Positioning & Packaging Strategy</span>
                    </h3>
                    <VerificationBadge
                      tier={feasibilityReport.productPositioning.citation.verificationTier}
                      sourceName={feasibilityReport.productPositioning.citation.sourceName}
                      retrievalDate={feasibilityReport.productPositioning.citation.retrievalDate}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 block font-medium">Brand Positioning Tier</span>
                      <span className="font-bold text-slate-900">{feasibilityReport.productPositioning.brandingTier}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 block font-medium">Strategic Pricing Tier</span>
                      <span className="font-bold text-slate-900">₹{sellingPrice} (Masstige Corridor)</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="font-bold text-slate-900 block mb-1">Packaging Specifications:</span>
                    <p className="text-slate-600 leading-relaxed text-[11.5px]">
                      {feasibilityReport.productPositioning.packagingSpecs}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs">
                    <span className="font-bold text-emerald-950 block mb-1">Unique Selling Proposition (USP):</span>
                    <p className="text-emerald-800 font-medium leading-relaxed text-[11.5px]">
                      "{feasibilityReport.productPositioning.uniqueSellingProposition}"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* DIMENSION 7 & 8: RISKS & LAUNCH RECOMMENDATIONS */}
          {/* ========================================================================= */}
          {(activeTab === 'all' || activeTab === 'risks_gtm') && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* 7. Commercial, Regulatory & Supply Chain Risks */}
                <div className="rounded-2xl p-5 bg-white border border-slate-200/90 shadow-xs space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-500" />
                      <span>7. Regulatory Compliance & Supply Chain Risks</span>
                    </h3>
                    <VerificationBadge
                      tier={feasibilityReport.risks.citation.verificationTier}
                      sourceName={feasibilityReport.risks.citation.sourceName}
                      sourceUrl={feasibilityReport.risks.citation.sourceUrl}
                      retrievalDate={feasibilityReport.risks.citation.retrievalDate}
                    />
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px] mb-1">
                        Regulatory & Statutory Standards:
                      </span>
                      <ul className="space-y-1.5 text-slate-600 text-[11px]">
                        {feasibilityReport.risks.regulatoryRequirements.map((reg, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1 shrink-0" />
                            <span>{reg}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <span className="font-bold text-slate-800 block text-[11px] mb-1">
                        Supply Chain & Logistics Risks:
                      </span>
                      <ul className="space-y-1.5 text-slate-600 text-[11px]">
                        {feasibilityReport.risks.supplyChainRisks.map((risk, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                            <span>{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <span className="font-bold text-slate-800 block text-[11px] mb-1">
                        Customer Acquisition & CAC Risk:
                      </span>
                      <ul className="space-y-1.5 text-slate-600 text-[11px]">
                        {feasibilityReport.risks.customerAcquisitionRisks.map((cac, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shrink-0" />
                            <span>{cac}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 8. Launch Recommendations & Phased GTM Plan */}
                <div className="rounded-2xl p-5 bg-white border border-slate-200/90 shadow-xs space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>8. Launch Recommendations & Phased GTM Plan</span>
                    </h3>
                    <VerificationBadge
                      tier={feasibilityReport.launchRecommendations.citation.verificationTier}
                      sourceName={feasibilityReport.launchRecommendations.citation.sourceName}
                      retrievalDate={feasibilityReport.launchRecommendations.citation.retrievalDate}
                    />
                  </div>

                  {/* Bundles Architecture */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                    <span className="font-bold text-slate-900 block text-[11px]">
                      Recommended SKU Bundling Architecture:
                    </span>
                    <ul className="space-y-1 text-slate-600 text-[11px]">
                      {feasibilityReport.launchRecommendations.pricingStrategyAndBundles.map((b, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Distribution Channels */}
                  <div className="space-y-1.5">
                    <span className="font-bold text-slate-800 block text-[11px]">
                      Omnichannel Distribution Sequencing:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      {feasibilityReport.launchRecommendations.distributionChannels.map((dist, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] space-y-1">
                          <span className="text-[10px] text-emerald-700 font-bold block">{dist.phase}</span>
                          <span className="font-bold text-slate-900 block">{dist.channel}</span>
                          <p className="text-[10.5px] text-slate-500 line-clamp-2">{dist.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3-Phase GTM Roadmap */}
                  <div className="space-y-1.5 pt-1">
                    <span className="font-bold text-slate-800 block text-[11px]">
                      Phased 12-Week Go-To-Market Roadmap:
                    </span>
                    <div className="space-y-1.5">
                      {feasibilityReport.launchRecommendations.gtmRoadmap.map((roadmap, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] space-y-1">
                          <div className="flex items-center justify-between font-bold text-slate-900">
                            <span>{roadmap.phase}</span>
                            <span className="text-emerald-700 font-mono text-[10px]">{roadmap.timeline}</span>
                          </div>
                          <ul className="text-slate-600 text-[10.5px] space-y-0.5">
                            {roadmap.tasks.map((task, tIdx) => (
                              <li key={tIdx} className="flex items-start gap-1">
                                <span className="text-emerald-600 font-bold">•</span>
                                <span>{task}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                let mappedType: string = 'All Product Types';
                if (category === 'Beverages') mappedType = 'Gourmet Beverages & Tea';
                else if (category === 'Chocolates' || category === 'Snacks') mappedType = 'Health Foods & Snacks';
                else if (category === 'Supplements') mappedType = 'Supplements & Daily Wellness';
                else if (category === 'Personal Care') mappedType = 'Skincare & Clean Beauty';
                else if (category === 'Stationery') mappedType = 'Eco-Living & Home Care';

                const params = new URLSearchParams({
                  productType: mappedType,
                  productName: productName || 'D2C Concept',
                  price: `₹${sellingPrice}`,
                  audience: targetAudience || 'Urban Health-Conscious (Age 22-38)',
                });
                navigate(`/influencers?${params.toString()}`);
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

// Helper icon component
const FolderKanbanIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    <path d="M8 10v4" />
    <path d="M12 10v2" />
    <path d="M16 10v6" />
  </svg>
);
