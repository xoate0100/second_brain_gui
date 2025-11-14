/**
 * SuggestionList Component Tests
 * Tests for suggestions list component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SuggestionList } from './SuggestionList';
import { ReviewApiClient } from '../../api/review-api';
import { ApiClientImpl } from '../../api/client';
import type { ApiResponse } from '../../types/api';
import type { SuggestionResponse, Suggestion } from '../../api/types';

describe('SuggestionList', () => {
  let container: HTMLElement;
  let apiClient: ApiClientImpl;
  let reviewApi: ReviewApiClient;
  let component: SuggestionList;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    apiClient = new ApiClientImpl('http://localhost:8000', 'test-api-key');
    reviewApi = new ReviewApiClient(apiClient);
    component = new SuggestionList(container, reviewApi, apiClient);
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (container.parentNode) {
      container.remove();
    }
  });

  describe('render', () => {
    it('should render loading state initially', () => {
      component['loading'] = true;
      const element = component.render();
      expect(element.querySelector('.suggestion-list__loading')).toBeTruthy();
    });

    it('should render empty state when no suggestions', () => {
      component['loading'] = false;
      component['suggestions'] = [];
      const element = component.render();
      expect(element.querySelector('.suggestion-list__empty')).toBeTruthy();
    });

    it('should render list of suggestions', () => {
      const suggestions: Suggestion[] = [
        {
          note_id: 'note-1',
          suggested_action: 'archive',
          confidence: 0.85,
          reason: 'Inactive for 90 days',
          note_summary: 'Test note 1',
        },
        {
          note_id: 'note-2',
          suggested_action: 'mark_done',
          confidence: 0.75,
          reason: 'Completed task',
          note_summary: 'Test note 2',
        },
      ];

      component['loading'] = false;
      component['suggestions'] = suggestions;
      const element = component.render();
      const items = element.querySelectorAll('.suggestion-item');
      expect(items.length).toBe(2);
    });
  });

  describe('loadSuggestions', () => {
    it('should fetch suggestions from API', async () => {
      const mockResponse: ApiResponse<SuggestionResponse> = {
        success: true,
        data: {
          suggestions: [
            {
              note_id: 'note-1',
              suggested_action: 'archive',
              confidence: 0.85,
              reason: 'Inactive for 90 days',
              note_summary: 'Test note 1',
            },
          ],
        },
      };

      vi.spyOn(reviewApi, 'getSuggestions').mockResolvedValueOnce(mockResponse);

      await component.loadSuggestions();

      expect(reviewApi.getSuggestions).toHaveBeenCalled();
      expect(component['suggestions'].length).toBe(1);
    });

    it('should handle API errors', async () => {
      const mockResponse: ApiResponse<SuggestionResponse> = {
        success: false,
        error: {
          code: 'API_ERROR',
          message: 'Failed to load suggestions',
          details: {},
        },
      };

      vi.spyOn(reviewApi, 'getSuggestions').mockResolvedValueOnce(mockResponse);

      await component.loadSuggestions();

      expect(component['suggestions'].length).toBe(0);
    });

    it('should handle network errors', async () => {
      vi.spyOn(reviewApi, 'getSuggestions').mockRejectedValueOnce(new Error('Network error'));

      await component.loadSuggestions();

      expect(component['suggestions'].length).toBe(0);
    });

    it('should accept filter parameters', async () => {
      const mockResponse: ApiResponse<SuggestionResponse> = {
        success: true,
        data: { suggestions: [] },
      };

      vi.spyOn(reviewApi, 'getSuggestions').mockResolvedValueOnce(mockResponse);

      await component.loadSuggestions({ venture: 'SWS', limit: 20 });

      expect(reviewApi.getSuggestions).toHaveBeenCalledWith({ venture: 'SWS', limit: 20 });
    });
  });

  describe('events', () => {
    it('should emit apply event when suggestion is applied', async () => {
      const suggestions: Suggestion[] = [
        {
          note_id: 'note-1',
          suggested_action: 'archive',
          confidence: 0.85,
          reason: 'Inactive',
          note_summary: 'Test note',
        },
      ];

      component['suggestions'] = suggestions;
      const element = component.render();
      container.appendChild(element);

      let appliedSuggestion: Suggestion | null = null;
      // Listen on container - events bubble from itemContainer through list to container
      const handler = ((e: CustomEvent) => {
        appliedSuggestion = e.detail.suggestion;
      }) as EventListener;
      container.addEventListener('suggestion:apply', handler);

      const applyButton = element.querySelector('[data-action="apply"]') as HTMLButtonElement;
      expect(applyButton).toBeTruthy();
      if (applyButton) {
        applyButton.click();
        // Wait for event to propagate
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(appliedSuggestion).toBeTruthy();
        expect(appliedSuggestion?.note_id).toBe('note-1');
        container.removeEventListener('suggestion:apply', handler);
      }
    });

    it('should emit dismiss event when suggestion is dismissed', async () => {
      const suggestions: Suggestion[] = [
        {
          note_id: 'note-1',
          suggested_action: 'archive',
          confidence: 0.85,
          reason: 'Inactive',
          note_summary: 'Test note',
        },
      ];

      component['suggestions'] = suggestions;
      const element = component.render();
      container.appendChild(element);

      let dismissedId: string | null = null;
      // Listen on container - events bubble from itemContainer through list to container
      const handler = ((e: CustomEvent) => {
        dismissedId = e.detail.note_id;
      }) as EventListener;
      container.addEventListener('suggestion:dismiss', handler);

      const dismissButton = element.querySelector('[data-action="dismiss"]') as HTMLButtonElement;
      expect(dismissButton).toBeTruthy();
      if (dismissButton) {
        dismissButton.click();
        // Wait for event to propagate
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(dismissedId).toBe('note-1');
        container.removeEventListener('suggestion:dismiss', handler);
      }
    });
  });
});

