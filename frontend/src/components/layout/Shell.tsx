import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { ToastProvider } from '../common/Toast';
import { UpgradeModal } from '../dashboard/UpgradeModal';
import { VideoModal } from '../dashboard/VideoModal';
import { api } from '../../api/client';
import { queryKeys } from '../../services/queryKeys';

export const Shell: React.FC = () => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isWatchVideoOpen, setIsWatchVideoOpen] = useState(false);
  const location = useLocation();

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

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#080C15] text-[#F8FAFC] flex flex-col font-sans selection:bg-indigo-500/30 selection:text-white relative">
        {/* Subtle Ambient Glows */}
        <div className="fixed top-0 left-64 w-[600px] h-[400px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none z-0" />
        <div className="fixed top-1/3 right-10 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[180px] pointer-events-none z-0" />
        <div className="fixed bottom-10 left-1/3 w-[600px] h-[400px] bg-indigo-600/10 rounded-full blur-[160px] pointer-events-none z-0" />

        {/* Persistent Left Sidebar */}
        <Sidebar
          selectedProductId={selectedProductId}
          isMobileOpen={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
          onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
        />

        {/* Main Content to the right of fixed Sidebar (lg:pl-64) */}
        <div className="lg:pl-64 flex flex-col min-h-screen min-w-0 z-10">
          {/* Top Bar Header */}
          <TopBar
            onToggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)}
            selectedProductId={selectedProductId}
          />

          {/* Body Content */}
          <main className="flex-1 p-3 sm:p-5 lg:p-6 max-w-[1680px] w-full mx-auto">
            <Outlet
              context={{
                selectedProductId,
                onOpenUpgradeModal: () => setIsUpgradeModalOpen(true),
                onOpenVideoModal: () => setIsWatchVideoOpen(true),
              }}
            />
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
