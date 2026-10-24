import React, { useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { queryKeys } from '../services/queryKeys';
import { HeroSection } from '../components/dashboard/HeroSection';
import { CategoryCarousel } from '../components/dashboard/CategoryCarousel';
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
  Flame,
  Factory,
  DollarSign,
  Users,
  Grid,
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

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showDeepDive, setShowDeepDive] = useState<boolean>(false);
  const [activeSectionTab, setActiveSectionTab] = useState<'projects' | 'trends' | 'factories' | 'profit' | 'creators' | 'all'>('projects');

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
    <div className="space-y-5 pb-12 animate-in fade-in duration-300">
      {/* 1. GUIDED 3-STEP WIZARD (Front & Center) */}
      <HeroSection
        onOpenVideo={outletCtx?.onOpenVideoModal}
        onOpenValidate={() => navigate('/new-analysis')}
      />

      {/* 2. D2C Market Sectors Filter Bar */}
      <CategoryCarousel
        selectedCategory={selectedCategory}
        onSelectCategory={(catId) => setSelectedCategory(catId)}
      />

      {/* 3. SIMPLIFIED TOOL TABS: Focus on One Action at a Time */}
      <div className="space-y-4 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              Explore Tools & Projects
            </h2>
          </div>

          {/* Simple Tab Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'projects', label: 'My Projects & Top Ideas', icon: FolderKanban },
              { id: 'trends', label: 'Market Demand Trends', icon: Flame },
              { id: 'factories', label: 'Verified Factories', icon: Factory },
              { id: 'profit', label: 'Profit Calculator', icon: DollarSign },
              { id: 'creators', label: 'Creator Network', icon: Users },
              { id: 'all', label: 'View All Cards', icon: Grid },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSectionTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSectionTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/30'
                      : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB 1 (DEFAULT): My Projects & Top Booming Opportunities */}
        {activeSectionTab === 'projects' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch animate-in fade-in duration-200">
            <div className="lg:col-span-7">
              <MyProjectsCard />
            </div>
            <div className="lg:col-span-5">
              <TopOpportunitiesCard />
            </div>
          </div>
        )}

        {/* TAB 2: Market Demand Trends */}
        {activeSectionTab === 'trends' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch animate-in fade-in duration-200">
            <DemandTrendCard />
            <TrendingProductsCard />
            <MarketInsightsCard />
          </div>
        )}

        {/* TAB 3: Factory Directory */}
        {activeSectionTab === 'factories' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch animate-in fade-in duration-200">
            <div className="lg:col-span-8">
              <ManufacturersCard />
            </div>
            <div className="lg:col-span-4 p-5 rounded-2xl glass-panel border border-white/[0.08] flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Factory className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">How Factory Audits Work</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Every manufacturer in this directory has undergone FSSAI, ISO, or GMP facility inspections. Contact factories directly to lock in low minimum order quantities (MOQs).
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/manufacturers')}
                className="w-full py-2.5 rounded-xl btn-primary-gradient text-xs font-semibold text-white shadow-md cursor-pointer"
              >
                Open Full Sourcing Hub →
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: Profit Calculator */}
        {activeSectionTab === 'profit' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch animate-in fade-in duration-200">
            <div className="lg:col-span-8">
              <ProfitCalculatorCard />
            </div>
            <div className="lg:col-span-4 p-5 rounded-2xl glass-panel border border-white/[0.08] flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Exact Decimal Unit Economics</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Adjust selling price, packaging, and logistics buffers to find your break-even order volume.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/profit-calculator')}
                className="w-full py-2.5 rounded-xl btn-primary-gradient text-xs font-semibold text-white shadow-md cursor-pointer"
              >
                Open Full Profit Engine →
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: Creator Network */}
        {activeSectionTab === 'creators' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch animate-in fade-in duration-200">
            <div className="lg:col-span-8">
              <InfluencerMatchmakerCard />
            </div>
            <div className="lg:col-span-4 p-5 rounded-2xl glass-panel border border-white/[0.08] flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Micro-Creator ROI Matching</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Filter verified creators with 5%+ engagement in food, wellness, and beauty.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/influencers')}
                className="w-full py-2.5 rounded-xl btn-primary-gradient text-xs font-semibold text-white shadow-md cursor-pointer"
              >
                Open Influencer Finder →
              </button>
            </div>
          </div>
        )}

        {/* TAB 6: All Cards Mode (for advanced users) */}
        {activeSectionTab === 'all' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
              <MarketInsightsCard />
              <TrendingProductsCard />
              <DemandTrendCard />
              <TopOpportunitiesCard />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
              <ProfitCalculatorCard />
              <ManufacturersCard />
              <InfluencerMatchmakerCard />
              <MyProjectsCard />
            </div>
          </div>
        )}
      </div>

      {/* 4. Deep-Dive Product Intelligence Section (when active product exists) */}
      {product && (
        <div className="pt-4 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={() => setShowDeepDive(!showDeepDive)}
            className="w-full py-3 px-4 rounded-2xl glass-panel-subtle hover:bg-white/[0.06] border border-white/[0.08] flex items-center justify-between transition-all text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  Active Analysis: {product.name}
                  <span className="text-[10px] text-emerald-400 font-mono-nums bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Viability: {readiness?.overall_score ?? 78}/100
                  </span>
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  View 6-stage validation pipeline, pricing model and competitive benchmarking
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium">
              <span>{showDeepDive ? 'Collapse Analysis' : 'Expand Deep Dive'}</span>
              {showDeepDive ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showDeepDive && (
            <div className="mt-4 space-y-4 animate-in slide-in-from-top-4 duration-300">
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
        </div>
      )}
    </div>
  );
};
