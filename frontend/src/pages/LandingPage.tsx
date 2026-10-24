import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  ChevronDown,
  Star,
  Zap,
  TrendingUp,
  Factory,
  DollarSign,
  ShieldCheck,
  ArrowRight,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Check,
  CheckCircle2,
  Tag,
  Share2,
  Heart,
  ExternalLink,
  Layers,
  Award,
} from 'lucide-react';

interface FlipkartProduct {
  id: string;
  name: string;
  category: string;
  image: string;
  rating: number;
  ratingsCount: string;
  mrp: number;
  originalPrice: number;
  discountPercent: number;
  cogs: number;
  netProfit: number;
  grossMargin: number;
  viabilityScore: number;
  factoryName: string;
  factoryLocation: string;
  moq: string;
  badge?: string;
  fastSelling?: boolean;
}

const FLIPKART_CATEGORIES = [
  { id: 'chocolates', name: 'Chocolates', icon: '🍫', count: '142 Brands' },
  { id: 'supplements', name: 'Protein & Health', icon: '🌿', count: '310 Brands' },
  { id: 'skincare', name: 'Beauty & Skincare', icon: '✨', count: '420 Brands' },
  { id: 'snacks', name: 'Healthy Snacks', icon: '🍿', count: '280 Brands' },
  { id: 'beverages', name: 'Cold Brew & Drinks', icon: '☕', count: '195 Brands' },
  { id: 'personal-care', name: 'Personal Care', icon: '🧴', count: '340 Brands' },
  { id: 'fashion', name: 'D2C Apparel', icon: '👕', count: '540 Brands' },
  { id: 'home', name: 'Home & Living', icon: '🏡', count: '160 Brands' },
  { id: 'electronics', name: 'Smart Gadgets', icon: '⚡', count: '230 Brands' },
];

const FLIPKART_HERO_BANNERS = [
  {
    id: 1,
    title: 'THE BIG D2C LAUNCH FESTIVAL',
    subtitle: 'Validate high-demand products at 0% capital risk. Up to 76% Gross Margins!',
    tag: '⚡ 42 Audited Factories Ready with Low MOQs',
    cta: 'Explore Top Opportunities',
    badge: 'LIVE NOW',
    bgGradient: 'from-[#1e3c72] via-[#2a5298] to-[#2874f0]',
    image: '/images/hero-products.jpg',
  },
  {
    id: 2,
    title: 'VERIFIED MANUFACTURER EXPO 2026',
    subtitle: 'Lock in certified contract manufacturers with MOQs starting at just 250 units.',
    tag: '🏭 FSSAI, ISO 22000 & GMP Certified Facilities',
    cta: 'Connect With Factories',
    badge: 'NEW TIE-UPS',
    bgGradient: 'from-[#0f2027] via-[#203a43] to-[#2c5364]',
    image: '/images/cat-supplements.jpg',
  },
  {
    id: 3,
    title: 'VIRAL ON INSTAGRAM & SOCIAL COMMERCE',
    subtitle: 'High perceived-value botanical formulations with 4.6x repeat subscription potential.',
    tag: '✨ 5.2x Pricing Multiple • Fast 90-Day Payback',
    cta: 'View Viral Beauty Fit',
    badge: 'HIGH DEMAND',
    bgGradient: 'from-[#3a1c71] via-[#d76d77] to-[#ffaf7b]',
    image: '/images/cat-personal-care.jpg',
  },
];

const DEALS_OF_THE_DAY: FlipkartProduct[] = [
  {
    id: 'chocolate',
    name: 'Artisanal 70% Dark Chocolate (Bean-to-Bar)',
    category: 'Gourmet Food & Snacks',
    image: '/images/hero-products.jpg',
    rating: 4.8,
    ratingsCount: '1,248',
    mrp: 299,
    originalPrice: 499,
    discountPercent: 40,
    cogs: 74,
    netProfit: 129,
    grossMargin: 68,
    viabilityScore: 92,
    factoryName: 'Campco Co-Op',
    factoryLocation: 'Mangaluru, Karnataka',
    moq: '500 units',
    badge: 'Top Opportunity',
    fastSelling: true,
  },
  {
    id: 'supplements',
    name: 'Clean Pea & Brown Rice Vegan Protein (1kg)',
    category: 'Health & Fitness',
    image: '/images/cat-supplements.jpg',
    rating: 4.9,
    ratingsCount: '3,140',
    mrp: 1499,
    originalPrice: 2499,
    discountPercent: 40,
    cogs: 410,
    netProfit: 550,
    grossMargin: 64,
    viabilityScore: 88,
    factoryName: 'NutraCaps Labs',
    factoryLocation: 'Pune, Maharashtra',
    moq: '300 jars',
    badge: 'High LTV Repeat',
    fastSelling: true,
  },
  {
    id: 'skincare',
    name: 'Botanical Barrier Glow Dropper Serum (30ml)',
    category: 'Beauty & Skincare',
    image: '/images/cat-personal-care.jpg',
    rating: 4.7,
    ratingsCount: '892',
    mrp: 799,
    originalPrice: 1299,
    discountPercent: 38,
    cogs: 145,
    netProfit: 460,
    grossMargin: 76,
    viabilityScore: 86,
    factoryName: 'Solan Cosmeceuticals',
    factoryLocation: 'Solan, Himachal',
    moq: '500 pcs',
    badge: '76% Margin',
  },
  {
    id: 'makhana',
    name: 'Flavored Roasted Foxnut (Makhana) Pudina Crunch',
    category: 'Healthy Snacks',
    image: '/images/cat-snacks.jpg',
    rating: 4.8,
    ratingsCount: '2,110',
    mrp: 149,
    originalPrice: 249,
    discountPercent: 40,
    cogs: 38,
    netProfit: 68,
    grossMargin: 62,
    viabilityScore: 85,
    factoryName: 'Mithila Agro Foods',
    factoryLocation: 'Darbhanga, Bihar',
    moq: '500 packs',
    badge: 'Fast Payback',
  },
  {
    id: 'coldbrew',
    name: 'Nitro Cold Brew Black Coffee Can (250ml)',
    category: 'Beverages',
    image: '/images/cat-beverages.jpg',
    rating: 4.6,
    ratingsCount: '620',
    mrp: 160,
    originalPrice: 250,
    discountPercent: 36,
    cogs: 48,
    netProfit: 64,
    grossMargin: 58,
    viabilityScore: 84,
    factoryName: 'BrewCraft India',
    factoryLocation: 'Chikmagalur, Karnataka',
    moq: '1,000 cans',
    badge: 'Summer Surge',
  },
];

const VIRAL_INSTAGRAM_PRODUCTS: FlipkartProduct[] = [
  {
    id: 'herbaltea',
    name: 'Organic Ashwagandha & Chamomile Sleep Tea',
    category: 'Wellness & Teas',
    image: '/images/cat-chocolates.jpg',
    rating: 4.8,
    ratingsCount: '1,840',
    mrp: 349,
    originalPrice: 599,
    discountPercent: 41,
    cogs: 82,
    netProfit: 162,
    grossMargin: 70,
    viabilityScore: 87,
    factoryName: 'Assam Green Estate',
    factoryLocation: 'Dibrugarh, Assam',
    moq: '300 tins',
    badge: 'Viral Wellness',
  },
  {
    id: 'creatine',
    name: 'Micronized Creatine Monohydrate 250g',
    category: 'Fitness Nutrition',
    image: '/images/cat-supplements.jpg',
    rating: 4.9,
    ratingsCount: '4,200',
    mrp: 699,
    originalPrice: 999,
    discountPercent: 30,
    cogs: 190,
    netProfit: 310,
    grossMargin: 65,
    viabilityScore: 89,
    factoryName: 'HealthCore Labs',
    factoryLocation: 'Vadodara, Gujarat',
    moq: '400 tubs',
    badge: 'High Search Vol',
  },
  {
    id: 'shampoo',
    name: 'Rosemary & Biotin Anti-Hairfall Shampoo (200ml)',
    category: 'Hair Care',
    image: '/images/cat-personal-care.jpg',
    rating: 4.7,
    ratingsCount: '2,900',
    mrp: 449,
    originalPrice: 799,
    discountPercent: 43,
    cogs: 95,
    netProfit: 210,
    grossMargin: 72,
    viabilityScore: 86,
    factoryName: 'PureAura Care',
    factoryLocation: 'Haridwar, Uttarakhand',
    moq: '500 btls',
    badge: 'Trending Haircare',
  },
  {
    id: 'granola',
    name: 'Crunchy Dark Chocolate Hazelnut Granola (400g)',
    category: 'Breakfast Cereals',
    image: '/images/cat-snacks.jpg',
    rating: 4.8,
    ratingsCount: '1,120',
    mrp: 399,
    originalPrice: 599,
    discountPercent: 33,
    cogs: 110,
    netProfit: 175,
    grossMargin: 66,
    viabilityScore: 85,
    factoryName: 'Wholesome Bakes',
    factoryLocation: 'Bengaluru, Karnataka',
    moq: '250 packs',
    badge: 'High Repeat',
  },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<FlipkartProduct | null>(null);
  const [cartCount, setCartCount] = useState(3);
  const [isSaved, setIsSaved] = useState(false);

  // Auto slide hero banners
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % FLIPKART_HERO_BANNERS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      navigate('/dashboard');
      return;
    }
    navigate('/dashboard');
  };

  const handleOpenProductModal = (product: FlipkartProduct) => {
    setSelectedProduct(product);
    setIsSaved(false);
  };

  return (
    <div className="min-h-screen bg-[#F1F3F6] text-[#212121] font-sans antialiased">
      {/* 1. FLIPKART SIGNATURE BLUE HEADER */}
      <header className="sticky top-0 z-50 bg-[#2874F0] text-white shadow-md">
        <div className="max-w-[1340px] mx-auto px-4 h-16 flex items-center justify-between gap-4 sm:gap-8">
          
          {/* Flipkart-style Logo + Plus Subtext */}
          <Link to="/" className="flex flex-col items-end group shrink-0">
            <span className="text-xl sm:text-2xl font-black italic tracking-wide text-white flex items-center gap-1">
              D2C<span className="text-[#FFE500]">Vision</span>
            </span>
            <div className="text-[10px] sm:text-[11px] font-medium italic text-slate-100 flex items-center gap-0.5 -mt-1 group-hover:underline">
              <span>Explore</span>
              <span className="text-[#FFE500] font-bold">LaunchTwin</span>
              <span className="text-[#FFE500] text-xs">✦</span>
            </div>
          </Link>

          {/* Flipkart Wide Search Bar */}
          <div className="flex-1 max-w-2xl">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center shadow-xs">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for D2C products, categories, manufacturers, margins..."
                className="w-full bg-white text-[#212121] placeholder-slate-400 text-xs sm:text-sm pl-4 pr-11 py-2.5 rounded-xs sm:rounded-sm shadow-inner focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Search"
                className="absolute right-0 top-0 bottom-0 px-3.5 text-[#2874F0] hover:text-[#1e58b8] flex items-center justify-center cursor-pointer"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </form>
          </div>

          {/* Right Header Navigation & Actions */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            {/* White Flipkart Login/Dashboard Button */}
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="bg-white text-[#2874F0] hover:bg-slate-50 font-bold px-5 sm:px-8 py-1.5 rounded-xs sm:rounded-sm text-xs sm:text-sm border border-transparent shadow-xs transition-all cursor-pointer"
            >
              Dashboard
            </button>

            {/* Become a Supplier */}
            <Link
              to="/manufacturers"
              className="hidden lg:flex items-center gap-1 text-xs sm:text-sm font-semibold text-white hover:text-[#FFE500] transition-colors"
            >
              <span>Factories & MOQ</span>
            </Link>

            {/* More Menu Dropdown */}
            <div className="hidden md:flex items-center gap-1 text-xs sm:text-sm font-semibold text-white cursor-pointer hover:text-[#FFE500]">
              <span>Tools</span>
              <ChevronDown className="w-4 h-4" />
            </div>

            {/* Cart / Saved Ideas Icon */}
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white hover:text-[#FFE500] cursor-pointer"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5 text-white" />
                <span className="absolute -top-1.5 -right-2 bg-[#FFE500] text-[#2874F0] font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              </div>
              <span className="hidden sm:inline">Saved Ideas</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. FLIPKART TOP CATEGORIES BAR (White Ribbon with Icons) */}
      <section className="bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-[1340px] mx-auto px-4 py-2.5 flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
          {FLIPKART_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex flex-col items-center gap-1 group shrink-0 min-w-[76px] cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-[#f1f3f6] group-hover:bg-[#e4e7ec] flex items-center justify-center text-xl shadow-xs transition-all transform group-hover:scale-105">
                <span>{cat.icon}</span>
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-[#212121] group-hover:text-[#2874F0] transition-colors text-center whitespace-nowrap">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* MAIN CONTAINER */}
      <main className="max-w-[1340px] mx-auto px-2 sm:px-4 py-3 space-y-3.5">
        
        {/* 3. FLIPKART HERO SLIDER CAROUSEL BANNER */}
        <section className="relative w-full h-52 sm:h-72 md:h-80 rounded-xs sm:rounded-sm overflow-hidden shadow-xs">
          {FLIPKART_HERO_BANNERS.map((banner, index) => {
            const isActive = activeBannerIndex === index;
            return (
              <div
                key={banner.id}
                className={`absolute inset-0 transition-opacity duration-700 flex items-center justify-between p-6 sm:p-12 bg-gradient-to-r ${banner.bgGradient} text-white ${
                  isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                {/* Banner Content */}
                <div className="space-y-2.5 sm:space-y-4 max-w-xl z-10">
                  <span className="inline-block px-2.5 py-0.5 rounded-sm bg-[#FFE500] text-[#212121] text-[10px] sm:text-xs font-extrabold uppercase tracking-wider">
                    {banner.badge}
                  </span>
                  <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                    {banner.title}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-100 font-medium max-w-md">
                    {banner.subtitle}
                  </p>
                  <div className="pt-1 flex items-center gap-2 text-[11px] sm:text-xs text-[#FFE500] font-semibold">
                    <span>{banner.tag}</span>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => navigate('/dashboard')}
                      className="bg-white text-[#2874F0] hover:bg-slate-100 px-6 py-2.5 rounded-sm font-extrabold text-xs sm:text-sm shadow-md flex items-center gap-2 cursor-pointer transition-transform hover:scale-105"
                    >
                      <span>{banner.cta}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Banner Photography */}
                <div className="hidden sm:block relative w-60 md:w-80 h-52 md:h-64 rounded-xl overflow-hidden shadow-2xl border-4 border-white/20 transform rotate-2 hover:rotate-0 transition-transform">
                  <img
                    src={banner.image}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                    <span className="text-[10px] text-white font-bold bg-[#388E3C] px-2 py-0.5 rounded">
                      68% Margin Verified
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Slider Prev / Next Controls */}
          <button
            type="button"
            onClick={() =>
              setActiveBannerIndex(
                (prev) => (prev - 1 + FLIPKART_HERO_BANNERS.length) % FLIPKART_HERO_BANNERS.length
              )
            }
            aria-label="Previous slide"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-18 bg-white/90 hover:bg-white text-[#212121] flex items-center justify-center rounded-r-sm shadow-md cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={() =>
              setActiveBannerIndex((prev) => (prev + 1) % FLIPKART_HERO_BANNERS.length)
            }
            aria-label="Next slide"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-18 bg-white/90 hover:bg-white text-[#212121] flex items-center justify-center rounded-l-sm shadow-md cursor-pointer transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </section>

        {/* 4. FLIPKART "DEALS OF THE DAY" WHITE SECTION CONTAINER */}
        <section className="bg-white rounded-xs sm:rounded-sm p-4 shadow-xs">
          {/* Section Header Strip with Timer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-3 border-b border-slate-100 gap-2">
            <div className="flex items-center gap-3">
              <h2 className="text-base sm:text-lg font-bold text-[#212121]">
                Deals of the Day — Top Viability Product Ideas
              </h2>
              
              {/* Flipkart Countdown Clock */}
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-sm border border-slate-200">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>16 : 42 : 18 Left</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="bg-[#2874F0] text-white hover:bg-[#1e58b8] px-4 py-1.5 rounded-sm text-xs font-bold shadow-xs flex items-center justify-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <span>VIEW ALL</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Flipkart Product Cards Horizontal Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {DEALS_OF_THE_DAY.map((prod) => (
              <div
                key={prod.id}
                onClick={() => handleOpenProductModal(prod)}
                className="group relative flex flex-col justify-between p-3 rounded-sm border border-slate-100 hover:border-slate-300 hover:shadow-lg transition-all cursor-pointer bg-white"
              >
                {/* Viability Pill Tag */}
                <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-[#388E3C] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-xs shadow-xs">
                  <span>{prod.viabilityScore}%</span>
                  <span>Score</span>
                </div>

                {/* Product Photograph */}
                <div className="relative w-full h-36 sm:h-44 overflow-hidden rounded-xs flex items-center justify-center bg-slate-50">
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {prod.badge && (
                    <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded backdrop-blur-xs font-semibold">
                      {prod.badge}
                    </span>
                  )}
                </div>

                {/* Product Title & Category */}
                <div className="pt-2 space-y-1">
                  <h3 className="text-xs sm:text-sm font-semibold text-[#212121] line-clamp-2 group-hover:text-[#2874F0] leading-snug">
                    {prod.name}
                  </h3>

                  {/* Flipkart Green Rating Badge */}
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="bg-[#388E3C] text-white font-bold px-1.5 py-0.2 rounded-xs flex items-center gap-0.5 text-[10px]">
                      <span>{prod.rating}</span>
                      <Star className="w-2.5 h-2.5 fill-white" />
                    </span>
                    <span className="text-slate-400 font-medium">({prod.ratingsCount})</span>
                  </div>

                  {/* Price Row: Target Selling Price + Discount */}
                  <div className="flex items-baseline gap-1.5 pt-0.5">
                    <span className="text-sm sm:text-base font-bold text-[#212121]">
                      ₹{prod.mrp}
                    </span>
                    <span className="text-xs text-slate-400 line-through">
                      ₹{prod.originalPrice}
                    </span>
                    <span className="text-xs font-bold text-[#388E3C]">
                      {prod.discountPercent}% off
                    </span>
                  </div>

                  {/* Flipkart Signature Green Offer / Margin Pill */}
                  <div className="pt-1">
                    <span className="inline-block text-[11px] font-bold text-[#388E3C] bg-emerald-50 px-1.5 py-0.5 rounded-xs border border-emerald-100">
                      ★ {prod.grossMargin}% Gross Margin (₹{prod.netProfit} profit)
                    </span>
                  </div>

                  {/* Verified Manufacturer Info */}
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
                    <span className="truncate">{prod.factoryName}</span>
                    <span className="font-mono text-cyan-700 font-semibold shrink-0">{prod.moq}</span>
                  </div>
                </div>

                {/* Quick Action Button */}
                <div className="pt-2.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenProductModal(prod);
                    }}
                    className="w-full py-1.5 bg-[#f1f3f6] hover:bg-[#2874F0] hover:text-white text-[#2874F0] font-bold text-xs rounded-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Quick Test Idea</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. FLIPKART "VIRAL ON INSTAGRAM & SOCIAL COMMERCE" SECTION */}
        <section className="bg-white rounded-xs sm:rounded-sm p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#212121] flex items-center gap-2">
                <span>Viral D2C Opportunities on Social Media</span>
                <span className="bg-[#FFE500] text-[#212121] text-[10px] font-black px-2 py-0.5 rounded-xs uppercase">
                  Trending
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Formulations and product concepts generating over 4x repeat purchases and micro-creator momentum.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="bg-[#2874F0] text-white hover:bg-[#1e58b8] px-4 py-1.5 rounded-sm text-xs font-bold shadow-xs flex items-center justify-center gap-1 shrink-0 cursor-pointer"
            >
              <span>EXPLORE ALL</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {VIRAL_INSTAGRAM_PRODUCTS.map((prod) => (
              <div
                key={prod.id}
                onClick={() => handleOpenProductModal(prod)}
                className="group p-3.5 rounded-sm border border-slate-100 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer bg-white flex flex-col justify-between"
              >
                <div>
                  <div className="relative w-full h-40 overflow-hidden rounded-xs bg-slate-50">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 left-2 bg-[#388E3C] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-xs">
                      {prod.viabilityScore}% Viability
                    </span>
                  </div>

                  <div className="pt-2.5 space-y-1">
                    <h3 className="text-sm font-semibold text-[#212121] line-clamp-1 group-hover:text-[#2874F0]">
                      {prod.name}
                    </h3>
                    <div className="text-xs text-slate-500">{prod.category}</div>

                    <div className="flex items-center gap-1.5 pt-1 text-xs">
                      <span className="font-bold text-[#212121] text-base">₹{prod.mrp}</span>
                      <span className="text-slate-400 line-through">₹{prod.originalPrice}</span>
                      <span className="font-bold text-[#388E3C]">{prod.discountPercent}% off</span>
                    </div>

                    <div className="pt-1">
                      <span className="text-xs font-bold text-[#388E3C] bg-emerald-50 px-2 py-0.5 rounded-xs inline-block">
                        Clean Profit: ₹{prod.netProfit} / unit ({prod.grossMargin}%)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px] truncate">{prod.factoryName}</span>
                  <button
                    type="button"
                    className="text-[#2874F0] font-bold text-xs hover:underline cursor-pointer"
                  >
                    View Factory →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. FLIPKART 3-BANNER PROMOTIONAL ROW */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div
            onClick={() => navigate('/manufacturers')}
            className="p-5 rounded-xs sm:rounded-sm bg-gradient-to-r from-blue-900 to-indigo-800 text-white cursor-pointer hover:shadow-md transition-all flex flex-col justify-between h-44"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FFE500]">
                Verified Sourcing Network
              </span>
              <h3 className="text-lg font-bold text-white">42+ Audited Factories</h3>
              <p className="text-xs text-slate-200">
                Direct contacts in Pune, Mangaluru & Solan with guaranteed low MOQs.
              </p>
            </div>
            <span className="text-xs font-bold text-[#FFE500] flex items-center gap-1">
              <span>Browse Manufacturers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div
            onClick={() => navigate('/profit-calculator')}
            className="p-5 rounded-xs sm:rounded-sm bg-gradient-to-r from-emerald-900 to-teal-800 text-white cursor-pointer hover:shadow-md transition-all flex flex-col justify-between h-44"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FFE500]">
                Exact Decimal Arithmetic
              </span>
              <h3 className="text-lg font-bold text-white">Unit Economics Engine</h3>
              <p className="text-xs text-slate-200">
                Calculate break-even units, return courier buffers, and net margins.
              </p>
            </div>
            <span className="text-xs font-bold text-[#FFE500] flex items-center gap-1">
              <span>Simulate Margins</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div
            onClick={() => navigate('/influencers')}
            className="p-5 rounded-xs sm:rounded-sm bg-gradient-to-r from-purple-900 to-pink-800 text-white cursor-pointer hover:shadow-md transition-all flex flex-col justify-between h-44"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FFE500]">
                Customer Acquisition
              </span>
              <h3 className="text-lg font-bold text-white">Influencer Matchmaker</h3>
              <p className="text-xs text-slate-200">
                Connect with micro-creators boasting 5%+ engagement rates.
              </p>
            </div>
            <span className="text-xs font-bold text-[#FFE500] flex items-center gap-1">
              <span>Find Creators</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </section>

        {/* 7. FLIPKART TRUST & ADVANTAGE BADGES */}
        <section className="bg-white rounded-xs sm:rounded-sm p-4 sm:p-6 shadow-xs border border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2874F0] flex items-center justify-center">
                <Factory className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[#212121]">100% Audited Factories</h4>
              <p className="text-xs text-slate-500">
                FSSAI, ISO & GMP certified contract manufacturing facilities across India.
              </p>
            </div>

            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#388E3C] flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[#212121]">Exact Decimal Math</h4>
              <p className="text-xs text-slate-500">
                Python Decimal domain engine prevents financial calculation hallucinations.
              </p>
            </div>

            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[#212121]">Fast 90-Day Payback</h4>
              <p className="text-xs text-slate-500">
                Unit economics structured to recover capital expenditures in under 3 months.
              </p>
            </div>

            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[#212121]">6-Stage Sequential Guard</h4>
              <p className="text-xs text-slate-500">
                Rigorous multi-stage validation ensures unviable products never waste money.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* 8. FLIPKART-STYLE AUTHENTIC PRODUCT DETAIL MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-white rounded-xs sm:rounded-sm shadow-2xl overflow-hidden max-h-[90vh] flex flex-col md:flex-row">
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Column: Product Photo & Buy/Launch Buttons */}
            <div className="w-full md:w-5/12 p-5 border-r border-slate-200 flex flex-col justify-between bg-slate-50">
              <div className="relative w-full h-64 sm:h-72 rounded-sm overflow-hidden bg-white border border-slate-200 flex items-center justify-center">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-[#388E3C] text-white text-xs font-bold px-2 py-0.5 rounded-xs">
                  {selectedProduct.viabilityScore}% Viability Score
                </div>
              </div>

              {/* Flipkart Dual Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    navigate('/dashboard');
                  }}
                  className="bg-[#FF9F00] hover:bg-[#f39700] text-white font-bold py-3 px-3 rounded-xs text-xs sm:text-sm shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  <span>TEST IN APP</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigate('/profit-calculator');
                  }}
                  className="bg-[#FB641B] hover:bg-[#e65510] text-white font-bold py-3 px-3 rounded-xs text-xs sm:text-sm shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>CALCULATE</span>
                </button>
              </div>
            </div>

            {/* Right Column: Flipkart Product Specifications & Offers */}
            <div className="w-full md:w-7/12 p-5 sm:p-6 overflow-y-auto space-y-4">
              <div>
                <span className="text-xs text-slate-400 font-medium">{selectedProduct.category}</span>
                <h2 className="text-lg sm:text-xl font-bold text-[#212121] leading-snug mt-0.5">
                  {selectedProduct.name}
                </h2>

                {/* Rating Strip */}
                <div className="flex items-center gap-2 pt-1.5">
                  <span className="bg-[#388E3C] text-white font-bold text-xs px-2 py-0.5 rounded-xs flex items-center gap-1">
                    <span>{selectedProduct.rating}</span>
                    <Star className="w-3 h-3 fill-white" />
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">
                    {selectedProduct.ratingsCount} Founder Reviews & Verifications
                  </span>
                </div>
              </div>

              {/* Price Block */}
              <div className="p-3 rounded-xs bg-slate-50 border border-slate-200">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-[#212121]">₹{selectedProduct.mrp}</span>
                  <span className="text-sm text-slate-400 line-through">₹{selectedProduct.originalPrice}</span>
                  <span className="text-sm font-bold text-[#388E3C]">{selectedProduct.discountPercent}% off</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Target Recommended Selling Price (M.R.P.)
                </div>
              </div>

              {/* Available D2C Launch Offers */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#212121] uppercase tracking-wider">
                  Available D2C Launch Economics:
                </h4>
                <div className="space-y-1.5 text-xs text-slate-700">
                  <div className="flex items-start gap-2">
                    <Tag className="w-4 h-4 text-[#388E3C] shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-[#212121]">Unit Margin:</strong> COGS is ₹{selectedProduct.cogs}. Clean net profit of <strong className="text-[#388E3C]">₹{selectedProduct.netProfit} per sale</strong> ({selectedProduct.grossMargin}% margin).
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Tag className="w-4 h-4 text-[#388E3C] shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-[#212121]">Verified Supplier:</strong> {selectedProduct.factoryName} in {selectedProduct.factoryLocation} offers MOQ of {selectedProduct.moq}.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Tag className="w-4 h-4 text-[#388E3C] shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-[#212121]">Demand Velocity:</strong> Scored {selectedProduct.viabilityScore}/100 on multi-stage demand validation.
                    </span>
                  </div>
                </div>
              </div>

              {/* Direct Link to Start Launching */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="w-full py-3 bg-[#2874F0] hover:bg-[#1e58b8] text-white font-bold text-xs sm:text-sm rounded-xs shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Open in Guided 3-Step Launch Wizard →</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. FLIPKART SIGNATURE DARK NAVY FOOTER */}
      <footer className="bg-[#172337] text-white text-xs pt-10 pb-6 border-t border-slate-700">
        <div className="max-w-[1340px] mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 pb-8 border-b border-slate-700">
          <div className="space-y-2">
            <h4 className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">ABOUT</h4>
            <ul className="space-y-1.5 text-slate-300">
              <li><Link to="/dashboard" className="hover:underline">Contact Us</Link></li>
              <li><Link to="/dashboard" className="hover:underline">About LaunchTwin OS</Link></li>
              <li><Link to="/dashboard" className="hover:underline">Deterministic Rules Engine</Link></li>
              <li><Link to="/dashboard" className="hover:underline">D2C Stories</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">SERVICES</h4>
            <ul className="space-y-1.5 text-slate-300">
              <li><Link to="/manufacturers" className="hover:underline">Factory Directory</Link></li>
              <li><Link to="/profit-calculator" className="hover:underline">Profit Calculator</Link></li>
              <li><Link to="/influencers" className="hover:underline">Creator Matchmaker</Link></li>
              <li><Link to="/validation" className="hover:underline">6-Stage Validation</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">SECTORS</h4>
            <ul className="space-y-1.5 text-slate-300">
              <li><Link to="/dashboard" className="hover:underline">Organic Chocolates</Link></li>
              <li><Link to="/dashboard" className="hover:underline">Plant Protein Powders</Link></li>
              <li><Link to="/dashboard" className="hover:underline">Active Botanical Skincare</Link></li>
              <li><Link to="/dashboard" className="hover:underline">Roasted Foxnut Snacks</Link></li>
            </ul>
          </div>

          <div className="space-y-2 border-l border-slate-700 pl-4">
            <h4 className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">HEADQUARTERS</h4>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              D2C Vision Private Limited,<br />
              LaunchTwin AI Tower, Outer Ring Road,<br />
              Bengaluru, 560103, Karnataka, India
            </p>
            <div className="pt-2 text-slate-400 text-[10px]">
              CIN: U72900KA2026PTC000000
            </div>
          </div>
        </div>

        <div className="max-w-[1340px] mx-auto px-4 pt-6 flex flex-col sm:flex-row items-center justify-between text-slate-400 text-[11px] gap-2">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-[#FFE500]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>LaunchTwin Deterministic OS</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-[#FFE500]" />
              <span>42+ Verified Factories</span>
            </span>
          </div>
          <div>
            © 2026 D2C Vision. Inspired by Flipkart marketplace aesthetics.
          </div>
        </div>
      </footer>
    </div>
  );
};
