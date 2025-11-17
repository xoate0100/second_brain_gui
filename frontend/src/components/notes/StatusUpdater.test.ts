/**
 * StatusUpdater Component Tests
 * Tests for status update form component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StatusUpdater } from './StatusUpdater';
import { ApiClientImpl } from '../../api/client';
import { NotesApiClient } from '../../api/notes-api';
import type { StatusUpdateRequest } from '../../api/types';
import type { StatusUpdateResponse } from '../../api/types';
import type { ApiResponse } from '../../types/api';

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
      const statusSelect = element.querySelector('select[name="status"]') as HTMLSelectElement;
      expect(statusSelect.value).toBe('inbox');
    });

    it('should render review workflow fields', () => {
      const element = component.render();
      expect(element.querySelector('select[name="review_stage"]')).toBeTruthy();
      expect(element.querySelector('input[name="needs_review"]')).toBeTruthy();
      expect(element.querySelector('input[name="review_fields"]')).toBeTruthy();
    });
  });

  describe('update', () => {
    it('should update current status', () => {
      component.update('ready');
      const element = component.render();
      const statusSelect = element.querySelector('select[name="status"]') as HTMLSelectElement;
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
          updated_at: '2025-01-31T00:00:00Z',
        },
      };

      vi.spyOn(notesApi, 'updateStatus').mockResolvedValueOnce(mockResponse);

      const request: StatusUpdateRequest = {
        status: 'in-progress',
        review_notes: 'Starting work',
      };

      let updatedEmitted = false;
      container.addEventListener('status:updated', () => {
        updatedEmitted = true;
      });

      await component.submitStatusUpdate(request);

      expect(notesApi.updateStatus).toHaveBeenCalledWith(noteId, request);
      expect(updatedEmitted).toBe(true);
    });

    it('should submit status update with review workflow fields', async () => {
      component.update('ready');

      const mockResponse: ApiResponse<StatusUpdateResponse> = {
        success: true,
        data: {
          note_id: noteId,
          status: 'in-progress',
          previous_status: 'ready',
          momentum_delta: 0.1,
          updated_at: '2025-01-31T00:00:00Z',
          review_stage: 'in_progress',
          review_notes: 'Starting review',
        },
      };

      vi.spyOn(notesApi, 'updateStatus').mockResolvedValueOnce(mockResponse);

      const request: StatusUpdateRequest = {
        status: 'in-progress',
        review_stage: 'in_progress',
        needs_review: true,
        review_fields: ['venture', 'tags'],
        review_notes: 'Starting review',
      };

      let updatedEmitted = false;
      container.addEventListener('status:updated', () => {
        updatedEmitted = true;
      });

      await component.submitStatusUpdate(request);

      expect(notesApi.updateStatus).toHaveBeenCalledWith(noteId, request);
      expect(updatedEmitted).toBe(true);
    });

    it('should handle API errors', async () => {
      component.update('ready'); // Set valid starting state

      const mockResponse: ApiResponse<StatusUpdateResponse> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid status transition',
          details: {},
        },
      };

      vi.spyOn(notesApi, 'updateStatus').mockResolvedValueOnce(mockResponse);

      const request: StatusUpdateRequest = {
        status: 'in-progress',
      };

      let errorEmitted = false;
      container.addEventListener('status:error', () => {
        errorEmitted = true;
      });

      await component.submitStatusUpdate(request);

      expect(errorEmitted).toBe(true);
    });

    it('should handle network errors', async () => {
      component.update('ready'); // Set valid starting state

      vi.spyOn(notesApi, 'updateStatus').mockRejectedValueOnce(new Error('Network error'));

      const request: StatusUpdateRequest = {
        status: 'in-progress',
      };

      let errorEmitted = false;
      container.addEventListener('status:error', () => {
        errorEmitted = true;
      });

      await component.submitStatusUpdate(request);

      expect(errorEmitted).toBe(true);
    });

    it('should emit validation error but still submit for invalid transitions', async () => {
      component.update('inbox');

      const mockResponse: ApiResponse<StatusUpdateResponse> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid status transition',
          details: {},
        },
      };

      const updateStatusSpy = vi.spyOn(notesApi, 'updateStatus').mockResolvedValueOnce(mockResponse);

      let validationErrorEmitted = false;
      container.addEventListener('status:validation-error', () => {
        validationErrorEmitted = true;
      });

      const request: StatusUpdateRequest = {
        status: 'ready', // Requires first_action and effort_estimate_min
      };

      await component.submitStatusUpdate(request);

      // Validation error is emitted but submission still proceeds (backend validates)
      expect(validationErrorEmitted).toBe(true);
      expect(updateStatusSpy).toHaveBeenCalled();
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
      expect(validation.requirements).toContain('effort_estimate_min');
    });

    it('should validate in-progress to paused requires resume_hint', () => {
      component.update('in-progress');
      const validation = component.validateTransition('paused');
      expect(validation.valid).toBe(false);
      expect(validation.requirements).toContain('resume_hint');
    });

    it('should allow valid transitions', () => {
      component.update('ready');
      const validation = component.validateTransition('in-progress');
      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it('should allow transition to done from any status', () => {
      component.update('inbox');
      const validation = component.validateTransition('done');
      expect(validation.valid).toBe(true);
    });
  });

  describe('form submission', () => {
    it('should submit form with all fields', async () => {
      component.update('ready');
      const element = component.render();
      container.appendChild(element);

      const mockResponse: ApiResponse<StatusUpdateResponse> = {
        success: true,
        data: {
          note_id: noteId,
          status: 'done',
          previous_status: 'ready',
          momentum_delta: 0.2,
          updated_at: '2025-01-31T00:00:00Z',
        },
      };

      const updateStatusSpy = vi
        .spyOn(notesApi, 'updateStatus')
        .mockResolvedValueOnce(mockResponse);

      const form = element as HTMLFormElement;
      const statusSelect = form.querySelector('[name="status"]') as HTMLSelectElement;
      if (statusSelect) {
        statusSelect.value = 'done';
      }

      const reviewNotes = form.querySelector('[name="review_notes"]') as HTMLTextAreaElement;
      if (reviewNotes) {
        reviewNotes.value = 'Completed';
      }

      const followUpDate = form.querySelector('[name="follow_up_date"]') as HTMLInputElement;
      if (followUpDate) {
        followUpDate.value = '2025-02-01';
      }

      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));

      // Wait for async operation
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(updateStatusSpy).toHaveBeenCalled();
    });

    it('should handle cancel button', () => {
      const element = component.render();
      container.appendChild(element);

      let cancelEmitted = false;
      container.addEventListener('status:cancel', () => {
        cancelEmitted = true;
      });

      const cancelButton = element.querySelector('.btn.btn--secondary') as HTMLButtonElement;
      cancelButton.click();

      expect(cancelEmitted).toBe(true);
    });
  });
});
