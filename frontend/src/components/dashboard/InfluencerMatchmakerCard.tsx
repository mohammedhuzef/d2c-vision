import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ChevronDown, ArrowRight, X } from 'lucide-react';

export interface InfluencerItem {
  id: string;
  name: string;
  niche: string;
  followers: string;
  engagement: string;
  match: string;
  avatar: string;
}

export const InfluencerMatchmakerCard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerItem | null>(null);

  const influencers: InfluencerItem[] = [
    {
      id: '1',
      name: 'FitWithSneha',
      niche: 'Health & Wellness',
      followers: '412K',
      engagement: '6.3%',
      match: '92%',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    },
    {
      id: '2',
      name: 'Rahul Bites',
      niche: 'Healthy Food',
      followers: '1.2M',
      engagement: '5.4%',
      match: '88%',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    },
    {
      id: '3',
      name: 'The Nutrition Guy',
      niche: 'Fitness & Nutrition',
      followers: '256K',
      engagement: '7.1%',
      match: '85%',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    },
    {
      id: '4',
      name: 'Rhea Sharma',
      niche: 'Lifestyle',
      followers: '184K',
      engagement: '5.9%',
      match: '82%',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    },
  ];

  return (
    <div id="influencer-matchmaker" className="glass-panel rounded-2xl p-4 border border-white/[0.08] flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white tracking-tight">Influencer Matchmaker</span>
              <p className="text-[10px] text-slate-400">Find the perfect influencers for your product.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/influencers')}
            className="text-[11px] font-medium text-slate-400 hover:text-indigo-400 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>See All</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {['Category', 'Followers', 'Engagement', 'Platform'].map((filter) => (
            <button
              key={filter}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[11px] text-slate-300 hover:text-white transition-colors"
            >
              <span>{filter}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Influencers List */}
      <div className="mt-3 space-y-2">
        {influencers.map((inf) => (
          <div
            key={inf.id}
            className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] transition-all"
          >
            {/* Left: Avatar & Info */}
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={inf.avatar}
                alt={inf.name}
                className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-white/10"
              />
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-white truncate">{inf.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{inf.niche}</div>
              </div>
            </div>

            {/* Metrics */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="text-right">
                <div className="text-[11px] font-bold text-white font-mono-nums">{inf.followers}</div>
                <div className="text-[9px] text-slate-400">Followers</div>
              </div>

              <div className="text-right hidden sm:block">
                <div className="text-[11px] font-bold text-slate-300 font-mono-nums">{inf.engagement}</div>
                <div className="text-[9px] text-slate-400">Eng. Rate</div>
              </div>

              <div className="text-right">
                <div className="text-[11px] font-extrabold text-emerald-400 font-mono-nums">{inf.match}</div>
                <div className="text-[9px] text-slate-400">Match</div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedInfluencer(inf)}
                className="px-2.5 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 hover:text-white text-[11px] font-semibold transition-all cursor-pointer"
              >
                View
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Influencer Detail Modal */}
      {selectedInfluencer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm glass-panel rounded-2xl p-5 border border-white/[0.12] shadow-2xl relative">
            <button
              onClick={() => setSelectedInfluencer(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <img
                src={selectedInfluencer.avatar}
                alt={selectedInfluencer.name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500/50"
              />
              <div>
                <h3 className="text-sm font-bold text-white">{selectedInfluencer.name}</h3>
                <p className="text-xs text-indigo-300">{selectedInfluencer.niche}</p>
                <div className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full mt-1">
                  {selectedInfluencer.match} Audience Compatibility
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
              <div>
                <span className="text-[10px] text-slate-400 block">Total Followers</span>
                <span className="text-base font-extrabold text-white font-mono-nums">{selectedInfluencer.followers}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Engagement Rate</span>
                <span className="text-base font-extrabold text-emerald-400 font-mono-nums">{selectedInfluencer.engagement}</span>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedInfluencer(null)}
                className="flex-1 py-2 rounded-xl bg-white/[0.05] text-xs text-slate-300 hover:text-white"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(`Collab outreach link prepared for ${selectedInfluencer.name}!`);
                  setSelectedInfluencer(null);
                }}
                className="flex-1 btn-primary-gradient py-2 rounded-xl text-xs font-semibold text-white"
              >
                Send Pitch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
