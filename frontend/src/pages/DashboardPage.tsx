import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { HeroSection } from '../components/dashboard/HeroSection';
import { ProductCategoryCarousel } from '../components/dashboard/ProductCategoryCarousel';
import { MarketInsightsCard } from '../components/dashboard/MarketInsightsCard';
import { TrendingProductsCard } from '../components/dashboard/TrendingProductsCard';
import { DemandTrendCard } from '../components/dashboard/DemandTrendCard';
import { TopOpportunitiesCard } from '../components/dashboard/TopOpportunitiesCard';
import { ProfitCalculatorCard } from '../components/dashboard/ProfitCalculatorCard';
import { MyProjectsCard } from '../components/dashboard/MyProjectsCard';
import {
  Sparkles,
  FolderKanban,
  Calculator,
  ArrowRight,
  TrendingUp,
  Users,
} from 'lucide-react';

interface ShellContextType {
  onOpenVideoModal?: () => void;
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const outletCtx = useOutletContext<ShellContextType>();
  const [selectedCategory, setSelectedCategory] = useState<string>('chocolates');

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* ==================================================
          1. BENTO GRID 3-ZONE HERO SECTION
          ================================================== */}
      <HeroSection
        onOpenVideo={outletCtx?.onOpenVideoModal}
        onOpenValidate={() => navigate('/validation')}
        onSelectCategory={(catId) => setSelectedCategory(catId)}
      />

      {/* ==================================================
          2. PRODUCT CATEGORY CAROUSEL (10 CATEGORIES)
          ================================================== */}
      <ProductCategoryCarousel
        selectedCategory={selectedCategory}
        onSelectCategory={(catId) => setSelectedCategory(catId)}
        onViewAll={() => navigate('/validation')}
      />

      {/* ==================================================
          3. MARKET ANALYTICS & INTELLIGENCE GRID
          Panels:
          1. Market Insights
          2. Trending Products
          3. Demand Trend
          4. Top Opportunities
          ================================================== */}
      <section className="space-y-3 pt-1">
        <div className="flex items-center justify-between pb-1 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
              Market Analytics & Intelligence
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-mono-nums">
            4 Core Panels • Trailing 180 Days
          </span>
        </div>

        {/* 2-Column Balanced Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
          {/* Column 1: Market Insights & Demand Trend Chart */}
          <div className="space-y-5 flex flex-col justify-between">
            {/* Panel 1: Market Insights */}
            <MarketInsightsCard />

            {/* Panel 3: Demand Trend Chart */}
            <DemandTrendCard />
          </div>

          {/* Column 2: Trending Products & Top Opportunities */}
          <div className="space-y-5 flex flex-col justify-between">
            {/* Panel 2: Trending Products */}
            <TrendingProductsCard />

            {/* Panel 4: Top Opportunities */}
            <TopOpportunitiesCard />
          </div>
        </div>
      </section>

      {/* ==================================================
          4. CORE FOUNDER WORKSPACES (Projects & Unit Economics)
          ================================================== */}
      <section className="space-y-3.5 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-900" />
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
              Core Founder Workspaces
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/influencers')}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>Influencer Finder</span>
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FolderKanban className="w-3.5 h-3.5 text-slate-500" />
              <span>All Projects</span>
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={() => navigate('/profit-calculator')}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5 text-emerald-600" />
              <span>Full Calculator</span>
            </button>
          </div>
        </div>

        {/* 2-Column Grid: My Projects & Profit Calculator Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch pt-1">
          <div className="lg:col-span-6 flex flex-col">
            <MyProjectsCard />
          </div>
          <div className="lg:col-span-6 flex flex-col">
            <ProfitCalculatorCard />
          </div>
        </div>
      </section>
    </div>
  );
};
