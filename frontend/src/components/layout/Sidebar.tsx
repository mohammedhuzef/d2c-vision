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
  BarChart3,
  GitBranch,
  FileText,
  PlusCircle,
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
  const pathname = location.pathname;

  const isUUID = (str?: string): boolean =>
    Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

  const validId = isUUID(selectedProductId) ? selectedProductId : undefined;
  // If validId exists, link to /:id for dashboard as expected by deep link routing
  const dashboardPath = validId ? `/${validId}` : '/dashboard';

  // Navigation items in the exact requested order:
  // 1. Dashboard
  // 2. Product Validation
  // 3. Market Analysis
  // 4. Manufacturers
  // 5. Influencer Finder
  // 6. Profit Calculator
  // 7. Ad & Content Tools
  // 8. Trends & Insights
  // 9. My Projects
  // 10. Team
  // 11. Settings
  const navItems = [
    {
      to: dashboardPath,
      label: 'Dashboard',
      icon: LayoutDashboard,
      isActive:
        pathname === '/' ||
        pathname === '/dashboard' ||
        pathname.startsWith('/dashboard/') ||
        (validId && pathname === `/${validId}`),
    },
    {
      to: '/validation',
      label: 'Product Validation',
      icon: CheckCircle2,
      isActive: pathname.startsWith('/validation') || pathname.startsWith('/new-analysis'),
    },
    {
      to: '/market-analysis',
      label: 'Market Analysis',
      icon: TrendingUp,
      isActive: pathname.startsWith('/market-analysis'),
    },
    {
      to: '/manufacturers',
      label: 'Manufacturers',
      icon: Building2,
      isActive: pathname.startsWith('/manufacturers'),
    },
    {
      to: '/influencers',
      label: 'Influencer Finder',
      icon: Users,
      isActive: pathname.startsWith('/influencers'),
    },
    {
      to: '/profit-calculator',
      label: 'Profit Calculator',
      icon: Calculator,
      isActive: pathname.startsWith('/profit-calculator'),
    },
    {
      to: '/ad-tools',
      label: 'Ad & Content Tools',
      icon: Layers,
      isActive: pathname.startsWith('/ad-tools'),
    },
    {
      to: '/trends',
      label: 'Trends & Insights',
      icon: Flame,
      isActive: pathname.startsWith('/trends'),
    },
    {
      to: '/projects',
      label: 'My Projects',
      icon: FolderKanban,
      isActive: pathname.startsWith('/projects'),
    },
    {
      to: '/team',
      label: 'Team',
      icon: Users2,
      isActive: pathname.startsWith('/team'),
    },
    {
      to: '/settings',
      label: 'Settings',
      icon: Settings,
      isActive: pathname.startsWith('/settings'),
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#08182C] text-[#F8FAFF] select-none">
      {/* Brand area: Geometric purple and cyan cube logo + D2C Vision */}
      <div className="h-14 px-3.5 flex items-center justify-between border-b border-[rgba(161,190,230,0.18)]">
        <Link
          to={dashboardPath}
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 group cursor-pointer"
        >
          {/* Geometric 3D Cube Logo in Purple & Cyan */}
          <div className="relative w-7 h-7 shrink-0 flex items-center justify-center">
            <svg
              className="w-7 h-7 drop-shadow-[0_0_8px_rgba(117,71,255,0.65)]"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Top Face */}
              <path
                d="M16 3L28 9.8L16 16.6L4 9.8L16 3Z"
                fill="#25D9E8"
                fillOpacity="0.95"
              />
              {/* Left Face */}
              <path
                d="M4 11.2L15 17.5V29L4 22.7V11.2Z"
                fill="#7547FF"
                fillOpacity="0.95"
              />
              {/* Right Face */}
              <path
                d="M17 17.5L28 11.2V22.7L17 29V17.5Z"
                fill="#278BFF"
                fillOpacity="0.95"
              />
              {/* Inner geometric accent */}
              <path
                d="M16 11L21 14L16 17L11 14L16 11Z"
                fill="#FFFFFF"
                fillOpacity="0.8"
              />
            </svg>
          </div>

          <div className="flex flex-col leading-none">
            <span className="text-[13.5px] font-bold tracking-tight text-[#F8FAFF] group-hover:text-white transition-colors">
              D2C Vision
            </span>
            <span className="text-[9.5px] font-medium text-[#25D9E8] tracking-wider uppercase">
              Intelligence
            </span>
          </div>
        </Link>

        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1 rounded-lg text-[#9EADC2] hover:text-[#F8FAFF] hover:bg-white/[0.06] transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation items list */}
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          return (
            <Link
              key={item.label}
              to={item.to}
              onClick={onCloseMobile}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11.5px] font-medium transition-all group cursor-pointer ${
                active
                  ? 'bg-gradient-to-r from-[#7547FF] to-[#278BFF] text-[#F8FAFF] shadow-[0_0_14px_rgba(117,71,255,0.45)]'
                  : 'text-[#9EADC2] hover:text-[#F8FAFF] hover:bg-white/[0.06]'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                  active ? 'text-white' : 'text-[#9EADC2] group-hover:text-[#25D9E8]'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}

        {/* Deep Pipeline Tools for active product analysis */}
        {validId && (
          <div className="pt-2 mt-2 border-t border-[rgba(161,190,230,0.12)]">
            <div className="px-2.5 py-1 text-[9px] font-semibold text-[#25D9E8] uppercase tracking-wider">
              Deep Pipeline
            </div>
            <Link
              to={`/validation/${validId}`}
              onClick={onCloseMobile}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                pathname.startsWith('/validation/')
                  ? 'bg-white/[0.08] text-white'
                  : 'text-[#9EADC2] hover:text-[#F8FAFF] hover:bg-white/[0.04]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#25D9E8]" />
              <span className="truncate">Validation Pipeline</span>
            </Link>
            <Link
              to={`/competitors/${validId}`}
              onClick={onCloseMobile}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                pathname.startsWith('/competitors/')
                  ? 'bg-white/[0.08] text-white'
                  : 'text-[#9EADC2] hover:text-[#F8FAFF] hover:bg-white/[0.04]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-[#7547FF]" />
              <span className="truncate">Competitor Intelligence</span>
            </Link>
            <Link
              to={`/change-tracker/${validId}`}
              onClick={onCloseMobile}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                pathname.startsWith('/change-tracker/')
                  ? 'bg-white/[0.08] text-white'
                  : 'text-[#9EADC2] hover:text-[#F8FAFF] hover:bg-white/[0.04]'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5 text-[#28D7A0]" />
              <span className="truncate">Change Tracker</span>
            </Link>
            <Link
              to={`/reports/${validId}`}
              onClick={onCloseMobile}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                pathname.startsWith('/reports/')
                  ? 'bg-white/[0.08] text-white'
                  : 'text-[#9EADC2] hover:text-[#F8FAFF] hover:bg-white/[0.04]'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-[#FFBE58]" />
              <span className="truncate">Launch Report</span>
            </Link>
            <Link
              to="/new-analysis"
              onClick={onCloseMobile}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                pathname === '/new-analysis'
                  ? 'bg-white/[0.08] text-white'
                  : 'text-[#9EADC2] hover:text-[#F8FAFF] hover:bg-white/[0.04]'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#25D9E8]" />
              <span className="truncate">New Analysis</span>
            </Link>
          </div>
        )}
      </nav>

      {/* Upgrade to Pro Card at bottom */}
      <div className="p-2 border-t border-[rgba(161,190,230,0.18)]">
        <div
          onClick={onOpenUpgradeModal}
          className="relative rounded-xl p-2.5 bg-gradient-to-b from-[rgba(20,39,62,0.9)] to-[rgba(10,24,44,0.95)] border border-[rgba(161,190,230,0.25)] hover:border-[#FFBE58]/50 transition-all cursor-pointer group shadow-sm overflow-hidden"
        >
          {/* Subtle gold glow behind crown */}
          <div className="absolute -top-3 -right-3 w-10 h-10 bg-[#FFBE58]/15 rounded-full blur-lg pointer-events-none" />

          <div className="flex items-center gap-1.5 mb-1">
            <Crown className="w-3.5 h-3.5 text-[#FFBE58] shrink-0 animate-pulse" />
            <h4 className="text-[11.5px] font-bold text-[#F8FAFF] tracking-tight group-hover:text-[#FFBE58] transition-colors">
              Upgrade to Pro
            </h4>
          </div>

          <p className="text-[10px] leading-tight text-[#9EADC2] mb-2 font-normal">
            Unlock premium data, AI tools, and more.
          </p>

          <button
            type="button"
            className="w-full py-1 px-2 rounded-lg text-[10px] font-semibold text-white bg-gradient-to-r from-[#7547FF] to-[#278BFF] hover:from-[#855bff] hover:to-[#3896ff] transition-all shadow-sm flex items-center justify-center gap-1"
          >
            <Sparkles className="w-2.5 h-2.5 text-[#25D9E8]" />
            <span>Go Unlimited</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky / Fixed Sidebar (183px width) */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-[183px] border-r border-[rgba(161,190,230,0.18)] z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer container */}
          <div className="fixed inset-y-0 left-0 w-[240px] max-w-[80vw] shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
