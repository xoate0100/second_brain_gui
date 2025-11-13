/**
 * Notes API Tests
 * Tests for notes API endpoint client
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotesApiClient } from './notes-api';
import { ApiClientImpl } from './client';
import type {
  StatusUpdateRequest,
  NoteUpdateRequest,
  BatchUpdateRequest
} from './types';

describe('NotesApiClient', () => {
  let apiClient: ApiClientImpl;
  let notesApi: NotesApiClient;

  beforeEach(() => {
    apiClient = new ApiClientImpl('http://localhost:8000', 'test-api-key');
    notesApi = new NotesApiClient(apiClient);
    vi.clearAllMocks();
  });

  describe('getNote', () => {
    it('should fetch note by ID', async () => {
      const noteId = 'test-note-123';
      const mockResponse = {
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
          body: 'Note content',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      };

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockResponse);

      const result = await notesApi.getNote(noteId);

      expect(apiClient.get).toHaveBeenCalledWith(`/api/v1/notes/${noteId}`);
      expect(result.success).toBe(true);
      expect(result.data?.note_id).toBe(noteId);
    });
  });

  describe('updateStatus', () => {
    it('should update note status', async () => {
      const noteId = 'test-note-123';
      const request: StatusUpdateRequest = {
        status: 'ready',
        review_notes: 'Ready for review'
      };

      const mockResponse = {
        success: true,
        data: {
          note_id: noteId,
          status: 'ready',
          previous_status: 'inbox',
          momentum_delta: 0.1,
          updated_at: '2025-01-31T00:00:00Z'
        }
      };

      vi.spyOn(apiClient, 'put').mockResolvedValueOnce(mockResponse);

      const result = await notesApi.updateStatus(noteId, request);

      expect(apiClient.put).toHaveBeenCalledWith(
        `/api/v1/notes/${noteId}/status`,
        request
      );
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('ready');
    });
  });

  describe('updateNote', () => {
    it('should update note metadata', async () => {
      const noteId = 'test-note-123';
      const request: NoteUpdateRequest = {
        venture: 'CRL',
        domain: 'new-domain',
        tags: ['tag1', 'tag2']
      };

      const mockResponse = {
        success: true,
        data: {
          note_id: noteId,
          updated_fields: ['venture', 'domain', 'tags'],
          updated_at: '2025-01-31T00:00:00Z'
        }
      };

      vi.spyOn(apiClient, 'put').mockResolvedValueOnce(mockResponse);

      const result = await notesApi.updateNote(noteId, request);

      expect(apiClient.put).toHaveBeenCalledWith(
        `/api/v1/notes/${noteId}`,
        request
      );
      expect(result.success).toBe(true);
      expect(result.data?.updated_fields).toContain('venture');
    });
  });

  describe('batchUpdate', () => {
    it('should perform batch update', async () => {
      const request: BatchUpdateRequest = {
        note_ids: ['note1', 'note2', 'note3'],
        updates: {
          status: 'done'
        }
      };

      const mockResponse = {
        success: true,
        data: {
          total: 3,
          succeeded: 2,
          failed: 1,
          results: [
            { note_id: 'note1', success: true },
            { note_id: 'note2', success: true },
            { note_id: 'note3', success: false, error: 'Not found' }
          ]
        }
      };

      vi.spyOn(apiClient, 'post').mockResolvedValueOnce(mockResponse);

      const result = await notesApi.batchUpdate(request);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/notes/batch-update',
        request
      );
      expect(result.success).toBe(true);
      expect(result.data?.succeeded).toBe(2);
      expect(result.data?.failed).toBe(1);
    });
  });
});

