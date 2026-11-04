import React from 'react';
import { X, Play, Sparkles } from 'lucide-react';

export interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 flex items-center justify-center border border-white/20 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Video Player / Interactive Preview */}
        <div className="relative aspect-video w-full bg-slate-900 flex items-center justify-center overflow-hidden">
          <img
            src="/images/hero-products-realistic.jpg"
            alt="Product Platform Demo"
            className="w-full h-full object-cover filter brightness-75 scale-102"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />

          {/* Central Play Badge */}
          <div className="relative z-10 flex flex-col items-center text-center p-6">
            <div className="w-16 h-16 rounded-full bg-emerald-600 border-2 border-white shadow-xl flex items-center justify-center mb-4 cursor-pointer hover:scale-110 hover:bg-emerald-500 transition-all">
              <Play className="w-7 h-7 fill-white text-white ml-1" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Watch: How D2C Vision Powers $10M+ Brands
            </h3>
            <p className="text-xs text-slate-300 max-w-md mt-1.5 leading-relaxed">
              Discover how AI market analytics, unit economics modeling, and validation frameworks compress months of launch risk into minutes.
            </p>
          </div>
        </div>

        {/* Video Footer */}
        <div className="p-4 bg-white flex items-center justify-between border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Interactive Platform Walkthrough (3:45 mins)</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            Close Video
          </button>
        </div>
      </div>
    </div>
  );
};
