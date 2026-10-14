/**
 * [client/src/lib/api.ts]
 * Frontend API client with comprehensive error origin tagging for BrandShield AI.
 */

import {
  BrandProfile,
  CompletenessReport,
  Detection,
  ExcludedAsset,
  LookalikeTestResult,
  ScanSummary,
  SourceHealth,
} from '../types/index.js';

const API_BASE = '/api';

export class ApiError extends Error {
  constructor(
    public readonly fileOrigin: string,
    message: string,
    public readonly statusCode: number = 500
  ) {
    super(`[${fileOrigin}] ${message}`);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 20000); // 20s request timeout

  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      signal: controller.signal,
      ...options,
    });

    if (!res.ok) {
      let serverErrorMsg = `HTTP ${res.status}: ${res.statusText}`;
      try {
        const json = await res.json();
        serverErrorMsg = json.error || json.message || json.details || serverErrorMsg;
      } catch {
        // Fallback for HTML or plain-text proxy error response
        if (res.status === 500 || res.status === 502 || res.status === 503 || res.status === 504) {
          serverErrorMsg = `Can't reach the API at ${url} (HTTP ${res.status}). Is the backend server running on port 4000?`;
        }
      }
      throw new ApiError('client/src/lib/api.ts', serverErrorMsg, res.status);
    }

    try {
      return await res.json();
    } catch (parseErr: any) {
      console.error(`[client/src/lib/api.ts] Failed to parse JSON response from ${endpoint}:`, parseErr);
      throw new ApiError(
        'client/src/lib/api.ts',
        `Invalid response format from ${endpoint}. Expected JSON but received unparseable output.`,
        500
      );
    }
  } catch (err: any) {
    if (err instanceof ApiError) throw err;

    console.error(`[client/src/lib/api.ts] Request exception calling ${endpoint}:`, err);

    if (err.name === 'AbortError') {
      throw new ApiError(
        'client/src/lib/api.ts',
        `Request to ${endpoint} timed out after 20 seconds. The server took too long to respond.`,
        504
      );
    }

    const rawMsg = String(err?.message || '');
    const lower = rawMsg.toLowerCase();

    // Safari throws "Load failed" (TypeError) when network fails, connection is refused, or CORS rejects
    // Chrome throws "Failed to fetch", Firefox throws "NetworkError when attempting to fetch resource."
    const isNetworkOrCorsFailure =
      err instanceof TypeError ||
      lower.includes('load failed') ||
      lower.includes('failed to fetch') ||
      lower.includes('networkerror') ||
      lower.includes('econnrefused');

    if (isNetworkOrCorsFailure) {
      throw new ApiError(
        'client/src/lib/api.ts',
        `Can't reach the API at ${url}. Is the backend running on port 4000? (Network/CORS error: ${rawMsg})`,
        503
      );
    }

    throw new ApiError('client/src/lib/api.ts', err.message || 'Network communication failure', 500);
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = {
  // Health
  async getHealth(): Promise<{
    status: string;
    mode: string;
    db?: string;
    brands?: number;
    detections?: number;
    ai?: {
      status: 'available' | 'degraded' | 'unavailable';
      model: string;
      verified: boolean;
      lastError: string | null;
      lastErrorCategory: string | null;
    };
    aiStatus?: 'available' | 'degraded' | 'unavailable';
    aiAvailable?: boolean;
    model?: string;
    sources: SourceHealth[];
  }> {
    return request('/health');
  },

  // Brands List & Active Brand
  async getBrands(): Promise<BrandProfile[]> {
    const res = await request<{ success: boolean; brands: BrandProfile[] }>('/profile/brands');
    return res.brands || [];
  },

  async selectBrand(brandId: string): Promise<{ profile: BrandProfile; completeness: CompletenessReport }> {
    const res = await request<{ success: boolean; data: { profile: BrandProfile; completeness: CompletenessReport } }>('/profile/select', {
      method: 'POST',
      body: JSON.stringify({ brandId }),
    });
    return res.data;
  },

  // Brand Profile
  async getProfile(brandId?: string): Promise<{ profile: BrandProfile; completeness: CompletenessReport }> {
    const query = brandId ? `?brandId=${encodeURIComponent(brandId)}` : '';
    const res = await request<{ success: boolean; data: { profile: BrandProfile; completeness: CompletenessReport } }>(`/profile${query}`);
    return res.data;
  },

  async updateProfile(profile: BrandProfile): Promise<{ profile: BrandProfile; completeness: CompletenessReport }> {
    const res = await request<{ success: boolean; data: { profile: BrandProfile; completeness: CompletenessReport } }>('/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
    return res.data;
  },

  // Run Demo Analysis across verified & synthetic datasets
  async runScan(): Promise<{
    summary: ScanSummary;
    sources: SourceHealth[];
    warnings: string[];
  }> {
    return request('/scan', { method: 'POST' });
  },

  // Detections & Excluded Assets
  async getDetections(brand?: string): Promise<{
    summary: ScanSummary;
    detections: Detection[];
    excluded: ExcludedAsset[];
    sources: SourceHealth[];
  }> {
    const query = brand && brand.toLowerCase() !== 'all' ? `?brand=${encodeURIComponent(brand)}` : '';
    return request(`/detections${query}`);
  },

  async getDetectionById(id: string): Promise<Detection> {
    const res = await request<{ success: boolean; data: Detection }>(`/detections/${id}`);
    return res.data;
  },

  async updateDetectionStatus(
    id: string,
    status: 'active' | 'confirmed' | 'false_positive'
  ): Promise<Detection> {
    const res = await request<{ success: boolean; data: Detection }>(`/detections/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res.data;
  },

  // Look-alike Lab Live Testbench
  async testLookalike(candidateName: string, context?: string): Promise<{ targetBrand: string; result: LookalikeTestResult }> {
    return request('/lookalike/test', {
      method: 'POST',
      body: JSON.stringify({ candidateName, context }),
    });
  },

  // Ingestion & Deterministic Evaluation
  async checkIngest(input: import('../types/index.js').IngestCheckInput): Promise<import('../types/index.js').IngestCheckResponse> {
    return request('/ingest/check', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async saveIngest(detection: Detection): Promise<{ success: boolean; detection: Detection }> {
    return request('/ingest/save', {
      method: 'POST',
      body: JSON.stringify({ detection }),
    });
  },

  // Dataset Management
  async getDatasetCounts(): Promise<import('../types/index.js').DatasetCounts> {
    const res = await request<{ success: boolean; data: import('../types/index.js').DatasetCounts }>('/dataset/counts');
    return res.data;
  },

  async resetDataset(): Promise<{ success: boolean; message: string; remainingDetections: number }> {
    return request('/dataset/reset', {
      method: 'POST',
    });
  },

  // Feedback System
  async submitFeedback(data: {
    rating: number;
    category: string;
    comment: string;
    email?: string;
    hp_bot_check?: string;
  }): Promise<{ success: boolean; feedback: import('../types/index.js').Feedback }> {
    return request('/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getFeedbacks(): Promise<import('../types/index.js').Feedback[]> {
    const res = await request<{ success: boolean; count: number; data: import('../types/index.js').Feedback[] }>('/feedback');
    return res.data || [];
  },

  // AI Threat Enrichment (Google AI Studio)
  async enrichThreat(detectionId: string): Promise<{ success: boolean; detectionId: string; enrichment: import('../types/index.js').ThreatAnalysis }> {
    return request('/enrich', {
      method: 'POST',
      body: JSON.stringify({ detectionId }),
    });
  },

  async enrichThreatDirect(detection: any, brandName: string): Promise<{ success: boolean; enrichment: import('../types/index.js').ThreatAnalysis }> {
    return request('/enrich', {
      method: 'POST',
      body: JSON.stringify({ detection, brandName }),
    });
  },

  // Configuration
  async getConfig(): Promise<any> {
    const res = await request<{ success: boolean; config: any }>('/config');
    return res.config;
  },

  async updateConfig(config: any): Promise<any> {
    const res = await request<{ success: boolean; config: any }>('/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
    return res.config;
  },
};
