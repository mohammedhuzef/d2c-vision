import { describe, it, expect, beforeEach } from 'vitest';
import {
  STORAGE_KEY,
  getLocalProjects,
  setLocalProjects,
  queryLocalProjects,
  getLocalProjectById,
  createLocalProject,
  updateLocalProject,
  deleteLocalProject,
} from '../utils/projectStorage';
import { api } from '../api/client';

describe('D2C Vision - Project Storage & Demo Mode Workflow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('1. SAVE: Saves complete product details, AI feasibility report, viability scores and packaging images', () => {
    const mockReport = {
      productName: 'Organic Ashwagandha Sparkling Energy Elixir',
      category: 'Beverages',
      viabilityScore: 88,
      viabilityGrade: 'Grade A',
      executiveSummary: 'Strong market opportunity with 42% YoY herbal beverage growth.',
      marketAnalysis: {
        demandScore: 85,
        growthRate: '+34% YoY',
        competitiveDensity: 'Moderate',
        searchVolumeTrend: 'Rising (+65% search queries)',
      },
      marginViability: {
        grossMarginPercent: 68,
        status: 'Healthy',
        breakEvenUnits: 1200,
        unitEconomicsNotes: 'Optimal selling price with healthy margin buffer.',
      },
      coPackers: [
        {
          name: 'Himalayan Herbal Bottlers',
          location: 'Himachal Pradesh, India',
          moq: 1000,
          certifications: ['FSSAI', 'GMP', 'ISO 22000'],
        },
      ],
      risks: [
        {
          category: 'Supply Chain',
          severity: 'Medium',
          mitigation: 'Procure organic ashwagandha extract with dual suppliers.',
        },
      ],
      recommendations: [
        'Launch D2C website first with quick commerce expansion in Mumbai & Bengaluru.',
        'Target fitness enthusiasts and young tech professionals aged 22-38.',
      ],
    };

    const newProject = createLocalProject({
      name: 'Organic Ashwagandha Sparkling Energy Elixir',
      category: 'Beverages',
      targetMarket: 'India (Tier 1 Metros)',
      sellingPrice: 199,
      mfgCost: 65,
      moq: 1000,
      marketingBudget: 75000,
      description: 'Zero-sugar sparkling herbal adaptogenic beverage.',
      ingredients: 'Sparkling spring water, KSM-66 Ashwagandha 300mg, Green Tea extract.',
      targetAudience: 'Urban professionals and fitness enthusiasts aged 22-35.',
      image: '/images/cat-beverages.jpg',
      status: 'In Progress',
      viabilityScore: 88,
      viabilityGrade: 'Grade A',
      report: mockReport,
      userId: 'user-demo-1',
    });

    expect(newProject.id).toBeDefined();
    expect(newProject.name).toBe('Organic Ashwagandha Sparkling Energy Elixir');
    expect(newProject.sellingPrice).toBe(199);
    expect(newProject.mfgCost).toBe(65);
    expect(newProject.margin).toBe(67); // Math.round(((199 - 65) / 199) * 100) = 67%
    expect(newProject.moq).toBe(1000);
    expect(newProject.viabilityScore).toBe(88);
    expect(newProject.viabilityGrade).toBe('Grade A');
    expect(newProject.report).toEqual(mockReport);
    expect(newProject.createdAt).toBeDefined();
    expect(newProject.updatedAt).toBeDefined();

    // Verify written to localStorage
    const storedRaw = localStorage.getItem(STORAGE_KEY);
    expect(storedRaw).not.toBeNull();
    const stored = JSON.parse(storedRaw!);
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(newProject.id);
  });

  it('2. RETRIEVE: Dynamically retrieves saved projects and supports multi-field filtering', () => {
    // Seed 2 distinct projects
    const p1 = createLocalProject({
      name: 'Matcha Clean Energy Drink',
      category: 'Beverages',
      sellingPrice: 149,
      mfgCost: 45,
      status: 'Completed',
      ingredients: 'Organic Ceremonial Matcha',
    });

    const p2 = createLocalProject({
      name: 'Peptide Firming Face Serum',
      category: 'Personal Care',
      sellingPrice: 899,
      mfgCost: 180,
      status: 'In Progress',
      ingredients: 'Matrixyl 3000, Niacinamide, Hyaluronic Acid',
    });

    // Retrieve all
    const all = queryLocalProjects();
    expect(all).toHaveLength(2);

    // Search by name
    const matchMatcha = queryLocalProjects({ search: 'Matcha' });
    expect(matchMatcha).toHaveLength(1);
    expect(matchMatcha[0].id).toBe(p1.id);

    // Search by ingredients
    const matchPeptide = queryLocalProjects({ search: 'Matrixyl' });
    expect(matchPeptide).toHaveLength(1);
    expect(matchPeptide[0].id).toBe(p2.id);

    // Filter by Category
    const beverages = queryLocalProjects({ category: 'Beverages' });
    expect(beverages).toHaveLength(1);
    expect(beverages[0].id).toBe(p1.id);

    // Filter by Status
    const completed = queryLocalProjects({ status: 'Completed' });
    expect(completed).toHaveLength(1);
    expect(completed[0].id).toBe(p1.id);

    // Get single by ID
    const single = getLocalProjectById(p2.id);
    expect(single).not.toBeNull();
    expect(single?.name).toBe('Peptide Firming Face Serum');
  });

  it('3. REFRESH SIMULATION: Projects remain fully intact and visible across browser reloads', () => {
    const projectData = createLocalProject({
      name: 'Cold Pressed Cold Brew Coffee Concentrate',
      category: 'Food & Nutrition',
      sellingPrice: 350,
      mfgCost: 110,
      moq: 500,
      viabilityScore: 92,
      viabilityGrade: 'Grade A',
      report: {
        marketAnalysis: { demandScore: 95 },
        recommendations: ['Sell in 500ml glass amber bottles'],
      },
    });

    // Simulate page reload / state flush by retrieving purely from localStorage
    const reloadedProjects = getLocalProjects();
    expect(reloadedProjects).toHaveLength(1);
    const reloaded = reloadedProjects[0];

    expect(reloaded.id).toBe(projectData.id);
    expect(reloaded.name).toBe('Cold Pressed Cold Brew Coffee Concentrate');
    expect(reloaded.sellingPrice).toBe(350);
    expect(reloaded.mfgCost).toBe(110);
    expect(reloaded.margin).toBe(69);
    expect(reloaded.viabilityScore).toBe(92);
    expect(reloaded.report?.recommendations[0]).toBe('Sell in 500ml glass amber bottles');
  });

  it('4. EDIT: Updates project fields in-place, recalculates margins, updates timestamp, preserves ID', () => {
    const original = createLocalProject({
      name: 'Hydrating Botanical Mist',
      category: 'Personal Care',
      sellingPrice: 400,
      mfgCost: 120,
      status: 'Idea Stage',
    });

    const originalUpdatedAt = original.updatedAt;

    // Perform edit
    const updated = updateLocalProject(original.id, {
      sellingPrice: 499,
      mfgCost: 110,
      status: 'In Progress',
      targetMarket: 'All Tier 1 & Tier 2 Cities',
    });

    expect(updated).not.toBeNull();
    expect(updated?.id).toBe(original.id); // ID must remain constant
    expect(updated?.sellingPrice).toBe(499);
    expect(updated?.mfgCost).toBe(110);
    expect(updated?.margin).toBe(78); // ((499 - 110) / 499) * 100 = 78%
    expect(updated?.status).toBe('In Progress');
    expect(updated?.targetMarket).toBe('All Tier 1 & Tier 2 Cities');
    expect(new Date(updated!.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(originalUpdatedAt).getTime()
    );

    // Verify updated in localStorage
    const refreshed = getLocalProjectById(original.id);
    expect(refreshed?.sellingPrice).toBe(499);
    expect(refreshed?.status).toBe('In Progress');
  });

  it('5. DELETE: Permanently removes project from LocalStorage', () => {
    const p1 = createLocalProject({ name: 'Project to Keep' });
    const p2 = createLocalProject({ name: 'Project to Delete' });

    expect(getLocalProjects()).toHaveLength(2);

    const deleted = deleteLocalProject(p2.id);
    expect(deleted).toBe(true);

    const remaining = getLocalProjects();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(p1.id);
    expect(getLocalProjectById(p2.id)).toBeNull();

    // Deleting non-existent returns false
    expect(deleteLocalProject('non-existent-id')).toBe(false);
  });

  it('6. INTEGRATION / DEMO MODE: api.projects handles CRUD without failing when backend is offline', async () => {
    // When backend is not running or throws network error, api.projects persists to LocalStorage
    const created = await api.projects.create({
      name: 'Vegan Protein Oat Bar',
      category: 'Food & Nutrition',
      sellingPrice: 120,
      mfgCost: 40,
      status: 'Research',
      viabilityScore: 84,
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe('Vegan Protein Oat Bar');

    // List via api.projects
    const listRes = await api.projects.list();
    expect(listRes.items.length).toBeGreaterThanOrEqual(1);
    expect(listRes.items.some((item) => item.id === created.id)).toBe(true);

    // Get via api.projects
    const single = await api.projects.get(created.id);
    expect(single.name).toBe('Vegan Protein Oat Bar');

    // Update via api.projects
    const updated = await api.projects.update(created.id, {
      status: 'Completed',
      sellingPrice: 135,
    });
    expect(updated.status).toBe('Completed');
    expect(updated.sellingPrice).toBe(135);

    // Delete via api.projects
    await api.projects.delete(created.id);
    const listAfterDelete = await api.projects.list();
    expect(listAfterDelete.items.some((item) => item.id === created.id)).toBe(false);
  });

  it('7. NO MOCK PROJECTS: Legacy placeholders (proj-1, proj-2, etc.) are never returned', () => {
    // Artificially inject legacy dummy records into localStorage
    const legacyData = [
      { id: 'proj-1', name: 'Legacy Mock 1' },
      { id: 'proj-2', name: 'Legacy Mock 2' },
      { id: 'proj-user-real-99', name: 'Authentic User Project' },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyData));

    const retrieved = getLocalProjects();
    expect(retrieved).toHaveLength(1);
    expect(retrieved[0].id).toBe('proj-user-real-99');
    expect(retrieved[0].name).toBe('Authentic User Project');
  });
});
