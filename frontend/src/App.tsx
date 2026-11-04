import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { Shell } from './components/layout/Shell';
import { DashboardPage } from './pages/DashboardPage';
import { ProductValidationPage } from './pages/ProductValidationPage';
import { ProfitCalculatorPage } from './pages/ProfitCalculatorPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { InfluencersPage } from './pages/InfluencersPage';
import { NotFound } from './components/layout/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
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
            {/* Primary D2C Vision Shell with the 4 Core Tools */}
            <Route element={<Shell />}>
              <Route index element={<DashboardPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="dashboard/:id" element={<DashboardPage />} />
              <Route path="validation" element={<ProductValidationPage />} />
              <Route path="profit-calculator" element={<ProfitCalculatorPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="influencers" element={<InfluencersPage />} />

              {/* Direct product ID route -> Dashboard */}
              <Route path=":id" element={<DashboardPage />} />

              {/* Catch-all redirect to Dashboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
