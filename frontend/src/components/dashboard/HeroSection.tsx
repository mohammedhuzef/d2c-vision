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
  Info,
  Star,
  Check,
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

  // Accurate HUD pins mapped to the realistic product showcase
  const productPins = [
    {
      id: 'skincare',
      title: 'Emerald Serum',
      metric: '94% Viability',
      pos: 'top-[22%] left-[12%]',
      color: '#28D7A0',
    },
    {
      id: 'protein',
      title: 'Superfood Pouch',
      metric: '68% Margin',
      pos: 'top-[16%] left-[40%]',
      color: '#7547FF',
    },
    {
      id: 'beverages',
      title: 'Botanical Tonic',
      metric: '+54% Growth',
      pos: 'top-[24%] right-[14%]',
      color: '#25D9E8',
    },
    {
      id: 'chocolate',
      title: 'Artisan Cocoa',
      metric: 'High Repeat',
      pos: 'bottom-[28%] left-[24%]',
      color: '#A855F7',
    },
    {
      id: 'snacks',
      title: 'Artisan Snacks',
      metric: '300 MOQ',
      pos: 'bottom-[24%] right-[20%]',
      color: '#FFBE58',
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
      {/* 3-Zone Cinematic Hero Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-stretch">
        {/* ==================================================
            ZONE 1: LEFT HERO CONTENT (Headline, Pillars, Social Proof & CTAs)
            ================================================== */}
        <div className="lg:col-span-4 rounded-3xl p-6 sm:p-7 bg-[rgba(20,39,62,0.72)] backdrop-blur-xl border border-[rgba(161,190,230,0.25)] shadow-2xl flex flex-col justify-between relative overflow-hidden group">
          {/* Subtle ambient light */}
          <div className="absolute top-0 left-0 w-56 h-56 bg-[#7547FF]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-[#25D9E8]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Headline Section */}
          <div className="relative z-10 space-y-3.5">
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(8,24,44,0.85)] border border-[rgba(161,190,230,0.25)] text-xs font-medium text-[#25D9E8] shadow-inner">
              <span className="w-2 h-2 rounded-full bg-[#25D9E8] shadow-[0_0_8px_#25D9E8]" />
              <span className="text-[#F8FAFF]">From an Idea</span>
              <span className="text-[#9EADC2]">to a Global Brand</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold text-[#F8FAFF] tracking-tight leading-[1.12]">
              Turn Product Ideas<br />
              Into <span className="text-[#A855F7] drop-shadow-[0_0_24px_rgba(168,85,247,0.5)]">Profitable</span><br />
              <span className="bg-gradient-to-r from-[#25D9E8] via-[#278BFF] to-[#7547FF] bg-clip-text text-transparent">
                D2C Brands.
              </span>
            </h1>

            {/* Description */}
            <p className="text-xs sm:text-sm text-[#9EADC2] leading-relaxed max-w-sm">
              Validate consumer demand, simulate unit economics, and connect with verified manufacturers before spending capital.
            </p>
          </div>

          {/* Middle: Feature Highlights (Fills the previous vertical void) */}
          <div className="relative z-10 space-y-2.5 my-4">
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[rgba(8,24,44,0.6)] border border-[rgba(161,190,230,0.15)] hover:border-[#25D9E8]/40 transition-colors">
              <div className="w-7 h-7 rounded-lg bg-[#25D9E8]/15 text-[#25D9E8] flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(37,217,232,0.25)]">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#F8FAFF] block leading-tight">AI Demand & Feasibility Audit</span>
                <span className="text-[10px] text-[#9EADC2] truncate block">Real-time category velocity & competition analysis</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[rgba(8,24,44,0.6)] border border-[rgba(161,190,230,0.15)] hover:border-[#7547FF]/40 transition-colors">
              <div className="w-7 h-7 rounded-lg bg-[#7547FF]/15 text-[#A855F7] flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(117,71,255,0.25)]">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#F8FAFF] block leading-tight">450+ Verified Contract Co-Packers</span>
                <span className="text-[10px] text-[#9EADC2] truncate block">Low pilot MOQs starting at 250 units</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[rgba(8,24,44,0.6)] border border-[rgba(161,190,230,0.15)] hover:border-[#28D7A0]/40 transition-colors">
              <div className="w-7 h-7 rounded-lg bg-[#28D7A0]/15 text-[#28D7A0] flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(40,215,160,0.25)]">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#F8FAFF] block leading-tight">Deterministic Unit Economics</span>
                <span className="text-[10px] text-[#9EADC2] truncate block">Contribution margin, CAC headroom & break-even math</span>
              </div>
            </div>
          </div>

          {/* Bottom Section: Social Proof + CTA Buttons */}
          <div className="relative z-10 pt-3 border-t border-[rgba(161,190,230,0.18)] space-y-3.5">
            {/* Social Proof Trust Strip */}
            <div className="flex items-center justify-between text-[11px] text-[#9EADC2]">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&auto=format&fit=crop&q=80"
                    className="w-5 h-5 rounded-full border border-white/20 object-cover"
                    alt="Founder"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&auto=format&fit=crop&q=80"
                    className="w-5 h-5 rounded-full border border-white/20 object-cover"
                    alt="Founder"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=60&auto=format&fit=crop&q=80"
                    className="w-5 h-5 rounded-full border border-white/20 object-cover"
                    alt="Founder"
                  />
                </div>
                <span>1,400+ Active Founders</span>
              </div>
              <div className="text-[#FFBE58] font-bold flex items-center gap-1 font-mono-nums">
                <span>★★★★★</span>
                <span className="text-slate-300 font-semibold">4.9/5</span>
              </div>
            </div>

            {/* Action Buttons: Primary & Secondary */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Primary Button */}
              <button
                type="button"
                onClick={handleValidateClick}
                className="flex-1 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#7547FF] to-[#278BFF] hover:from-[#855bff] hover:to-[#3896ff] shadow-[0_0_22px_rgba(117,71,255,0.5)] hover:shadow-[0_0_30px_rgba(117,71,255,0.7)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Validate My Product</span>
                <ArrowRight className="w-4 h-4 text-[#25D9E8]" />
              </button>

              {/* Secondary Button */}
              <button
                type="button"
                onClick={onOpenVideo}
                className="px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-[#F8FAFF] bg-[rgba(8,24,44,0.65)] hover:bg-[rgba(20,39,62,0.9)] border border-[rgba(161,190,230,0.25)] hover:border-[#25D9E8]/50 hover:text-white transition-all flex items-center gap-2 cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-white/[0.1] flex items-center justify-center text-[#25D9E8]">
                  <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                </div>
                <span>Watch Video</span>
              </button>
            </div>
          </div>
        </div>

        {/* ==================================================
            ZONE 2: CENTER - REALISTIC MULTI-PRODUCT HERO IMAGE
            ================================================== */}
        <div className="lg:col-span-4 rounded-3xl bg-[rgba(20,39,62,0.72)] backdrop-blur-xl border border-[rgba(161,190,230,0.25)] shadow-2xl relative overflow-hidden flex flex-col justify-between group min-h-[460px]">
          {/* Subtle top & bottom backlight glow */}
          <div className="absolute top-0 right-1/4 w-48 h-48 bg-[#25D9E8]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-[#7547FF]/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top category indicator pills header */}
          <div className="p-3.5 flex items-center justify-between relative z-20">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(8,24,44,0.88)] backdrop-blur-md border border-[rgba(161,190,230,0.25)] text-[10px] text-[#F8FAFF] shadow-md">
              <Sparkles className="w-3 h-3 text-[#25D9E8]" />
              <span className="font-semibold">Curated Commercial Portfolio</span>
            </div>
            <span className="text-[10px] text-[#9EADC2] font-mono-nums bg-[rgba(8,24,44,0.88)] backdrop-blur-md px-2.5 py-1 rounded-full border border-[rgba(161,190,230,0.2)]">
              5 Display Platforms
            </span>
          </div>

          {/* Realistic Multi-Product Composition Container */}
          <div className="relative flex-1 w-full overflow-hidden flex items-center justify-center">
            <img
              src="/images/hero-products-realistic.jpg"
              alt="D2C Multi-Product Showcase - Luxury Skincare Dropper, Superfood Pouch, Aluminium Can, Dark Chocolate Bar, and Roasted Snacks on dark stone pedestals"
              className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-700 ease-out"
            />

            {/* Seamless Vignette and Gradient Overlay for Cinematic Depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(8,24,44,0.92)] via-transparent to-[rgba(8,24,44,0.3)] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-[rgba(8,24,44,0.6)] via-transparent to-transparent pointer-events-none" style={{ height: '70px' }} />

            {/* Interactive floating product category HUD pins */}
            {productPins.map((pin) => (
              <div
                key={pin.id}
                onMouseEnter={() => setActivePin(pin.id)}
                onMouseLeave={() => setActivePin(null)}
                onClick={() => onSelectCategory?.(pin.id)}
                className={`absolute ${pin.pos} cursor-pointer transition-all duration-300 z-20 ${
                  activePin === pin.id ? 'scale-110 z-30' : 'opacity-95 hover:opacity-100'
                }`}
              >
                <div
                  className="px-2.5 py-1 rounded-full bg-[rgba(8,24,44,0.88)] backdrop-blur-md border border-[rgba(161,190,230,0.3)] shadow-xl flex items-center gap-1.5 transition-all"
                  style={{
                    borderColor: activePin === pin.id ? pin.color : undefined,
                    boxShadow: activePin === pin.id ? `0 0 16px ${pin.color}88` : `0 4px 12px rgba(0,0,0,0.5)`,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: pin.color }}
                  />
                  <div className="flex flex-col leading-tight">
                    <span className="text-[10px] font-bold text-[#F8FAFF] whitespace-nowrap">{pin.title}</span>
                    <span className="text-[9px] font-semibold text-[#9EADC2] font-mono-nums">{pin.metric}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Caption: Highlights realistic packaging materials & OEM readiness */}
          <div className="px-4 py-2.5 bg-[rgba(8,24,44,0.88)] backdrop-blur-md border-t border-[rgba(161,190,230,0.18)] flex items-center justify-between text-[11px] text-[#9EADC2] relative z-20">
            <span className="truncate pr-2">Frosted Glass • Matte Pouch • Aluminium Can • Cocoa</span>
            <span className="text-[#25D9E8] font-semibold flex items-center gap-1 shrink-0">
              <span>Ready for OEM</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#28D7A0]" />
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
