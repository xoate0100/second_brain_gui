/**
 * Review API Tests
 * Tests for review API endpoint client
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReviewApiClient } from './review-api';
import { ApiClientImpl } from './client';
import type { ReviewQueueParams, SuggestionParams } from './types';

describe('ReviewApiClient', () => {
  let apiClient: ApiClientImpl;
  let reviewApi: ReviewApiClient;

  beforeEach(() => {
    apiClient = new ApiClientImpl('http://localhost:8000', 'test-api-key');
    reviewApi = new ReviewApiClient(apiClient);
    vi.clearAllMocks();
  });

  describe('getQueue', () => {
    it('should fetch review queue with default params', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [],
          pagination: {
            page: 1,
            page_size: 50,
            total_items: 0,
            total_pages: 0,
            has_next: false,
            has_previous: false
          }
        }
      };

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockResponse);

      const result = await reviewApi.getQueue({});

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/review/queue');
      expect(result.success).toBe(true);
      expect(result.data?.items).toEqual([]);
    });

    it('should include query parameters', async () => {
      const params: ReviewQueueParams = {
        stage: 'unreviewed',
        venture: 'SWS',
        limit: 25,
        offset: 50,
        sort_by: 'momentum_score',
        order: 'desc'
      };

      const mockResponse = {
        success: true,
        data: {
          items: [],
          pagination: {
            page: 1,
            page_size: 25,
            total_items: 0,
            total_pages: 0,
            has_next: false,
            has_previous: false
          }
        }
      };

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockResponse);

      await reviewApi.getQueue(params);

      expect(apiClient.get).toHaveBeenCalledWith(
        '/api/v1/review/queue?stage=unreviewed&venture=SWS&limit=25&' +
          'offset=50&sort_by=momentum_score&order=desc'
      );
    });
  });

  describe('getSuggestions', () => {
    it('should fetch suggestions with default params', async () => {
      const mockResponse = {
        success: true,
        data: {
          suggestions: []
        }
      };

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockResponse);

      const result = await reviewApi.getSuggestions({});

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/review/suggestions');
      expect(result.success).toBe(true);
      expect(result.data?.suggestions).toEqual([]);
    });

    it('should include query parameters', async () => {
      const params: SuggestionParams = {
        limit: 20,
        venture: 'SWS',
        domain: 'test'
      };

      const mockResponse = {
        success: true,
        data: {
          suggestions: []
        }
      };

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockResponse);

      await reviewApi.getSuggestions(params);

      expect(apiClient.get).toHaveBeenCalledWith(
        '/api/v1/review/suggestions?limit=20&venture=SWS&domain=test'
      );
    });
  });
});

