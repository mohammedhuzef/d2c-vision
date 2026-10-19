import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '../api/client';
import { Shell } from '../components/layout/Shell';
import { DashboardPage } from '../pages/DashboardPage';
import { NewAnalysisPage } from '../pages/NewAnalysisPage';
import { ValidationPipelinePage } from '../pages/ValidationPipelinePage';
import { CompetitorIntelligencePage } from '../pages/CompetitorIntelligencePage';
import { ChangeTrackerPage } from '../pages/ChangeTrackerPage';
import { LaunchReportPage } from '../pages/LaunchReportPage';
import { ProductFallbackRedirect } from '../components/layout/ProductFallbackRedirect';
import { NotFound } from '../components/layout/NotFound';
import { ToastProvider } from '../components/common/Toast';
import { ApiError } from '../api/errors';

const product1 = {
  id: '9756e7ae-ffba-45b7-94f7-f9743f03390d',
  name: 'TerraFlask 32oz Tumbler',
  category: 'Drinkware',
  target_market: 'Commuters',
  current_version: 1,
  status: 'active',
  created_at: '2026-10-17T05:14:22',
  validated_version: 1,
  revalidation_required: false,
  research_provider: 'mock',
  assumptions: {
    pricing: { selling_price: '270.00', target_margin_fraction: '0.40' },
    costs: {
      cogs_per_unit: '70.00',
      packaging_cost: '20.00',
      shipping_cost_per_unit: '30.00',
      other_variable_cost_per_unit: '5.00',
      payment_fee_fraction: '0.02',
      fixed_costs_total: '25000.00',
    },
    marketing: {
      monthly_budget: '50000.00',
      expected_cac: '500.00',
      channels: ['Meta Ads'],
      expected_conversion_rate_fraction: '0.03',
    },
  },
};

const product2 = {
  id: '3b778cb1-e5ae-426f-b6f2-09ce32a93866',
  name: 'Basic Budget Bottle',
  category: 'Drinkware',
  target_market: 'Students',
  current_version: 1,
  status: 'active',
  created_at: '2026-10-17T05:14:25',
  validated_version: 1,
  revalidation_required: false,
  research_provider: 'mock',
  assumptions: {
    pricing: { selling_price: '150.00', target_margin_fraction: '0.20' },
    costs: {
      cogs_per_unit: '80.00',
      packaging_cost: '10.00',
      shipping_cost_per_unit: '25.00',
      other_variable_cost_per_unit: '5.00',
      payment_fee_fraction: '0.02',
      fixed_costs_total: '15000.00',
    },
    marketing: {
      monthly_budget: '20000.00',
      expected_cac: '300.00',
      channels: ['Instagram'],
      expected_conversion_rate_fraction: '0.02',
    },
  },
};

const mockReadiness = {
  label: 'READY',
  overall_score: 92.5,
  blocking_stages: [],
  warning_stages: [],
  missing_stages: [],
};

const mockValidationRun = {
  id: 'run-1',
  product_id: product1.id,
  version_number: 1,
  status: 'COMPLETED',
  readiness_score: 92.5,
  readiness_label: 'READY',
  started_at: '2026-10-17T05:15:00',
  completed_at: '2026-10-17T05:15:05',
  results: [
    { stage: 'customer', status: 'PASSED', score: 95.0, metrics: {}, findings: [] },
    { stage: 'competitor', status: 'PASSED', score: 90.0, metrics: {}, findings: [] },
    { stage: 'product_packaging', status: 'PASSED', score: 90.0, metrics: {}, findings: [] },
    { stage: 'pricing', status: 'PASSED', score: 95.0, metrics: {}, findings: [] },
    {
      stage: 'financial',
      status: 'PASSED',
      score: 92.0,
      metrics: {
        selling_price: '270.00',
        variable_cost_per_unit: '130.40',
        contribution_margin: 0.517,
        break_even_units: 180,
      },
      findings: [],
    },
    { stage: 'marketing', status: 'PASSED', score: 93.0, metrics: {}, findings: [] },
  ],
};

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="current-location">{location.pathname}</div>;
}

function renderAppWithRouter(initialEntry: string, productsList: any[] = [product1, product2]) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  });

  return render(
    <ToastProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <LocationDisplay />
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
        </MemoryRouter>
      </QueryClientProvider>
    </ToastProvider>
  );
}

describe('W3 Navigation & Routing Verification Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(api.products, 'list').mockResolvedValue({
      items: [product1, product2] as any,
      total: 2,
      limit: 20,
      offset: 0,
    });

    vi.spyOn(api.products, 'get').mockImplementation(async (id: string) => {
      if (id === product1.id) return product1 as any;
      if (id === product2.id) return product2 as any;
      throw new ApiError(404, { code: 'NOT_FOUND', message: 'Product not found', details: [] });
    });

    vi.spyOn(api.validation, 'readiness').mockResolvedValue(mockReadiness as any);
    vi.spyOn(api.validation, 'latest').mockResolvedValue(mockValidationRun as any);
    vi.spyOn(api.validation, 'latestRecommendations').mockResolvedValue({ items: [] } as any);
    vi.spyOn(api.competitors, 'list').mockResolvedValue({ items: [] } as any);
    vi.spyOn(api.evidence, 'list').mockResolvedValue({ items: [], total: 0, limit: 20, offset: 0 } as any);
    vi.spyOn(api.versions, 'list').mockResolvedValue({ items: [] } as any);
    vi.spyOn(api.reports, 'list').mockResolvedValue({ items: [] } as any);
  });

  it('1. sidebar links contain the selected id', async () => {
    renderAppWithRouter(`/${product1.id}`);

    await waitFor(() => {
      expect(screen.getByTestId('current-location')).toHaveTextContent(`/${product1.id}`);
    });

    // Check sidebar nav links
    const dashboardLink = screen.getAllByRole('link', { name: /Dashboard/i })[0];
    const validationLink = screen.getAllByRole('link', { name: /Validation Pipeline/i })[0];
    const competitorLink = screen.getAllByRole('link', { name: /Competitor Intelligence/i })[0];
    const changeTrackerLink = screen.getAllByRole('link', { name: /Change Tracker/i })[0];
    const reportLink = screen.getAllByRole('link', { name: /Launch Report/i })[0];
    const newAnalysisLink = screen.getAllByRole('link', { name: /New Analysis/i })[0];

    expect(dashboardLink).toHaveAttribute('href', `/${product1.id}`);
    expect(validationLink).toHaveAttribute('href', `/validation/${product1.id}`);
    expect(competitorLink).toHaveAttribute('href', `/competitors/${product1.id}`);
    expect(changeTrackerLink).toHaveAttribute('href', `/change-tracker/${product1.id}`);
    expect(reportLink).toHaveAttribute('href', `/reports/${product1.id}`);
    expect(newAnalysisLink).toHaveAttribute('href', '/new-analysis');
  });

  it('2. a deep link to each of the five id routes renders its page', async () => {
    // 2a. Dashboard /:id
    const { unmount: u1 } = renderAppWithRouter(`/${product1.id}`);
    await waitFor(() => {
      expect(screen.getByText(/Launch Readiness/i)).toBeInTheDocument();
    });
    u1();

    // 2b. Validation Pipeline /validation/:id
    const { unmount: u2 } = renderAppWithRouter(`/validation/${product1.id}`);
    await waitFor(() => {
      expect(screen.getByText(/6-Stage Sequential Gatekeeper/i)).toBeInTheDocument();
    });
    u2();

    // 2c. Competitor Intelligence /competitors/:id
    const { unmount: u3 } = renderAppWithRouter(`/competitors/${product1.id}`);
    await waitFor(() => {
      expect(screen.getByText(/Competitor Intelligence & Pricing Corridor/i)).toBeInTheDocument();
    });
    u3();

    // 2d. Change Tracker /change-tracker/:id
    const { unmount: u4 } = renderAppWithRouter(`/change-tracker/${product1.id}`);
    await waitFor(() => {
      expect(screen.getByText(/What-If Simulation & Version Ledger/i)).toBeInTheDocument();
    });
    u4();

    // 2e. Launch Report /reports/:id
    const { unmount: u5 } = renderAppWithRouter(`/reports/${product1.id}`);
    await waitFor(() => {
      expect(screen.getByText(/Executive Launch Dossier/i)).toBeInTheDocument();
    });
    u5();
  });

  it('3. no id redirects to the same page with the selected id', async () => {
    // 3a. /validation -> /validation/:id
    const { unmount: u1 } = renderAppWithRouter('/validation');
    await waitFor(() => {
      expect(screen.getByTestId('current-location')).toHaveTextContent(`/validation/${product1.id}`);
      expect(screen.getByText(/6-Stage Sequential Gatekeeper/i)).toBeInTheDocument();
    });
    u1();

    // 3b. /competitors -> /competitors/:id
    const { unmount: u2 } = renderAppWithRouter('/competitors');
    await waitFor(() => {
      expect(screen.getByTestId('current-location')).toHaveTextContent(`/competitors/${product1.id}`);
      expect(screen.getByText(/Competitor Intelligence & Pricing Corridor/i)).toBeInTheDocument();
    });
    u2();

    // 3c. /change-tracker -> /change-tracker/:id
    const { unmount: u3 } = renderAppWithRouter('/change-tracker');
    await waitFor(() => {
      expect(screen.getByTestId('current-location')).toHaveTextContent(`/change-tracker/${product1.id}`);
      expect(screen.getByText(/What-If Simulation & Version Ledger/i)).toBeInTheDocument();
    });
    u3();

    // 3d. /reports -> /reports/:id
    const { unmount: u4 } = renderAppWithRouter('/reports');
    await waitFor(() => {
      expect(screen.getByTestId('current-location')).toHaveTextContent(`/reports/${product1.id}`);
      expect(screen.getByText(/Executive Launch Dossier/i)).toBeInTheDocument();
    });
    u4();

    // 3e. / -> /:id (written back to URL)
    const { unmount: u5 } = renderAppWithRouter('/');
    await waitFor(() => {
      expect(screen.getByTestId('current-location')).toHaveTextContent(`/${product1.id}`);
    });
    u5();
  });

  it('4. unknown or malformed id shows the not-found state with a link back', async () => {
    // Malformed ID
    const { unmount: u1 } = renderAppWithRouter('/validation/malformed-id-123');
    await waitFor(() => {
      expect(screen.getByText('Analysis Not Found')).toBeInTheDocument();
      expect(screen.getByText(/The requested analysis ID "malformed-id-123" could not be found or is invalid/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Back to Dashboard/i })).toBeInTheDocument();
    });
    u1();

    // Unknown UUID
    const unknownUUID = '00000000-0000-0000-0000-000000000000';
    const { unmount: u2 } = renderAppWithRouter(`/validation/${unknownUUID}`);
    await waitFor(() => {
      expect(screen.getByText('Analysis Not Found')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Back to Dashboard/i })).toBeInTheDocument();
    });
    u2();
  });

  it('5. no analyses shows the empty dashboard', async () => {
    // Mock products.list returning empty array
    vi.spyOn(api.products, 'list').mockResolvedValue({
      items: [],
      total: 0,
      limit: 20,
      offset: 0,
    });

    // Opening / with no products
    const { unmount: u1 } = renderAppWithRouter('/', []);
    await waitFor(() => {
      expect(screen.getByText('No Analyses Found')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Create Your First Analysis/i })).toBeInTheDocument();
    });
    u1();

    // Opening /validation with no products redirects to / and shows empty dashboard
    const { unmount: u2 } = renderAppWithRouter('/validation', []);
    await waitFor(() => {
      expect(screen.getByTestId('current-location')).toHaveTextContent('/');
      expect(screen.getByText('No Analyses Found')).toBeInTheDocument();
    });
    u2();
  });

  it('6. the catch-all shows 404 page', async () => {
    renderAppWithRouter('/nonexistent/deep/route/here');

    await waitFor(() => {
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
      expect(screen.getByText(/The page or analysis resource you are looking for does not exist/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Back to Dashboard/i })).toBeInTheDocument();
    });
  });

  it('7. switching the analysis keeps the current page', async () => {
    renderAppWithRouter(`/competitors/${product1.id}`);

    await waitFor(() => {
      expect(screen.getByTestId('current-location')).toHaveTextContent(`/competitors/${product1.id}`);
    });

    // Open analysis selector dropdown once loaded
    const selectorBtn = await screen.findByRole('button', { name: new RegExp(product1.name, 'i') });
    fireEvent.click(selectorBtn);

    // Click product2 in dropdown
    const product2Btn = await screen.findByRole('button', { name: new RegExp(product2.name, 'i') });
    fireEvent.click(product2Btn);

    // Current page is maintained, swapping only the ID
    await waitFor(() => {
      expect(screen.getByTestId('current-location')).toHaveTextContent(`/competitors/${product2.id}`);
    });
  });
});
