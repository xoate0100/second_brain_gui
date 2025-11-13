/**
 * BatchActions Component Tests
 * Tests for batch action buttons component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BatchActions } from './BatchActions';
import { ApiClientImpl } from '../../api/client';
import { NotesApiClient } from '../../api/notes-api';
import type { BatchUpdateRequest, NoteStatus } from '../../api/types';
import type { ApiResponse, BatchUpdateResponse } from '../../api/types';

describe('BatchActions', () => {
  let container: HTMLElement;
  let apiClient: ApiClientImpl;
  let notesApi: NotesApiClient;
  let component: BatchActions;
  const selectedIds = ['note1', 'note2', 'note3'];

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    apiClient = new ApiClientImpl('http://localhost:8000', 'test-api-key');
    notesApi = new NotesApiClient(apiClient);
    component = new BatchActions(container, notesApi, selectedIds);
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (container.parentNode) {
      container.remove();
    }
  });

  describe('render', () => {
    it('should render batch action buttons', () => {
      const element = component.render();
      expect(element).toBeInstanceOf(HTMLElement);
      expect(element.querySelector('[data-action="update-status"]')).toBeTruthy();
      expect(element.querySelector('[data-action="update-metadata"]')).toBeTruthy();
    });

    it('should disable buttons when no items selected', () => {
      const emptyComponent = new BatchActions(container, notesApi, []);
      const element = emptyComponent.render();
      const buttons = element.querySelectorAll('button');
      buttons.forEach((button) => {
        expect(button.disabled).toBe(true);
      });
    });
  });

  describe('update', () => {
    it('should update selected items', () => {
      component.update(['note4', 'note5']);
      const element = component.render();
      // Buttons should be enabled with new selection
      const buttons = element.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('executeBatchUpdate', () => {
    it('should execute batch update via API', async () => {
      const mockResponse: ApiResponse<BatchUpdateResponse> = {
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

      vi.spyOn(notesApi, 'batchUpdate').mockResolvedValueOnce(mockResponse);

      const request: BatchUpdateRequest = {
        note_ids: selectedIds,
        updates: {
          status: 'done' as NoteStatus
        }
      };

      const result = await component.executeBatchUpdate(request);

      expect(notesApi.batchUpdate).toHaveBeenCalledWith(request);
      expect(result?.succeeded).toBe(2);
      expect(result?.failed).toBe(1);
    });
  });
});

