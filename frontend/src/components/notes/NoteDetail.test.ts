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
  });

  describe('loadNote', () => {
    it('should fetch and display note data', async () => {
      const mockResponse: ApiResponse<NoteDetailResponse> = {
        success: true,
        data: {
          note_id: noteId,
          file_path: '/path/to/note.md',
          frontmatter: {
            id: noteId,
            title: 'Test Note',
            status: 'inbox',
            venture: 'SWS',
            domain: 'test',
            tags: [],
            ai_summary: 'Test summary',
            momentum_score: 0.5,
            age_days: 10,
            aging_stage: 'fresh'
          },
          body: 'Note body content',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      };

      vi.spyOn(notesApi, 'getNote').mockResolvedValueOnce(mockResponse);

      await component.loadNote();

      const element = component.render();
      expect(element.querySelector('.note-detail__content')).toBeTruthy();
    });
  });
});

