import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { Shell } from './components/layout/Shell';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProductValidationPage } from './pages/ProductValidationPage';
import { MarketAnalysisPage } from './pages/MarketAnalysisPage';
import { ManufacturersPage } from './pages/ManufacturersPage';
import { InfluencersPage } from './pages/InfluencersPage';
import { ProfitCalculatorPage } from './pages/ProfitCalculatorPage';
import { AdContentToolsPage } from './pages/AdContentToolsPage';
import { TrendsInsightsPage } from './pages/TrendsInsightsPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { TeamPage } from './pages/TeamPage';
import { SettingsPage } from './pages/SettingsPage';
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
            {/* Public Home Page when user enters */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/home" element={<LandingPage />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/marketplace" element={<LandingPage />} />

            {/* Application Shell with Sidebar and Header */}
            <Route element={<Shell />}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="dashboard/:id" element={<DashboardPage />} />
              <Route path="validation" element={<ProductValidationPage />} />
              <Route path="market-analysis" element={<MarketAnalysisPage />} />
              <Route path="manufacturers" element={<ManufacturersPage />} />
              <Route path="influencers" element={<InfluencersPage />} />
              <Route path="profit-calculator" element={<ProfitCalculatorPage />} />
              <Route path="ad-tools" element={<AdContentToolsPage />} />
              <Route path="trends" element={<TrendsInsightsPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="team" element={<TeamPage />} />
              <Route path="settings" element={<SettingsPage />} />
              
              {/* Preserved deep-dive backend pipelines */}
              <Route path="new-analysis" element={<NewAnalysisPage />} />
              <Route path="validation/:id" element={<ValidationPipelinePage />} />
              <Route path="competitors" element={<ProductFallbackRedirect toSection="competitors" />} />
              <Route path="competitors/:id" element={<CompetitorIntelligencePage />} />
              <Route path="change-tracker" element={<ProductFallbackRedirect toSection="change-tracker" />} />
              <Route path="change-tracker/:id" element={<ChangeTrackerPage />} />
              <Route path="reports" element={<ProductFallbackRedirect toSection="reports" />} />
              <Route path="reports/:id" element={<LaunchReportPage />} />

              {/* Direct product ID route */}
              <Route path=":id" element={<DashboardPage />} />
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
