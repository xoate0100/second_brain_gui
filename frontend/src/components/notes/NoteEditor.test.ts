/**
 * NoteEditor Component Tests
 * Tests for note metadata editor component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NoteEditor } from './NoteEditor';
import { ApiClientImpl } from '../../api/client';
import { NotesApiClient } from '../../api/notes-api';
import type { NoteDetailResponse, NoteUpdateRequest } from '../../api/types';
import type { NoteUpdateResponse } from '../../api/types';
import type { ApiResponse } from '../../types/api';

describe('NoteEditor', () => {
  let container: HTMLElement;
  let apiClient: ApiClientImpl;
  let notesApi: NotesApiClient;
  let component: NoteEditor;
  const noteId = 'test-note-123';

  const mockNoteData: NoteDetailResponse = {
    note_id: noteId,
    file_path: '/path/to/note.md',
    frontmatter: {
      id: noteId,
      title: 'Test Note',
      status: 'inbox',
      venture: 'SWS',
      domain: 'test-domain',
      tags: ['tag1', 'tag2'],
      ai_summary: 'Test summary',
      momentum_score: 0.5,
      age_days: 10,
      aging_stage: 'fresh',
      first_action: 'Do something',
      effort_estimate_min: 30,
      resume_hint: 'Continue from here',
    },
    body: 'Note body content',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    apiClient = new ApiClientImpl('http://localhost:8000', 'test-api-key');
    notesApi = new NotesApiClient(apiClient);
    component = new NoteEditor(container, notesApi, noteId);
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (container.parentNode) {
      container.remove();
    }
  });

  describe('render', () => {
    it('should render note editor form', () => {
      const element = component.render();
      expect(element).toBeInstanceOf(HTMLElement);
      expect(element.querySelector('select[name="venture"]')).toBeTruthy();
      expect(element.querySelector('input[name="domain"]')).toBeTruthy();
      expect(element.querySelector('input[name="tags"]')).toBeTruthy();
    });

    it('should render with default values when no note data', () => {
      const element = component.render();
      const ventureSelect = element.querySelector('select[name="venture"]') as HTMLSelectElement;
      expect(ventureSelect).toBeTruthy();
    });

    it('should render review workflow fields', () => {
      const element = component.render();
      expect(element.querySelector('select[name="review_stage"]')).toBeTruthy();
      expect(element.querySelector('input[name="needs_review"]')).toBeTruthy();
      expect(element.querySelector('input[name="review_fields"]')).toBeTruthy();
      expect(element.querySelector('textarea[name="review_notes"]')).toBeTruthy();
    });

    it('should display review workflow values from note data', () => {
      const noteDataWithReview: NoteDetailResponse = {
        ...mockNoteData,
        frontmatter: {
          ...mockNoteData.frontmatter,
          review_stage: 'in_progress',
          needs_review: true,
          review_fields: ['venture', 'tags'],
          review_notes: 'Reviewing classification',
        },
      };
      component.update(noteDataWithReview);
      const element = component.render();
      const reviewStageSelect = element.querySelector('select[name="review_stage"]') as HTMLSelectElement;
      expect(reviewStageSelect.value).toBe('in_progress');
      const needsReviewCheckbox = element.querySelector('input[name="needs_review"]') as HTMLInputElement;
      expect(needsReviewCheckbox.checked).toBe(true);
      const reviewFieldsInput = element.querySelector('input[name="review_fields"]') as HTMLInputElement;
      expect(reviewFieldsInput.value).toBe('venture, tags');
      const reviewNotesTextarea = element.querySelector('textarea[name="review_notes"]') as HTMLTextAreaElement;
      expect(reviewNotesTextarea.value.trim()).toBe('Reviewing classification');
    });
  });

  describe('update', () => {
    it('should update with note data', () => {
      component.update(mockNoteData);
      const element = component.render();
      const ventureSelect = element.querySelector('select[name="venture"]') as HTMLSelectElement;
      expect(ventureSelect.value).toBe('SWS');
      const domainInput = element.querySelector('input[name="domain"]') as HTMLInputElement;
      expect(domainInput.value).toBe('test-domain');
    });
  });

  describe('submitUpdate', () => {
    it('should submit note update via API', async () => {
      const mockResponse: ApiResponse<NoteUpdateResponse> = {
        success: true,
        data: {
          note_id: noteId,
          updated_fields: ['venture', 'domain'],
          updated_at: '2025-01-31T00:00:00Z',
        },
      };

      vi.spyOn(notesApi, 'updateNote').mockResolvedValueOnce(mockResponse);

      const request: NoteUpdateRequest = {
        venture: 'CRL',
        domain: 'new-domain',
      };

      await component.submitUpdate(request);

      expect(notesApi.updateNote).toHaveBeenCalledWith(noteId, request);
    });

    it('should submit note update with review workflow fields', async () => {
      const mockResponse: ApiResponse<NoteUpdateResponse> = {
        success: true,
        data: {
          note_id: noteId,
          updated_fields: ['review_stage', 'needs_review', 'review_fields', 'review_notes'],
          updated_at: '2025-01-31T00:00:00Z',
          review_stage: 'complete',
          needs_review: false,
          review_fields: [],
          review_notes: 'Review completed',
        },
      };

      vi.spyOn(notesApi, 'updateNote').mockResolvedValueOnce(mockResponse);

      const request: NoteUpdateRequest = {
        venture: 'CRL',
        review_stage: 'complete',
        needs_review: false,
        review_fields: [],
        review_notes: 'Review completed',
      };

      await component.submitUpdate(request);

      expect(notesApi.updateNote).toHaveBeenCalledWith(noteId, request);
    });

    it('should handle API errors', async () => {
      const mockResponse: ApiResponse<NoteUpdateResponse> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid data',
          details: {},
        },
      };

      vi.spyOn(notesApi, 'updateNote').mockResolvedValueOnce(mockResponse);

      const request: NoteUpdateRequest = {
        venture: 'CRL',
      };

      let errorEmitted = false;
      container.addEventListener('editor:error', () => {
        errorEmitted = true;
      });

      await component.submitUpdate(request);

      expect(errorEmitted).toBe(true);
    });

    it('should handle network errors', async () => {
      vi.spyOn(notesApi, 'updateNote').mockRejectedValueOnce(new Error('Network error'));

      const request: NoteUpdateRequest = {
        venture: 'CRL',
      };

      let errorEmitted = false;
      container.addEventListener('editor:error', () => {
        errorEmitted = true;
      });

      await component.submitUpdate(request);

      expect(errorEmitted).toBe(true);
    });
  });

  describe('form submission', () => {
    it('should submit form with all fields', async () => {
      component.update(mockNoteData);
      const element = component.render();
      container.appendChild(element);

      const mockResponse: ApiResponse<NoteUpdateResponse> = {
        success: true,
        data: {
          note_id: noteId,
          updated_fields: ['venture', 'domain', 'tags'],
          updated_at: '2025-01-31T00:00:00Z',
        },
      };

      vi.spyOn(notesApi, 'updateNote').mockResolvedValueOnce(mockResponse);

      // element IS the form (render() returns the form element)
      const form = element as HTMLFormElement;
      const ventureSelect = form.querySelector('[name="venture"]') as HTMLSelectElement;
      if (ventureSelect) {
        ventureSelect.value = 'CRL';
      }

      const domainInput = form.querySelector('[name="domain"]') as HTMLInputElement;
      if (domainInput) {
        domainInput.value = 'new-domain';
      }

      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));

      // Wait for async operation
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(notesApi.updateNote).toHaveBeenCalled();
    });

    it('should submit form with review workflow fields', async () => {
      const noteDataWithReview: NoteDetailResponse = {
        ...mockNoteData,
        frontmatter: {
          ...mockNoteData.frontmatter,
          review_stage: 'in_progress',
          needs_review: true,
          review_fields: ['venture'],
        },
      };
      component.update(noteDataWithReview);
      const element = component.render();
      container.appendChild(element);

      const mockResponse: ApiResponse<NoteUpdateResponse> = {
        success: true,
        data: {
          note_id: noteId,
          updated_fields: ['review_stage', 'needs_review', 'review_fields'],
          updated_at: '2025-01-31T00:00:00Z',
        },
      };

      vi.spyOn(notesApi, 'updateNote').mockResolvedValueOnce(mockResponse);

      const form = element as HTMLFormElement;
      const reviewStageSelect = form.querySelector('[name="review_stage"]') as HTMLSelectElement;
      if (reviewStageSelect) {
        reviewStageSelect.value = 'complete';
      }

      const needsReviewCheckbox = form.querySelector('[name="needs_review"]') as HTMLInputElement;
      if (needsReviewCheckbox) {
        needsReviewCheckbox.checked = false;
      }

      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(notesApi.updateNote).toHaveBeenCalled();
      const callArgs = (notesApi.updateNote as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(callArgs[1]).toHaveProperty('review_stage');
    });

    it('should handle cancel button', () => {
      const element = component.render();
      container.appendChild(element);

      let cancelEmitted = false;
      container.addEventListener('editor:cancel', () => {
        cancelEmitted = true;
      });

      const cancelButton = element.querySelector('.btn.btn--secondary') as HTMLButtonElement;
      cancelButton.click();

      expect(cancelEmitted).toBe(true);
    });
  });

  describe('validation', () => {
    it('should validate domain length', () => {
      component.render();
      const longDomain = 'a'.repeat(101); // Exceeds 100 char limit
      const error = component['validateField']('domain', longDomain);
      expect(error).toBe('Domain must be 100 characters or less');
    });

    it('should validate effort estimate is a number', () => {
      component.render();
      const error = component['validateField']('effort_estimate_min', 'not-a-number');
      expect(error).toBe('Effort estimate must be a number');
    });

    it('should accept valid domain', () => {
      component.render();
      const error = component['validateField']('domain', 'valid-domain');
      expect(error).toBeNull();
    });

    it('should accept valid effort estimate', () => {
      component.render();
      const error = component['validateField']('effort_estimate_min', '30');
      expect(error).toBeNull();
    });
  });
});
