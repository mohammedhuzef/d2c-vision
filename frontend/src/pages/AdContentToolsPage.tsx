import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Calendar,
  Layers,
  Megaphone,
  Palette,
  Send,
  Video,
  FileText,
  Clock,
  RefreshCw,
} from 'lucide-react';

export const AdContentToolsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'adcopy' | 'social' | 'campaign' | 'concepts' | 'calendar'>('adcopy');
  const [selectedProduct, setSelectedProduct] = useState('Healthy Chocolate (70% Dark Cocoa)');
  const [tone, setTone] = useState<'Punchy & Bold' | 'Luxury & Premium' | 'Science & Health' | 'Playful'>('Punchy & Bold');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 800);
  };

  // Demo Ad Copies
  const adCopies = [
    {
      id: 'ad-1',
      platform: 'Instagram / Facebook Feed Ad',
      badge: 'High CTR Hook',
      headline: 'Craving chocolate at 4 PM? Ditch the sugar crash.',
      body: 'Most dark chocolates are secretly 40% refined sugar. Our 70% Single-Origin Cocoa uses organic monk fruit and real ashwagandha for clean energy that doesn’t spike your insulin.\n\n✨ 0g Added Sugar\n🌿 100% Single-Origin Craft Cocoa\n📦 Free Shipping on 3-Packs today only.',
      cta: 'Shop Now — 20% Off Your First Box',
    },
    {
      id: 'ad-2',
      platform: 'Instagram Reels / TikTok Video Hook',
      badge: 'Founder Story Angle',
      headline: '“I spent 14 months trying to make chocolate that wouldn’t ruin my keto diet.”',
      body: 'Script:\n0:00 - (Hold chocolate bar, snap it crisp close to mic for ASMR)\n0:03 - "This bar has 0 grams of sugar, but tastes richer than Swiss milk chocolate."\n0:08 - (Cut to raw cocoa nibs and lab testing report)\n0:15 - "Try our sampler box. If you don\'t love it, we refund every rupee."',
      cta: 'Claim Limited Batch Sampler',
    },
    {
      id: 'ad-3',
      platform: 'Google Search High-Intent Ad',
      badge: 'Intent Capture',
      headline: 'Best Healthy Dark Chocolate India | No Refined Sugar | D2C Vision Brand',
      body: 'Handcrafted with 70% raw cocoa and adaptogens. Vegan, Keto & Diabetic friendly. Order fresh batches straight from our Mangaluru roastery. 10,000+ 5-star reviews.',
      cta: 'Order Now & Get Free Protein Bites',
    },
  ];

  // Social Captions
  const socialCaptions = [
    {
      id: 'soc-1',
      platform: 'Instagram Carousel Post',
      caption: `Swipe to see what 50g of ordinary chocolate does to your blood glucose vs our adaptogenic bar 📊\n\nSlide 1: The 4 PM slump is real.\nSlide 2: Blood glucose spike after standard chocolate.\nSlide 3: Steady sustained focus with raw polyphenols.\n\nWhich afternoon snack are you choosing today? Tell us in the comments! 👇`,
      hashtags: '#D2CBrand #CleanEating #DarkChocolate #HealthySnacks #FunctionalFood #SugarFreeLife',
    },
    {
      id: 'soc-2',
      platform: 'LinkedIn Founder Story',
      caption: `Why we said NO to 12 supermarket retail distribution deals before launching our D2C website.\n\nRetail brokers asked for 45% distributor margins and 90-day payment cycles.\nInstead, we invested that 45% into sourcing single-origin cocoa from smallholder farmers in Karnataka.\n\nThe result? Our customers get fresher chocolate delivered in 48 hours, and our gross margins are 62%.\n\nBuilding D2C in 2026 is about radical supply chain transparency.`,
      hashtags: '#D2C #StartupJourney #Entrepreneurship #BrandBuilding #FoodTech',
    },
  ];

  // Campaign Milestones
  const campaignMilestones = [
    {
      stage: 'Phase 1: VIP Waitlist & Teaser',
      days: 'Days -14 to -1',
      budget: '₹25,000 (30% of spend)',
      target: 'Gather 1,500 qualified email & WhatsApp VIP waitlist leads with a free shaker/tote giveaway.',
      status: 'Ready',
    },
    {
      stage: 'Phase 2: Drop Day & Micro-Influencer Blast',
      days: 'Day 1 to 5',
      budget: '₹40,000 (50% of spend)',
      target: 'Coordinated unboxing posts from 25 seeded micro-creators + Meta Lookalike ads targeting waitlist.',
      status: 'Scheduled',
    },
    {
      stage: 'Phase 3: Retargeting & Review Harvesting',
      days: 'Day 6 to 30',
      budget: '₹15,000 (20% of spend)',
      target: 'Dynamic catalog retargeting on abandoned carts; automated review request SMS sequence offering ₹100 credit.',
      status: 'Planned',
    },
  ];

  // Content Calendar slots
  const calendarSlots = [
    { day: 'Monday', title: 'Behind the Scenes: Roasting Cocoa Nibs', channel: 'Instagram Reel', status: 'Published' },
    { day: 'Tuesday', title: 'Infographic: Sugar vs Monk Fruit', channel: 'Carousel / Pin', status: 'Scheduled' },
    { day: 'Thursday', title: 'Customer Unboxing Spotlight (Sneha R.)', channel: 'TikTok / Story', status: 'Drafting' },
    { day: 'Friday', title: 'Weekend Flash Bundle: Buy 2 Get 1 Free', channel: 'Email Newsletter', status: 'Scheduled' },
    { day: 'Sunday', title: 'Founder Q&A: Sourcing from Western Ghats', channel: 'LinkedIn Post', status: 'Drafting' },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/15 border border-fuchsia-500/30 text-fuchsia-300 text-xs font-semibold mb-2">
              <Megaphone className="w-3.5 h-3.5" />
              <span>D2C Marketing & Creative Suite</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Ad & Content Generator Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Produce high-converting Meta & Google ad copy, viral social media video hooks, campaign roadmaps, and scheduling calendars tailored to your product persona.
            </p>
          </div>

          {/* Product & Tone Pickers */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="px-3 py-1.5 bg-[#090D18] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none"
            >
              <option value="Healthy Chocolate (70% Dark Cocoa)">Healthy Chocolate (70% Dark Cocoa)</option>
              <option value="Roasted Makhana (Himalayan Pink Salt)">Roasted Makhana (Himalayan Pink Salt)</option>
              <option value="Plant Protein Bar (20g Protein)">Plant Protein Bar (20g Protein)</option>
              <option value="Barrier Repair Peptide Serum">Barrier Repair Peptide Serum</option>
            </select>

            <button
              type="button"
              onClick={handleGenerate}
              className="btn-primary-gradient px-3 py-1.5 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>Regenerate</span>
            </button>
          </div>
        </div>
      </div>

      {/* Studio Navigation Tabs */}
      <div className="glass-panel rounded-2xl p-1.5 border border-white/[0.08] flex items-center gap-1 overflow-x-auto no-scrollbar">
        {[
          { id: 'adcopy', label: 'Ad Copy Studio', icon: Megaphone },
          { id: 'social', label: 'Social Media Captions', icon: FileText },
          { id: 'campaign', label: 'Campaign Planner', icon: Layers },
          { id: 'concepts', label: 'Creative & UGC Angles', icon: Palette },
          { id: 'calendar', label: 'Content Calendar', icon: Calendar },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Ad Copy Studio */}
      {activeTab === 'adcopy' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Product Focus: <strong>{selectedProduct}</strong></span>
            <span>Tone: <strong>{tone}</strong></span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {adCopies.map((ad) => (
              <div
                key={ad.id}
                className="glass-panel rounded-2xl p-5 border border-white/[0.08] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
                    <span className="text-[11px] font-semibold text-slate-300">{ad.platform}</span>
                    <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                      {ad.badge}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white mb-2 leading-snug">{ad.headline}</h4>
                  <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed mb-4">
                    {ad.body}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                  <span className="text-[10px] text-emerald-400 font-semibold truncate block">
                    CTA: {ad.cta}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(ad.id, `${ad.headline}\n\n${ad.body}\n\nCTA: ${ad.cta}`)}
                    className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white text-xs flex items-center gap-1 shrink-0 transition-colors"
                  >
                    {copiedId === ad.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Social Media Captions */}
      {activeTab === 'social' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {socialCaptions.map((soc) => (
            <div key={soc.id} className="glass-panel rounded-2xl p-5 border border-white/[0.08] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
                  <span className="text-xs font-bold text-white">{soc.platform}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(soc.id, `${soc.caption}\n\n${soc.hashtags}`)}
                    className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300"
                  >
                    {copiedId === soc.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === soc.id ? 'Copied' : 'Copy Post'}</span>
                  </button>
                </div>

                <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed mb-4">
                  {soc.caption}
                </p>
              </div>

              <div className="pt-3 border-t border-white/[0.06] text-[11px] text-indigo-300 font-mono">
                {soc.hashtags}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Campaign Planner */}
      {activeTab === 'campaign' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {campaignMilestones.map((milestone, idx) => (
              <div key={milestone.stage} className="glass-panel rounded-2xl p-5 border border-white/[0.08] relative">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
                  <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/15 px-2 py-0.5 rounded-full">
                    {milestone.days}
                  </span>
                  <span className="text-[10px] text-slate-400">{milestone.budget}</span>
                </div>
                <h4 className="text-sm font-bold text-white mb-2">{milestone.stage}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{milestone.target}</p>
                <div className="mt-4 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Execution Status:</span>
                  <span className="text-emerald-400 font-bold">{milestone.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Creative & UGC Angles */}
      {activeTab === 'concepts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Video className="w-4 h-4 text-purple-400" />
              <span>Angle 1: The "Secret Sugar" Expose</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>Creator Hook:</strong> "I tested 10 store-bought dark chocolates with a continuous glucose monitor. You won't believe what brand #4 did."
            </p>
            <p className="text-xs text-slate-400">
              <strong>Why it converts:</strong> Leverages health skepticism and fear of false "healthy" marketing claims. Positions your brand as the truthful solution.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Angle 2: Afternoon Energy Replacement</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>Creator Hook:</strong> "Stop drinking your 3rd cold coffee at 4 PM. Have two squares of this adaptogenic cocoa instead."
            </p>
            <p className="text-xs text-slate-400">
              <strong>Why it converts:</strong> Taps into an existing daily micro-habit (the 4 PM coffee/slump) and substitutes it with your functional product.
            </p>
          </div>
        </div>
      )}

      {/* Tab 5: Content Calendar */}
      {activeTab === 'calendar' && (
        <div className="glass-panel rounded-2xl p-5 border border-white/[0.08]">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-4">
            <h3 className="text-sm font-bold text-white">Weekly Multi-Channel Publishing Schedule</h3>
            <span className="text-xs text-indigo-400 font-semibold">Active Campaign: Launch Week 1</span>
          </div>

          <div className="space-y-2.5">
            {calendarSlots.map((slot) => (
              <div
                key={slot.day}
                className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-20 text-xs font-bold text-indigo-300">{slot.day}</span>
                  <div>
                    <span className="text-xs font-semibold text-white block">{slot.title}</span>
                    <span className="text-[10px] text-slate-400">{slot.channel}</span>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    slot.status === 'Published'
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                      : slot.status === 'Scheduled'
                      ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
                      : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                  }`}
                >
                  {slot.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
