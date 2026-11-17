import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { App } from '../App';
import { APP_URL, NEW_ANALYSIS_URL } from '../config';

describe('Landing Page Navigation & CTAs', () => {
  it('renders brand logo and sticky navigation links with correct href anchors', () => {
    render(<App />);

    // Brand logo
    const brandElements = screen.getAllByLabelText(/LaunchTwin AI homepage/i);
    expect(brandElements.length).toBeGreaterThan(0);

    // Section anchor links
    const problemLinks = screen.getAllByRole('link', { name: /The Problem/i });
    expect(problemLinks[0]).toHaveAttribute('href', '#problem');

    const howItWorksLinks = screen.getAllByRole('link', { name: /How It Works/i });
    expect(howItWorksLinks[0]).toHaveAttribute('href', '#how-it-works');

    const pipelineLinks = screen.getAllByRole('link', { name: /Validation Pipeline/i });
    expect(pipelineLinks[0]).toHaveAttribute('href', '#pipeline');

    const architectureLinks = screen.getAllByRole('link', { name: /AI vs Python/i });
    expect(architectureLinks[0]).toHaveAttribute('href', '#architecture');
  });

  it('links all "Open the app" CTAs to the configured VITE_APP_URL', () => {
    render(<App />);

    const openAppLinks = screen.getAllByRole('link', { name: /Open the app/i });
    expect(openAppLinks.length).toBeGreaterThan(0);

    openAppLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', APP_URL);
    });
  });

  it('links "Start an analysis" CTA to VITE_APP_URL/new-analysis', () => {
    render(<App />);

    const startAnalysisLink = screen.getByRole('link', { name: /Start an analysis/i });
    expect(startAnalysisLink).toHaveAttribute('href', NEW_ANALYSIS_URL);
  });

  it('toggles the mobile drawer menu when mobile button is clicked', () => {
    render(<App />);

    const menuToggle = screen.getByLabelText(/Toggle navigation menu/i);
    expect(menuToggle).toHaveAttribute('aria-expanded', 'false');

    // Click to open
    fireEvent.click(menuToggle);
    expect(menuToggle).toHaveAttribute('aria-expanded', 'true');

    const mobileMenu = document.getElementById('mobile-navigation-menu');
    expect(mobileMenu).toBeInTheDocument();

    // Click to close
    fireEvent.click(menuToggle);
    expect(menuToggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('displays the static sample readiness card labelled Example', () => {
    render(<App />);

    const exampleLabels = screen.getAllByText(/Example/i);
    expect(exampleLabels.length).toBeGreaterThan(0);

    expect(screen.getByText('EcoGlow Face Serum 50ml')).toBeInTheDocument();
    expect(screen.getByText('₹500.00')).toBeInTheDocument();
    expect(screen.getByText('₹270.00')).toBeInTheDocument();
  });

  it('renders all 6 pipeline stages and marks Pricing and Financial as critical vetoes', () => {
    render(<App />);

    expect(screen.getByText('Customer Discovery')).toBeInTheDocument();
    expect(screen.getByText('Competitor Landscape')).toBeInTheDocument();
    expect(screen.getByText('Product & Packaging')).toBeInTheDocument();
    expect(screen.getByText('Pricing Strategy')).toBeInTheDocument();
    expect(screen.getByText('Financial Unit Economics')).toBeInTheDocument();
    expect(screen.getByText('Marketing Feasibility')).toBeInTheDocument();

    const criticalBadges = screen.getAllByText(/Critical Veto/i);
    expect(criticalBadges.length).toBe(2);
  });
});
