import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Bell,
  Menu,
  Sparkles,
  User,
  X,
  Check,
  Plus,
  PlayCircle,
  HelpCircle,
  FolderKanban,
  Calculator,
  Users,
} from 'lucide-react';

export interface TopBarProps {
  onToggleMobileNav?: () => void;
  selectedProductId?: string;
  onOpenVideoModal?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onToggleMobileNav,
  onOpenVideoModal,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
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

  // Keyboard shortcut ⌘K / Ctrl+K
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

    if (query.includes('dash') || query.includes('home')) {
      navigate('/dashboard');
    } else if (query.includes('influenc') || query.includes('creator') || query.includes('collab')) {
      navigate('/influencers');
    } else if (query.includes('profit') || query.includes('calc') || query.includes('margin') || query.includes('cost')) {
      navigate('/profit-calculator');
    } else if (query.includes('project') || query.includes('portfolio') || query.includes('my')) {
      navigate('/projects');
    } else {
      navigate('/validation');
    }
    setSearchQuery('');
  };

  return (
    <header className="h-16 px-4 lg:px-7 bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-20 flex items-center justify-between gap-3 select-none">
      {/* Left: Mobile hamburger & Global Search input */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={onToggleMobileNav}
          className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="global-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools: validation, profit calculator, influencers, projects..."
            className="w-full pl-9 pr-14 py-2 rounded-xl bg-slate-50 border border-slate-200/80 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 text-xs text-slate-800 placeholder-slate-400 transition-all outline-none"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-slate-400 bg-white border border-slate-200 shadow-2xs">
            ⌘K
          </kbd>
        </form>
      </div>

      {/* Right Controls: Quick Validate CTA, Notifications & Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Quick Validate Button */}
        <button
          type="button"
          onClick={() => navigate('/validation')}
          className="btn-primary-gradient px-3.5 py-2 rounded-xl text-xs font-semibold text-white shadow-xs flex items-center gap-1.5 cursor-pointer hover:bg-emerald-700 active:scale-[0.98] transition-all"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-200" />
          <span className="hidden sm:inline">Validate Idea</span>
          <span className="sm:hidden">Validate</span>
        </button>

        {/* Video Tour Walkthrough */}
        <button
          type="button"
          onClick={onOpenVideoModal}
          className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-all cursor-pointer"
        >
          <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>Demo</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setHasUnread(false);
            }}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors relative cursor-pointer"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {hasUnread && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-slate-200 shadow-xl p-4 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
                <span className="font-bold text-slate-900">Notifications</span>
                <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  All Read
                </span>
              </div>
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-slate-900 text-[11px]">Unit Economics Engine</span>
                  </div>
                  <p className="text-[10.5px] text-slate-500 mt-1 pl-4">
                    Break-even calculation updated for your active chocolate concept.
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span className="font-semibold text-slate-900 text-[11px]">Product Validation Studio</span>
                  </div>
                  <p className="text-[10.5px] text-slate-500 mt-1 pl-4">
                    Feasibility audit generated for Cold Brew Hibiscus Tonic.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-[10px] font-bold text-white shadow-2xs">
              AR
            </div>
            <span className="hidden sm:inline text-xs font-semibold text-slate-700">
              Adarsh
            </span>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl p-2.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="p-2 border-b border-slate-100 mb-1">
                <span className="font-bold text-slate-900 block">Adarsh Reddy</span>
                <span className="text-[10.5px] text-emerald-700 font-medium">Founder Workspace • Full Access</span>
              </div>
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    navigate('/projects');
                    setIsProfileOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors font-medium flex items-center gap-2 cursor-pointer"
                >
                  <FolderKanban className="w-3.5 h-3.5 text-slate-400" />
                  <span>My Projects Portfolio</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigate('/profit-calculator');
                    setIsProfileOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors font-medium flex items-center gap-2 cursor-pointer"
                >
                  <Calculator className="w-3.5 h-3.5 text-slate-400" />
                  <span>Profit Calculator</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigate('/influencers');
                    setIsProfileOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors font-medium flex items-center gap-2 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Influencer Finder</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
