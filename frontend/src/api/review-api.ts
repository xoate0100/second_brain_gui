/**
 * Review API Client
 * Client for review-related API endpoints
 *
 * Responsibilities:
 * - Provide typed methods for review queue and suggestions
 * - Handle query parameter serialization
 *
 * SOLID Principles:
 * - SRP: Single responsibility - review API endpoints
 * - DIP: Depends on ApiClient interface
 */

import type { ApiClient, ApiResponse } from '../types/api';
import type {
  ReviewQueueParams,
  ReviewQueueResponse,
  SuggestionParams,
  SuggestionResponse,
} from './types';

export class ReviewApiClient {
  constructor(private apiClient: ApiClient) {}

  /**
   * Get review queue with optional filters and pagination
   */
  async getQueue(params: ReviewQueueParams = {}): Promise<ApiResponse<ReviewQueueResponse>> {
    const queryString = this.buildQueryString(params);
    const url = `/api/v1/review/queue${queryString}`;
    return this.apiClient.get<ReviewQueueResponse>(url);
  }

  /**
   * Get smart suggestions for review items
   */
  async getSuggestions(params: SuggestionParams = {}): Promise<ApiResponse<SuggestionResponse>> {
    const queryString = this.buildQueryString(params);
    const url = `/api/v1/review/suggestions${queryString}`;
    return this.apiClient.get<SuggestionResponse>(url);
  }

  /**
   * Build query string from parameters
   */
  private buildQueryString(
    params: Record<string, unknown> | ReviewQueueParams | SuggestionParams
  ): string {
    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }
}
