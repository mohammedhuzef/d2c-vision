import { describe, it, expect } from 'vitest';
import { CREATORS_DATABASE, Influencer } from '../pages/InfluencersPage';

describe('D2C Vision - Influencer Finder Data Authenticity & ROAS Integrity', () => {
  it('1. DATA SOURCE IDENTIFICATION: Every metric has a distinct data source label (Verified, Estimated, Illustrative, or Unavailable)', () => {
    expect(CREATORS_DATABASE.length).toBeGreaterThanOrEqual(8);

    CREATORS_DATABASE.forEach((creator) => {
      // Follower metric verification
      expect(['Verified', 'Estimated', 'Illustrative', 'Unavailable']).toContain(
        creator.followersMeta.status
      );
      expect(creator.followersMeta.source).toBeDefined();

      // Engagement metric verification
      expect(['Verified', 'Estimated', 'Illustrative', 'Unavailable']).toContain(
        creator.engagementMeta.status
      );
      expect(creator.engagementMeta.source).toBeDefined();

      // Reach metric verification
      expect(['Verified', 'Estimated', 'Illustrative', 'Unavailable']).toContain(
        creator.reachMeta.status
      );
      expect(creator.reachMeta.source).toBeDefined();

      // Demographics metric verification
      expect(['Verified', 'Estimated', 'Illustrative', 'Unavailable']).toContain(
        creator.demographicsMeta.status
      );

      // Past campaign verification
      expect(['Verified', 'Estimated', 'Illustrative', 'Unavailable']).toContain(
        creator.pastCampaignData.status
      );
    });
  });

  it('2. ROAS & REVENUE CALCULATION: Strictly obeys ROAS = Campaign-attributed Revenue / Advertising Spend', () => {
    const verifiedCampaignCreators = CREATORS_DATABASE.filter(
      (c) => c.pastCampaignData.status === 'Verified' && c.pastCampaignData.attributedRevenue && c.pastCampaignData.advertisingSpend
    );

    expect(verifiedCampaignCreators.length).toBeGreaterThanOrEqual(3);

    verifiedCampaignCreators.forEach((creator) => {
      const rev = creator.pastCampaignData.attributedRevenue!;
      const spend = creator.pastCampaignData.advertisingSpend!;
      const expectedRoas = (rev / spend).toFixed(1) + 'x ROAS';

      // Calculated ROAS must match the exact mathematical formula: Revenue / Spend
      expect(creator.pastCampaignData.calculatedRoas).toBe(expectedRoas);
      expect(creator.pastCampaignData.methodology).toContain('ROAS =');
      expect(creator.pastCampaignData.methodology).toContain('Revenue / Advertising Spend');
      expect(creator.pastCampaignData.verificationProof).toBeDefined();
    });
  });

  it('3. UNAVAILABLE DATA HONESTY: If campaign revenue or ROAS is unavailable, it is never fabricated', () => {
    const unavailableCampaignCreators = CREATORS_DATABASE.filter(
      (c) => c.pastCampaignData.status === 'Unavailable'
    );

    expect(unavailableCampaignCreators.length).toBeGreaterThanOrEqual(2);

    unavailableCampaignCreators.forEach((creator) => {
      expect(creator.pastCampaignData.attributedRevenue).toBeUndefined();
      expect(creator.pastCampaignData.advertisingSpend).toBeUndefined();
      expect(creator.pastCampaignData.calculatedRoas).toBe('Unavailable');
      expect(creator.pastCampaignData.summary).toContain('No historical third-party campaign revenue or ROAS on file');
    });
  });

  it('4. AUDIENCE DEMOGRAPHICS AUTHENTICITY: Does not invent percentages when data is unavailable', () => {
    const unavailableDemographicsCreators = CREATORS_DATABASE.filter(
      (c) => c.demographicsMeta.status === 'Unavailable'
    );

    expect(unavailableDemographicsCreators.length).toBeGreaterThanOrEqual(2);

    unavailableDemographicsCreators.forEach((creator) => {
      expect(creator.topAudience).toBe('Demographics Unavailable');
      expect(creator.topCities).toHaveLength(0);
      expect(creator.demographicsMeta.methodology).toContain('Creator has not connected authorized Meta Graph API');
    });
  });

  it('5. ENGAGEMENT FORMULA & DENOMINATOR: Discloses formula and whether denominator is followers or reach', () => {
    CREATORS_DATABASE.forEach((creator) => {
      expect(creator.engagementMeta.methodology).toBeDefined();
      expect(creator.engagementMeta.methodology?.toLowerCase()).toContain('denominator:');
      expect(creator.engagementMeta.methodology?.toLowerCase()).toMatch(/followers|reach|views/);
      expect(creator.engagementMeta.sampleSize).toBeDefined();
    });
  });

  it('6. REACH MEASUREMENT PERIOD & SAMPLE SIZE: Discloses exact measurement period and sample size', () => {
    CREATORS_DATABASE.forEach((creator) => {
      expect(creator.reachMeta.sampleSize).toBeDefined();
      expect(creator.reachMeta.sampleSize).toMatch(/(\d+)\s*.*(reels|videos)/i);
      expect(creator.reachMeta.lastUpdated).toBeDefined();
    });
  });

  it('7. PROJECTED ROAS IN MATCHMAKER: Discloses that matchmaker projections are estimated simulation benchmarks', () => {
    CREATORS_DATABASE.forEach((creator) => {
      const fits = Object.values(creator.productTypeFits);
      fits.forEach((fit) => {
        expect(['Estimated', 'Illustrative']).toContain(fit.roiStatus);
        expect(fit.roiMethodology.toLowerCase()).toMatch(/projected roas|assumed|benchmark|conversion|baseline/);
      });
    });
  });
});
