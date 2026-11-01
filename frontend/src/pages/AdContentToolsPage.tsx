import React, { useState, useMemo } from 'react';
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
  Plus,
  Trash2,
  X,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

export const AdContentToolsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'adcopy' | 'social' | 'campaign' | 'concepts' | 'calendar'>('adcopy');
  const [selectedProduct, setSelectedProduct] = useState('Healthy Chocolate (70% Dark Cocoa)');
  const [tone, setTone] = useState<'Punchy & Bold' | 'Luxury & Premium' | 'Science & Health' | 'Playful'>('Punchy & Bold');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Content calendar dynamic state
  const [calendarSlots, setCalendarSlots] = useState([
    { id: 'cal-1', day: 'Monday', title: 'Behind the Scenes: Sourcing Single-Origin Botanicals', channel: 'Instagram Reel', status: 'Published' },
    { id: 'cal-2', day: 'Tuesday', title: 'Infographic: Refined Sugar vs Clean Monk Fruit', channel: 'Carousel / Pin', status: 'Scheduled' },
    { id: 'cal-3', day: 'Thursday', title: 'Customer Unboxing Spotlight (Sneha R. 3-Pack)', channel: 'TikTok / Story', status: 'Drafting' },
    { id: 'cal-4', day: 'Friday', title: 'Weekend Flash Bundle: Buy 2 Get 1 Free Promo', channel: 'Email Newsletter', status: 'Scheduled' },
    { id: 'cal-5', day: 'Sunday', title: 'Founder Note: Why we rejected supermarket brokers', channel: 'LinkedIn Post', status: 'Drafting' },
  ]);

  // Modal to add calendar entry
  const [isAddCalOpen, setIsAddCalOpen] = useState(false);
  const [newCalDay, setNewCalDay] = useState('Wednesday');
  const [newCalTitle, setNewCalTitle] = useState('');
  const [newCalChannel, setNewCalChannel] = useState('Instagram Reel');

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 700);
  };

  // Add Calendar Entry
  const handleAddCalendarSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCalTitle.trim()) return;
    const newSlot = {
      id: `cal-${Date.now()}`,
      day: newCalDay,
      title: newCalTitle,
      channel: newCalChannel,
      status: 'Scheduled',
    };
    setCalendarSlots([...calendarSlots, newSlot]);
    setNewCalTitle('');
    setIsAddCalOpen(false);
  };

  // Toggle calendar slot status
  const handleToggleStatus = (id: string) => {
    setCalendarSlots(
      calendarSlots.map((slot) => {
        if (slot.id !== id) return slot;
        const nextStatus = slot.status === 'Drafting' ? 'Scheduled' : slot.status === 'Scheduled' ? 'Published' : 'Drafting';
        return { ...slot, status: nextStatus };
      })
    );
  };

  // Delete calendar slot
  const handleDeleteSlot = (id: string) => {
    setCalendarSlots(calendarSlots.filter((slot) => slot.id !== id));
  };

  // Dynamic Content based on Product and Tone
  const contentDatabase = useMemo(() => {
    const isLuxury = tone === 'Luxury & Premium';
    const isScience = tone === 'Science & Health';
    const isPlayful = tone === 'Playful';

    const pName = selectedProduct.split('(')[0].trim();

    return {
      adCopies: [
        {
          id: 'ad-1',
          platform: 'Meta / Instagram Feed Ad',
          badge: 'High-CTR Hook',
          headline: isLuxury
            ? `The Art of Clean Indulgence: Handcrafted ${pName}.`
            : isScience
            ? `Clinically Clean: 0g Added Sugar in Every Batch of ${pName}.`
            : isPlayful
            ? `Ditch the 4 PM Sugar Crash with our ${pName} 🍫`
            : `Craving a snack at 4 PM? Upgrade your routine with ${pName}.`,
          body: isLuxury
            ? `Single-origin botanicals meets uncompromising purity. Formulated without industrial fillers or artificial sweeteners.\n\n✨ Certified Organic Ingredients\n📦 Numbered Batch Reserve\n🌿 Complimentary Eco-Insulated Shipping on Multi-Packs.`
            : isScience
            ? `Most market alternatives are 40% refined sugar and palm fats. We lab-verify each batch for glycemic stability and functional bio-availability.\n\n🧪 0g Added Sugar\n🔬 Zero Artificial Preservatives\n📊 10,000+ Verified 5-Star Customer Reviews.`
            : `Say goodbye to jittery spikes and guilt. Freshly crafted, slow-roasted, and delivered direct from our workshop to your door in 48 hours.\n\n💥 High Protein & Zero Palm Oil\n📦 Try the Discovery 3-Pack Sampler\n⚡ 100% Full Refund Guarantee if not obsessed.`,
          cta: isLuxury ? 'Explore the Reserve Batch' : 'Claim Your 20% Founder Discount',
        },
        {
          id: 'ad-2',
          platform: 'Reels & TikTok 15-Sec UGC Video Script',
          badge: 'Creator Hook',
          headline: `“I threw away all store-bought snacks after testing this.”`,
          body: `Script:\n0:00 - (Close-up crisp product unboxing audio)\n0:03 - "This has zero refined sugar, but tastes richer than imported Swiss brands."\n0:08 - (Camera pans to ingredient label showing only 4 clean components)\n0:12 - "Stocked up with the 3-pack bundle. Tap below before this batch sells out."`,
          cta: 'Shop Viral TikTok Sampler',
        },
        {
          id: 'ad-3',
          platform: 'Google Search High-Intent Ad',
          badge: 'Search Intent',
          headline: `Best Clean ${pName} India | 0g Sugar | Official Brand Store`,
          body: `Freshly crafted with organic ingredients & adaptogens. Vegan, keto & diabetic friendly. Free 48-hour delivery on starter packs. Order direct for 20% off.`,
          cta: 'Shop Now & Get Free Bonus Tin',
        },
      ],
      socialPosts: [
        {
          id: 'soc-1',
          platform: 'Instagram Educational Carousel (4 Slides)',
          caption: `Swipe to see what happens to your afternoon energy with standard snacks vs ${pName} 📊\n\nSlide 1: The 4 PM slump is real.\nSlide 2: Blood glucose spike from commercial corn syrup and palm oil.\nSlide 3: Steady sustained focus with organic single-origin botanicals.\nSlide 4: Which afternoon snack are you choosing today?\n\nTell us in the comments! 👇`,
          hashtags: '#D2CBrand #CleanEating #FunctionalFood #HealthyLifestyle #MindfulLiving #StartupIndia',
        },
        {
          id: 'soc-2',
          platform: 'LinkedIn Founder Story & Supply Chain Transparency',
          caption: `Why we rejected 12 supermarket distributor contracts before launching our D2C brand.\n\nTraditional retail brokers demand 45% distributor margins and 90-day credit windows.\nInstead, we invested that 45% back into ethical direct farmer partnerships and small-batch production.\n\nThe result? Our customers receive products roasted within 4 days, and our unit gross margin is 62%.\n\nBuilding modern D2C in 2026 is about radical transparency.`,
          hashtags: '#D2C #StartupJourney #Entrepreneurship #BrandBuilding #FoodTech #SupplyChain',
        },
      ],
      ugcAngles: [
        {
          id: 'ugc-1',
          title: `Angle 1: The "Secret Sugar" Expose`,
          hook: `"I scanned 10 store-bought options with a food scanner app. Look what they're hiding."`,
          why: 'Leverages consumer skepticism around deceptive "healthy" corporate claims. Positions your product as the trustworthy clean solution.',
        },
        {
          id: 'ugc-2',
          title: `Angle 2: 4 PM Desk Ritual Replacement`,
          hook: `"Stop drinking your 3rd lukewarm coffee at 4 PM. Have a serving of this instead."`,
          why: 'Ties your product into an existing daily micro-habit (the afternoon energy slump) with a frictionless swap.',
        },
      ],
    };
  }, [selectedProduct, tone]);

  // Campaign Milestones
  const campaignMilestones = [
    {
      stage: 'Phase 1: VIP Waitlist & Gifting Seeding',
      days: 'Days -14 to -1',
      budget: '₹25,000 (25% spend)',
      target: '1,500 qualified WhatsApp & Email VIP signups via teaser landing page and influencer gift drops.',
      status: 'Ready',
    },
    {
      stage: 'Phase 2: Launch Day Flash Drop',
      days: 'Day 1 to Day 5',
      budget: '₹50,000 (50% spend)',
      target: 'Synchronized unboxing videos from 25 micro-creators + Meta Lookalike campaigns targeting waitlist.',
      status: 'Scheduled',
    },
    {
      stage: 'Phase 3: Retargeting & Review Harvesting',
      days: 'Day 6 to Day 30',
      budget: '₹25,000 (25% spend)',
      target: 'Dynamic catalog retargeting on abandoned carts; automated review request SMS sequence offering ₹100 credit.',
      status: 'Planned',
    },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="rounded-2xl p-6 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#A855F7]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#A855F7]/15 border border-[#A855F7]/30 text-[#A855F7] text-xs font-semibold mb-2">
              <Megaphone className="w-3.5 h-3.5" />
              <span>D2C Marketing & Creative Studio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFF] tracking-tight">
              Ad & Content Generator Studio
            </h1>
            <p className="text-xs sm:text-sm text-[#9EADC2] mt-1 max-w-2xl">
              Produce high-converting Meta and Google ad copies, viral creator video hooks, multi-week campaign roadmaps, and scheduling calendars tailored to your product persona.
            </p>
          </div>

          {/* Product & Tone Pickers */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="px-3 py-2 bg-[#08182C] border border-[rgba(161,190,230,0.2)] rounded-xl text-xs text-[#F8FAFF] focus:outline-none cursor-pointer"
            >
              <option value="Healthy Chocolate (70% Dark Cocoa)">Healthy Chocolate (70% Dark Cocoa)</option>
              <option value="Roasted Makhana (Himalayan Pink Salt)">Roasted Makhana (Himalayan Pink Salt)</option>
              <option value="Plant Protein Bar (20g Protein)">Plant Protein Bar (20g Protein)</option>
              <option value="Cold Brew Tonic (Hibiscus Sparkling)">Cold Brew Tonic (Hibiscus Sparkling)</option>
              <option value="Barrier Repair Peptide Serum">Barrier Repair Peptide Serum</option>
            </select>

            <button
              type="button"
              onClick={handleGenerate}
              className="btn-primary-gradient px-3.5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>Regenerate</span>
            </button>
          </div>
        </div>
      </div>

      {/* Labelled Demo Banner */}
      <div className="p-3.5 rounded-xl bg-[#7547FF]/10 border border-[#7547FF]/25 text-xs text-indigo-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#25D9E8] shrink-0" />
          <span className="text-[#F8FAFF]">
            <strong>Creative Engine:</strong> High-converting frameworks synthesized from top D2C scale-ups. Configure custom Gemini / OpenAI API keys in Settings to connect live LLMs.
          </span>
        </div>
        <span className="text-[10px] font-bold text-[#25D9E8] bg-[#25D9E8]/15 px-2 py-0.5 rounded-full border border-[#25D9E8]/30 shrink-0 self-start sm:self-auto">
          Demo Suite
        </span>
      </div>

      {/* Tone Selector Pills */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#9EADC2] flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5 text-[#25D9E8]" />
            <span>Brand Tone:</span>
          </span>
          <div className="flex items-center gap-1.5">
            {(['Punchy & Bold', 'Luxury & Premium', 'Science & Health', 'Playful'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTone(t)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  tone === t
                    ? 'bg-gradient-to-r from-[#7547FF] to-[#278BFF] text-white shadow-sm'
                    : 'bg-[rgba(8,24,44,0.6)] text-[#9EADC2] hover:text-white border border-[rgba(161,190,230,0.15)]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <span className="text-[11px] text-[#9EADC2]">
          Selected Product: <strong className="text-[#F8FAFF]">{selectedProduct.split('(')[0]}</strong>
        </span>
      </div>

      {/* Studio Navigation Tabs */}
      <div className="rounded-2xl p-1.5 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl flex items-center gap-1 overflow-x-auto no-scrollbar shadow-lg">
        {[
          { id: 'adcopy', label: 'Ad Copy Studio', icon: Megaphone },
          { id: 'social', label: 'Social Media Captions', icon: FileText },
          { id: 'campaign', label: 'Campaign Roadmap', icon: Layers },
          { id: 'concepts', label: 'UGC & Video Angles', icon: Palette },
          { id: 'calendar', label: 'Publishing Calendar', icon: Calendar },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#7547FF] to-[#278BFF] text-white shadow-md'
                  : 'text-[#9EADC2] hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: AD COPY STUDIO */}
      {activeTab === 'adcopy' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {contentDatabase.adCopies.map((ad) => (
              <div
                key={ad.id}
                className="rounded-2xl p-5 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[rgba(161,190,230,0.18)] mb-3">
                    <span className="text-[11px] font-semibold text-slate-300">{ad.platform}</span>
                    <span className="text-[10px] font-bold text-[#25D9E8] bg-[#25D9E8]/15 px-2 py-0.5 rounded-full border border-[#25D9E8]/30">
                      {ad.badge}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white mb-2 leading-snug">{ad.headline}</h4>
                  <p className="text-xs text-[#9EADC2] whitespace-pre-line leading-relaxed mb-4">
                    {ad.body}
                  </p>
                </div>

                <div className="pt-3 border-t border-[rgba(161,190,230,0.15)] flex items-center justify-between gap-2">
                  <span className="text-[10px] text-[#28D7A0] font-semibold truncate block">
                    CTA: {ad.cta}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(ad.id, `${ad.headline}\n\n${ad.body}\n\nCTA: ${ad.cta}`)}
                    className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white text-xs flex items-center gap-1 shrink-0 transition-colors cursor-pointer border border-[rgba(161,190,230,0.15)]"
                  >
                    {copiedId === ad.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#28D7A0]" />
                        <span className="text-[10px] text-[#28D7A0]">Copied</span>
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

      {/* TAB 2: SOCIAL MEDIA CAPTIONS */}
      {activeTab === 'social' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contentDatabase.socialPosts.map((soc) => (
            <div
              key={soc.id}
              className="rounded-2xl p-5 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[rgba(161,190,230,0.18)] mb-3">
                  <span className="text-xs font-bold text-white">{soc.platform}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(soc.id, `${soc.caption}\n\n${soc.hashtags}`)}
                    className="flex items-center gap-1 text-[11px] text-[#25D9E8] hover:text-white cursor-pointer"
                  >
                    {copiedId === soc.id ? <Check className="w-3.5 h-3.5 text-[#28D7A0]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === soc.id ? 'Copied Post' : 'Copy Post'}</span>
                  </button>
                </div>

                <p className="text-xs text-[#9EADC2] whitespace-pre-line leading-relaxed mb-4">
                  {soc.caption}
                </p>
              </div>

              <div className="pt-3 border-t border-[rgba(161,190,230,0.15)] text-[11px] text-[#25D9E8] font-mono break-words">
                {soc.hashtags}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: CAMPAIGN PLANNER */}
      {activeTab === 'campaign' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {campaignMilestones.map((milestone) => (
              <div
                key={milestone.stage}
                className="rounded-2xl p-5 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[rgba(161,190,230,0.18)] mb-3">
                    <span className="text-[10px] font-bold text-[#25D9E8] bg-[#25D9E8]/15 px-2.5 py-0.5 rounded-full border border-[#25D9E8]/30">
                      {milestone.days}
                    </span>
                    <span className="text-[10px] text-[#9EADC2] font-mono-nums">{milestone.budget}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-2">{milestone.stage}</h4>
                  <p className="text-xs text-[#9EADC2] leading-relaxed">{milestone.target}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-[rgba(161,190,230,0.15)] flex items-center justify-between text-[11px]">
                  <span className="text-[#9EADC2]">Execution State:</span>
                  <span className="text-[#28D7A0] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{milestone.status}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CREATIVE & UGC ANGLES */}
      {activeTab === 'concepts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contentDatabase.ugcAngles.map((ugc) => (
            <div
              key={ugc.id}
              className="rounded-2xl p-5 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl shadow-lg space-y-3"
            >
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Video className="w-4 h-4 text-[#A855F7]" />
                <span>{ugc.title}</span>
              </h4>
              <p className="text-xs text-[#F8FAFF] leading-relaxed p-3 rounded-xl bg-[rgba(8,24,44,0.6)] border border-[rgba(161,190,230,0.15)]">
                <strong>Creator Hook:</strong> {ugc.hook}
              </p>
              <p className="text-xs text-[#9EADC2] leading-relaxed">
                <strong>Psychological Trigger:</strong> {ugc.why}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: CONTENT CALENDAR */}
      {activeTab === 'calendar' && (
        <div className="rounded-2xl p-5 bg-[rgba(20,39,62,0.72)] border border-[rgba(161,190,230,0.25)] backdrop-blur-xl shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[rgba(161,190,230,0.18)] mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Weekly Multi-Channel Publishing Schedule</h3>
              <p className="text-[11px] text-[#9EADC2]">Click status badge to toggle progression; add custom slots for your campaign.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddCalOpen(true)}
              className="btn-primary-gradient px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-md cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Schedule Slot</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {calendarSlots.map((slot) => (
              <div
                key={slot.id}
                className="p-3 rounded-xl bg-[rgba(8,24,44,0.5)] hover:bg-[rgba(8,24,44,0.8)] border border-[rgba(161,190,230,0.15)] flex items-center justify-between transition-colors gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-20 text-xs font-bold text-[#25D9E8] shrink-0">{slot.day}</span>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-white block truncate">{slot.title}</span>
                    <span className="text-[10px] text-[#9EADC2]">{slot.channel}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(slot.id)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border cursor-pointer transition-all ${
                      slot.status === 'Published'
                        ? 'text-[#28D7A0] bg-[#28D7A0]/15 border-[#28D7A0]/30'
                        : slot.status === 'Scheduled'
                        ? 'text-[#25D9E8] bg-[#25D9E8]/15 border-[#25D9E8]/30'
                        : 'text-amber-400 bg-amber-500/15 border-amber-500/30'
                    }`}
                    title="Click to toggle status"
                  >
                    {slot.status}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSlot(slot.id)}
                    className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Delete slot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Entry Modal */}
          {isAddCalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
              <div className="w-full max-w-md rounded-2xl p-6 bg-[rgba(15,30,50,0.95)] border border-[rgba(161,190,230,0.3)] shadow-2xl relative">
                <button
                  type="button"
                  onClick={() => setIsAddCalOpen(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>

                <h3 className="text-sm font-bold text-white mb-4">Add Publishing Slot</h3>

                <form onSubmit={handleAddCalendarSlot} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-semibold text-[#F8FAFF] block mb-1">Day of Week</label>
                    <select
                      value={newCalDay}
                      onChange={(e) => setNewCalDay(e.target.value)}
                      className="w-full px-3 py-2 bg-[#08182C] border border-[rgba(161,190,230,0.2)] rounded-xl text-xs text-white focus:outline-none"
                    >
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#F8FAFF] block mb-1">Channel / Platform</label>
                    <select
                      value={newCalChannel}
                      onChange={(e) => setNewCalChannel(e.target.value)}
                      className="w-full px-3 py-2 bg-[#08182C] border border-[rgba(161,190,230,0.2)] rounded-xl text-xs text-white focus:outline-none"
                    >
                      <option value="Instagram Reel">Instagram Reel</option>
                      <option value="Instagram Carousel">Instagram Carousel</option>
                      <option value="TikTok Video">TikTok Video</option>
                      <option value="LinkedIn Post">LinkedIn Post</option>
                      <option value="Email Newsletter">Email Newsletter</option>
                      <option value="Twitter/X Thread">Twitter/X Thread</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#F8FAFF] block mb-1">Content Concept Title</label>
                    <input
                      type="text"
                      required
                      value={newCalTitle}
                      onChange={(e) => setNewCalTitle(e.target.value)}
                      placeholder="e.g. Unboxing 3-Pack Discovery Box..."
                      className="w-full px-3 py-2 bg-[rgba(8,24,44,0.7)] border border-[rgba(161,190,230,0.2)] rounded-xl text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddCalOpen(false)}
                      className="px-3 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary-gradient px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-md cursor-pointer"
                    >
                      Add Slot
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
