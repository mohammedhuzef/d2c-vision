import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '../api/client';
import { DashboardPage } from '../pages/DashboardPage';
import { NewAnalysisPage } from '../pages/NewAnalysisPage';
import { CompetitorIntelligencePage } from '../pages/CompetitorIntelligencePage';
import { ValidationPipelinePage } from '../pages/ValidationPipelinePage';
import { ChangeTrackerPage } from '../pages/ChangeTrackerPage';
import { LaunchReportPage } from '../pages/LaunchReportPage';

// Sample mock data for smoke tests
const mockProduct = {
  id: '9756e7ae-ffba-45b7-94f7-f9743f03390d',
  name: 'TerraFlask 32oz Tumbler',
  category: 'Drinkware',
  target_market: 'Eco-conscious commuters',
  current_version: 1,
  status: 'active',
  created_at: '2026-10-17T05:14:22.448357',
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

const mockReadiness = {
  label: 'READY',
  overall_score: 92.5,
  blocking_stages: [],
  warning_stages: [],
  missing_stages: [],
};

const mockValidationRun = {
  id: 'run-123',
  product_id: mockProduct.id,
  version_number: 1,
  status: 'COMPLETED',
  readiness_score: 92.5,
  readiness_label: 'READY',
  started_at: '2026-10-17T05:15:00',
  completed_at: '2026-10-17T05:15:05',
  results: [
    {
      stage: 'customer',
      status: 'PASSED',
      score: 95.0,
      metrics: { interviews_count: 15 },
      findings: [],
    },
    {
      stage: 'competitor',
      status: 'PASSED',
      score: 90.0,
      metrics: {
        competitor_price_min: 249,
        competitor_price_median: 299,
        competitor_price_max: 349,
      },
      findings: [],
    },
    {
      stage: 'product_packaging',
      status: 'PASSED',
      score: 90.0,
      metrics: {},
      findings: [],
    },
    {
      stage: 'pricing',
      status: 'PASSED',
      score: 95.0,
      metrics: {},
      findings: [],
    },
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
    {
      stage: 'marketing',
      status: 'PASSED',
      score: 93.0,
      metrics: {},
      findings: [],
    },
  ],
};

const mockCompetitors = {
  items: [
    {
      id: 'comp-1',
      product_id: mockProduct.id,
      name: 'HydroFlask',
      product_name: '32oz Wide Mouth',
      website_url: 'https://example.com/hydro',
      notes: 'Market leader',
      created_at: '2026-10-17T05:14:00',
      evidence_count: 3,
      analyses: [
        {
          id: 'analysis-1',
          summary: 'Premium competitor with strong brand loyalty',
          strengths: ['Brand recognition', 'Thermal retention'],
          weaknesses: ['High price point'],
          price_observed: 299,
          evidence_ids: ['ev-1'],
          produced_by: 'mock',
        },
      ],
    },
  ],
};

const mockEvidence = {
  items: [
    {
      id: 'ev-1',
      title: 'HydroFlask Pricing Survey',
      excerpt: 'Observed retail pricing on Amazon India for 32oz tumbler at ₹299.',
      source_url: 'https://example.com/hydro',
      source_type: 'web_scrape',
      confidence: 0.95,
      created_at: '2026-10-17T05:14:00',
      data: { price: '299.00' },
    },
  ],
  total: 1,
  limit: 20,
  offset: 0,
};

const mockVersions = {
  items: [
    {
      id: 'ver-1',
      product_id: mockProduct.id,
      version_number: 1,
      assumptions: mockProduct.assumptions,
      created_at: '2026-10-17T05:14:00',
    },
  ],
};

const mockRecommendations = {
  items: [
    {
      id: 'rec-1',
      stage: 'financial',
      priority: 'HIGH',
      title: 'Optimize COGS via bulk supplier negotiation',
      action_type: 'cost_reduction',
      suggested_value: '65.00',
    },
  ],
};

const mockReports = {
  items: [
    {
      id: 'rep-1',
      product_id: mockProduct.id,
      version_id: 'ver-1',
      format: 'json_markdown',
      content: {
        executive_summary: {
          product_name: mockProduct.name,
          category: mockProduct.category,
          readiness_label: 'READY',
          readiness_score: 92.5,
          verdict: 'TerraFlask exhibits viable unit economics and favorable price positioning.',
        },
        unit_economics: {
          selling_price: '270.00',
          variable_cost_per_unit: '130.40',
          contribution_margin: 0.517,
          break_even_units: 180,
        },
        stage_table: mockValidationRun.results.map((r) => ({
          stage: r.stage,
          status: r.status,
          score: r.score,
          findings_count: 0,
        })),
        unresolved_risks: [],
        strategic_recommendations: mockRecommendations.items,
        evidence_quality: {
          total_evidence_items: 1,
          average_confidence: '0.9500',
          share_with_source_url: '1.0000',
          citations: mockEvidence.items,
        },
      },
      markdown: '# Launch Readiness Report for TerraFlask\nVerdict: READY',
      generated_at: '2026-10-17T05:20:00',
    },
  ],
  total: 1,
  limit: 20,
  offset: 0,
};

import { ToastProvider } from '../components/common/Toast';

function renderWithProviders(ui: React.ReactElement, initialPath: string = '/') {
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
        <MemoryRouter initialEntries={[initialPath]}>
          {ui}
        </MemoryRouter>
      </QueryClientProvider>
    </ToastProvider>
  );
}

describe('Frontend Pages Smoke Test Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    // Mock API client methods
    vi.spyOn(api.products, 'get').mockResolvedValue(mockProduct as any);
    vi.spyOn(api.products, 'list').mockResolvedValue({
      items: [mockProduct as any],
      total: 1,
      limit: 20,
      offset: 0,
    });
    vi.spyOn(api.validation, 'readiness').mockResolvedValue(mockReadiness as any);
    vi.spyOn(api.validation, 'latest').mockResolvedValue(mockValidationRun as any);
    vi.spyOn(api.validation, 'latestRecommendations').mockResolvedValue(mockRecommendations as any);
    vi.spyOn(api.competitors, 'list').mockResolvedValue(mockCompetitors as any);
    vi.spyOn(api.evidence, 'list').mockResolvedValue(mockEvidence as any);
    vi.spyOn(api.versions, 'list').mockResolvedValue(mockVersions as any);
    vi.spyOn(api.reports, 'list').mockResolvedValue(mockReports as any);
  });

  it('DashboardPage: renders product summary, score, and core metrics', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/:id" element={<DashboardPage />} />
      </Routes>,
      `/${mockProduct.id}`
    );

    await waitFor(() => {
      expect(screen.getAllByText('TerraFlask 32oz Tumbler').length).toBeGreaterThan(0);
    });

    expect(screen.getByText(/Launch Readiness/i)).toBeInTheDocument();
    expect(screen.getByText(/Unit Economics & Financial Snapshot/i)).toBeInTheDocument();
  });

  it('NewAnalysisPage: renders multi-step wizard form', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/new-analysis" element={<NewAnalysisPage />} />
      </Routes>,
      '/new-analysis'
    );

    expect(screen.getByText(/Create D2C Product Launch Twin/i)).toBeInTheDocument();
    expect(screen.getByText(/Step 1: Product Definition & Customer Signals/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. TerraFlask/i)).toBeInTheDocument();
  });

  it('CompetitorIntelligencePage: renders competitor card and evidence ledger', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/competitors/:id" element={<CompetitorIntelligencePage />} />
      </Routes>,
      `/competitors/${mockProduct.id}`
    );

    await waitFor(() => {
      expect(screen.getByText(/Competitor Intelligence & Pricing Corridor/i)).toBeInTheDocument();
      expect(screen.getByText('HydroFlask')).toBeInTheDocument();
    });

    expect(screen.getByText(/Evidence Repository/i)).toBeInTheDocument();
  });

  it('ValidationPipelinePage: renders 6 stage cards and topological order', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/validation/:id" element={<ValidationPipelinePage />} />
      </Routes>,
      `/validation/${mockProduct.id}`
    );

    await waitFor(() => {
      expect(screen.getByText(/6-Stage Sequential Gatekeeper/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Stage 1: Customer Validation/i)).toBeInTheDocument();
    expect(screen.getByText(/Stage 5: Unit Economics & Viability/i)).toBeInTheDocument();
  });

  it('ChangeTrackerPage: renders What-If simulation parameters and version ledger', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/change-tracker/:id" element={<ChangeTrackerPage />} />
      </Routes>,
      `/change-tracker/${mockProduct.id}`
    );

    await waitFor(() => {
      expect(screen.getByText(/What-If Simulation & Version Ledger/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Assumption Parameters/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Simulate \(No Save\)/i).length).toBeGreaterThan(0);
  });

  it('LaunchReportPage: renders executive launch dossier and sections', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/reports/:id" element={<LaunchReportPage />} />
      </Routes>,
      `/reports/${mockProduct.id}`
    );

    await waitFor(() => {
      expect(screen.getByText(/Executive Launch Dossier/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Visual Executive Layout/i)).toBeInTheDocument();
    expect(screen.getByText(/Unit Economics & Viability Profile/i)).toBeInTheDocument();
  });
});
