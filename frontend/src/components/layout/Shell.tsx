import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { ToastProvider } from '../common/Toast';
import { EmptyState } from '../common/EmptyState';
import { UpgradeModal } from '../dashboard/UpgradeModal';
import { VideoModal } from '../dashboard/VideoModal';
import { api } from '../../api/client';
import { queryKeys } from '../../services/queryKeys';

export const Shell: React.FC = () => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isWatchVideoOpen, setIsWatchVideoOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isUUID = (str?: string): boolean =>
    Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

  // Extract ID from URL if directly on /:id, /validation/:id, etc.
  const pathParts = location.pathname.split('/').filter(Boolean);
  const activeId = pathParts.find(isUUID);

  // Fetch list of products
  const { data: productsData } = useQuery({
    queryKey: queryKeys.products.list(),
    queryFn: () => api.products.list({ limit: 20 }),
  });

  const products = productsData?.items || [];
  const newestProductId = products.length > 0 ? products[0].id : undefined;
  const selectedProductId = activeId || newestProductId;

  // Auto-redirect from / to /:id when products exist to preserve active ID in route
  useEffect(() => {
    if (location.pathname === '/' && selectedProductId) {
      navigate(`/${selectedProductId}`, { replace: true });
    }
  }, [location.pathname, selectedProductId, navigate]);

  const hasNoAnalyses = Boolean(productsData && productsData.items && productsData.items.length === 0);
  const isRootOrDashboard = location.pathname === '/' || location.pathname === '/dashboard';

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#071426] text-[#F8FAFF] flex flex-col font-sans selection:bg-[#7547FF]/40 selection:text-white relative">
        {/* Subtle Ambient Glows - Electric Purple & Cyan */}
        <div className="fixed top-0 left-64 w-[600px] h-[400px] bg-[#7547FF]/10 rounded-full blur-[180px] pointer-events-none z-0" />
        <div className="fixed top-1/3 right-10 w-[500px] h-[500px] bg-[#25D9E8]/8 rounded-full blur-[200px] pointer-events-none z-0" />
        <div className="fixed bottom-10 left-1/3 w-[600px] h-[400px] bg-[#278BFF]/10 rounded-full blur-[180px] pointer-events-none z-0" />

        {/* Persistent Left Sidebar: approximately 183px wide */}
        <Sidebar
          selectedProductId={selectedProductId}
          isMobileOpen={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
          onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
        />

        {/* Main Content to the right of fixed Sidebar (lg:pl-[183px]) */}
        <div className="lg:pl-[183px] flex flex-col min-h-screen min-w-0 z-10">
          {/* Top Bar Header */}
          <TopBar
            onToggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)}
            onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
            onOpenVideoModal={() => setIsWatchVideoOpen(true)}
            selectedProductId={selectedProductId}
          />

          {/* Main Content Body */}
          <main className="flex-1 p-3.5 sm:p-5 lg:p-6 max-w-[1536px] w-full mx-auto">
            {hasNoAnalyses && isRootOrDashboard ? (
              <div className="py-12">
                <EmptyState
                  title="No Analyses Found"
                  description="No product analyses have been created yet. Launch your first validation pipeline to get started."
                  action={{
                    label: 'Create Your First Analysis',
                    onClick: () => navigate('/new-analysis'),
                  }}
                />
              </div>
            ) : (
              <Outlet
                context={{
                  selectedProductId,
                  onOpenUpgradeModal: () => setIsUpgradeModalOpen(true),
                  onOpenVideoModal: () => setIsWatchVideoOpen(true),
                }}
              />
            )}
          </main>
        </div>

        {/* Global Modals */}
        <UpgradeModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
        />

        <VideoModal
          isOpen={isWatchVideoOpen}
          onClose={() => setIsWatchVideoOpen(false)}
        />
      </div>
    </ToastProvider>
  );
};
