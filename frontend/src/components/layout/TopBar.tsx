import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
  BookOpen,
  PlayCircle,
  HelpCircle,
  Layers,
} from 'lucide-react';
import { api } from '../../api/client';
import { queryKeys } from '../../services/queryKeys';

export interface TopBarProps {
  onToggleMobileNav?: () => void;
  selectedProductId?: string;
  onOpenUpgradeModal?: () => void;
  onOpenVideoModal?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onToggleMobileNav,
  selectedProductId,
  onOpenUpgradeModal,
  onOpenVideoModal,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  const resourcesRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);

  const isUUID = (str?: string): boolean =>
    Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

  // Query products list
  const { data: productsData } = useQuery({
    queryKey: queryKeys.products.list(),
    queryFn: () => api.products.list({ limit: 20 }),
  });

  const products = productsData?.items || [];

  // Active product details if selectedProductId is present
  const { data: activeProduct } = useQuery({
    queryKey: queryKeys.products.detail(selectedProductId),
    queryFn: () => api.products.get(selectedProductId!),
    enabled: Boolean(selectedProductId && isUUID(selectedProductId)),
  });

  const handleProductSwitch = (newId: string) => {
    setIsAnalysisOpen(false);
    if (selectedProductId && location.pathname.includes(selectedProductId)) {
      navigate(location.pathname.replace(selectedProductId, newId));
    } else {
      navigate(`/${newId}`);
    }
  };

  // Close dropdowns on outside click
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
      if (analysisRef.current && !analysisRef.current.contains(e.target as Node)) {
        setIsAnalysisOpen(false);
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

    if (query.includes('dash')) {
      navigate('/dashboard');
    } else if (query.includes('manufactur') || query.includes('supplier')) {
      navigate('/manufacturers');
    } else if (query.includes('influenc') || query.includes('creator')) {
      navigate('/influencers');
    } else if (query.includes('profit') || query.includes('calc') || query.includes('margin')) {
      navigate('/profit-calculator');
    } else if (query.includes('project') || query.includes('idea')) {
      navigate('/projects');
    } else if (query.includes('market') || query.includes('competitor')) {
      navigate('/market-analysis');
    } else if (query.includes('trend') || query.includes('insight')) {
      navigate('/trends');
    } else if (query.includes('validat') || query.includes('check')) {
      navigate('/validation');
    } else if (query.includes('ad') || query.includes('content')) {
      navigate('/ad-tools');
    } else if (query.includes('team')) {
      navigate('/team');
    } else if (query.includes('setting')) {
      navigate('/settings');
    } else {
      navigate(`/validation?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-14 bg-[#08182C]/90 backdrop-blur-md border-b border-[rgba(161,190,230,0.18)] px-4 sm:px-6">
      <div className="h-full flex items-center justify-between gap-4">
        {/* LEFT: Mobile hamburger + Rounded Global Search */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <button
            type="button"
            onClick={onToggleMobileNav}
            className="lg:hidden p-1.5 rounded-lg text-[#9EADC2] hover:text-[#F8FAFF] hover:bg-white/[0.06] transition-colors"
            aria-label="Open mobile menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Rounded global search field */}
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9EADC2] pointer-events-none" />
            <input
              id="global-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, suppliers, influencers, insights..."
              className="w-full h-9 pl-9 pr-14 rounded-full bg-[rgba(20,39,62,0.6)] border border-[rgba(161,190,230,0.22)] text-xs text-[#F8FAFF] placeholder:text-[#9EADC2]/70 focus:outline-none focus:border-[#25D9E8] focus:ring-1 focus:ring-[#25D9E8]/40 transition-all font-sans"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] text-[#9EADC2] bg-white/[0.06] border border-white/[0.08] font-mono pointer-events-none">
              <span>⌘</span>
              <span>K</span>
            </div>
          </form>
        </div>

        {/* MIDDLE: Active Product Selector (when active analysis is loaded) */}
        {activeProduct && (
          <div ref={analysisRef} className="relative hidden md:block shrink-0">
            <button
              type="button"
              onClick={() => setIsAnalysisOpen(!isAnalysisOpen)}
              className="flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(20,39,62,0.7)] border border-[rgba(161,190,230,0.25)] hover:border-[#25D9E8]/50 text-xs font-medium text-white transition-all cursor-pointer"
            >
              <div className="w-2 h-2 rounded-full bg-[#25D9E8] shadow-[0_0_8px_#25D9E8]" />
              <span className="truncate max-w-[130px]">{activeProduct.name}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#9EADC2] transition-transform duration-200 ${
                  isAnalysisOpen ? 'rotate-180 text-[#25D9E8]' : ''
                }`}
              />
            </button>

            {isAnalysisOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#08182C] border border-[rgba(161,190,230,0.25)] shadow-xl shadow-black/50 py-1.5 z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-[#9EADC2] uppercase tracking-wider border-b border-[rgba(161,190,230,0.15)]">
                  Switch Active Product
                </div>
                <div className="max-h-48 overflow-y-auto no-scrollbar py-1">
                  {products.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleProductSwitch(p.id)}
                      className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between ${
                        p.id === activeProduct.id
                          ? 'bg-white/[0.08] text-[#25D9E8] font-semibold'
                          : 'text-[#9EADC2] hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <span className="truncate">{p.name}</span>
                      {p.id === activeProduct.id && <Check className="w-3.5 h-3.5 text-[#25D9E8]" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* RIGHT: Features, How it works, Pricing, Resources, Notifications, Profile */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Text Links (Features, How it works, Pricing) */}
          <nav className="hidden xl:flex items-center gap-5 text-xs font-medium text-[#9EADC2]">
            <button
              type="button"
              onClick={() => navigate('/market-analysis')}
              className="hover:text-[#F8FAFF] transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              type="button"
              onClick={onOpenVideoModal}
              className="hover:text-[#F8FAFF] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <PlayCircle className="w-3.5 h-3.5 text-[#25D9E8]" />
              <span>How it works</span>
            </button>
            <button
              type="button"
              onClick={onOpenUpgradeModal}
              className="hover:text-[#FFBE58] transition-colors cursor-pointer"
            >
              Pricing
            </button>
          </nav>

          {/* Resources Dropdown */}
          <div ref={resourcesRef} className="relative hidden md:block">
            <button
              type="button"
              onClick={() => setIsResourcesOpen(!isResourcesOpen)}
              className="flex items-center gap-1 text-xs font-medium text-[#9EADC2] hover:text-[#F8FAFF] transition-colors py-1 cursor-pointer"
            >
              <span>Resources</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isResourcesOpen ? 'rotate-180 text-[#25D9E8]' : ''
                }`}
              />
            </button>

            {isResourcesOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#08182C] border border-[rgba(161,190,230,0.25)] shadow-xl shadow-black/50 py-1.5 z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
                <a
                  href="#playbook"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsResourcesOpen(false);
                    onOpenVideoModal?.();
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-[#F8FAFF] hover:bg-white/[0.06] transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-[#7547FF]" />
                  <div>
                    <div className="font-medium">D2C Playbook 2026</div>
                    <div className="text-[10px] text-[#9EADC2]">Launch blueprints & strategies</div>
                  </div>
                </a>
                <a
                  href="#suppliers"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsResourcesOpen(false);
                    navigate('/manufacturers');
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-[#F8FAFF] hover:bg-white/[0.06] transition-colors"
                >
                  <Layers className="w-4 h-4 text-[#25D9E8]" />
                  <div>
                    <div className="font-medium">Supplier Database</div>
                    <div className="text-[10px] text-[#9EADC2]">Verified Indian OEM/ODMs</div>
                  </div>
                </a>
                <a
                  href="#help"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsResourcesOpen(false);
                    navigate('/settings');
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-[#F8FAFF] hover:bg-white/[0.06] transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-[#28D7A0]" />
                  <div>
                    <div className="font-medium">Help Center & FAQ</div>
                    <div className="text-[10px] text-[#9EADC2]">Guides, tutorials & support</div>
                  </div>
                </a>
              </div>
            )}
          </div>

          <div className="h-4 w-[1px] bg-[rgba(161,190,230,0.18)] hidden sm:block" />

          {/* Notifications */}
          <div ref={notificationRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                setHasUnread(false);
              }}
              className="relative p-2 rounded-full text-[#9EADC2] hover:text-[#F8FAFF] hover:bg-white/[0.06] transition-colors cursor-pointer"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              {hasUnread && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#25D9E8] shadow-[0_0_8px_#25D9E8]" />
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-[#08182C] border border-[rgba(161,190,230,0.25)] shadow-xl shadow-black/50 p-3 z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[rgba(161,190,230,0.15)]">
                  <span className="text-xs font-semibold text-[#F8FAFF]">Notifications</span>
                  <span className="text-[10px] text-[#25D9E8]">2 New</span>
                </div>
                <div className="space-y-2">
                  <div className="p-2 rounded-lg bg-[rgba(20,39,62,0.6)] border border-[rgba(161,190,230,0.15)] text-xs">
                    <div className="flex items-center gap-1.5 text-[#28D7A0] font-medium text-[11px] mb-0.5">
                      <Sparkles className="w-3 h-3" />
                      <span>Viability Score Ready</span>
                    </div>
                    <p className="text-[11px] text-[#9EADC2]">
                      Dark Chocolate scored 92/100 viability with 68% net margin.
                    </p>
                    <span className="text-[9px] text-[#9EADC2]/70 mt-1 block">12m ago</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[rgba(20,39,62,0.6)] border border-[rgba(161,190,230,0.15)] text-xs">
                    <div className="flex items-center gap-1.5 text-[#278BFF] font-medium text-[11px] mb-0.5">
                      <Check className="w-3 h-3" />
                      <span>New Manufacturer Verified</span>
                    </div>
                    <p className="text-[11px] text-[#9EADC2]">
                      Campco Co-Op added to verified chocolate suppliers.
                    </p>
                    <span className="text-[9px] text-[#9EADC2]/70 mt-1 block">1h ago</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Profile: Circular Purple Avatar AR + Adarsh Reddy + Founder Plan badge + dropdown */}
          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 pl-1 pr-1.5 py-1 rounded-full hover:bg-white/[0.06] transition-colors cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#7547FF] to-[#A855F7] text-white flex items-center justify-center text-xs font-bold shadow-[0_0_10px_rgba(117,71,255,0.5)] shrink-0">
                AR
              </div>

              <div className="hidden sm:flex flex-col text-left leading-tight">
                <span className="text-xs font-semibold text-[#F8FAFF] group-hover:text-white transition-colors">
                  Adarsh Reddy
                </span>
                <span className="text-[10px] font-medium text-[#FFBE58] flex items-center gap-1">
                  <span>Founder Plan</span>
                </span>
              </div>

              <ChevronDown
                className={`w-3.5 h-3.5 text-[#9EADC2] transition-transform duration-200 ${
                  isProfileOpen ? 'rotate-180 text-[#25D9E8]' : ''
                }`}
              />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl bg-[#08182C] border border-[rgba(161,190,230,0.25)] shadow-xl shadow-black/50 py-1.5 z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-[rgba(161,190,230,0.15)] mb-1">
                  <p className="text-xs font-bold text-[#F8FAFF]">Adarsh Reddy</p>
                  <p className="text-[10px] text-[#9EADC2]">founder@d2cvision.com</p>
                  <div className="mt-1.5 inline-block px-2 py-0.5 rounded-full bg-[#FFBE58]/15 border border-[#FFBE58]/30 text-[9.5px] font-semibold text-[#FFBE58]">
                    Founder Plan • Active
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-[#9EADC2] hover:text-[#F8FAFF] hover:bg-white/[0.06] transition-colors text-left"
                >
                  <User className="w-3.5 h-3.5 text-[#7547FF]" />
                  <span>Profile Settings</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    onOpenUpgradeModal?.();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-[#9EADC2] hover:text-[#F8FAFF] hover:bg-white/[0.06] transition-colors text-left"
                >
                  <CreditCard className="w-3.5 h-3.5 text-[#FFBE58]" />
                  <span>Billing & Subscription</span>
                </button>

                <div className="my-1 border-t border-[rgba(161,190,230,0.15)]" />

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
