import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  ChevronDown,
  Menu,
  Sparkles,
  ExternalLink,
  Shield,
  CreditCard,
  LogOut,
  User,
  X,
  Check,
} from 'lucide-react';

export interface TopBarProps {
  onToggleMobileNav?: () => void;
  selectedProductId?: string;
  onOpenSearch?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onToggleMobileNav,
  onOpenSearch,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  const resourcesRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (resourcesRef.current && !resourcesRef.current.contains(e.target as Node)) {
        setIsResourcesOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut ⌘K or Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.getElementById('global-search-input');
        if (input) input.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const query = searchQuery.toLowerCase();

    if (query.includes('home') || query.includes('landing') || query.includes('store') || query.includes('marketplace')) {
      navigate('/');
    } else if (query.includes('dash')) {
      navigate('/dashboard');
    } else if (query.includes('manufactur') || query.includes('supplier')) {
      navigate('/manufacturers');
    } else if (query.includes('influenc') || query.includes('creator')) {
      navigate('/influencers');
    } else if (query.includes('profit') || query.includes('calc') || query.includes('cost') || query.includes('margin')) {
      navigate('/profit-calculator');
    } else if (query.includes('project') || query.includes('chocolate') || query.includes('makhana') || query.includes('serum')) {
      navigate('/projects');
    } else if (query.includes('market') || query.includes('competitor')) {
      navigate('/market-analysis');
    } else if (query.includes('trend') || query.includes('insight')) {
      navigate('/trends');
    } else if (query.includes('validat') || query.includes('idea')) {
      navigate('/validation');
    } else if (query.includes('ad') || query.includes('content') || query.includes('campaign')) {
      navigate('/ad-tools');
    } else if (query.includes('team') || query.includes('member')) {
      navigate('/team');
    } else if (query.includes('setting') || query.includes('config') || query.includes('profile')) {
      navigate('/settings');
    } else {
      navigate('/projects');
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 w-full bg-[#080C15]/85 backdrop-blur-md border-b border-white/[0.07] px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Mobile Toggle Button */}
      <div className="flex items-center gap-3 lg:hidden">
        <button
          type="button"
          onClick={onToggleMobileNav}
          className="p-2 rounded-xl text-slate-300 hover:text-white bg-white/[0.05] border border-white/[0.08]"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-base font-bold text-white tracking-tight">D2C Vision</span>
      </div>

      {/* Left: Context Breadcrumb (hidden on mobile, visible on desktop) */}
      <div className="hidden lg:flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Workspace</span>
          <span className="text-slate-600">/</span>
          <span className="text-white font-semibold flex items-center gap-1.5">
            LaunchTwin AI
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-medium font-mono-nums">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
          </span>
          <span>Engine Active</span>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-md hidden sm:block">
        <form onSubmit={handleSearchSubmit} className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-400 transition-colors">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="global-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Jump to products, suppliers, profit calculator... (⌘K)"
            className="w-full pl-9 pr-14 py-2 bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] focus:border-indigo-500/50 focus:bg-white/[0.07] rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white/[0.08] border border-white/[0.1] rounded-md shadow-xs">
              ⌘ K
            </kbd>
          </div>
        </form>
      </div>

      {/* Right Controls: Quick Action, Notifications & Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Quick Launch Button */}
        <button
          type="button"
          onClick={() => navigate('/new-analysis')}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02] cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>New Analysis</span>
        </button>

        {/* Validation Docs Link */}
        <button
          type="button"
          onClick={() => navigate('/validation')}
          className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors"
        >
          <Shield className="w-3.5 h-3.5 text-indigo-400" />
          <span>6-Stage Engine</span>
        </button>

        {/* Public Home Page Link */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
          title="Visit Public Home Page"
        >
          <span>Home</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </button>

        {/* Notification Bell */}
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setHasUnread(false);
            }}
            className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {hasUnread && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2.5 w-80 p-3 glass-panel rounded-2xl shadow-2xl border border-white/[0.1] z-50 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                <span className="font-semibold text-white">Notifications</span>
                <span className="text-[10px] text-indigo-400 font-medium">1 new</span>
              </div>
              <div className="mt-2 space-y-2">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-slate-300">
                  <p className="font-semibold text-white text-[11px]">New Supplier Match Found</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Campco in Mangaluru just lowered MOQ to 10 kg for Roasted Makhana.
                  </p>
                  <span className="text-[9px] text-slate-500 mt-1 block">10 minutes ago</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile / Founder Plan */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 pl-2 py-1 rounded-xl hover:bg-white/[0.04] transition-colors text-left"
          >
            <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-xs shadow-md shadow-indigo-600/30 ring-2 ring-white/10">
              AR
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-semibold text-white leading-tight">Adarsh Reddy</div>
              <div className="text-[10px] font-medium text-indigo-300/90 leading-tight">Founder Plan</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2.5 w-56 p-2 glass-panel rounded-2xl shadow-2xl border border-white/[0.1] z-50 text-xs">
              <div className="px-3 py-2 border-b border-white/[0.08]">
                <p className="font-semibold text-white">Adarsh Reddy</p>
                <p className="text-[10px] text-slate-400">adarsh@d2cvision.ai</p>
                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-[10px] text-indigo-300 font-medium">
                  <Sparkles className="w-2.5 h-2.5" /> Founder Plan
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/new-analysis');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] text-left"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>New Product Analysis</span>
                </button>
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] text-left"
                >
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  <span>Subscription & Billing</span>
                </button>
              </div>

              <div className="pt-1 border-t border-white/[0.08]">
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
