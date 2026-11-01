import React, { useState } from 'react';
import {
  Users,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  SlidersHorizontal,
  TrendingUp,
  Award,
  CheckCircle2,
  DollarSign,
  MapPin,
  Send,
  Eye,
} from 'lucide-react';

export interface CreatorProfile {
  id: string;
  name: string;
  category: string;
  platform: 'Instagram' | 'YouTube' | 'TikTok';
  followers: string;
  engagement: string;
  matchScore: number;
  location: string;
  budgetEst: string;
  avatar: string;
  bio: string;
  audienceSplit: string;
  topCities: string[];
  avgViews: string;
  compatibilityNote: string;
}

export const InfluencerMatchmakerCard: React.FC = () => {
  // Filter States
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [platformFilter, setPlatformFilter] = useState('All Platforms');
  const [followerFilter, setFollowerFilter] = useState('All Followers');
  const [engagementFilter, setEngagementFilter] = useState('All Engagement');
  const [locationFilter, setLocationFilter] = useState('All Locations');
  const [budgetFilter, setBudgetFilter] = useState('All Budgets');

  // Filter Dropdowns
  const [activeFilterDropdown, setActiveFilterDropdown] = useState<string | null>(null);

  // Interactive Product-to-Influencer Matching State
  const [isMatchingOpen, setIsMatchingOpen] = useState(false);
  const [matchProduct, setMatchProduct] = useState('Artisanal 70% Dark Chocolate');
  const [matchCategory, setMatchCategory] = useState('Health & Gourmet Food');
  const [matchAudience, setMatchAudience] = useState('Urban Health-Conscious (Age 22-38)');
  const [matchLocation, setMatchLocation] = useState('Tier 1 Metro Cities');
  const [matchBudget, setMatchBudget] = useState('₹50,000 - ₹1,00,000');
  const [matchPlatform, setMatchPlatform] = useState('Instagram Reels');
  const [hasCalculatedMatches, setHasCalculatedMatches] = useState(false);

  // View Profile Modal State
  const [selectedCreator, setSelectedCreator] = useState<CreatorProfile | null>(null);

  const creators: CreatorProfile[] = [
    {
      id: '1',
      name: 'FITWITHSNEHA',
      category: 'Health & Wellness',
      platform: 'Instagram',
      followers: '412K',
      engagement: '6.3%',
      matchScore: 92,
      location: 'Mumbai, India',
      budgetEst: '₹35,000 - ₹50,000 / Reel',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      bio: 'Certified clinical nutritionist & functional fitness coach sharing clean nutrition recipes.',
      audienceSplit: '68% Female • 32% Male (Age 21-36)',
      topCities: ['Mumbai', 'Bengaluru', 'Delhi NCR'],
      avgViews: '185K Views / Reel',
      compatibilityNote: 'Strong affinity with clean-label dark chocolate & plant protein snacks without refined sugars.',
    },
    {
      id: '2',
      name: 'RAHUL BITES',
      category: 'Food & Nutrition',
      platform: 'YouTube',
      followers: '1.2M',
      engagement: '5.4%',
      matchScore: 88,
      location: 'Delhi, India',
      budgetEst: '₹85,000 - ₹1,20,000 / Video',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      bio: 'Culinary explorer & snack reviewer dissecting authentic tastes and artisan food craft.',
      audienceSplit: '54% Male • 46% Female (Age 18-34)',
      topCities: ['Delhi', 'Mumbai', 'Chandigarh'],
      avgViews: '420K Views / Video',
      compatibilityNote: 'High conversion track record for gourmet snacks, roasted makhana, and guilt-free treats.',
    },
    {
      id: '3',
      name: 'THE NUTRITION GUY',
      category: 'Fitness & Nutrition',
      platform: 'Instagram',
      followers: '256K',
      engagement: '7.1%',
      matchScore: 85,
      location: 'Bengaluru, India',
      budgetEst: '₹25,000 - ₹40,000 / Collab',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      bio: 'Biochemist & fitness researcher debunking wellness myths and analyzing ingredient labels.',
      audienceSplit: '61% Male • 39% Female (Age 24-40)',
      topCities: ['Bengaluru', 'Hyderabad', 'Pune'],
      avgViews: '140K Views / Reel',
      compatibilityNote: 'Highest engagement rate (7.1%) in category; followers purchase lab-tested supplements & protein.',
    },
    {
      id: '4',
      name: 'RHEA SHARMA',
      category: 'Beauty & Lifestyle',
      platform: 'Instagram',
      followers: '184K',
      engagement: '5.9%',
      matchScore: 82,
      location: 'Mumbai, India',
      budgetEst: '₹20,000 - ₹35,000 / Story + Reel',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      bio: 'Mindful living advocate focusing on holistic morning routines, herbal teas, and natural glow skincare.',
      audienceSplit: '82% Female • 18% Male (Age 20-35)',
      topCities: ['Mumbai', 'Bengaluru', 'Kolkata'],
      avgViews: '95K Views / Reel',
      compatibilityNote: 'Ideal aesthetic integration for herbal sleep teas, natural serums, and mindful wellness rituals.',
    },
  ];

  // Filtering Logic
  const filteredCreators = creators.filter((c) => {
    const matchCat =
      categoryFilter === 'All Categories' || c.category.includes(categoryFilter.split(' ')[0]);
    const matchPlat =
      platformFilter === 'All Platforms' || c.platform === platformFilter;
    const matchLoc =
      locationFilter === 'All Locations' || c.location.includes(locationFilter.split(',')[0]);

    return matchCat && matchPlat && matchLoc;
  });

  const handleRunMatching = (e: React.FormEvent) => {
    e.preventDefault();
    setHasCalculatedMatches(true);
  };

  const toggleDropdown = (name: string) => {
    setActiveFilterDropdown(activeFilterDropdown === name ? null : name);
  };

  return (
    <div
      id="influencer-matchmaker"
      className="rounded-2xl p-4 sm:p-5 bg-[rgba(20,39,62,0.72)] backdrop-blur-xl border border-[rgba(161,190,230,0.25)] shadow-xl flex flex-col justify-between h-full relative overflow-hidden transition-all duration-300 hover:border-[#25D9E8]/40"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-48 h-48 bg-[#7547FF]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[rgba(161,190,230,0.18)]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#7547FF] to-[#A855F7] text-white flex items-center justify-center shadow-md shadow-[#7547FF]/30">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#F8FAFF] tracking-tight">Influencer Matchmaker</h3>
                <span className="text-[9px] font-medium text-[#25D9E8] bg-[#25D9E8]/10 px-1.5 py-0.5 rounded border border-[#25D9E8]/30">
                  Illustrative Profiles
                </span>
              </div>
              <p className="text-[10px] text-[#9EADC2]">Find the right creators for your product.</p>
            </div>
          </div>

          {/* Button to toggle interactive Product-to-Influencer Matching */}
          <button
            type="button"
            onClick={() => setIsMatchingOpen(!isMatchingOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[rgba(117,71,255,0.15)] hover:bg-[rgba(117,71,255,0.25)] border border-[rgba(117,71,255,0.35)] text-xs font-semibold text-[#F8FAFF] hover:text-[#25D9E8] transition-all cursor-pointer self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#25D9E8]" />
            <span>Product Matching AI</span>
            {isMatchingOpen ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
          </button>
        </div>

        {/* ==================================================
            INTERACTIVE PRODUCT-TO-INFLUENCER MATCHING INTERFACE
            ================================================== */}
        {isMatchingOpen && (
          <div className="mt-3 p-3.5 rounded-2xl bg-[rgba(8,24,44,0.85)] border border-[rgba(161,190,230,0.25)] shadow-lg animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[rgba(161,190,230,0.15)]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#25D9E8]" />
                <span className="text-xs font-bold text-white">Target Product Matching Engine</span>
              </div>
              <span className="text-[9px] text-[#FFBE58] font-mono">Sample Demo Calculator</span>
            </div>

            <form onSubmit={handleRunMatching} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div>
                <label className="text-[10px] font-semibold text-[#9EADC2] block mb-1">Product Name</label>
                <input
                  type="text"
                  value={matchProduct}
                  onChange={(e) => setMatchProduct(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-[rgba(20,39,62,0.7)] border border-[rgba(161,190,230,0.2)] text-white text-xs focus:outline-none focus:border-[#25D9E8]"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-[#9EADC2] block mb-1">Product Category</label>
                <input
                  type="text"
                  value={matchCategory}
                  onChange={(e) => setMatchCategory(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-[rgba(20,39,62,0.7)] border border-[rgba(161,190,230,0.2)] text-white text-xs focus:outline-none focus:border-[#25D9E8]"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-[#9EADC2] block mb-1">Target Audience</label>
                <input
                  type="text"
                  value={matchAudience}
                  onChange={(e) => setMatchAudience(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-[rgba(20,39,62,0.7)] border border-[rgba(161,190,230,0.2)] text-white text-xs focus:outline-none focus:border-[#25D9E8]"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-[#9EADC2] block mb-1">Target Location</label>
                <input
                  type="text"
                  value={matchLocation}
                  onChange={(e) => setMatchLocation(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-[rgba(20,39,62,0.7)] border border-[rgba(161,190,230,0.2)] text-white text-xs focus:outline-none focus:border-[#25D9E8]"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-[#9EADC2] block mb-1">Campaign Budget</label>
                <input
                  type="text"
                  value={matchBudget}
                  onChange={(e) => setMatchBudget(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-[rgba(20,39,62,0.7)] border border-[rgba(161,190,230,0.2)] text-white text-xs focus:outline-none focus:border-[#25D9E8]"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-[#9EADC2] block mb-1">Preferred Social Platform</label>
                <input
                  type="text"
                  value={matchPlatform}
                  onChange={(e) => setMatchPlatform(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-[rgba(20,39,62,0.7)] border border-[rgba(161,190,230,0.2)] text-white text-xs focus:outline-none focus:border-[#25D9E8]"
                />
              </div>

              <div className="sm:col-span-3 pt-1 flex items-center justify-between">
                <span className="text-[10px] text-[#9EADC2]">
                  * Illustrative matching scores calculated based on category alignment and audience parameters.
                </span>
                <button
                  type="submit"
                  className="btn-primary-gradient px-4 py-1.5 rounded-xl text-xs font-semibold text-white shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-[#25D9E8]" />
                  <span>Update Affinity Match</span>
                </button>
              </div>
            </form>

            {hasCalculatedMatches && (
              <div className="mt-2.5 p-2 rounded-xl bg-[#28D7A0]/10 border border-[#28D7A0]/25 text-[11px] text-[#28D7A0] flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Affinity recalculated for <strong>{matchProduct}</strong>: Creators ranked by demographic compatibility index.
                </span>
              </div>
            )}
          </div>
        )}

        {/* 6 Requested Filters (Category, Platform, Follower range, Engagement rate, Location, Budget) */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('category')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[rgba(8,24,44,0.7)] hover:bg-[rgba(20,39,62,0.9)] border border-[rgba(161,190,230,0.2)] text-[11px] text-[#F8FAFF] transition-all cursor-pointer"
            >
              <span>{categoryFilter}</span>
              <ChevronDown className="w-3 h-3 text-[#9EADC2]" />
            </button>
            {activeFilterDropdown === 'category' && (
              <div className="absolute left-0 mt-1 w-44 py-1 bg-[#08182C] border border-[rgba(161,190,230,0.25)] rounded-xl shadow-xl z-30 text-[11px] backdrop-blur-xl">
                {['All Categories', 'Health & Wellness', 'Food & Nutrition', 'Beauty & Lifestyle'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setCategoryFilter(c);
                      setActiveFilterDropdown(null);
                    }}
                    className="w-full text-left px-3 py-1.5 text-[#9EADC2] hover:text-[#F8FAFF] hover:bg-white/[0.04]"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Platform Filter */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('platform')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[rgba(8,24,44,0.7)] hover:bg-[rgba(20,39,62,0.9)] border border-[rgba(161,190,230,0.2)] text-[11px] text-[#F8FAFF] transition-all cursor-pointer"
            >
              <span>{platformFilter}</span>
              <ChevronDown className="w-3 h-3 text-[#9EADC2]" />
            </button>
            {activeFilterDropdown === 'platform' && (
              <div className="absolute left-0 mt-1 w-36 py-1 bg-[#08182C] border border-[rgba(161,190,230,0.25)] rounded-xl shadow-xl z-30 text-[11px] backdrop-blur-xl">
                {['All Platforms', 'Instagram', 'YouTube'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setPlatformFilter(p);
                      setActiveFilterDropdown(null);
                    }}
                    className="w-full text-left px-3 py-1.5 text-[#9EADC2] hover:text-[#F8FAFF] hover:bg-white/[0.04]"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Follower Range Filter */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('followers')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[rgba(8,24,44,0.7)] hover:bg-[rgba(20,39,62,0.9)] border border-[rgba(161,190,230,0.2)] text-[11px] text-[#F8FAFF] transition-all cursor-pointer"
            >
              <span>{followerFilter}</span>
              <ChevronDown className="w-3 h-3 text-[#9EADC2]" />
            </button>
            {activeFilterDropdown === 'followers' && (
              <div className="absolute left-0 mt-1 w-36 py-1 bg-[#08182C] border border-[rgba(161,190,230,0.25)] rounded-xl shadow-xl z-30 text-[11px] backdrop-blur-xl">
                {['All Followers', '100K - 500K', '500K - 1M', '1M+'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => {
                      setFollowerFilter(f);
                      setActiveFilterDropdown(null);
                    }}
                    className="w-full text-left px-3 py-1.5 text-[#9EADC2] hover:text-[#F8FAFF] hover:bg-white/[0.04]"
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Engagement Rate Filter */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('engagement')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[rgba(8,24,44,0.7)] hover:bg-[rgba(20,39,62,0.9)] border border-[rgba(161,190,230,0.2)] text-[11px] text-[#F8FAFF] transition-all cursor-pointer"
            >
              <span>{engagementFilter}</span>
              <ChevronDown className="w-3 h-3 text-[#9EADC2]" />
            </button>
            {activeFilterDropdown === 'engagement' && (
              <div className="absolute left-0 mt-1 w-36 py-1 bg-[#08182C] border border-[rgba(161,190,230,0.25)] rounded-xl shadow-xl z-30 text-[11px] backdrop-blur-xl">
                {['All Engagement', '≥ 5.0%', '≥ 6.0%', '≥ 7.0%'].map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => {
                      setEngagementFilter(e);
                      setActiveFilterDropdown(null);
                    }}
                    className="w-full text-left px-3 py-1.5 text-[#9EADC2] hover:text-[#F8FAFF] hover:bg-white/[0.04]"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Location Filter */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('location')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[rgba(8,24,44,0.7)] hover:bg-[rgba(20,39,62,0.9)] border border-[rgba(161,190,230,0.2)] text-[11px] text-[#F8FAFF] transition-all cursor-pointer"
            >
              <span>{locationFilter}</span>
              <ChevronDown className="w-3 h-3 text-[#9EADC2]" />
            </button>
            {activeFilterDropdown === 'location' && (
              <div className="absolute left-0 mt-1 w-36 py-1 bg-[#08182C] border border-[rgba(161,190,230,0.25)] rounded-xl shadow-xl z-30 text-[11px] backdrop-blur-xl">
                {['All Locations', 'Mumbai, India', 'Delhi, India', 'Bengaluru, India'].map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => {
                      setLocationFilter(l);
                      setActiveFilterDropdown(null);
                    }}
                    className="w-full text-left px-3 py-1.5 text-[#9EADC2] hover:text-[#F8FAFF] hover:bg-white/[0.04]"
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Budget Filter */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('budget')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[rgba(8,24,44,0.7)] hover:bg-[rgba(20,39,62,0.9)] border border-[rgba(161,190,230,0.2)] text-[11px] text-[#F8FAFF] transition-all cursor-pointer"
            >
              <span>{budgetFilter}</span>
              <ChevronDown className="w-3 h-3 text-[#9EADC2]" />
            </button>
            {activeFilterDropdown === 'budget' && (
              <div className="absolute right-0 mt-1 w-44 py-1 bg-[#08182C] border border-[rgba(161,190,230,0.25)] rounded-xl shadow-xl z-30 text-[11px] backdrop-blur-xl">
                {['All Budgets', '₹20,000 - ₹50,000', '₹50,000 - ₹1,00,000'].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => {
                      setBudgetFilter(b);
                      setActiveFilterDropdown(null);
                    }}
                    className="w-full text-left px-3 py-1.5 text-[#9EADC2] hover:text-[#F8FAFF] hover:bg-white/[0.04]"
                  >
                    {b}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Creator Profiles List */}
      <div className="mt-3.5 space-y-2">
        {filteredCreators.map((creator) => (
          <div
            key={creator.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-xl bg-[rgba(8,24,44,0.55)] hover:bg-[rgba(20,39,62,0.85)] border border-[rgba(161,190,230,0.15)] hover:border-[#25D9E8]/40 transition-all gap-2.5 group"
          >
            {/* Left: Circular Avatar & Creator Info */}
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={creator.avatar}
                alt={creator.name}
                className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-[rgba(161,190,230,0.3)] group-hover:ring-[#25D9E8] transition-all"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-[#F8FAFF] tracking-tight truncate group-hover:text-white transition-colors">
                    {creator.name}
                  </h4>
                  <span className="text-[9.5px] font-semibold text-[#25D9E8] bg-[#25D9E8]/10 px-1.5 py-0.5 rounded border border-[#25D9E8]/25">
                    {creator.platform}
                  </span>
                </div>
                <div className="text-[10.5px] text-[#9EADC2] truncate mt-0.5 font-medium">
                  <span>{creator.category}</span>
                  <span className="mx-1.5">•</span>
                  <span>{creator.location}</span>
                </div>
              </div>
            </div>

            {/* Right: Follower Count, Engagement Rate, Match Score, View Button */}
            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-white/[0.06]">
              {/* Followers */}
              <div className="text-left sm:text-right">
                <div className="text-xs font-bold text-[#F8FAFF] font-mono-nums">{creator.followers}</div>
                <div className="text-[9px] text-[#9EADC2]">Followers</div>
              </div>

              {/* Engagement Rate */}
              <div className="text-left sm:text-right">
                <div className="text-xs font-bold text-[#28D7A0] font-mono-nums">{creator.engagement}</div>
                <div className="text-[9px] text-[#9EADC2]">Eng. Rate</div>
              </div>

              {/* Product Match Score */}
              <div className="text-left sm:text-right">
                <div className="text-xs font-extrabold text-[#7547FF] font-mono-nums bg-[#7547FF]/15 px-2 py-0.5 rounded-lg border border-[#7547FF]/30">
                  {creator.matchScore}% match
                </div>
                <div className="text-[9px] text-[#9EADC2] text-center mt-0.5">Compatibility</div>
              </div>

              {/* View Button */}
              <button
                type="button"
                onClick={() => setSelectedCreator(creator)}
                className="px-3 py-1.5 rounded-lg bg-[rgba(8,24,44,0.7)] hover:bg-[rgba(20,39,62,0.9)] border border-[rgba(161,190,230,0.25)] hover:border-[#25D9E8]/50 text-xs font-semibold text-white transition-all shadow-sm flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3 h-3 text-[#25D9E8]" />
                <span>View</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="pt-2.5 mt-3 border-t border-[rgba(161,190,230,0.12)] flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] text-[#9EADC2]">
        <span>Illustrative Demo Profiles: Metrics and match scores are simulated sample data for portfolio review.</span>
        <span className="text-[#25D9E8] font-mono">Micro-Creator AI Match</span>
      </div>

      {/* ==================================================
          VIEW PROFILE MODAL
          ================================================== */}
      {selectedCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-[#08182C] border border-[rgba(161,190,230,0.25)] p-5 sm:p-6 shadow-2xl relative text-left">
            <button
              type="button"
              onClick={() => setSelectedCreator(null)}
              className="absolute top-4 right-4 p-1 text-[#9EADC2] hover:text-[#F8FAFF] hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Creator Overview */}
            <div className="flex items-center gap-3.5 pb-4 border-b border-[rgba(161,190,230,0.15)]">
              <img
                src={selectedCreator.avatar}
                alt={selectedCreator.name}
                className="w-14 h-14 rounded-full object-cover ring-2 ring-[#7547FF] shadow-lg shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-white">{selectedCreator.name}</h4>
                  <span className="text-[10px] font-semibold text-[#25D9E8] bg-[#25D9E8]/15 px-2 py-0.5 rounded-full border border-[#25D9E8]/30">
                    {selectedCreator.platform}
                  </span>
                </div>
                <p className="text-xs text-[#9EADC2] mt-0.5">{selectedCreator.category} • {selectedCreator.location}</p>
                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#28D7A0] bg-[#28D7A0]/15 px-2 py-0.5 rounded-full mt-1.5">
                  <Sparkles className="w-3 h-3" />
                  <span>{selectedCreator.matchScore}% Product Compatibility Match</span>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="my-3 text-xs text-[#F8FAFF] leading-relaxed">
              <p className="text-[#9EADC2]">{selectedCreator.bio}</p>
            </div>

            {/* Audience Information & Metrics */}
            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-[rgba(20,39,62,0.6)] border border-[rgba(161,190,230,0.18)] text-center">
              <div>
                <span className="text-[9.5px] text-[#9EADC2] uppercase tracking-wider block">Followers</span>
                <span className="text-sm font-bold text-white font-mono-nums">{selectedCreator.followers}</span>
              </div>
              <div>
                <span className="text-[9.5px] text-[#9EADC2] uppercase tracking-wider block">Engagement</span>
                <span className="text-sm font-bold text-[#28D7A0] font-mono-nums">{selectedCreator.engagement}</span>
              </div>
              <div>
                <span className="text-[9.5px] text-[#9EADC2] uppercase tracking-wider block">Avg. Reel Reach</span>
                <span className="text-sm font-bold text-[#25D9E8] font-mono-nums">{selectedCreator.avgViews}</span>
              </div>
            </div>

            <div className="my-3 space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[rgba(8,24,44,0.7)] border border-[rgba(161,190,230,0.15)] space-y-1">
                <span className="text-[10px] font-semibold text-[#9EADC2] block uppercase tracking-wider">
                  Audience Demographics & Top Metro Reach
                </span>
                <p className="text-white text-xs font-medium">{selectedCreator.audienceSplit}</p>
                <div className="flex gap-1.5 pt-0.5">
                  {selectedCreator.topCities.map((city, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-white/[0.05] text-[10px] text-[#9EADC2]">
                      {city}
                    </span>
                  ))}
                </div>
              </div>

              {/* Product Compatibility & Estimated Campaign Budget Field */}
              <div className="p-2.5 rounded-xl bg-[rgba(8,24,44,0.7)] border border-[rgba(161,190,230,0.15)] space-y-1">
                <span className="text-[10px] font-semibold text-[#25D9E8] block uppercase tracking-wider">
                  Product Compatibility Insights
                </span>
                <p className="text-[#9EADC2] text-xs leading-relaxed">{selectedCreator.compatibilityNote}</p>
                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-[#9EADC2]">Estimated Campaign Budget:</span>
                  <span className="font-bold text-[#FFBE58] font-mono-nums">{selectedCreator.budgetEst}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[rgba(161,190,230,0.15)]">
              <button
                type="button"
                onClick={() => setSelectedCreator(null)}
                className="px-3.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs text-[#9EADC2] hover:text-white transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(`Collab outreach link prepared for ${selectedCreator.name}! (Demo Mode)`);
                  setSelectedCreator(null);
                }}
                className="btn-primary-gradient px-4 py-1.5 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Prepare Gifted Seeding Pitch</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
