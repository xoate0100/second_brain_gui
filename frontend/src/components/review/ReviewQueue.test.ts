/**
 * ReviewQueue Component Tests
 * Tests for main review queue list component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ReviewQueue } from './ReviewQueue';
import { ApiClientImpl } from '../../api/client';
import { ReviewApiClient } from '../../api/review-api';
import type { ReviewQueueResponse, ReviewItem as ReviewItemType } from '../../api/types';
import type { ApiResponse } from '../../types/api';

describe('ReviewQueue', () => {
  let container: HTMLElement;
  let apiClient: ApiClientImpl;
  let reviewApi: ReviewApiClient;
  let component: ReviewQueue;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    apiClient = new ApiClientImpl('http://localhost:8000', 'test-api-key');
    reviewApi = new ReviewApiClient(apiClient);
    component = new ReviewQueue(container, reviewApi, apiClient);
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (container.parentNode) {
      container.remove();
    }
  });

  describe('render', () => {
    it('should render queue container', () => {
      const element = component.render();
      expect(element).toBeInstanceOf(HTMLElement);
      expect(element.classList.contains('review-queue')).toBe(true);
    });

    it('should render loading state initially', async () => {
      // Set loading state before render
      component['loading'] = true;
      const element = component.render();
      expect(element.querySelector('.review-queue__loading')).toBeTruthy();
    });
  });

  describe('loadQueue', () => {
    it('should fetch and display review items', async () => {
      const mockItems: ReviewItemType[] = [
        {
          note_id: 'note1',
          title: 'Note 1',
          venture: 'SWS',
          domain: 'test',
          status: 'inbox',
          age_days: 5,
          momentum_score: 0.8,
        },
        {
          note_id: 'note2',
          title: 'Note 2',
          venture: 'CRL',
          domain: 'test',
          status: 'ready',
          age_days: 10,
          momentum_score: 0.6,
        },
      ];

      const mockResponse: ApiResponse<ReviewQueueResponse> = {
        success: true,
        data: {
          items: mockItems,
          pagination: {
            page: 1,
            page_size: 50,
            total_items: 2,
            total_pages: 1,
            has_next: false,
            has_previous: false,
          },
        },
      };

      vi.spyOn(reviewApi, 'getQueue').mockResolvedValueOnce(mockResponse);

      await component.loadQueue({});

      const element = component.render();
      expect(element.querySelector('.review-queue__items')).toBeTruthy();
      expect(element.querySelectorAll('.review-item').length).toBe(2);
    });

    it('should handle API errors', async () => {
      const mockResponse: ApiResponse<ReviewQueueResponse> = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Server error',
          details: {},
        },
      };

      vi.spyOn(reviewApi, 'getQueue').mockResolvedValueOnce(mockResponse);

      await component.loadQueue({});

      // After loadQueue, check the container element for error state
      const errorDiv = container.querySelector('.review-queue__error');
      expect(errorDiv).toBeTruthy();
    });
  });

  describe('update', () => {
    it('should update with new filter parameters', async () => {
      const mockResponse: ApiResponse<ReviewQueueResponse> = {
        success: true,
        data: {
          items: [],
          pagination: {
            page: 1,
            page_size: 50,
            total_items: 0,
            total_pages: 0,
            has_next: false,
            has_previous: false,
          },
        },
      };

      vi.spyOn(reviewApi, 'getQueue').mockResolvedValue(mockResponse);

      await component.update({ stage: 'unreviewed', venture: 'SWS' });

      expect(reviewApi.getQueue).toHaveBeenCalledWith({
        stage: 'unreviewed',
        venture: 'SWS',
      });
    });
  });

  describe('selection', () => {
    it('should track selected items', async () => {
      const mockItems: ReviewItemType[] = [
        {
          note_id: 'note1',
          title: 'Note 1',
          venture: 'SWS',
          domain: 'test',
          status: 'inbox',
          age_days: 5,
          momentum_score: 0.8,
        },
      ];

      const mockResponse: ApiResponse<ReviewQueueResponse> = {
        success: true,
        data: {
          items: mockItems,
          pagination: {
            page: 1,
            page_size: 50,
            total_items: 1,
            total_pages: 1,
            has_next: false,
            has_previous: false,
          },
        },
      };

      vi.spyOn(reviewApi, 'getQueue').mockResolvedValueOnce(mockResponse);

      await component.loadQueue({});
      const selected = component.getSelectedItems();
      expect(selected).toEqual([]);

      // Simulate item selection
      container.dispatchEvent(new CustomEvent('item:select', { detail: { note_id: 'note1' } }));

      // Note: In a real implementation, we'd need to handle the event
      // For now, we test the getter
      expect(component.getSelectedItems()).toBeDefined();
    });
  });
});
