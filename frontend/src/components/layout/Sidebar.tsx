import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckCircle2,
  TrendingUp,
  Building2,
  Users,
  Calculator,
  Layers,
  Flame,
  FolderKanban,
  Users2,
  Settings,
  Crown,
  X,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export interface SidebarProps {
  selectedProductId?: string;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenUpgradeModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedProductId,
  isMobileOpen = false,
  onCloseMobile,
  onOpenUpgradeModal,
}) => {
  const location = useLocation();
  const isUUID = (str?: string): boolean =>
    Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

  const validId = isUUID(selectedProductId) ? selectedProductId : undefined;
  const idPath = validId ? `/dashboard/${validId}` : '/dashboard';
  const pathname = location.pathname;

  const navGroups = [
    {
      group: 'Core',
      items: [
        {
          to: idPath,
          label: 'Dashboard',
          icon: LayoutDashboard,
          isActive: pathname.startsWith('/dashboard') || isUUID(pathname.replace(/^\//, '')),
        },
        {
          to: '/validation',
          label: 'Product Validation',
          icon: CheckCircle2,
          isActive: pathname.startsWith('/validation'),
          badge: '3 Active',
        },
      ],
    },
    {
      group: 'Market Intel',
      items: [
        {
          to: '/market-analysis',
          label: 'Market Analysis',
          icon: TrendingUp,
          isActive: pathname.startsWith('/market-analysis'),
        },
        {
          to: '/trends',
          label: 'Trends & Insights',
          icon: Flame,
          isActive: pathname.startsWith('/trends'),
          badge: 'Live',
        },
      ],
    },
    {
      group: 'Execution & Margins',
      items: [
        {
          to: '/manufacturers',
          label: 'Manufacturers & MOQ',
          icon: Building2,
          isActive: pathname.startsWith('/manufacturers'),
        },
        {
          to: '/influencers',
          label: 'Influencer Matchmaker',
          icon: Users,
          isActive: pathname.startsWith('/influencers'),
        },
        {
          to: '/profit-calculator',
          label: 'Profit & Unit Economics',
          icon: Calculator,
          isActive: pathname.startsWith('/profit-calculator'),
        },
        {
          to: '/ad-tools',
          label: 'Ad & Creative Tools',
          icon: Layers,
          isActive: pathname.startsWith('/ad-tools'),
        },
      ],
    },
    {
      group: 'Workspace',
      items: [
        {
          to: '/projects',
          label: 'My Projects',
          icon: FolderKanban,
          isActive: pathname.startsWith('/projects'),
        },
        {
          to: '/team',
          label: 'Team Members',
          icon: Users2,
          isActive: pathname.startsWith('/team'),
        },
        {
          to: '/settings',
          label: 'Settings',
          icon: Settings,
          isActive: pathname.startsWith('/settings'),
        },
      ],
    },
  ];

  const handleNavClick = () => {
    if (onCloseMobile) onCloseMobile();
  };

  const renderNavContent = () => (
    <aside className="w-64 h-full flex flex-col justify-between p-4 bg-[#090D18]/95 backdrop-blur-xl border-r border-white/[0.08] select-none overflow-y-auto no-scrollbar">
      <div className="space-y-6">
        {/* Brand Logo & Back to Home */}
        <div className="flex items-center justify-between px-1">
          <Link to="/dashboard" onClick={handleNavClick} className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-500 shadow-md shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-300">
              {/* Glowing 3D Crystal / Cube effect */}
              <div className="absolute inset-0.5 rounded-[10px] bg-gradient-to-tr from-blue-500 via-indigo-500 to-fuchsia-400 opacity-90" />
              <div className="relative z-10 w-4 h-4 border-2 border-white/90 rounded-sm transform rotate-45 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-2xs" />
              </div>
              {/* Ambient shine */}
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
              </span>
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                D2C Vision
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase block -mt-0.5">
                LaunchTwin OS
              </span>
            </div>
          </Link>
          <Link
            to="/"
            title="View Public Home Page"
            className="px-2 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors text-[10px] font-medium flex items-center gap-1 border border-white/[0.06]"
          >
            <span>Home</span>
            <ExternalLink className="w-2.5 h-2.5 text-indigo-400" />
          </Link>
        </div>

        {/* Grouped Navigation */}
        <div className="space-y-4">
          {navGroups.map((group) => (
            <div key={group.group} className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {group.group}
              </div>
              <nav className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      to={item.to}
                      onClick={handleNavClick}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 group relative ${
                        item.isActive
                          ? 'bg-white/[0.08] text-white font-semibold border border-white/[0.1] shadow-xs'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.isActive && (
                          <span className="absolute left-0 inset-y-1.5 w-1 rounded-r-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />
                        )}
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            item.isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                            item.isActive
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                              : 'bg-white/[0.05] text-slate-400 border border-white/[0.06]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade to Pro Card */}
      <div className="pt-4 border-t border-white/[0.06]">
        <div
          onClick={onOpenUpgradeModal}
          className="relative overflow-hidden cursor-pointer rounded-2xl p-3.5 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 hover:border-amber-500/40 transition-all duration-300 group shadow-lg shadow-amber-950/20"
        >
          {/* Subtle gold glow blur */}
          <div className="absolute -top-6 -right-6 w-16 h-16 bg-amber-500/20 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/30 transition-all" />

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
              <Crown className="w-4 h-4 fill-amber-400/30" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white tracking-tight">Upgrade to Pro</span>
                <Sparkles className="w-3 h-3 text-amber-400" />
              </div>
              <p className="mt-0.5 text-[10px] text-slate-400 leading-snug line-clamp-2">
                Unlock premium data, AI tools and more.
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:block fixed top-0 left-0 bottom-0 w-64 z-40">
        {renderNavContent()}
      </div>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-64 max-w-xs bg-[#090D18] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <div className="p-4 flex items-center justify-between border-b border-white/[0.08]">
              <span className="text-xs font-bold text-white tracking-wider uppercase">
                Menu
              </span>
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close menu"
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar">{renderNavContent()}</div>
          </div>
        </div>
      )}
    </>
  );
};
