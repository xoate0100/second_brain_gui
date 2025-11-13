/**
 * NoteEditor Component Tests
 * Tests for note metadata editor component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NoteEditor } from './NoteEditor';
import { ApiClientImpl } from '../../api/client';
import { NotesApiClient } from '../../api/notes-api';
import type { NoteDetailResponse, NoteUpdateRequest } from '../../api/types';
import type { ApiResponse, NoteUpdateResponse } from '../../api/types';

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
  });

  describe('update', () => {
    it('should update with note data', () => {
      component.update(mockNoteData);
      const element = component.render();
      const ventureSelect = element.querySelector(
        'select[name="venture"]'
      ) as HTMLSelectElement;
      expect(ventureSelect.value).toBe('SWS');
    });
  });

  describe('submitUpdate', () => {
    it('should submit note update via API', async () => {
      const mockResponse: ApiResponse<NoteUpdateResponse> = {
        success: true,
        data: {
          note_id: noteId,
          updated_fields: ['venture', 'domain'],
          updated_at: '2025-01-31T00:00:00Z'
        }
      };

      vi.spyOn(notesApi, 'updateNote').mockResolvedValueOnce(mockResponse);

      const request: NoteUpdateRequest = {
        venture: 'CRL',
        domain: 'new-domain'
      };

      await component.submitUpdate(request);

      expect(notesApi.updateNote).toHaveBeenCalledWith(noteId, request);
    });
  });
});

