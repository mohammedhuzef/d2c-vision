import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { Shell } from './components/layout/Shell';
import { DashboardPage } from './pages/DashboardPage';
import { NewAnalysisPage } from './pages/NewAnalysisPage';
import { ValidationPipelinePage } from './pages/ValidationPipelinePage';
import { CompetitorIntelligencePage } from './pages/CompetitorIntelligencePage';
import { ChangeTrackerPage } from './pages/ChangeTrackerPage';
import { LaunchReportPage } from './pages/LaunchReportPage';
import { ProductFallbackRedirect } from './components/layout/ProductFallbackRedirect';
import { NotFound } from './components/layout/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Shell />}>
              <Route index element={<DashboardPage />} />
              <Route path="new-analysis" element={<NewAnalysisPage />} />
              <Route path="validation" element={<ProductFallbackRedirect toSection="validation" />} />
              <Route path="validation/:id" element={<ValidationPipelinePage />} />
              <Route path="competitors" element={<ProductFallbackRedirect toSection="competitors" />} />
              <Route path="competitors/:id" element={<CompetitorIntelligencePage />} />
              <Route path="change-tracker" element={<ProductFallbackRedirect toSection="change-tracker" />} />
              <Route path="change-tracker/:id" element={<ChangeTrackerPage />} />
              <Route path="reports" element={<ProductFallbackRedirect toSection="reports" />} />
              <Route path="reports/:id" element={<LaunchReportPage />} />
              <Route path=":id" element={<DashboardPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
