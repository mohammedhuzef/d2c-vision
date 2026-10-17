import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  ShieldCheck,
  Users2,
  SlidersHorizontal,
  FileText,
  X,
} from 'lucide-react';

export interface SidebarProps {
  selectedProductId?: string;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedProductId,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const idPath = selectedProductId ? `/${selectedProductId}` : '';
  const validationPath = selectedProductId ? `/validation/${selectedProductId}` : '/validation';
  const competitorPath = selectedProductId ? `/competitors/${selectedProductId}` : '/competitors';
  const changeTrackerPath = selectedProductId
    ? `/change-tracker/${selectedProductId}`
    : '/change-tracker';
  const reportPath = selectedProductId ? `/reports/${selectedProductId}` : '/reports';

  const navLinks = [
    {
      to: idPath || '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      to: '/new-analysis',
      label: 'New Analysis',
      icon: PlusCircle,
    },
    {
      to: validationPath,
      label: 'Validation Pipeline',
      icon: ShieldCheck,
    },
    {
      to: competitorPath,
      label: 'Competitor Intelligence',
      icon: Users2,
    },
    {
      to: changeTrackerPath,
      label: 'Change Tracker',
      icon: SlidersHorizontal,
    },
    {
      to: reportPath,
      label: 'Launch Report',
      icon: FileText,
    },
  ];

  const content = (
    <aside className="w-64 h-full flex flex-col justify-between py-6 px-3 bg-white border-r border-slate-200">
      <div className="space-y-6">
        {/* Navigation list */}
        <div className="space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Platform Navigation
          </div>
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.exact}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-indigo-600' : 'text-slate-400'
                      }`}
                    />
                    <span>{link.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500">
        <p className="font-semibold text-slate-800">LaunchTwin AI v1.0</p>
        <p className="mt-0.5 text-[10px] text-slate-400">
          Deterministic 6-Stage Gatekeeper
        </p>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:block fixed top-16 left-0 bottom-0 w-64 z-30">
        {content}
      </div>

      {/* Mobile / Tablet Drawer */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-64 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <div className="p-4 flex items-center justify-between border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Menu
              </span>
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close menu"
                className="p-1 rounded-md text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{content}</div>
          </div>
        </div>
      )}
    </>
  );
};
