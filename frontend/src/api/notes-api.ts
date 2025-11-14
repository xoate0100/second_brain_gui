/**
 * Notes API Client
 * Client for note-related API endpoints
 * 
 * Responsibilities:
 * - Provide typed methods for note operations
 * - Handle note CRUD operations
 * 
 * SOLID Principles:
 * - SRP: Single responsibility - notes API endpoints
 * - DIP: Depends on ApiClient interface
 */

import type { ApiClient, ApiResponse } from '../types/api';
import type {
  NoteDetailResponse,
  StatusUpdateRequest,
  StatusUpdateResponse,
  NoteUpdateRequest,
  NoteUpdateResponse,
  BatchUpdateRequest,
  BatchUpdateResponse
} from './types';

export class NotesApiClient {
  constructor(private apiClient: ApiClient) {}

  /**
   * Get note detail by ID
   */
  async getNote(noteId: string): Promise<ApiResponse<NoteDetailResponse>> {
    return this.apiClient.get<NoteDetailResponse>(`/api/v1/notes/${noteId}`);
  }

  /**
   * Update note status
   */
  async updateStatus(
    noteId: string,
    request: StatusUpdateRequest
  ): Promise<ApiResponse<StatusUpdateResponse>> {
    return this.apiClient.put<StatusUpdateResponse>(
      `/api/v1/notes/${noteId}/status`,
      request
    );
  }

  /**
   * Update note metadata
   */
  async updateNote(
    noteId: string,
    request: NoteUpdateRequest
  ): Promise<ApiResponse<NoteUpdateResponse>> {
    return this.apiClient.put<NoteUpdateResponse>(
      `/api/v1/notes/${noteId}`,
      request
    );
  }

  /**
   * Batch update multiple notes
   */
  async batchUpdate(
    request: BatchUpdateRequest
  ): Promise<ApiResponse<BatchUpdateResponse>> {
    return this.apiClient.post<BatchUpdateResponse>(
      '/api/v1/notes/batch-update',
      request
    );
  }
}


