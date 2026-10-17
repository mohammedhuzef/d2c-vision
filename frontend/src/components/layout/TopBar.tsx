import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, API_BASE_URL } from '../../api/client';
import { queryKeys } from '../../services/queryKeys';
import { formatDate } from '../../utils/formatters';
import {
  Sparkles,
  ChevronDown,
  Bell,
  Server,
  CheckCircle2,
  AlertCircle,
  Menu,
  Plus,
} from 'lucide-react';

export interface TopBarProps {
  onToggleMobileNav?: () => void;
  selectedProductId?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  onToggleMobileNav,
  selectedProductId,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);

  const selectorRef = useRef<HTMLDivElement>(null);
  const activityRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(e.target as Node)) {
        setIsSelectorOpen(false);
      }
      if (activityRef.current && !activityRef.current.contains(e.target as Node)) {
        setIsActivityOpen(false);
      }
      if (workspaceRef.current && !workspaceRef.current.contains(e.target as Node)) {
        setIsWorkspaceOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch product list
  const { data: productsData } = useQuery({
    queryKey: queryKeys.products.list(),
    queryFn: () => api.products.list({ limit: 50 }),
  });

  // Fetch health status
  const { data: healthData, isError: isHealthError } = useQuery({
    queryKey: queryKeys.health,
    queryFn: () => api.health.check(),
    refetchInterval: 30000,
  });

  const isUUID = (str?: string): boolean =>
    Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

  // Fetch recent activity if a product is selected
  const { data: versionsData } = useQuery({
    queryKey: queryKeys.versions.list(selectedProductId),
    queryFn: () => api.versions.list(selectedProductId!),
    enabled: Boolean(selectedProductId && isUUID(selectedProductId)),
  });

  const { data: runsData } = useQuery({
    queryKey: queryKeys.validation.runs(selectedProductId),
    queryFn: () => api.validation.runs(selectedProductId!),
    enabled: Boolean(selectedProductId && isUUID(selectedProductId)),
  });

  const products = productsData?.items || [];
  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const handleSelectProduct = (newId: string) => {
    setIsSelectorOpen(false);
    // Maintain current subpath if applicable
    const pathname = location.pathname;
    if (pathname.startsWith('/validation')) {
      navigate(`/validation/${newId}`);
    } else if (pathname.startsWith('/competitors')) {
      navigate(`/competitors/${newId}`);
    } else if (pathname.startsWith('/change-tracker')) {
      navigate(`/change-tracker/${newId}`);
    } else if (pathname.startsWith('/reports')) {
      navigate(`/reports/${newId}`);
    } else {
      navigate(`/${newId}`);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-40 px-4 lg:px-6 flex items-center justify-between">
      {/* Left: Mobile hamburger + Brand */}
      <div className="flex items-center gap-3 lg:gap-6">
        <button
          type="button"
          onClick={onToggleMobileNav}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => navigate(selectedProduct ? `/${selectedProduct.id}` : '/')}
          className="flex items-center gap-2.5 text-left focus:outline-hidden"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-sm tracking-tight block">
              LaunchTwin AI
            </span>
            <span className="text-[10px] text-indigo-600 font-semibold tracking-wider uppercase block">
              Validation Engine
            </span>
          </div>
        </button>

        {/* Product selector dropdown */}
        <div ref={selectorRef} className="relative ml-2 sm:ml-4">
          <button
            type="button"
            onClick={() => setIsSelectorOpen(!isSelectorOpen)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          >
            <span className="max-w-[140px] sm:max-w-[200px] truncate">
              {selectedProduct ? selectedProduct.name : 'Select Analysis'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {isSelectorOpen && (
            <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Analyses ({products.length})
              </div>
              <div className="max-h-60 overflow-y-auto">
                {products.length === 0 ? (
                  <div className="px-3 py-4 text-center text-xs text-slate-500">
                    No analyses yet. Create your first one!
                  </div>
                ) : (
                  products.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectProduct(p.id)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        p.id === selectedProductId
                          ? 'bg-indigo-50/60 font-semibold text-indigo-900'
                          : 'text-slate-700'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {p.category || 'D2C Product'} • v{p.current_version}
                        </p>
                      </div>
                      {p.id === selectedProductId && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>
              <div className="pt-1.5 border-t border-slate-100 mt-1 px-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsSelectorOpen(false);
                    navigate('/new-analysis');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create New Analysis
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Activity Bell + Workspace Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Recent Activity Bell */}
        <div ref={activityRef} className="relative">
          <button
            type="button"
            onClick={() => setIsActivityOpen(!isActivityOpen)}
            aria-label="Recent activity"
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 relative transition-colors focus:ring-2 focus:ring-indigo-500"
          >
            <Bell className="w-4 h-4" />
            {((versionsData?.items?.length || 0) > 0 || (runsData?.items?.length || 0) > 0) && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
            )}
          </button>

          {isActivityOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-slate-200 py-3 z-50 animate-in fade-in">
              <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900">
                  Recent Engine Activity
                </span>
                <span className="text-[11px] text-slate-400">
                  {selectedProduct?.name || 'Selected Analysis'}
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto px-4 py-2 space-y-3">
                {/* Validation runs snippet */}
                {runsData?.items && runsData.items.length > 0 && (
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Validation Runs
                    </span>
                    <ul className="mt-1 space-y-1.5">
                      {runsData.items.slice(0, 3).map((r) => {
                        const verdict = (r as any).verdict || r.readiness?.label || 'COMPLETED';
                        const startedAt = (r as any).started_at || r.created_at;
                        const score = (r as any).readiness_score || r.readiness?.overall_score;
                        return (
                          <li
                            key={r.id}
                            className="text-xs p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between"
                          >
                            <div>
                              <span className="font-medium text-slate-800">
                                v{r.version_number} Run ({verdict})
                              </span>
                              <span className="block text-[10px] text-slate-400">
                                {formatDate(startedAt)}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-slate-900 font-mono-nums">
                              {score ? `${score}/100` : '—'}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Impact events / versions */}
                {versionsData?.items && versionsData.items.length > 0 && (
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Version Ledger
                    </span>
                    <ul className="mt-1 space-y-1.5">
                      {versionsData.items.slice(0, 3).map((v) => (
                        <li
                          key={v.id}
                          className="text-xs p-2 rounded-lg bg-slate-50 border border-slate-100"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-indigo-700">
                              Version {v.version_number}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {formatDate(v.created_at)}
                            </span>
                          </div>
                          {v.change_summary && Object.keys(v.change_summary).length > 0 ? (
                            <p className="mt-1 text-[11px] text-slate-600 line-clamp-1">
                              Changed: {Object.keys(v.change_summary).join(', ')}
                            </p>
                          ) : (
                            <p className="mt-0.5 text-[11px] text-slate-400">
                              Initial baseline version
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(!runsData?.items || runsData.items.length === 0) &&
                  (!versionsData?.items || versionsData.items.length === 0) && (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No recent activity recorded for this analysis.
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>

        {/* Workspace Menu */}
        <div ref={workspaceRef} className="relative">
          <button
            type="button"
            onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus:ring-2 focus:ring-indigo-500"
            aria-label="Workspace connection status"
          >
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
              <Server className="w-3.5 h-3.5" />
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 leading-tight">
                Backend API
              </span>
              <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Connected
              </span>
            </div>
          </button>

          {isWorkspaceOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 p-4 z-50 animate-in fade-in">
              <div className="text-xs font-semibold text-slate-900 mb-2">
                Workspace & Connectivity
              </div>
              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">API Base URL</span>
                  <code className="text-[11px] text-slate-700 bg-slate-50 p-1.5 rounded-md border border-slate-200 block truncate font-mono">
                    {API_BASE_URL}
                  </code>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-slate-600">Health Endpoint:</span>
                  <span className="inline-flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                    {isHealthError ? (
                      <>
                        <AlertCircle className="w-3 h-3 text-red-500" />
                        Offline
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        {healthData?.status || 'Active'}
                      </>
                    )}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  Target: Deterministic validation engine v1
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
