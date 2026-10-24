import React from 'react';
import { X, Crown, Check, Sparkles } from 'lucide-react';

export interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const proFeatures = [
    'Unlimited AI Product Idea Validations',
    'Full access to 5,000+ Verified Contract Manufacturers',
    'Direct Influencer Contact details & ROI forecasting',
    'Real-time Amazon & Quick Commerce demand trackers',
    'Automated Unit Economics & Packaging Cost Breakdown',
    'Exportable Pitch Decks & Investor PDF Reports',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg glass-panel rounded-2xl p-6 border border-amber-500/30 shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/30 to-amber-400/10 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <Crown className="w-5 h-5 fill-amber-400/30" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-1.5">
              <span>Upgrade to D2C Vision Pro</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </h3>
            <p className="text-xs text-slate-400">
              Supercharge your brand launches with enterprise data & AI.
            </p>
          </div>
        </div>

        {/* Price Tag */}
        <div className="my-5 p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Founder Access Plan</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-white font-mono-nums">₹2,999</span>
              <span className="text-xs text-slate-400">/ month</span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-1 rounded-full">
            Save 40% Annually
          </span>
        </div>

        {/* Feature List */}
        <div className="space-y-2.5 mb-6">
          {proFeatures.map((feat) => (
            <div key={feat} className="flex items-center gap-2.5 text-xs text-slate-200">
              <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5" />
              </div>
              <span>{feat}</span>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Maybe Later
          </button>
          <button
            type="button"
            onClick={() => {
              alert('Redirecting to Pro checkout session...');
              onClose();
            }}
            className="flex-1 btn-primary-gradient py-2.5 rounded-xl text-xs font-bold text-white shadow-lg cursor-pointer"
          >
            Get Pro Access Now
          </button>
        </div>
      </div>
    </div>
  );
};
