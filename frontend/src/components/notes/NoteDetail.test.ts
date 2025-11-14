/**
 * NoteDetail Component Tests
 * Tests for main note detail view component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NoteDetail } from './NoteDetail';
import { ApiClientImpl } from '../../api/client';
import { NotesApiClient } from '../../api/notes-api';
import type { NoteDetailResponse } from '../../api/types';
import type { ApiResponse } from '../../types/api';

describe('NoteDetail', () => {
  let container: HTMLElement;
  let apiClient: ApiClientImpl;
  let notesApi: NotesApiClient;
  let component: NoteDetail;
  const noteId = 'test-note-123';

  const mockNoteData: NoteDetailResponse = {
    note_id: noteId,
    file_path: '/path/to/note.md',
    frontmatter: {
      id: noteId,
      title: 'Test Note',
      status: 'inbox',
      venture: 'SWS',
      domain: 'test',
      tags: ['tag1', 'tag2'],
      ai_summary: 'Test summary',
      momentum_score: 0.5,
      age_days: 10,
      aging_stage: 'fresh'
    },
    body: 'Note body content',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    apiClient = new ApiClientImpl('http://localhost:8000', 'test-api-key');
    notesApi = new NotesApiClient(apiClient);
    component = new NoteDetail(container, notesApi, apiClient, noteId);
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (container.parentNode) {
      container.remove();
    }
  });

  describe('render', () => {
    it('should render note detail container', () => {
      const element = component.render();
      expect(element).toBeInstanceOf(HTMLElement);
      expect(element.classList.contains('note-detail')).toBe(true);
    });

    it('should render loading state initially', () => {
      component['loading'] = true;
      const element = component.render();
      expect(element.querySelector('.note-detail__loading')).toBeTruthy();
    });

    it('should render empty state when no note data', () => {
      component['noteData'] = null;
      component['loading'] = false;
      const element = component.render();
      expect(element.querySelector('.note-detail__empty')).toBeTruthy();
    });
  });

  describe('loadNote', () => {
    it('should fetch and display note data', async () => {
      const mockResponse: ApiResponse<NoteDetailResponse> = {
        success: true,
        data: mockNoteData
      };

      vi.spyOn(notesApi, 'getNote').mockResolvedValueOnce(mockResponse);

      await component.loadNote();

      const element = component.render();
      expect(element.querySelector('.note-detail__content')).toBeTruthy();
      expect(element.textContent).toContain('Test Note');
      expect(element.textContent).toContain('SWS');
    });

    it('should handle API errors', async () => {
      const mockResponse: ApiResponse<NoteDetailResponse> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Note not found',
          details: {}
        }
      };

      vi.spyOn(notesApi, 'getNote').mockResolvedValueOnce(mockResponse);

      await component.loadNote();

      // Error is rendered in container, not in the rendered element
      const errorDiv = container.querySelector('.note-detail__error');
      expect(errorDiv).toBeTruthy();
    });

    it('should handle network errors', async () => {
      vi.spyOn(notesApi, 'getNote').mockRejectedValueOnce(new Error('Network error'));

      await component.loadNote();

      // Error is rendered in container, not in the rendered element
      const errorDiv = container.querySelector('.note-detail__error');
      expect(errorDiv).toBeTruthy();
    });
  });

  describe('update', () => {
    it('should update note ID and reload', async () => {
      const newNoteId = 'new-note-456';
      const mockResponse: ApiResponse<NoteDetailResponse> = {
        success: true,
        data: { ...mockNoteData, note_id: newNoteId }
      };

      vi.spyOn(notesApi, 'getNote').mockResolvedValueOnce(mockResponse);

      await component.update(newNoteId);

      expect(notesApi.getNote).toHaveBeenCalledWith(newNoteId);
    });
  });

  describe('showEditor', () => {
    it('should show editor when edit button clicked', async () => {
      const mockResponse: ApiResponse<NoteDetailResponse> = {
        success: true,
        data: mockNoteData
      };

      vi.spyOn(notesApi, 'getNote').mockResolvedValueOnce(mockResponse);
      await component.loadNote();

      const element = component.render();
      const editButton = element.querySelector('.edit-button') as HTMLButtonElement;
      editButton.click();

      const editorContainer = container.querySelector('.note-detail__editor-container');
      expect(editorContainer?.querySelector('form')).toBeTruthy();
    });
  });

  describe('showStatusUpdater', () => {
    it('should show status updater when update status button clicked', async () => {
      const mockResponse: ApiResponse<NoteDetailResponse> = {
        success: true,
        data: mockNoteData
      };

      vi.spyOn(notesApi, 'getNote').mockResolvedValueOnce(mockResponse);
      await component.loadNote();

      const element = component.render();
      const statusButton = element.querySelector(
        '.update-status-button'
      ) as HTMLButtonElement;
      statusButton.click();

      const statusContainer = container.querySelector('.note-detail__status-container');
      expect(statusContainer?.querySelector('form')).toBeTruthy();
    });
  });
});
