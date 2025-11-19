/**
 * BatchActions Component
 * Action buttons for batch operations
 *
 * Responsibilities:
 * - Display batch action buttons
 * - Execute batch operations via API
 * - Emit batch operation events
 *
 * SOLID Principles:
 * - SRP: Single responsibility - batch action execution
 * - DIP: Depends on NotesApiClient interface
 */

import { Component } from '../base/Component';
import { NotesApiClient } from '../../api/notes-api';
import { ApiErrorHandler } from '../../api/errors';
import { ToastManager } from '../../services/ToastManager';
import type { BatchUpdateRequest, BatchUpdateResponse } from '../../api/types';
import type { ApiResponse } from '../../types/api';

export class BatchActions extends Component {
  private notesApi: NotesApiClient;
  private selectedIds: string[];

  constructor(container: HTMLElement, notesApi: NotesApiClient, selectedIds: string[]) {
    super(container);
    this.notesApi = notesApi;
    this.selectedIds = selectedIds;
  }

  render(): HTMLElement {
    const actions = document.createElement('div');
    actions.className = 'batch-actions';
    actions.setAttribute('role', 'toolbar');
    actions.setAttribute('aria-label', 'Batch operation actions');

    const hasSelection = this.selectedIds.length > 0;

    actions.innerHTML = `
      <button type="button" class="btn btn--primary" data-action="update-status"
              ${hasSelection ? '' : 'disabled'}
              aria-label="Update status for selected items">
        Update Status
      </button>
      <button type="button" class="btn btn--primary" data-action="update-metadata"
              ${hasSelection ? '' : 'disabled'}
              aria-label="Update metadata for selected items">
        Update Metadata
      </button>
      <button type="button" class="btn btn--danger" data-action="archive"
              ${hasSelection ? '' : 'disabled'}
              aria-label="Archive selected items">
        Archive
      </button>
    `;

    // Add event listeners
    const updateStatusButton = actions.querySelector(
      '[data-action="update-status"]'
    ) as HTMLButtonElement;
    if (updateStatusButton) {
      updateStatusButton.addEventListener('click', () => {
        this.emit('action:update-status', { selected: this.selectedIds });
      });
    }

    const updateMetadataButton = actions.querySelector(
      '[data-action="update-metadata"]'
    ) as HTMLButtonElement;
    if (updateMetadataButton) {
      updateMetadataButton.addEventListener('click', () => {
        this.emit('action:update-metadata', { selected: this.selectedIds });
      });
    }

    const archiveButton = actions.querySelector('[data-action="archive"]') as HTMLButtonElement;
    if (archiveButton) {
      archiveButton.addEventListener('click', () => {
        this.emit('action:archive', { selected: this.selectedIds });
      });
    }

    return actions;
  }

  update(data: unknown): void {
    if (Array.isArray(data)) {
      this.selectedIds = data as string[];
      // Re-render if element exists
      const existing = this.element.querySelector('.batch-actions');
      if (existing) {
        existing.remove();
        this.element.appendChild(this.render());
      }
    }
  }

  async executeBatchUpdate(request: BatchUpdateRequest): Promise<BatchUpdateResponse | null> {
    try {
      const response: ApiResponse<BatchUpdateResponse> = await this.notesApi.batchUpdate(request);

      if (!response.success || !response.data) {
        const error = response.error || {
          code: 'UNKNOWN_ERROR',
          message: 'Failed to execute batch update',
          details: {},
        };
        ToastManager.getInstance().error(error.message);
        ApiErrorHandler.handle(error);
        this.emit('batch:error', { error });
        return null;
      }

      const { total, succeeded, failed } = response.data;
      if (failed > 0) {
        ToastManager.getInstance().warning(`Batch update completed: ${succeeded} succeeded, ${failed} failed`);
      } else {
        ToastManager.getInstance().success(`Batch update completed: ${succeeded} items updated`);
      }

      this.emit('batch:complete', {
        total,
        succeeded,
        failed,
        results: response.data.results,
      });

      return response.data;
    } catch (error) {
      const apiError = {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Network error',
        details: {},
      };
      ApiErrorHandler.handle(apiError);
      this.emit('batch:error', { error: apiError });
      return null;
    }
  }
}
