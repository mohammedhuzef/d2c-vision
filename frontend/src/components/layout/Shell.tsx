import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { MockProviderBanner } from './MockProviderBanner';
import { ToastProvider } from '../common/Toast';
import { api } from '../../api/client';
import { queryKeys } from '../../services/queryKeys';

export const Shell: React.FC = () => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Helper to validate UUID format
  const isUUID = (str?: string): boolean =>
    Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

  // Extract ID from URL if directly on /:id, /validation/:id, /competitors/:id, etc.
  const pathParts = location.pathname.split('/').filter(Boolean);
  const activeId = pathParts.find(isUUID);

  // Fetch list of products to get the newest as default if no ID is specified in URL
  const { data: productsData } = useQuery({
    queryKey: queryKeys.products.list(),
    queryFn: () => api.products.list({ limit: 20 }),
  });

  const products = productsData?.items || [];
  const newestProductId = products.length > 0 ? products[0].id : undefined;
  const selectedProductId = activeId || newestProductId;

  // If on "/" without an ID, write the selected id back to the URL when analyses exist
  useEffect(() => {
    if (location.pathname === '/' && newestProductId) {
      navigate(`/${newestProductId}`, { replace: true });
    }
  }, [location.pathname, newestProductId, navigate]);

  // Check if research results for this product were produced by 'mock' provider
  const { data: competitorData } = useQuery({
    queryKey: queryKeys.competitors.list(selectedProductId),
    queryFn: () => api.competitors.list(selectedProductId!),
    enabled: Boolean(selectedProductId && isUUID(selectedProductId)),
  });

  const isMockProvider = Boolean(
    competitorData?.items?.some((comp) =>
      comp.analyses?.some((analysis: any) => analysis.produced_by === 'mock')
    )
  );

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        {/* Fixed Top Bar (64px) */}
        <TopBar
          onToggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)}
          selectedProductId={selectedProductId}
        />

        <div className="pt-16 flex flex-1">
          {/* Sidebar */}
          <Sidebar
            selectedProductId={selectedProductId}
            isMobileOpen={isMobileNavOpen}
            onCloseMobile={() => setIsMobileNavOpen(false)}
          />

          {/* Main content area */}
          <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
            {/* Mock Provider Amber Banner */}
            <MockProviderBanner isMock={isMockProvider} />

            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
              <Outlet context={{ selectedProductId }} />
            </main>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
};
