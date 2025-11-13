/**
 * StatusUpdater Component Tests
 * Tests for status update form component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StatusUpdater } from './StatusUpdater';
import { ApiClientImpl } from '../../api/client';
import { NotesApiClient } from '../../api/notes-api';
import type { StatusUpdateRequest } from '../../api/types';
import type { ApiResponse, StatusUpdateResponse } from '../../api/types';

describe('StatusUpdater', () => {
  let container: HTMLElement;
  let apiClient: ApiClientImpl;
  let notesApi: NotesApiClient;
  let component: StatusUpdater;
  const noteId = 'test-note-123';

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    apiClient = new ApiClientImpl('http://localhost:8000', 'test-api-key');
    notesApi = new NotesApiClient(apiClient);
    component = new StatusUpdater(container, notesApi, noteId, 'inbox');
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (container.parentNode) {
      container.remove();
    }
  });

  describe('render', () => {
    it('should render status update form', () => {
      const element = component.render();
      expect(element).toBeInstanceOf(HTMLElement);
      expect(element.querySelector('select[name="status"]')).toBeTruthy();
      expect(element.querySelector('textarea[name="review_notes"]')).toBeTruthy();
      expect(element.querySelector('input[name="follow_up_date"]')).toBeTruthy();
    });

    it('should display current status', () => {
      const element = component.render();
      const statusSelect = element.querySelector(
        'select[name="status"]'
      ) as HTMLSelectElement;
      expect(statusSelect.value).toBe('inbox');
    });
  });

  describe('update', () => {
    it('should update current status', () => {
      component.update('ready');
      const element = component.render();
      const statusSelect = element.querySelector(
        'select[name="status"]'
      ) as HTMLSelectElement;
      expect(statusSelect.value).toBe('ready');
    });
  });

  describe('submitStatusUpdate', () => {
    it('should submit status update via API', async () => {
      // Use a valid transition: ready → in-progress (no validation required)
      component.update('ready');
      
      const mockResponse: ApiResponse<StatusUpdateResponse> = {
        success: true,
        data: {
          note_id: noteId,
          status: 'in-progress',
          previous_status: 'ready',
          momentum_delta: 0.1,
          updated_at: '2025-01-31T00:00:00Z'
        }
      };

      vi.spyOn(notesApi, 'updateStatus').mockResolvedValueOnce(mockResponse);

      const request: StatusUpdateRequest = {
        status: 'in-progress',
        review_notes: 'Starting work'
      };

      await component.submitStatusUpdate(request);

      expect(notesApi.updateStatus).toHaveBeenCalledWith(noteId, request);
    });

    it('should handle API errors', async () => {
      const mockResponse: ApiResponse<StatusUpdateResponse> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid status transition',
          details: {}
        }
      };

      vi.spyOn(notesApi, 'updateStatus').mockResolvedValueOnce(mockResponse);

      const request: StatusUpdateRequest = {
        status: 'ready'
      };

      await component.submitStatusUpdate(request);

      // Should emit error event
      let errorEmitted = false;
      container.addEventListener('status:error', () => {
        errorEmitted = true;
      });

      expect(errorEmitted).toBeDefined();
    });
  });

  describe('validation', () => {
    it('should validate required fields for status transitions', () => {
      component.update('inbox');
      const validation = component.validateTransition('ready');
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.requirements).toContain('first_action');
    });

    it('should validate ready status requires first_action and effort_estimate_min', () => {
      component.update('inbox');
      const validation = component.validateTransition('ready');
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });
});

