import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckCircle2,
  Calculator,
  FolderKanban,
  Users,
  X,
  Sparkles,
} from 'lucide-react';

export interface SidebarProps {
  selectedProductId?: string;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const location = useLocation();
  const pathname = location.pathname;

  // 4 Core Navigation Items
  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      isActive:
        pathname === '/' ||
        pathname === '/dashboard' ||
        pathname.startsWith('/dashboard/'),
    },
    {
      to: '/validation',
      label: 'Product Validation',
      icon: CheckCircle2,
      isActive: pathname.startsWith('/validation'),
    },
    {
      to: '/profit-calculator',
      label: 'Profit Calculator',
      icon: Calculator,
      isActive: pathname.startsWith('/profit-calculator'),
    },
    {
      to: '/influencers',
      label: 'Influencer Finder',
      icon: Users,
      isActive: pathname.startsWith('/influencers'),
    },
    {
      to: '/projects',
      label: 'My Projects',
      icon: FolderKanban,
      isActive: pathname.startsWith('/projects'),
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white text-slate-800 select-none border-r border-slate-200/90 shadow-[1px_0_3px_rgba(0,0,0,0.02)]">
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100">
        <Link
          to="/dashboard"
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 group cursor-pointer"
        >
          {/* Modern Emerald & Navy Geometric Cube Monogram */}
          <div className="w-7 h-7 relative flex items-center justify-center">
            <svg
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full transform transition-transform duration-200 group-hover:scale-105"
            >
              <defs>
                <linearGradient id="cubeTop" x1="16" y1="2" x2="16" y2="14" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#10B981" />
                  <stop offset="1" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="cubeLeft" x1="2" y1="10" x2="16" y2="28" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0F172A" />
                  <stop offset="1" stopColor="#1E293B" />
                </linearGradient>
                <linearGradient id="cubeRight" x1="16" y1="14" x2="30" y2="28" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#047857" />
                  <stop offset="1" stopColor="#065F46" />
                </linearGradient>
              </defs>
              <path d="M16 2L29 9.5L16 17L3 9.5L16 2Z" fill="url(#cubeTop)" />
              <path d="M3 9.5L16 17V31L3 23.5V9.5Z" fill="url(#cubeLeft)" fillOpacity="0.95" />
              <path d="M16 17L29 9.5V23.5L16 31V17Z" fill="url(#cubeRight)" fillOpacity="0.9" />
              <path
                d="M16 2L29 9.5V23.5L16 31L3 23.5V9.5L16 2Z"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="0.75"
              />
              <path d="M16 17L3 9.5M16 17V31M16 17L29 9.5" stroke="rgba(255,255,255,0.3)" strokeWidth="0.75" />
            </svg>
          </div>

          {/* Brand Name */}
          <div className="flex flex-col leading-none">
            <span className="font-extrabold text-[13px] tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
              D2C Vision
            </span>
            <span className="text-[9px] font-semibold text-emerald-600 tracking-wider uppercase mt-0.5">
              Intelligence
            </span>
          </div>
        </Link>

        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 4 Core Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
        <div className="px-2 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Core Workspaces
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          return (
            <Link
              key={item.label}
              to={item.to}
              onClick={onCloseMobile}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all group cursor-pointer ${
                active
                  ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/80 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                  active ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-700'
                }`}
              />
              <span className="truncate">{item.label}</span>
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-600" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Workspace Status at bottom */}
      <div className="p-3 border-t border-slate-100">
        <div className="rounded-xl p-2.5 bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-slate-800 block leading-tight truncate">
                Founder Workspace
              </span>
              <span className="text-[10px] text-slate-500 leading-none">
                All Tools Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar: 200px wide */}
      <aside
        id="desktop-sidebar"
        className="hidden md:flex flex-col w-[200px] fixed inset-y-0 left-0 z-30"
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative flex flex-col w-64 max-w-[80vw] h-full bg-white z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
