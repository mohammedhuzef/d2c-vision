import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Bell,
  Palette,
  Key,
  CheckCircle2,
  Save,
  Sparkles,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';
import { getStoredSettings, saveStoredSettings, UserSettings } from '../utils/storage';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>(getStoredSettings());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showKeys, setShowKeys] = useState(false);

  useEffect(() => {
    setSettings(getStoredSettings());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredSettings(settings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-2">
              <Settings className="w-3.5 h-3.5" />
              <span>Workspace Configurations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Settings & Preferences
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Manage your founder profile, notification triggers, brand identity, and AI inference configuration.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="btn-primary-gradient px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white flex items-center gap-2 shadow-lg cursor-pointer"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Saved Changes!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Preferences</span>
              </>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Profile & Brand (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section 1: Founder & Brand Identity */}
          <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] space-y-4">
            <h2 className="text-sm font-bold text-white pb-3 border-b border-white/[0.06] flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" />
              <span>Founder & Brand Identity</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">Founder Name</label>
                <input
                  type="text"
                  value={settings.founderName}
                  onChange={(e) => setSettings({ ...settings, founderName: e.target.value })}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">Account Email</label>
                <input
                  type="email"
                  value={settings.founderEmail}
                  onChange={(e) => setSettings({ ...settings, founderEmail: e.target.value })}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">Brand Entity Name</label>
                <input
                  type="text"
                  value={settings.brandName}
                  onChange={(e) => setSettings({ ...settings, brandName: e.target.value })}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">Default Platform Currency</label>
                <select
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full px-3 py-2 bg-[#090D18] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value="INR (₹)">Indian Rupee (INR ₹)</option>
                  <option value="USD ($)">US Dollar (USD $)</option>
                  <option value="EUR (€)">Euro (EUR €)</option>
                  <option value="AED (د.إ)">UAE Dirham (AED)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-200 block mb-1">Brand Tagline</label>
                <input
                  type="text"
                  value={settings.brandTagline}
                  onChange={(e) => setSettings({ ...settings, brandTagline: e.target.value })}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: AI & Inference Keys */}
          <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] space-y-4">
            <h2 className="text-sm font-bold text-white pb-3 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-purple-400" />
                <span>AI Gatekeeper & Data Integrations</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Encrypted Client-Side
              </span>
            </h2>

            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
              💡 <strong>Demo Mode is active by default.</strong> If no private API keys are configured, the platform safely simulates high-fidelity synthetic market reports without making external network calls.
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">Google Gemini API Key (Optional)</label>
                <div className="relative">
                  <input
                    type={showKeys ? 'text' : 'password'}
                    value={settings.apiKeys.geminiKey}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        apiKeys: { ...settings.apiKeys, geminiKey: e.target.value },
                      })
                    }
                    className="w-full pl-3 pr-10 py-2 bg-white/[0.04] border border-white/[0.1] rounded-xl text-xs text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeys(!showKeys)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showKeys ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">OpenAI API Key (Optional)</label>
                <input
                  type={showKeys ? 'text' : 'password'}
                  value={settings.apiKeys.openAiKey}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      apiKeys: { ...settings.apiKeys, openAiKey: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.1] rounded-xl text-xs text-white font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Preferences & Notifications (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Section 3: Notification Alerts */}
          <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] space-y-4">
            <h2 className="text-sm font-bold text-white pb-3 border-b border-white/[0.06] flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-400" />
              <span>Notification Dispatch Triggers</span>
            </h2>

            <div className="space-y-3">
              {[
                {
                  key: 'supplierQuotes' as const,
                  label: 'Manufacturer MOQ & Price Alerts',
                  desc: 'Notify when a verified manufacturer responds with a quote.',
                },
                {
                  key: 'trendAlerts' as const,
                  label: 'Category Velocity & Breakout Trends',
                  desc: 'Weekly alerts when a category search surge exceeds +40%.',
                },
                {
                  key: 'validationReports' as const,
                  label: 'Feasibility Stage Approvals',
                  desc: 'Email summary when a 6-stage validation pipeline completes.',
                },
                {
                  key: 'weeklyDigest' as const,
                  label: 'Founder Weekly Briefing',
                  desc: 'Digest of unit economics and active portfolio metrics.',
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                >
                  <div className="pr-3">
                    <span className="text-xs font-semibold text-white block">{item.label}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">{item.desc}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications[item.key]}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, [item.key]: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded bg-white/[0.1] border-white/[0.2] accent-indigo-600 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Visual Theme Accent */}
          <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] space-y-4">
            <h2 className="text-sm font-bold text-white pb-3 border-b border-white/[0.06] flex items-center gap-2">
              <Palette className="w-4 h-4 text-emerald-400" />
              <span>Theme & Glow Accents</span>
            </h2>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'indigo' as const, label: 'Electric Indigo', color: '#6366F1' },
                { id: 'purple' as const, label: 'Cyber Violet', color: '#8B5CF6' },
                { id: 'cyan' as const, label: 'Neon Cyan', color: '#06B6D4' },
                { id: 'emerald' as const, label: 'Emerald Mint', color: '#10B981' },
              ].map((accent) => (
                <button
                  key={accent.id}
                  type="button"
                  onClick={() => setSettings({ ...settings, themeAccent: accent.id })}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                    settings.themeAccent === accent.id
                      ? 'border-indigo-400 bg-white/[0.08] ring-2 ring-indigo-500/40'
                      : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: accent.color }} />
                  <span className="text-xs font-semibold text-white">{accent.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
