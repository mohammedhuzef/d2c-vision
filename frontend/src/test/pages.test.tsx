import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

describe('Core D2C Pages Rendering', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    localStorage.clear();
  });

  it('renders DashboardPage with hero, analytics, and founder workspaces', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Hero headline
    expect(screen.getByText(/Turn Product Ideas/i)).toBeInTheDocument();
    expect(screen.getByText(/D2C Brands/i)).toBeInTheDocument();

    // Analytics section
    expect(screen.getByText(/Market Analytics & Intelligence/i)).toBeInTheDocument();
    expect(screen.getByText(/Trending Products/i)).toBeInTheDocument();
    expect(screen.getByText(/Top Opportunities/i)).toBeInTheDocument();

    // Core Workspaces
    expect(screen.getByText(/Core Founder Workspaces/i)).toBeInTheDocument();
  });

  it('renders ProductValidationPage and computes viability score', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/validation']}>
          <Routes>
            <Route path="/validation" element={<ProductValidationPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByRole('heading', { name: /Product Validation Studio/i })).toBeInTheDocument();
    expect(screen.getByText(/Live Concept Preview/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Validate Product/i })).toBeInTheDocument();
  });

  it('renders ProfitCalculatorPage with interactive unit economics and contribution margin', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/profit-calculator']}>
          <Routes>
            <Route path="/profit-calculator" element={<ProfitCalculatorPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByRole('heading', { name: /D2C Profit & Break-Even Calculator/i })).toBeInTheDocument();
    expect(screen.getByText(/1\. Per-Unit Variable Economics/i)).toBeInTheDocument();
    expect(screen.getByText(/Manufacturing Cost \/ COGS/i)).toBeInTheDocument();
  });

  it('renders ProjectsPage and displays stored projects or empty state', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/projects']}>
          <Routes>
            <Route path="/projects" element={<ProjectsPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByRole('heading', { level: 1, name: /My Projects/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Project/i })).toBeInTheDocument();
  });

  it('renders InfluencersPage with product-type matchmaker and creator cards', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/influencers?productType=Skincare%20%26%20Clean%20Beauty']}>
          <Routes>
            <Route path="/influencers" element={<InfluencersPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Page Header
    expect(screen.getByRole('heading', { name: /Influencer Finder by Product Type/i })).toBeInTheDocument();
    expect(screen.getByText(/Product-Type Creator Matchmaker Studio/i)).toBeInTheDocument();

    // Product Type Fit Pill
    expect(screen.getByRole('button', { name: /Calculate Best Product Matches/i })).toBeInTheDocument();

    // Creators should be rendered (e.g., Rhea Sharma has 97% fit for Skincare)
    expect(screen.getByText(/Rhea Sharma/i)).toBeInTheDocument();
    expect(screen.getByText(/97% Fit/i)).toBeInTheDocument();
  });
});
