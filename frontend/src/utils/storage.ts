/**
 * LocalStorage management utility for D2C Vision
 * Handles persistence for Projects, Team Members, and Settings
 */

export interface Project {
  id: string;
  name: string;
  category: string;
  description?: string;
  targetAudience?: string;
  status: 'In Progress' | 'Completed' | 'Research' | 'Idea Stage';
  viabilityScore: number;
  sellingPrice: number;
  mfgCost: number;
  margin: number;
  image: string;
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

const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Healthy Chocolate',
    category: 'Food & Beverage',
    description: '70% dark cocoa refined with organic stevia and ashwagandha adaptogens for clean energy.',
    targetAudience: 'Health-conscious millennials, gym-goers, keto lifestyle adherents.',
    status: 'In Progress',
    viabilityScore: 78,
    sellingPrice: 299,
    mfgCost: 80,
    margin: 54,
    image: '/images/cat-chocolates.jpg',
    createdAt: '2026-09-15',
    updatedAt: '2026-10-14',
  },
  {
    id: 'proj-2',
    name: 'Makhana Snacks',
    category: 'Snacks',
    description: 'Slow-roasted Himalayan foxnuts flavored with peri-peri, cheddary herbs, and pink salt.',
    targetAudience: 'Urban professionals looking for guilt-free evening tea and desk snacks.',
    status: 'Completed',
    viabilityScore: 82,
    sellingPrice: 199,
    mfgCost: 45,
    margin: 58,
    image: '/images/cat-snacks.jpg',
    createdAt: '2026-08-20',
    updatedAt: '2026-10-10',
  },
  {
    id: 'proj-3',
    name: 'Skincare Brand',
    category: 'Personal Care',
    description: 'Barrier-repair peptides and fermented rice water serums formulated for South Asian skin.',
    targetAudience: 'Gen-Z and young professionals combating urban pollution and hyperpigmentation.',
    status: 'Research',
    viabilityScore: 65,
    sellingPrice: 599,
    mfgCost: 110,
    margin: 62,
    image: '/images/cat-personal-care.jpg',
    createdAt: '2026-10-01',
    updatedAt: '2026-10-16',
  },
  {
    id: 'proj-4',
    name: 'Protein Bar',
    category: 'Supplements',
    description: 'Cold-pressed whey and pea protein bars with zero added palm oil and 20g protein per bar.',
    targetAudience: 'Athletes, fitness enthusiasts, and busy executives.',
    status: 'Idea Stage',
    viabilityScore: 72,
    sellingPrice: 149,
    mfgCost: 40,
    margin: 48,
    image: '/images/cat-supplements.jpg',
    createdAt: '2026-10-05',
    updatedAt: '2026-10-12',
  },
];

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

// Projects storage
export const getStoredProjects = (): Project[] => {
  try {
    const raw = localStorage.getItem('d2c_projects');
    if (!raw) {
      localStorage.setItem('d2c_projects', JSON.stringify(DEFAULT_PROJECTS));
      return DEFAULT_PROJECTS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PROJECTS;
  }
};

export const saveStoredProjects = (projects: Project[]) => {
  try {
    localStorage.setItem('d2c_projects', JSON.stringify(projects));
  } catch (err) {
    console.error('Failed to save projects to localStorage:', err);
  }
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
