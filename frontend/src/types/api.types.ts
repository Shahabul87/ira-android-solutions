// API response types that match backend FastAPI responses

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: ApiMetadata;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiMetadata {
  timestamp: string;
  requestId: string;
  version: string;
}

// Pagination types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  skip?: number;
  limit?: number;
}

// Query parameters
export interface QueryParams extends Record<string, unknown> {
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
}

// HTTP method types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// API client configuration
export interface ApiConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

// Request options
export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  timeout?: number;
  signal?: AbortSignal;
}

// Upload types
export interface FileUpload {
  file: File;
  onProgress?: (progress: number) => void;
  metadata?: Record<string, unknown>;
}

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  content_type: string;
  metadata?: Record<string, unknown>;
}

// Health check types
export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  database: {
    status: 'connected' | 'disconnected';
    response_time?: number;
  };
  redis?: {
    status: 'connected' | 'disconnected';
    response_time?: number;
  };
}