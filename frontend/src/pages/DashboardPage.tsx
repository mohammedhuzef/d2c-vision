import React, { useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { queryKeys } from '../services/queryKeys';
import { HeroSection } from '../components/dashboard/HeroSection';
import { ProductCategoryCarousel } from '../components/dashboard/ProductCategoryCarousel';
import { MarketInsightsCard } from '../components/dashboard/MarketInsightsCard';
import { TrendingProductsCard } from '../components/dashboard/TrendingProductsCard';
import { DemandTrendCard } from '../components/dashboard/DemandTrendCard';
import { TopOpportunitiesCard } from '../components/dashboard/TopOpportunitiesCard';
import { ManufacturersCard } from '../components/dashboard/ManufacturersCard';
import { InfluencerMatchmakerCard } from '../components/dashboard/InfluencerMatchmakerCard';
import { ProfitCalculatorCard } from '../components/dashboard/ProfitCalculatorCard';
import { MyProjectsCard } from '../components/dashboard/MyProjectsCard';
import { PipelineStrip } from '../components/dashboard/PipelineStrip';
import { FinancialSnapshotCard } from '../components/dashboard/FinancialSnapshotCard';
import { CompetitorPriceChart } from '../components/dashboard/CompetitorPriceChart';
import {
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  FolderKanban,
  Building2,
  Calculator,
  Users,
  Grid,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface ShellContextType {
  selectedProductId?: string;
  onOpenUpgradeModal?: () => void;
  onOpenVideoModal?: () => void;
}

export const DashboardPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const outletCtx = useOutletContext<ShellContextType>();

  const [selectedCategory, setSelectedCategory] = useState<string>('chocolates');
  const [showDeepDive, setShowDeepDive] = useState<boolean>(true);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'all' | 'manufacturers' | 'influencers' | 'projects' | 'profit'>('all');

  const isUUID = (str?: string): boolean =>
    Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

  const hasIdParam = Boolean(id);
  const isValidParamId = hasIdParam && isUUID(id);
  const activeProductId = isValidParamId ? id : (!hasIdParam ? outletCtx?.selectedProductId : undefined);

  // Fetch optional product detail if an active product exists
  const { data: product } = useQuery({
    queryKey: queryKeys.products.detail(activeProductId),
    queryFn: () => api.products.get(activeProductId!),
    enabled: Boolean(activeProductId && isUUID(activeProductId)),
  });

  const { data: readiness } = useQuery({
    queryKey: queryKeys.validation.readiness(activeProductId),
    queryFn: () => api.validation.readiness(activeProductId!),
    enabled: Boolean(activeProductId && isUUID(activeProductId)),
  });

  const { data: latestRun } = useQuery({
    queryKey: queryKeys.validation.latest(activeProductId),
    queryFn: () => api.validation.latest(activeProductId!),
    enabled: Boolean(activeProductId && isUUID(activeProductId)),
  });

  const { data: competitorData } = useQuery({
    queryKey: queryKeys.competitors.list(activeProductId),
    queryFn: () => api.competitors.list(activeProductId!),
    enabled: Boolean(activeProductId && isUUID(activeProductId)),
  });

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* ==================================================
          PART 1: CINEMATIC 3-ZONE HERO SECTION
          ================================================== */}
      <HeroSection
        onOpenVideo={outletCtx?.onOpenVideoModal}
        onOpenValidate={() => navigate('/validation')}
        onSelectCategory={(catId) => setSelectedCategory(catId)}
      />

      {/* ==================================================
          PART 1: PRODUCT CATEGORY CAROUSEL (10 CATEGORIES)
          ================================================== */}
      <ProductCategoryCarousel
        selectedCategory={selectedCategory}
        onSelectCategory={(catId) => setSelectedCategory(catId)}
        onViewAll={() => navigate('/market-analysis')}
      />

      {/* ==================================================
          PART 2, SECTION 1: DASHBOARD ANALYTICS GRID
          Below carousel: Multi-column 2-column balanced desktop layout
          Panels:
          1. Market Insights
          2. Trending Products
          3. Demand Trend
          4. Top Opportunities
          ================================================== */}
      <section className="space-y-3 pt-1">
        <div className="flex items-center justify-between pb-1 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#25D9E8] shadow-[0_0_8px_#25D9E8]" />
            <h2 className="text-xs sm:text-sm font-bold text-[#F8FAFF] uppercase tracking-wider">
              Market Analytics & Intelligence
            </h2>
          </div>
          <span className="text-[10px] text-[#9EADC2] font-mono-nums">
            4 Core Panels • Trailing 180 Days
          </span>
        </div>

        {/* 2-Column Balanced Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 items-stretch">
          {/* Column 1: Market Insights & Demand Trend Chart */}
          <div className="space-y-4 lg:space-y-5 flex flex-col justify-between">
            {/* Panel 1: Market Insights */}
            <MarketInsightsCard />

            {/* Panel 3: Demand Trend Chart */}
            <DemandTrendCard />
          </div>

          {/* Column 2: Trending Products & Top Opportunities */}
          <div className="space-y-4 lg:space-y-5 flex flex-col justify-between">
            {/* Panel 2: Trending Products */}
            <TrendingProductsCard />

            {/* Panel 4: Top Opportunities */}
            <TopOpportunitiesCard />
          </div>
        </div>
      </section>

      {/* ==================================================
          PART 2, SECTIONS 6, 7 & 8: MANUFACTURER DISCOVERY & INFLUENCER MATCHMAKER
          ================================================== */}
      <section className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[rgba(161,190,230,0.18)]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#7547FF] shadow-[0_0_8px_#7547FF]" />
            <h2 className="text-xs sm:text-sm font-bold text-[#F8FAFF] uppercase tracking-wider">
              Sourcing & Creator Discovery Hub
            </h2>
          </div>

          {/* Quick Filter Switcher */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All Discovery Panels' },
              { id: 'manufacturers', label: 'Manufacturers Only' },
              { id: 'influencers', label: 'Creators Only' },
              { id: 'projects', label: 'My Projects' },
              { id: 'profit', label: 'Unit Economics' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveWorkspaceTab(tab.id as any)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  activeWorkspaceTab === tab.id
                    ? 'bg-gradient-to-r from-[#7547FF] to-[#278BFF] text-white shadow-md shadow-[#7547FF]/35'
                    : 'bg-[rgba(20,39,62,0.5)] text-[#9EADC2] hover:text-[#F8FAFF] border border-[rgba(161,190,230,0.15)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section 6: Manufacturer Discovery Panel */}
        {(activeWorkspaceTab === 'all' || activeWorkspaceTab === 'manufacturers') && (
          <div className="animate-in fade-in duration-200">
            <ManufacturersCard />
          </div>
        )}

        {/* Section 7 & 8: Influencer Matchmaker with Product-to-Influencer Matching */}
        {(activeWorkspaceTab === 'all' || activeWorkspaceTab === 'influencers') && (
          <div className="animate-in fade-in duration-200">
            <InfluencerMatchmakerCard />
          </div>
        )}

        {/* Additional Founder Workspace Panels (My Projects & Profit Calculator) */}
        {(activeWorkspaceTab === 'all' || activeWorkspaceTab === 'projects' || activeWorkspaceTab === 'profit') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch pt-2 animate-in fade-in duration-200">
            <div className="lg:col-span-6">
              <MyProjectsCard />
            </div>
            <div className="lg:col-span-6">
              <ProfitCalculatorCard />
            </div>
          </div>
        )}
      </section>

      {/* ==================================================
          DEEP-DIVE PRODUCT INTELLIGENCE PIPELINE (When product is loaded)
          ================================================== */}
      {product && (
        <section className="pt-4 border-t border-[rgba(161,190,230,0.18)] space-y-4">
          <div className="rounded-2xl glass-panel p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#25D9E8] uppercase tracking-wider">
                  Launch Readiness
                </span>
                <span className="text-[10px] text-[#28D7A0] font-mono-nums bg-[#28D7A0]/15 px-2 py-0.5 rounded-full border border-[#28D7A0]/30 font-semibold">
                  Viability: {readiness?.overall_score ?? 78}/100
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-[#9EADC2]">Active Analysis:</span>
                <h3 className="text-base font-bold text-white">{product.name}</h3>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDeepDive(!showDeepDive)}
              className="px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-[rgba(161,190,230,0.2)] text-xs text-[#25D9E8] font-semibold flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
            >
              <span>{showDeepDive ? 'Collapse Pipeline' : 'Expand Pipeline'}</span>
              {showDeepDive ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {showDeepDive && (
            <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
              {activeProductId && (
                <PipelineStrip
                  productId={activeProductId}
                  stageResults={(latestRun as any)?.stage_results}
                />
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <FinancialSnapshotCard
                  assumptions={product.assumptions as any}
                />
                <CompetitorPriceChart
                  competitors={competitorData?.items || []}
                  sellingPrice={product.assumptions?.pricing?.selling_price}
                />
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
