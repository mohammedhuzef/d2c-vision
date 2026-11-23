/**
 * LocalStorage management utility for D2C Vision
 * Handles persistence for Projects, Team Members, and Settings
 */

export interface Project {
  id: string;
  name: string;
  category: string;
  targetMarket?: string;
  sellingPrice: number;
  mfgCost: number;
  moq?: number;
  marketingBudget?: number;
  margin: number;
  description?: string;
  ingredients?: string;
  targetAudience?: string;
  image: string;
  status: 'In Progress' | 'Completed' | 'Research' | 'Idea Stage';
  viabilityScore: number;
  viabilityGrade?: string;
  report?: any;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Growth Lead' | 'Supply Chain Lead' | 'Product Designer' | 'Marketer';
  avatar: string;
  status: 'Active' | 'Pending';
  joinedDate: string;
}

export interface UserSettings {
  founderName: string;
  founderEmail: string;
  brandName: string;
  brandTagline: string;
  currency: string;
  themeAccent: 'indigo' | 'purple' | 'cyan' | 'emerald';
  notifications: {
    supplierQuotes: boolean;
    trendAlerts: boolean;
    validationReports: boolean;
    weeklyDigest: boolean;
  };
  apiKeys: {
    openAiKey: string;
    geminiKey: string;
    useMockData: boolean;
  };
}

const DEFAULT_PROJECTS: Project[] = [];

const DEFAULT_TEAM: TeamMember[] = [
  {
    id: 'team-1',
    name: 'Adarsh Reddy',
    email: 'adarsh@d2cvision.ai',
    role: 'Owner',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    status: 'Active',
    joinedDate: 'Jan 2026',
  },
  {
    id: 'team-2',
    name: 'Sneha Patel',
    email: 'sneha@d2cvision.ai',
    role: 'Growth Lead',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    status: 'Active',
    joinedDate: 'Feb 2026',
  },
  {
    id: 'team-3',
    name: 'Vikram Mehta',
    email: 'vikram@d2cvision.ai',
    role: 'Supply Chain Lead',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    status: 'Active',
    joinedDate: 'Mar 2026',
  },
  {
    id: 'team-4',
    name: 'Ananya Roy',
    email: 'ananya@d2cvision.ai',
    role: 'Product Designer',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    status: 'Active',
    joinedDate: 'Apr 2026',
  },
];

const DEFAULT_SETTINGS: UserSettings = {
  founderName: 'Adarsh Reddy',
  founderEmail: 'adarsh@d2cvision.ai',
  brandName: 'D2C Vision Inc.',
  brandTagline: 'Turn Product Ideas Into Profitable D2C Brands',
  currency: 'INR (₹)',
  themeAccent: 'indigo',
  notifications: {
    supplierQuotes: true,
    trendAlerts: true,
    validationReports: true,
    weeklyDigest: false,
  },
  apiKeys: {
    openAiKey: 'sk-mock-••••••••••••••••••••••••••••••',
    geminiKey: 'AIzaSy-mock-•••••••••••••••••••••••',
    useMockData: true,
  },
};

import { getLocalProjects, setLocalProjects } from './projectStorage';

// Projects storage
export const getStoredProjects = (): Project[] => {
  return getLocalProjects();
};

export const saveStoredProjects = (projects: Project[]) => {
  setLocalProjects(projects);
};

// Team storage
export const getStoredTeam = (): TeamMember[] => {
  try {
    const raw = localStorage.getItem('d2c_team');
    if (!raw) {
      localStorage.setItem('d2c_team', JSON.stringify(DEFAULT_TEAM));
      return DEFAULT_TEAM;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_TEAM;
  }
};

export const saveStoredTeam = (team: TeamMember[]) => {
  try {
    localStorage.setItem('d2c_team', JSON.stringify(team));
  } catch (err) {
    console.error('Failed to save team to localStorage:', err);
  }
};

// Settings storage
export const getStoredSettings = (): UserSettings => {
  try {
    const raw = localStorage.getItem('d2c_settings');
    if (!raw) {
      localStorage.setItem('d2c_settings', JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveStoredSettings = (settings: UserSettings) => {
  try {
    localStorage.setItem('d2c_settings', JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings to localStorage:', err);
  }
};
