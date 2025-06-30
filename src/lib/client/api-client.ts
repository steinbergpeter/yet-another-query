import { ErrorResponse } from '../validation/base';
import {
  UserQuery,
  UserApiResponse,
  userQuerySchema,
  type UserResponse,
} from '../validation/users';
import {
  PostQuery,
  PostApiResponse,
  postQuerySchema,
  type PostResponse,
} from '../validation/posts';

// Base API client configuration
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined'
    ? window.location.origin
    : 'http://localhost:3000');

// Generic API client for type-safe requests
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<T> {
    try {
      console.log('API Request Debug:', {
        baseUrl: this.baseUrl,
        endpoint,
        params,
      });
      const url = new URL(`${this.baseUrl}/api${endpoint}`);
      console.log('Constructed URL:', url.toString());

      // Add query parameters with proper handling of complex types
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            // Handle complex objects (like 'and', 'or' conditions) by JSON stringifying
            if (typeof value === 'object' && !Array.isArray(value)) {
              url.searchParams.append(key, JSON.stringify(value));
            } else {
              url.searchParams.append(key, String(value));
            }
          }
        });
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errorData: ErrorResponse;
        try {
          errorData = await response.json();
        } catch {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Enhanced error handling for TanStack Query
        const error = new Error(errorData.error || `HTTP ${response.status}`);
        (error as any).status = response.status;
        (error as any).validation = errorData.validation;
        throw error;
      }

      return response.json();
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Type-safe user queries
  async getUsers(params?: Partial<UserQuery>): Promise<UserApiResponse> {
    // Validate parameters at runtime
    if (params) {
      const validation = userQuerySchema.safeParse(params);
      if (!validation.success) {
        throw new Error(`Invalid parameters: ${validation.error.message}`);
      }
    }

    return this.request<UserApiResponse>('/users', params);
  }

  // Type-safe post queries
  async getPosts(params?: Partial<PostQuery>): Promise<PostApiResponse> {
    // Validate parameters at runtime
    if (params) {
      const validation = postQuerySchema.safeParse(params);
      if (!validation.success) {
        throw new Error(`Invalid parameters: ${validation.error.message}`);
      }
    }

    return this.request<PostApiResponse>('/posts', params);
  }

  // Type-safe single user query
  async getUser(
    id: string,
    params?: Pick<UserQuery, 'select' | 'include'>
  ): Promise<UserResponse> {
    return this.request<UserResponse>(`/users/${id}`, params);
  }

  // Type-safe single post query
  async getPost(
    id: string,
    params?: Pick<PostQuery, 'select' | 'include'>
  ): Promise<PostResponse> {
    return this.request<PostResponse>(`/posts/${id}`, params);
  }

  // Generic method for future endpoints
  async customQuery<T>(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<T> {
    return this.request<T>(endpoint, params);
  }
}

// Default client instance
export const apiClient = new ApiClient();

// Type guards for response validation
export function isUserApiResponse(data: any): data is UserApiResponse {
  return data && Array.isArray(data.data) && data.pagination;
}

export function isPostApiResponse(data: any): data is PostApiResponse {
  return data && Array.isArray(data.data) && data.pagination;
}

export function isErrorResponse(data: any): data is ErrorResponse {
  return data && typeof data.error === 'string';
}
