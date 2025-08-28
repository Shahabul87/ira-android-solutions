// Type-safe API client for communicating with FastAPI backend

import { 
  ApiResponse, 
  ApiConfig, 
  RequestOptions, 
  HttpMethod,
  PaginatedResponse,
  QueryParams 
} from '@/types';

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;

  constructor(config: ApiConfig) {
    this.baseURL = config.baseURL.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = config.timeout || 30000; // 30 seconds default
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  // Get authorization header from stored tokens
  private getAuthHeaders(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    
    const tokens = localStorage.getItem('auth_tokens');
    if (!tokens) return {};

    try {
      const parsed = JSON.parse(tokens);
      if (parsed.access_token) {
        return {
          Authorization: `Bearer ${parsed.access_token}`,
        };
      }
    } catch {
      // Failed to parse stored tokens - continue without auth
    }

    return {};
  }

  // Make HTTP request with proper error handling and type safety
  private async request<T>(
    method: HttpMethod,
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Prepare headers
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...this.getAuthHeaders(),
      ...options?.headers,
    };

    // Prepare request configuration
    const config: RequestInit = {
      method,
      headers,
      signal: options?.signal || null,
    };

    // Add body for non-GET requests
    if (data && method !== 'GET') {
      if (data instanceof FormData) {
        // Remove Content-Type for FormData (browser will set it with boundary)
        delete headers['Content-Type'];
        config.body = data;
      } else {
        config.body = JSON.stringify(data);
      }
    }

    // Add query parameters for GET requests
    let finalUrl = url;
    if (method === 'GET' && data && typeof data === 'object') {
      const params = new URLSearchParams();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
      if (params.toString()) {
        finalUrl += `?${params.toString()}`;
      }
    }

    try {
      const response = await fetch(finalUrl, {
        ...config,
        signal: AbortSignal.timeout(this.timeout),
      });

      let responseData: ApiResponse<T>;

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        // Handle non-JSON responses (like plain text errors)
        const text = await response.text();
        if (response.ok) {
          responseData = {
            success: true,
          };
        } else {
          responseData = {
            success: false,
            error: {
              code: 'INVALID_RESPONSE',
              message: text || 'Invalid response format',
            },
          };
        }
      }

      // Handle HTTP error status codes
      if (!response.ok && responseData.success !== false) {
        return {
          success: false,
          error: {
            code: `HTTP_${response.status}`,
            message: `Request failed with status ${response.status}`,
            details: { status: response.status, statusText: response.statusText },
          },
        };
      }

      return responseData;
    } catch (error) {
      // Handle network errors, timeouts, etc.
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
          return {
            success: false,
            error: {
              code: 'REQUEST_TIMEOUT',
              message: 'Request timed out',
            },
          };
        }

        return {
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message: error.message,
          },
        };
      }

      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unknown error occurred',
        },
      };
    }
  }

  // Convenience methods for different HTTP verbs
  async get<T>(
    endpoint: string, 
    params?: QueryParams, 
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, params, options);
  }

  async post<T>(
    endpoint: string, 
    data?: unknown, 
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, data, options);
  }

  async put<T>(
    endpoint: string, 
    data?: unknown, 
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, data, options);
  }

  async patch<T>(
    endpoint: string, 
    data?: unknown, 
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, data, options);
  }

  async delete<T>(
    endpoint: string, 
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }

  // Paginated requests
  async getPaginated<T>(
    endpoint: string,
    params?: QueryParams & { page?: number; size?: number },
    options?: RequestOptions
  ): Promise<ApiResponse<PaginatedResponse<T>>> {
    return this.get<PaginatedResponse<T>>(endpoint, params, options);
  }

  // Upload files
  async upload<T>(
    endpoint: string,
    formData: FormData,
    options?: RequestOptions & { onProgress?: (progress: number) => void }
  ): Promise<ApiResponse<T>> {
    // Note: Progress tracking would require additional implementation with XMLHttpRequest
    return this.post<T>(endpoint, formData, options);
  }

  // Update base configuration
  updateConfig(config: Partial<ApiConfig>): void {
    if (config.baseURL) {
      this.baseURL = config.baseURL.replace(/\/$/, '');
    }
    if (config.timeout) {
      this.timeout = config.timeout;
    }
    if (config.headers) {
      this.defaultHeaders = { ...this.defaultHeaders, ...config.headers };
    }
  }

  // Clear stored authentication
  clearAuth(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_tokens');
    }
  }
}

// Create and export default API client instance
const apiClient = new ApiClient({
  baseURL: process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:8000',
  timeout: 30000,
});

export { ApiClient };
export default apiClient;