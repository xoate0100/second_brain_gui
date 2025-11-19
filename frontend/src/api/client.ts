/**
 * API Client Implementation
 * HTTP client for backend API communication
 *
 * Responsibilities:
 * - Make HTTP requests to backend API
 * - Handle authentication (API key, JWT)
 * - Generate request IDs for idempotency
 * - Parse responses and errors
 *
 * SOLID Principles:
 * - SRP: Single responsibility - API communication
 * - DIP: Implements ApiClient interface
 */

import type { ApiClient, ApiResponse } from '../types/api';
import { parseApiError } from './errors';
import { v4 as uuidv4 } from 'uuid';

function getErrorCodeFromStatus(status: number): string {
  switch (status) {
    case 400:
      return 'VALIDATION_ERROR';
    case 401:
      return 'AUTHENTICATION_ERROR';
    case 403:
      return 'AUTHORIZATION_ERROR';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 429:
      return 'RATE_LIMIT_EXCEEDED';
    case 500:
      return 'INTERNAL_ERROR';
    case 503:
      return 'SERVICE_UNAVAILABLE';
    default:
      return 'UNKNOWN_ERROR';
  }
}

export class ApiClientImpl implements ApiClient {
  private baseUrl: string;
  private apiKey: string;
  private jwtToken?: string;

  constructor(baseUrl: string, apiKey: string, jwtToken?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
    this.jwtToken = jwtToken;
  }

  /**
   * Update JWT token
   */
  setJwtToken(token: string | undefined): void {
    this.jwtToken = token;
  }

  /**
   * Make GET request
   */
  async get<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>('GET', url);
  }

  /**
   * Make POST request
   */
  async post<T>(url: string, data: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('POST', url, data);
  }

  /**
   * Make PUT request
   */
  async put<T>(url: string, data: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', url, data);
  }

  /**
   * Make DELETE request
   */
  async delete<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', url);
  }

  /**
   * Make HTTP request
   */
  private async request<T>(method: string, url: string, data?: unknown): Promise<ApiResponse<T>> {
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    const requestId = uuidv4();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
    };

    // Backend expects Authorization header with Bearer token format
    // API key should be sent as: Authorization: Bearer <api_key>
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    // JWT token takes precedence if both are provided
    if (this.jwtToken) {
      headers['Authorization'] = `Bearer ${this.jwtToken}`;
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(fullUrl, options);

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        return {
          success: false,
          error: {
            code: 'UNKNOWN_ERROR',
            message: `Unexpected content type: ${contentType}`,
            details: {},
          },
        };
      }

      const jsonData = await response.json();

      // Check if response indicates success
      if (!response.ok) {
        // Try to parse error from response
        const error = jsonData.error
          ? parseApiError(jsonData)
          : {
              code: getErrorCodeFromStatus(response.status),
              message: response.statusText || jsonData.message || 'Request failed',
              details: jsonData.details || {},
            };
        return {
          success: false,
          error,
        };
      }

      // Check if JSON indicates failure
      if (jsonData.success === false) {
        const error = parseApiError(jsonData);
        return {
          success: false,
          error,
        };
      }

      return jsonData as ApiResponse<T>;
    } catch (error) {
      // Handle network errors
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Network error',
          details: {},
        },
      };
    }
  }
}
