import { ApiError, type ApiErrorPayload } from './errors';
import {
  createLocalProject,
  deleteLocalProject,
  getLocalProjectById,
  getLocalProjects,
  queryLocalProjects,
  setLocalProjects,
  updateLocalProject,
} from '../utils/projectStorage';
import { Project } from '../utils/storage';
import type {
  AssumptionsPatchRequest,
  AssumptionsPatchResponse,
  CompetitorCreate,
  CompetitorListResponse,
  ProductCreate,
  ProductDetailResponse,
  ProductListResponse,
  ProductResponse,
  ProductVersionListResponse,
  ReadinessResponse,
  ReportListResponse,
  ReportResponse,
  ResearchIngestRequest,
  ResearchIngestResponse,
  ResearchStartResponse,
  ResearchStatusResponse,
  RunRecommendationListResponse,
  SimulationRequest,
  SimulationResponse,
  ValidationRunDetailResponse,
  ValidationRunListResponse,
  ValidationRunResponse,
  VersionCompareResponse,
  ProjectItem,
  ProjectListResponse,
  InfluencerCreate,
  InfluencerResponse,
  InfluencerListResponse,
  InfluencerMatchListResponse,
  InfluencerUpdate,
  CustomMatchRequest,
  PitchRequest,
  PitchResponse,
  ProductValidationRequest,
  ProductValidationResponse,
  InfluencerAiFindRequest,
  InfluencerAiFindResponse,
} from './types';

const RAW_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
// Strip trailing slash if present
export const API_BASE_URL = RAW_BASE.replace(/\/+$/, '');

// Base root (for /health)
export const ROOT_BASE_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, '') || '';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  // Strip redundant /api/v1 prefix if provided in path
  const cleanPath = path.startsWith('/api/v1') ? path.replace(/^\/api\/v1/, '') : path;
  const url = cleanPath.startsWith('http') || cleanPath === '/health'
    ? (cleanPath === '/health' ? `${ROOT_BASE_URL}/health` : cleanPath)
    : `${API_BASE_URL}${cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`}`;

  const headers = new Headers(options.headers);
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (networkError) {
    throw new ApiError(0, {
      code: 'NETWORK_ERROR',
      message: networkError instanceof Error ? networkError.message : 'Network request failed',
      details: [],
    });
  }

  if (!response.ok) {
    let errorPayload: ApiErrorPayload | undefined;
    try {
      const json = await response.json();
      if (json && typeof json === 'object') {
        if ('error' in json && json.error) {
          errorPayload = json.error;
        } else {
          errorPayload = json as ApiErrorPayload;
        }
      }
    } catch {
      // Body not JSON
    }

    throw new ApiError(response.status, errorPayload || response.statusText);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Generic request
  request,

  // Health
  health: {
    check: () => request<{ status: string }>('/health'),
  },

  // Products
  products: {
    list: (params?: { limit?: number; offset?: number }) => {
      const query = new URLSearchParams();
      if (params?.limit !== undefined) query.set('limit', String(params.limit));
      if (params?.offset !== undefined) query.set('offset', String(params.offset));
      const qs = query.toString();
      return request<ProductListResponse>(`/products${qs ? `?${qs}` : ''}`);
    },
    get: (productId: string) => request<ProductDetailResponse>(`/products/${productId}`),
    create: (data: ProductCreate) =>
      request<ProductResponse>('/products', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Assumptions
  assumptions: {
    patch: (productId: string, data: AssumptionsPatchRequest) =>
      request<AssumptionsPatchResponse>(`/products/${productId}/assumptions`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  // Competitors
  competitors: {
    list: (productId: string) =>
      request<CompetitorListResponse>(`/products/${productId}/competitors`),
    create: (productId: string, data: CompetitorCreate) =>
      request<CompetitorListResponse>(`/products/${productId}/competitors`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Research
  research: {
    start: (productId: string) =>
      request<ResearchStartResponse>(`/products/${productId}/research`, {
        method: 'POST',
      }),
    status: (productId: string, researchId: string) =>
      request<ResearchStatusResponse>(`/products/${productId}/research/${researchId}`),
    ingest: (data: ResearchIngestRequest) =>
      request<ResearchIngestResponse>('/internal/research-results', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Validation
  validation: {
    validate: (productId: string) =>
      request<ValidationRunResponse>(`/products/${productId}/validate`, {
        method: 'POST',
      }),
    revalidate: (productId: string) =>
      request<ValidationRunResponse>(`/products/${productId}/revalidate`, {
        method: 'POST',
      }),
    readiness: (productId: string) =>
      request<ReadinessResponse>(`/products/${productId}/validation/readiness`),
    latest: (productId: string) =>
      request<ValidationRunDetailResponse>(`/products/${productId}/validation/runs/latest`),
    runs: (productId: string) =>
      request<ValidationRunListResponse>(`/products/${productId}/validation/runs`),
    run: (productId: string, runId: string) =>
      request<ValidationRunDetailResponse>(`/products/${productId}/validation/runs/${runId}`),
    latestRecommendations: (productId: string) =>
      request<RunRecommendationListResponse>(
        `/products/${productId}/validation/runs/latest/recommendations`
      ),
    runRecommendations: (productId: string, runId: string) =>
      request<RunRecommendationListResponse>(
        `/products/${productId}/validation/runs/${runId}/recommendations`
      ),
    simulate: (productId: string, data: SimulationRequest) =>
      request<SimulationResponse>(`/products/${productId}/validation/simulate`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    aiFeasibility: (data: ProductValidationRequest) =>
      request<ProductValidationResponse>('/validation/ai-feasibility', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Versions
  versions: {
    list: (productId: string) =>
      request<ProductVersionListResponse>(`/products/${productId}/versions`),
    compare: (productId: string, versionA: number, versionB: number) =>
      request<VersionCompareResponse>(
        `/products/${productId}/versions/${versionA}/compare/${versionB}`
      ),
  },

  // Reports
  reports: {
    list: (productId: string) =>
      request<ReportListResponse>(`/products/${productId}/reports`),
    latest: (productId: string) =>
      request<ReportResponse>(`/products/${productId}/reports/latest`),
    get: (productId: string, reportId: string) =>
      request<ReportResponse>(`/products/${productId}/reports/${reportId}`),
    create: (productId: string) =>
      request<ReportResponse>(`/products/${productId}/reports`, {
        method: 'POST',
      }),
  },

  // Evidence
  evidence: {
    list: (productId: string) =>
      request<{ items: any[]; total: number; limit: number; offset: number }>(
        `/products/${productId}/evidence`
      ),
  },

  // Impact Events
  impactEvents: {
    list: (productId: string) =>
      request<{ items: any[]; total: number; limit: number; offset: number }>(
        `/products/${productId}/impact-events`
      ),
  },

  // Projects (Hybrid Demo Storage: LocalStorage guaranteed + backend sync if available)
  projects: {
    list: async (params?: { search?: string; category?: string; status?: string; limit?: number; offset?: number }): Promise<ProjectListResponse> => {
      const query = new URLSearchParams();
      if (params?.search) query.set('search', params.search);
      if (params?.category) query.set('category', params.category);
      if (params?.status) query.set('status', params.status);
      if (params?.limit !== undefined) query.set('limit', String(params.limit));
      if (params?.offset !== undefined) query.set('offset', String(params.offset));
      const qs = query.toString();

      try {
        const res = await request<ProjectListResponse>(`/projects${qs ? `?${qs}` : ''}`);
        if (res && Array.isArray(res.items)) {
          const localExisting = getLocalProjects();
          const remoteIds = new Set(res.items.map((i) => i.id));
          const merged = [...res.items, ...localExisting.filter((l) => !remoteIds.has(l.id))];
          setLocalProjects(merged as Project[]);
          return res;
        }
      } catch {
        // Fall back seamlessly to LocalStorage
      }

      const items = queryLocalProjects({
        search: params?.search,
        category: params?.category,
        status: params?.status,
      }) as ProjectItem[];

      return {
        items,
        total: items.length,
        limit: params?.limit || 100,
        offset: params?.offset || 0,
      };
    },

    get: async (projectId: string): Promise<ProjectItem> => {
      try {
        return await request<ProjectItem>(`/projects/${projectId}`);
      } catch {
        const local = getLocalProjectById(projectId);
        if (local) return local as ProjectItem;
        throw new Error(`Project ${projectId} not found`);
      }
    },

    create: async (data: Partial<ProjectItem>): Promise<ProjectItem> => {
      // 1. Always save locally immediately for guaranteed demo reliability
      const savedLocal = createLocalProject(data as any) as ProjectItem;

      // 2. Try to sync to backend in background if available
      try {
        const backendRes = await request<ProjectItem>('/projects', {
          method: 'POST',
          body: JSON.stringify({ ...data, id: savedLocal.id }),
        });
        if (backendRes) return backendRes;
      } catch {
        // Silently use the local saved copy for the demo
      }

      return savedLocal;
    },

    update: async (projectId: string, data: Partial<ProjectItem>): Promise<ProjectItem> => {
      // 1. Update locally immediately
      const updatedLocal = updateLocalProject(projectId, data as any) as ProjectItem;

      // 2. Try to sync to backend in background
      try {
        const backendRes = await request<ProjectItem>(`/projects/${projectId}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
        if (backendRes) return backendRes;
      } catch {
        // Silently use the local updated copy for the demo
      }

      if (!updatedLocal) throw new Error(`Project ${projectId} not found`);
      return updatedLocal;
    },

    delete: async (projectId: string): Promise<void> => {
      // 1. Delete locally immediately
      deleteLocalProject(projectId);

      // 2. Try to sync to backend in background
      try {
        await request<void>(`/projects/${projectId}`, {
          method: 'DELETE',
        });
      } catch {
        // Local deletion already succeeded
      }
    },
  },

  // Influencers
  influencers: {
    list: (params?: {
      category?: string;
      follower_tier?: string;
      platform?: string;
      search?: string;
      limit?: number;
      offset?: number;
    }) => {
      const query = new URLSearchParams();
      if (params?.category) query.set('category', params.category);
      if (params?.follower_tier) query.set('follower_tier', params.follower_tier);
      if (params?.platform) query.set('platform', params.platform);
      if (params?.search) query.set('search', params.search);
      if (params?.limit !== undefined) query.set('limit', String(params.limit));
      if (params?.offset !== undefined) query.set('offset', String(params.offset));
      const qs = query.toString();
      return request<InfluencerListResponse>(`/influencers${qs ? `?${qs}` : ''}`);
    },
    create: (data: InfluencerCreate) =>
      request<InfluencerResponse>('/influencers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    matchCustom: (data: CustomMatchRequest) =>
      request<InfluencerMatchListResponse>('/influencers/match-custom', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    matchProduct: (productId: string) =>
      request<InfluencerMatchListResponse>(`/influencers/match/${productId}`),
    generatePitch: (influencerId: string, data: PitchRequest) =>
      request<PitchResponse>(`/influencers/${influencerId}/pitch`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateStatus: (influencerId: string, data: InfluencerUpdate) =>
      request<InfluencerResponse>(`/influencers/${influencerId}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    aiFind: (data: InfluencerAiFindRequest) =>
      request<InfluencerAiFindResponse>('/influencers/ai-find', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
};
