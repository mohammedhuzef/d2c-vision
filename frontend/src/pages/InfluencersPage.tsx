import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Send,
  X,
  ExternalLink,
  MessageSquare,
  Award,
} from 'lucide-react';

export interface Influencer {
  id: string;
  name: string;
  handle: string;
  niche: string;
  followers: string;
  engagement: string;
  match: string;
  predictedRoi: string;
  avatar: string;
  topAudience: string;
  avgViews: string;
}

export const InfluencersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedNiche, setSelectedNiche] = useState('All');
  const [activePitchInfluencer, setActivePitchInfluencer] = useState<Influencer | null>(null);
  const [pitchSuccess, setPitchSuccess] = useState(false);
  const [pitchMessage, setPitchMessage] = useState(
    'Hey! We love your clean-eating content. We are sending out exclusive launch boxes of our single-origin adaptogenic dark chocolate. Would love to send a box your way!'
  );

  const creators: Influencer[] = [
    {
      id: '1',
      name: 'FitWithSneha',
      handle: '@fitwithsneha',
      niche: 'Health & Wellness',
      followers: '412K',
      engagement: '6.3%',
      match: '92%',
      predictedRoi: '3.8x ROAS',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      topAudience: 'Female 22-34 (Bengaluru, Mumbai)',
      avgViews: '85K views/reel',
    },
    {
      id: '2',
      name: 'Rahul Bites',
      handle: '@rahulbites',
      niche: 'Healthy Food & Snacks',
      followers: '1.2M',
      engagement: '5.4%',
      match: '88%',
      predictedRoi: '3.2x ROAS',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      topAudience: 'Male & Female 18-35 (Delhi NCR, Mumbai)',
      avgViews: '240K views/reel',
    },
    {
      id: '3',
      name: 'The Nutrition Guy',
      handle: '@nutritionguy_in',
      niche: 'Fitness & Nutrition',
      followers: '256K',
      engagement: '7.1%',
      match: '85%',
      predictedRoi: '4.2x ROAS',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
      topAudience: 'Gym goers, CrossFit athletes',
      avgViews: '62K views/reel',
    },
    {
      id: '4',
      name: 'Rhea Sharma',
      handle: '@rheasharma_living',
      niche: 'Lifestyle & Organic Living',
      followers: '184K',
      engagement: '5.9%',
      match: '82%',
      predictedRoi: '2.9x ROAS',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      topAudience: 'Urban aesthetics, Home chefs',
      avgViews: '45K views/reel',
    },
    {
      id: '5',
      name: 'Dr. Arjun K. MD',
      handle: '@dr_arjun_wellness',
      niche: 'Health & Wellness',
      followers: '320K',
      engagement: '8.4%',
      match: '94%',
      predictedRoi: '4.6x ROAS',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      topAudience: 'Biohackers, Preventive Health',
      avgViews: '110K views/reel',
    },
    {
      id: '6',
      name: 'Pooja Clean Eats',
      handle: '@pooja_cleaneats',
      niche: 'Healthy Food & Snacks',
      followers: '95K',
      engagement: '9.2%',
      match: '89%',
      predictedRoi: '5.1x ROAS',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
      topAudience: 'Keto, Gluten Free moms',
      avgViews: '40K views/reel',
    },
  ];

  const filtered = creators.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.handle.toLowerCase().includes(search.toLowerCase()) ||
      c.niche.toLowerCase().includes(search.toLowerCase());
    const matchesNiche = selectedNiche === 'All' || c.niche.includes(selectedNiche);
    return matchesSearch && matchesNiche;
  });

  const handleSendPitch = (e: React.FormEvent) => {
    e.preventDefault();
    setPitchSuccess(true);
    setTimeout(() => {
      setPitchSuccess(false);
      setActivePitchInfluencer(null);
    }, 1500);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-2">
              <Users className="w-3.5 h-3.5" />
              <span>Influencer ROI Matchmaker</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Influencer Discovery & Creator Match
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Identify verified D2C creators in health, wellness, and gourmet food with high engagement rates, audience compatibility, and predicted ROAS.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search creator name, @handle, niche..."
            className="w-full pl-9 pr-3 py-1.5 bg-white/[0.04] border border-white/[0.08] focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Niche Filter */}
          <select
            value={selectedNiche}
            onChange={(e) => setSelectedNiche(e.target.value)}
            className="px-3 py-1.5 bg-[#090D18] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none"
          >
            <option value="All">All Niches</option>
            <option value="Health & Wellness">Health & Wellness</option>
            <option value="Healthy Food & Snacks">Healthy Food & Snacks</option>
            <option value="Fitness & Nutrition">Fitness & Nutrition</option>
            <option value="Lifestyle">Lifestyle</option>
          </select>
        </div>
      </div>

      {/* Influencer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((creator) => (
          <div
            key={creator.id}
            className="glass-panel-interactive rounded-2xl p-5 border border-white/[0.08] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3 pb-3 border-b border-white/[0.06] mb-3">
                <img
                  src={creator.avatar}
                  alt={creator.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500/40"
                />
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">{creator.name}</h3>
                  <span className="text-xs text-indigo-400 font-medium">{creator.handle}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{creator.niche}</span>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center mb-3">
                <div>
                  <span className="text-slate-400 block text-[10px]">Followers</span>
                  <span className="font-bold text-white font-mono-nums">{creator.followers}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Engagement</span>
                  <span className="font-bold text-emerald-400 font-mono-nums">{creator.engagement}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Match Score</span>
                  <span className="font-bold text-purple-400 font-mono-nums">{creator.match}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-300 space-y-1 mb-3">
                <p><strong>Audience:</strong> {creator.topAudience}</p>
                <p><strong>Avg Reach:</strong> {creator.avgViews}</p>
                <p className="text-emerald-400 font-semibold"><strong>Predicted ROI:</strong> {creator.predictedRoi}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.06] flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActivePitchInfluencer(creator)}
                className="w-full btn-primary-gradient py-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Collaboration Pitch</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pitch Modal */}
      {activePitchInfluencer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md glass-panel rounded-2xl p-6 border border-white/[0.12] shadow-2xl relative">
            <button
              onClick={() => setActivePitchInfluencer(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <img
                src={activePitchInfluencer.avatar}
                alt={activePitchInfluencer.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/40"
              />
              <div>
                <h3 className="text-sm font-bold text-white">Pitch {activePitchInfluencer.name}</h3>
                <span className="text-xs text-indigo-400">{activePitchInfluencer.handle}</span>
              </div>
            </div>

            {pitchSuccess ? (
              <div className="my-6 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-white">Collaboration Pitch Sent!</p>
                <p className="text-[11px] text-slate-300 mt-1">Creator manager will receive your brief.</p>
              </div>
            ) : (
              <form onSubmit={handleSendPitch} className="space-y-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                    Creator Outreach Brief
                  </label>
                  <textarea
                    rows={4}
                    value={pitchMessage}
                    onChange={(e) => setPitchMessage(e.target.value)}
                    className="w-full p-2.5 bg-white/[0.04] border border-white/[0.1] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActivePitchInfluencer(null)}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.05] text-xs text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary-gradient px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Pitch</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
