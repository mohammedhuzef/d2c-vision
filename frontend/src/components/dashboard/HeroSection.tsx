import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Zap,
  Calculator,
  FolderKanban,
  Star,
} from 'lucide-react';
import { HeroAnalytics } from './HeroAnalytics';
import { HeroAIAssistant } from './HeroAIAssistant';

export interface HeroSectionProps {
  onOpenVideo?: () => void;
  onOpenValidate?: () => void;
  onSelectCategory?: (category: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenVideo,
  onOpenValidate,
  onSelectCategory,
}) => {
  const navigate = useNavigate();
  const [activePin, setActivePin] = useState<string | null>(null);

  // Modern clean HUD pins mapped to the realistic product showcase
  const productPins = [
    {
      id: 'skincare',
      title: 'Emerald Serum',
      metric: '94% Viability',
      pos: 'top-[22%] left-[10%]',
      color: '#059669',
    },
    {
      id: 'protein',
      title: 'Superfood Pouch',
      metric: '68% Margin',
      pos: 'top-[16%] left-[40%]',
      color: '#0F172A',
    },
    {
      id: 'beverages',
      title: 'Botanical Tonic',
      metric: '+54% Growth',
      pos: 'top-[24%] right-[12%]',
      color: '#0284C7',
    },
    {
      id: 'chocolate',
      title: 'Artisan Cocoa',
      metric: 'High Repeat',
      pos: 'bottom-[26%] left-[22%]',
      color: '#059669',
    },
    {
      id: 'snacks',
      title: 'Artisan Snacks',
      metric: '300 MOQ',
      pos: 'bottom-[24%] right-[18%]',
      color: '#D97706',
    },
  ];

  const handleValidateClick = () => {
    if (onOpenValidate) {
      onOpenValidate();
    } else {
      navigate('/validation');
    }
  };

  return (
    <section className="relative w-full">
      {/* 3-Zone Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* ==================================================
            ZONE 1: LEFT HERO CONTENT (Headline, Value Pillars & CTAs)
            ================================================== */}
        <div className="lg:col-span-4 rounded-2xl p-6 sm:p-7 bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between relative overflow-hidden group">
          {/* Top Headline Section */}
          <div className="relative z-10 space-y-3.5">
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-xs font-semibold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>From an Idea</span>
              <span className="text-emerald-600/70">to a Global Brand</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Turn Product Ideas<br />
              Into <span className="text-emerald-600">Profitable</span><br />
              <span className="text-slate-900">
                D2C Brands.
              </span>
            </h1>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm">
              Validate consumer demand, simulate contribution margins, and build winning product roadmaps before committing capital.
            </p>
          </div>

          {/* Middle: Core Feature Highlights */}
          <div className="relative z-10 space-y-2.5 my-5">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all">
              <div className="w-8 h-8 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 block leading-tight">AI Viability & Demand Audit</span>
                <span className="text-[11px] text-slate-500 truncate block">Real-time category velocity, margin and risk scoring</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all">
              <div className="w-8 h-8 rounded-lg bg-slate-200/80 text-slate-800 flex items-center justify-center shrink-0">
                <Calculator className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 block leading-tight">Unit Economics & Break-Even</span>
                <span className="text-[11px] text-slate-500 truncate block">Contribution margin, CAC headroom & volume simulator</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all">
              <div className="w-8 h-8 rounded-lg bg-teal-100/80 text-teal-700 flex items-center justify-center shrink-0">
                <FolderKanban className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 block leading-tight">Centralized Project Tracker</span>
                <span className="text-[11px] text-slate-500 truncate block">Track scores, statuses, and custom launch milestones</span>
              </div>
            </div>
          </div>

          {/* Bottom Section: Social Proof + CTA Buttons */}
          <div className="relative z-10 pt-4 border-t border-slate-100 space-y-4">
            {/* Social Proof Trust Strip */}
            <div className="flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&auto=format&fit=crop&q=80"
                    className="w-5 h-5 rounded-full border border-white object-cover"
                    alt="Founder"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&auto=format&fit=crop&q=80"
                    className="w-5 h-5 rounded-full border border-white object-cover"
                    alt="Founder"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=60&auto=format&fit=crop&q=80"
                    className="w-5 h-5 rounded-full border border-white object-cover"
                    alt="Founder"
                  />
                </div>
                <span className="font-medium text-slate-700">1,400+ Active Founders</span>
              </div>
              <div className="text-amber-500 font-bold flex items-center gap-1 font-mono-nums">
                <span>★★★★★</span>
                <span className="text-slate-700 font-semibold text-[11px]">4.9/5</span>
              </div>
            </div>

            {/* Action Buttons: Primary & Secondary */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Primary Emerald Button */}
              <button
                type="button"
                onClick={handleValidateClick}
                className="flex-1 btn-primary-gradient px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white shadow-xs hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Validate My Product</span>
                <ArrowRight className="w-4 h-4 text-emerald-200" />
              </button>

              {/* Secondary Clean Button */}
              <button
                type="button"
                onClick={onOpenVideo}
                className="px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs hover:text-slate-900 transition-all flex items-center gap-2 cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-emerald-600">
                  <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                </div>
                <span>Watch Video</span>
              </button>
            </div>
          </div>
        </div>

        {/* ==================================================
            ZONE 2: CENTER - REALISTIC MULTI-PRODUCT HERO SHOWCASE
            ================================================== */}
        <div className="lg:col-span-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs relative overflow-hidden flex flex-col justify-between group min-h-[460px]">
          {/* Top category indicator pills header */}
          <div className="p-3.5 flex items-center justify-between border-b border-slate-100 bg-white relative z-20">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] text-emerald-800">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-semibold">Curated Commercial Portfolio</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono-nums bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
              5 Display Platforms
            </span>
          </div>

          {/* Realistic Multi-Product Composition Container */}
          <div className="relative flex-1 w-full overflow-hidden flex items-center justify-center bg-slate-100">
            <img
              src="/images/hero-products-realistic.jpg"
              alt="D2C Multi-Product Showcase - Luxury Skincare Dropper, Superfood Pouch, Aluminium Can, Dark Chocolate Bar, and Roasted Snacks on dark stone pedestals"
              className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-500 ease-out"
            />

            {/* Clean Light Subtle Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />

            {/* Interactive floating product category HUD pins */}
            {productPins.map((pin) => (
              <div
                key={pin.id}
                onMouseEnter={() => setActivePin(pin.id)}
                onMouseLeave={() => setActivePin(null)}
                onClick={() => onSelectCategory?.(pin.id)}
                className={`absolute ${pin.pos} cursor-pointer transition-all duration-200 z-20 ${
                  activePin === pin.id ? 'scale-105 z-30' : 'opacity-95 hover:opacity-100'
                }`}
              >
                <div
                  className="px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 shadow-md flex items-center gap-1.5 transition-all"
                  style={{
                    boxShadow: activePin === pin.id ? `0 4px 14px rgba(15, 23, 42, 0.15)` : undefined,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: pin.color }}
                  />
                  <div className="flex flex-col leading-tight">
                    <span className="text-[10px] font-bold text-slate-900 whitespace-nowrap">{pin.title}</span>
                    <span className="text-[9px] font-semibold text-slate-500 font-mono-nums">{pin.metric}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Caption: Highlights realistic packaging materials & launch readiness */}
          <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-600 relative z-20">
            <span className="truncate pr-2 font-medium">Frosted Glass • Matte Pouch • Aluminium Can • Cocoa</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1 shrink-0">
              <span>Ready for Launch</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </span>
          </div>
        </div>

        {/* ==================================================
            ZONE 3: RIGHT HERO ANALYTICS & AI ASSISTANT PANELS
            ================================================== */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Top: Hero Analytics Panel */}
          <HeroAnalytics />

          {/* Bottom: Right Hero AI Assistant */}
          <HeroAIAssistant />
        </div>
      </div>
    </section>
  );
};
