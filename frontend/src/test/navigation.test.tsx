import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Shell } from '../components/layout/Shell';
import { DashboardPage } from '../pages/DashboardPage';
import { ProductValidationPage } from '../pages/ProductValidationPage';
import { ProfitCalculatorPage } from '../pages/ProfitCalculatorPage';
import { ProjectsPage } from '../pages/ProjectsPage';
import { InfluencersPage } from '../pages/InfluencersPage';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  });

describe('Core Application Navigation & Shell', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    localStorage.clear();
  });

  it('renders sidebar with the 4 core items and navigates cleanly', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<Shell />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/validation" element={<ProductValidationPage />} />
              <Route path="/profit-calculator" element={<ProfitCalculatorPage />} />
              <Route path="/influencers" element={<InfluencersPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Sidebar core items should exist
    const dashboardLinks = screen.getAllByRole('link', { name: /Dashboard/i });
    expect(dashboardLinks.length).toBeGreaterThan(0);

    const validationLinks = screen.getAllByRole('link', { name: /Product Validation/i });
    expect(validationLinks.length).toBeGreaterThan(0);

    const calculatorLinks = screen.getAllByRole('link', { name: /Profit Calculator/i });
    expect(calculatorLinks.length).toBeGreaterThan(0);

    const projectLinks = screen.getAllByRole('link', { name: /My Projects/i });
    expect(projectLinks.length).toBeGreaterThan(0);

    const influencerLinks = screen.getAllByRole('link', { name: /Influencer Finder/i });
    expect(influencerLinks.length).toBeGreaterThan(0);

    // Navigate to Influencer Finder
    fireEvent.click(influencerLinks[0]);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Influencer Finder by Product Type/i })).toBeInTheDocument();
    });

    // Navigate to Product Validation
    fireEvent.click(validationLinks[0]);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Product Validation Studio/i })).toBeInTheDocument();
    });

    // Navigate to Profit Calculator
    const calcLink = screen.getAllByRole('link', { name: /Profit Calculator/i })[0];
    fireEvent.click(calcLink);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /D2C Profit & Break-Even Calculator/i })).toBeInTheDocument();
    });

    // Navigate to My Projects
    const projLink = screen.getAllByRole('link', { name: /My Projects/i })[0];
    fireEvent.click(projLink);
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /My Projects/i })).toBeInTheDocument();
    });
  });

  it('supports quick validate action from TopBar', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<Shell />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/validation" element={<ProductValidationPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    const quickValidateButtons = screen.getAllByRole('button', { name: /Validate Idea/i });
    expect(quickValidateButtons.length).toBeGreaterThan(0);
    fireEvent.click(quickValidateButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Product Validation Studio/i })).toBeInTheDocument();
    });
  });
});
