import React from 'react';
import { X, Play, Sparkles } from 'lucide-react';

export interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-3xl glass-panel rounded-2xl overflow-hidden border border-white/[0.15] shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/60 text-slate-300 hover:text-white flex items-center justify-center border border-white/[0.1] transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Video Player / Interactive Preview */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
          <img
            src="/images/hero-products.jpg"
            alt="Product Platform Demo"
            className="w-full h-full object-cover filter brightness-75 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* Central Play Badge */}
          <div className="relative z-10 flex flex-col items-center text-center p-6">
            <div className="w-16 h-16 rounded-full bg-indigo-600/90 border-2 border-white/80 shadow-[0_0_30px_rgba(99,102,241,0.6)] flex items-center justify-center mb-4 cursor-pointer hover:scale-110 transition-transform">
              <Play className="w-7 h-7 fill-white text-white ml-1" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Watch: How D2C Vision Powers $10M+ Brands
            </h3>
            <p className="text-xs text-slate-300 max-w-md mt-1.5 leading-relaxed">
              Discover how AI market analytics, supplier matching and influencer economics compress months of launch time into minutes.
            </p>
          </div>
        </div>

        {/* Video Footer */}
        <div className="p-4 bg-[#090D18] flex items-center justify-between border-t border-white/[0.08]">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Watch time: 2 mins 45 secs • HD 1080p</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-xs font-semibold text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
