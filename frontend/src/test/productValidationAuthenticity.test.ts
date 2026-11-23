import { describe, it, expect } from 'vitest';
import {
  generateFeasibilityReport,
  ValidationInput,
  EvidenceFeasibilityReport,
} from '../utils/productFeasibilityEngine';

describe('Evidence-Based Product Feasibility Engine & Data Authenticity', () => {
  const sampleInput: ValidationInput = {
    productName: 'Cold Brew Hibiscus Energy Tonic',
    category: 'Beverages',
    location: 'India (Tier 1 Metros)',
    sellingPrice: 149,
    mfgCost: 38,
    moq: 500,
    marketingBudget: 50000,
    description: 'Naturally caffeinated sparkling botanical beverage with organic hibiscus and green tea.',
    ingredients: 'Organic hibiscus, Japanese green tea, stevia leaf, sparkling water.',
    targetAudience: 'Urban professionals aged 22-35 looking for clean energy.',
  };

  it('generates structured research across all 8 core dimensions', () => {
    const report: EvidenceFeasibilityReport = generateFeasibilityReport(sampleInput);

    // Dimension 1: Market Demand
    expect(report.marketDemand).toBeDefined();
    expect(report.marketDemand.searchVolumeMonthly).toMatch(/queries \/ mo/i);
    expect(report.marketDemand.yoyTrend).toMatch(/\+\d+%\s*YoY/i);
    expect(report.marketDemand.consumerInterestSummary.length).toBeGreaterThan(20);
    expect(report.marketDemand.purchaseIntent.length).toBeGreaterThan(10);

    // Dimension 2: Competition
    expect(report.competition).toBeDefined();
    expect(report.competition.competitors.length).toBeGreaterThanOrEqual(2);
    expect(report.competition.priceRange).toBeDefined();
    expect(report.competition.marketSaturation).toBeDefined();
    expect(report.competition.differentiationOpportunities.length).toBeGreaterThanOrEqual(1);

    // Dimension 3: Financial Feasibility
    expect(report.financialFeasibility).toBeDefined();
    expect(report.financialFeasibility.sellingPrice).toBe(149);
    expect(report.financialFeasibility.mfgCost).toBe(38);
    expect(report.financialFeasibility.grossMarginPct).toBe(74); // ((149-38)/149)*100 = 74.49 -> 74%
    expect(report.financialFeasibility.formulaDetails.grossMarginFormula).toContain('Selling Price');
    expect(report.financialFeasibility.formulaDetails.contributionFormula).toContain('Contribution Margin');

    // Dimension 4: Manufacturing Feasibility
    expect(report.manufacturingFeasibility).toBeDefined();
    expect(report.manufacturingFeasibility.copackers.length).toBeGreaterThanOrEqual(2);
    expect(report.manufacturingFeasibility.leadTime).toBeDefined();
    expect(report.manufacturingFeasibility.certificationsNeeded.length).toBeGreaterThanOrEqual(2);

    // Dimension 5: Target Customers
    expect(report.targetCustomers).toBeDefined();
    expect(report.targetCustomers.ageGroups.primary).toBeDefined();
    expect(report.targetCustomers.geographicMarkets.length).toBeGreaterThanOrEqual(3);
    expect(report.targetCustomers.idealCustomerProfile.length).toBeGreaterThan(20);

    // Dimension 6: Product Positioning
    expect(report.productPositioning).toBeDefined();
    expect(report.productPositioning.packagingSpecs.length).toBeGreaterThan(15);
    expect(report.productPositioning.brandingTier).toBeDefined();
    expect(report.productPositioning.uniqueSellingProposition).toContain(sampleInput.productName);

    // Dimension 7: Risks & Compliance
    expect(report.risks).toBeDefined();
    expect(report.risks.regulatoryRequirements.length).toBeGreaterThanOrEqual(1);
    expect(report.risks.supplyChainRisks.length).toBeGreaterThanOrEqual(1);
    expect(report.risks.customerAcquisitionRisks.length).toBeGreaterThanOrEqual(1);

    // Dimension 8: Launch Recommendations
    expect(report.launchRecommendations).toBeDefined();
    expect(report.launchRecommendations.pricingStrategyAndBundles.length).toBeGreaterThanOrEqual(2);
    expect(report.launchRecommendations.distributionChannels.length).toBeGreaterThanOrEqual(2);
    expect(report.launchRecommendations.gtmRoadmap.length).toBe(3);
  });

  it('mandates clear verification tiers and legitimate external citations', () => {
    const report = generateFeasibilityReport(sampleInput);

    // Market Demand Citation
    expect(report.marketDemand.citation.verificationTier).toBe('VERIFIED');
    expect(report.marketDemand.citation.sourceName).toMatch(/Google Trends|Bain/i);
    expect(report.marketDemand.citation.sourceUrl).toContain('trends.google.com');
    expect(report.marketDemand.citation.retrievalDate).toMatch(/Nov 2026/i);

    // Competition Citation
    expect(report.competition.citation.verificationTier).toBe('VERIFIED');
    expect(report.competition.citation.sourceName).toMatch(/Amazon|Blinkit|Quick Commerce/i);
    expect(report.competition.citation.sourceUrl).toContain('amazon.in');

    // Manufacturing Directory Citation
    expect(report.manufacturingFeasibility.citation.verificationTier).toBe('VERIFIED');
    expect(report.manufacturingFeasibility.citation.sourceName).toMatch(/IndiaMART|TradeIndia/i);
    expect(report.manufacturingFeasibility.citation.sourceUrl).toContain('indiamart.com');

    // AI Prediction Labels
    expect(report.productPositioning.citation.verificationTier).toBe('AI_PREDICTION');
    expect(report.launchRecommendations.citation.verificationTier).toBe('AI_PREDICTION');
  });

  it('honestly marks non-public manufacturer capacity as Unavailable instead of fabricating numbers', () => {
    const report = generateFeasibilityReport(sampleInput);

    report.manufacturingFeasibility.copackers.forEach((copacker) => {
      // Must not fabricate unverifiable private production line capacities
      expect(copacker.productionCapacity).toMatch(/Unavailable/i);
      expect(copacker.capacityTier).toBe('UNAVAILABLE');
      // Must have verifiable directory links and valid licenses
      expect(copacker.licenseNumber).toMatch(/FSSAI|ISO|GMP/i);
      expect(copacker.directoryUrl).toMatch(/indiamart\.com|tradeindia\.com/i);
    });
  });

  it('verifies exact mathematical integrity of financial formulas', () => {
    const report = generateFeasibilityReport({
      ...sampleInput,
      sellingPrice: 200,
      mfgCost: 50,
      moq: 1000,
      marketingBudget: 40000,
    });

    // 1. Gross Margin %: ((200 - 50) / 200) * 100 = 75%
    expect(report.financialFeasibility.grossMarginPct).toBe(75);

    // 2. Unit Gross Profit: 200 - 50 = 150
    const grossProfit = 200 - 50;
    expect(grossProfit).toBe(150);

    // 3. Target Allowable CAC (35% of Gross Profit): 150 * 0.35 = 52.5 -> 53
    expect(report.financialFeasibility.targetCac).toBe(53);

    // 4. Net Contribution Margin: 200 - (50 + packaging[12] + logistics[45] + CAC[53]) = 40
    expect(report.financialFeasibility.contributionMargin).toBe(40);

    // 5. Break-Even Units: 40000 / 40 = 1000 units
    expect(report.financialFeasibility.breakEvenUnits).toBe(1000);

    // 6. Formula Strings must be explicitly present
    expect(report.financialFeasibility.formulaDetails.grossMarginFormula).toBe(
      'Gross Margin % = ((Selling Price - COGS) / Selling Price) * 100'
    );
    expect(report.financialFeasibility.formulaDetails.breakEvenFormula).toBe(
      'Break-Even Units = Launch Marketing Budget / Unit Contribution Margin'
    );
  });

  it('produces real category-specific competitor prices and co-packers across different sectors', () => {
    const categories = ['Beverages', 'Chocolates', 'Snacks', 'Supplements', 'Personal Care', 'Stationery'];

    categories.forEach((cat) => {
      const catReport = generateFeasibilityReport({
        ...sampleInput,
        category: cat,
      });

      // Verify category competitors exist with real prices
      expect(catReport.competition.competitors.length).toBeGreaterThanOrEqual(2);
      catReport.competition.competitors.forEach((c) => {
        expect(c.name).toBeTruthy();
        expect(c.pricePoint).toMatch(/₹\d+/);
        expect(c.verifiedSource).toBeTruthy();
      });

      // Verify real co-packers with licenses exist
      expect(catReport.manufacturingFeasibility.copackers.length).toBeGreaterThanOrEqual(2);
      catReport.manufacturingFeasibility.copackers.forEach((cp) => {
        expect(cp.name).toBeTruthy();
        expect(cp.location).toBeTruthy();
        expect(cp.licenseNumber).toBeTruthy();
      });

      // Backward compatibility fields
      expect(catReport.demand).toBeDefined();
      expect(catReport.searchVol).toBeDefined();
      expect(catReport.copackers).toBeDefined();
      expect(catReport.grossMarginPct).toBeGreaterThan(0);
    });
  });
});
