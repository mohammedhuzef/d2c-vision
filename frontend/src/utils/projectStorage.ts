/**
 * Dedicated Demo-Mode & LocalStorage Project Persistence Layer
 * Provides robust, synchronous and asynchronous project CRUD operations
 * ensuring 100% reliability for demonstrations without failing on database dependencies.
 */

import { Project } from './storage';

export const STORAGE_KEY = 'd2c_projects';

/**
 * Retrieve all saved projects from LocalStorage.
 * Filters out legacy mock placeholders so only real user projects are returned.
 */
export const getLocalProjects = (): Project[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: Project[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Ensure no legacy static sample placeholders are returned
    return parsed.filter(
      (p) => p && p.id && !['proj-1', 'proj-2', 'proj-3', 'proj-4'].includes(p.id)
    );
  } catch (err) {
    console.error('Error reading projects from localStorage:', err);
    return [];
  }
};

/**
 * Save complete projects array to LocalStorage.
 */
export const setLocalProjects = (projects: Project[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (err) {
    console.error('Error writing projects to localStorage:', err);
  }
};

/**
 * List projects with optional search, category, and status filtering.
 */
export const queryLocalProjects = (params?: {
  search?: string;
  category?: string;
  status?: string;
}): Project[] => {
  let list = getLocalProjects();

  // Search filter
  if (params?.search && params.search.trim()) {
    const q = params.search.trim().toLowerCase();
    list = list.filter((p) => {
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.ingredients && p.ingredients.toLowerCase().includes(q)) ||
        (p.targetAudience && p.targetAudience.toLowerCase().includes(q))
      );
    });
  }

  // Category filter
  if (params?.category && params.category !== 'All') {
    list = list.filter((p) => p.category.toLowerCase() === params.category!.toLowerCase());
  }

  // Status filter
  if (params?.status && params.status !== 'All') {
    list = list.filter((p) => p.status.toLowerCase() === params.status!.toLowerCase());
  }

  // Sort newest updated first
  list.sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  return list;
};

/**
 * Get a single project by ID.
 */
export const getLocalProjectById = (id: string): Project | null => {
  const list = getLocalProjects();
  return list.find((p) => p.id === id) || null;
};

/**
 * Create and persist a new project in LocalStorage.
 */
export const createLocalProject = (data: Partial<Project>): Project => {
  const now = new Date().toISOString();
  const sellingPrice = Number(data.sellingPrice) || 0;
  const mfgCost = Number(data.mfgCost) || 0;
  const margin =
    sellingPrice > 0 ? Math.round(((sellingPrice - mfgCost) / sellingPrice) * 100) : 0;

  const newProject: Project = {
    id: data.id || `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: data.name || 'Untitled Concept',
    category: data.category || 'Beverages',
    targetMarket: data.targetMarket || 'India (Tier 1 Metros)',
    sellingPrice,
    mfgCost,
    moq: Number(data.moq) || 500,
    marketingBudget: Number(data.marketingBudget) || 50000,
    margin,
    description: data.description || '',
    ingredients: data.ingredients || '',
    targetAudience: data.targetAudience || '',
    image: data.image || '/images/cat-beverages.jpg',
    status: data.status || 'In Progress',
    viabilityScore: data.viabilityScore ?? 50,
    viabilityGrade: data.viabilityGrade || 'Grade B',
    report: data.report || null,
    userId: data.userId || 'default_user',
    createdAt: data.createdAt || now,
    updatedAt: now,
  };

  const existing = getLocalProjects();
  // Filter out any existing item with same id
  const updated = [newProject, ...existing.filter((p) => p.id !== newProject.id)];
  setLocalProjects(updated);
  return newProject;
};

/**
 * Update an existing project in LocalStorage, recalculating margin and updating timestamp.
 */
export const updateLocalProject = (id: string, updates: Partial<Project>): Project | null => {
  const existing = getLocalProjects();
  const index = existing.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const current = existing[index];
  const sellingPrice =
    updates.sellingPrice !== undefined ? Number(updates.sellingPrice) : current.sellingPrice;
  const mfgCost = updates.mfgCost !== undefined ? Number(updates.mfgCost) : current.mfgCost;
  const margin =
    sellingPrice > 0 ? Math.round(((sellingPrice - mfgCost) / sellingPrice) * 100) : current.margin;

  const updatedProject: Project = {
    ...current,
    ...updates,
    id: current.id, // retain ID
    sellingPrice,
    mfgCost,
    margin,
    updatedAt: new Date().toISOString(),
  };

  existing[index] = updatedProject;
  setLocalProjects(existing);
  return updatedProject;
};

/**
 * Delete a project from LocalStorage.
 */
export const deleteLocalProject = (id: string): boolean => {
  const existing = getLocalProjects();
  const filtered = existing.filter((p) => p.id !== id);
  if (filtered.length === existing.length) return false;
  setLocalProjects(filtered);
  return true;
};
