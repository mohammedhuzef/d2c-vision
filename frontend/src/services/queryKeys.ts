export const queryKeys = {
  health: ['health'] as const,

  products: {
    all: ['products'] as const,
    list: (params?: { limit?: number; offset?: number }) =>
      ['products', 'list', params] as const,
    detail: (id?: string) => ['products', 'detail', id] as const,
  },

  competitors: {
    list: (productId?: string) => ['competitors', 'list', productId] as const,
  },

  validation: {
    readiness: (productId?: string) => ['validation', 'readiness', productId] as const,
    latest: (productId?: string) => ['validation', 'latest', productId] as const,
    runs: (productId?: string) => ['validation', 'runs', productId] as const,
    run: (productId?: string, runId?: string) =>
      ['validation', 'run', productId, runId] as const,
    recommendations: (productId?: string) =>
      ['validation', 'recommendations', productId] as const,
    latestRecommendations: (productId?: string) =>
      ['validation', 'latestRecommendations', productId] as const,
    runRecommendations: (productId?: string, runId?: string) =>
      ['validation', 'runRecommendations', productId, runId] as const,
  },

  versions: {
    list: (productId?: string) => ['versions', 'list', productId] as const,
    compare: (productId?: string, vA?: number, vB?: number) =>
      ['versions', 'compare', productId, vA, vB] as const,
  },

  reports: {
    list: (productId?: string) => ['reports', 'list', productId] as const,
    detail: (productId?: string, reportId?: string) =>
      ['reports', 'detail', productId, reportId] as const,
  },

  evidence: {
    list: (productId?: string) => ['evidence', 'list', productId] as const,
  },

  impactEvents: {
    list: (productId?: string) => ['impactEvents', 'list', productId] as const,
  },
};
