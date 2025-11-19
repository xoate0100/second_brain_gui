/**
 * NoteDetail Component
 * Main component for displaying and editing note details
 *
 * Responsibilities:
 * - Display full note content (frontmatter + body)
 * - Coordinate NoteEditor and StatusUpdater components
 * - Load note data from API
 * - Handle note updates
 *
 * SOLID Principles:
 * - SRP: Single responsibility - note detail display and coordination
 * - DIP: Depends on NotesApiClient and ApiClient interfaces
 */

import { ApiComponent } from '../base/ApiComponent';
import { NoteEditor } from './NoteEditor';
import { StatusUpdater } from './StatusUpdater';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { NotesApiClient } from '../../api/notes-api';
import { ApiErrorHandler } from '../../api/errors';
import type { ApiClient, ApiResponse } from '../../types/api';
import type { NoteDetailResponse, NoteStatus } from '../../api/types';

export class NoteDetail extends ApiComponent {
  private notesApi: NotesApiClient;
  private noteId: string;
  private noteData: NoteDetailResponse | null = null;
  private loading = false;
  private editor: NoteEditor | null = null;
  private statusUpdater: StatusUpdater | null = null;
  private markdownRenderer: MarkdownRenderer | null = null;

  constructor(
    container: HTMLElement,
    notesApi: NotesApiClient,
    apiClient: ApiClient,
    noteId: string
  ) {
    super(container, apiClient);
    this.notesApi = notesApi;
    this.noteId = noteId;
  }

  render(): HTMLElement {
    const detail = document.createElement('div');
    detail.className = 'note-detail';
    detail.setAttribute('role', 'main');
    detail.setAttribute('aria-label', 'Note detail');

    if (this.loading) {
      detail.innerHTML = '<div class="note-detail__loading">Loading...</div>';
      return detail;
    }

    if (!this.noteData) {
      detail.innerHTML = '<div class="note-detail__empty">No note data</div>';
      return detail;
    }

    const { frontmatter, body } = this.noteData;

    detail.innerHTML = `
      <div class="note-detail__header">
        <h1 class="note-detail__title">${this.escapeHtml(frontmatter.title)}</h1>
        <div class="note-detail__metadata">
          <span class="note-detail__status">Status: ${this.escapeHtml(frontmatter.status)}</span>
          <span class="note-detail__venture">Venture: ${this.escapeHtml(frontmatter.venture)}</span>
          <span class="note-detail__domain">Domain: ${this.escapeHtml(frontmatter.domain)}</span>
          <span class="note-detail__momentum">
            Momentum: ${frontmatter.momentum_score.toFixed(2)}
          </span>
          <span class="note-detail__age">Age: ${frontmatter.age_days} days</span>
        </div>
      </div>
      <div class="note-detail__content">
        <div class="note-detail__body">
          <h2>Content</h2>
          <div class="note-detail__body-container"></div>
        </div>
        <div class="note-detail__frontmatter">
          <h2>Metadata</h2>
          <dl class="note-detail__metadata-list">
            <dt>Tags:</dt>
            <dd>${(frontmatter.tags || []).map((t) => this.escapeHtml(t)).join(', ')}</dd>
            <dt>AI Summary:</dt>
            <dd>${this.escapeHtml(frontmatter.ai_summary || '')}</dd>
            <dt>Created:</dt>
            <dd>${new Date(this.noteData.created_at).toLocaleString()}</dd>
            <dt>Updated:</dt>
            <dd>${new Date(this.noteData.updated_at).toLocaleString()}</dd>
          </dl>
        </div>
      </div>
      <div class="note-detail__actions">
        <button type="button" class="edit-button">Edit Metadata</button>
        <button type="button" class="update-status-button">Update Status</button>
      </div>
      <div class="note-detail__editor-container"></div>
      <div class="note-detail__status-container"></div>
    `;

    // Add action button handlers
    const editButton = detail.querySelector('.edit-button') as HTMLButtonElement;
    if (editButton) {
      editButton.addEventListener('click', () => {
        this.showEditor();
      });
    }

    const updateStatusButton = detail.querySelector('.update-status-button') as HTMLButtonElement;
    if (updateStatusButton) {
      updateStatusButton.addEventListener('click', () => {
        this.showStatusUpdater();
      });
    }

    // Render markdown content
    const bodyContainer = detail.querySelector('.note-detail__body-container') as HTMLElement;
    if (bodyContainer) {
      this.markdownRenderer = new MarkdownRenderer(bodyContainer);
      this.markdownRenderer.render();
      this.markdownRenderer.update(body);
    }

    return detail;
  }

  async update(data: unknown): Promise<void> {
    if (typeof data === 'string') {
      this.noteId = data;
      await this.loadNote();
    }
  }

  async loadNote(): Promise<void> {
    this.loading = true;

    // Re-render to show loading state
    const existing = this.element.querySelector('.note-detail');
    if (existing) {
      existing.remove();
    }
    this.element.appendChild(this.render());

    try {
      const response: ApiResponse<NoteDetailResponse> = await this.notesApi.getNote(this.noteId);

      if (!response.success || !response.data) {
        const error = response.error || {
          code: 'UNKNOWN_ERROR',
          message: 'Failed to load note',
          details: {},
        };
        this.handleError({
          code: error.code,
          message: error.message,
          details: error.details || {},
        });
        return;
      }

      this.noteData = response.data;
      this.loading = false;

      // Re-render with data
      const existingDetail = this.element.querySelector('.note-detail');
      if (existingDetail) {
        existingDetail.remove();
      }
      const rendered = this.render();
      this.element.appendChild(rendered);

      // Update markdown renderer if it exists
      if (this.markdownRenderer && this.noteData) {
        this.markdownRenderer.update(this.noteData.body);
      }
    } catch (error) {
      this.loading = false;
      this.handleError({
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Network error',
        details: {},
      });
    }
  }

  private showEditor(): void {
    if (!this.noteData) {
      return;
    }

    const container = this.element.querySelector('.note-detail__editor-container');
    if (!container) {
      return;
    }

    // Clear container
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    this.editor = new NoteEditor(container as HTMLElement, this.notesApi, this.noteId);
    this.editor.update(this.noteData);
    container.appendChild(this.editor.render());

    // Listen for editor events
    container.addEventListener('editor:updated', () => {
      this.loadNote(); // Reload note after update
    });

    container.addEventListener('editor:cancel', () => {
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    });
  }

  private showStatusUpdater(): void {
    if (!this.noteData) {
      return;
    }

    const container = this.element.querySelector('.note-detail__status-container');
    if (!container) {
      return;
    }

    // Clear container
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    this.statusUpdater = new StatusUpdater(
      container as HTMLElement,
      this.notesApi,
      this.noteId,
      this.noteData.frontmatter.status as NoteStatus
    );
    container.appendChild(this.statusUpdater.render());

    // Listen for status update events
    container.addEventListener('status:updated', () => {
      this.loadNote(); // Reload note after status update
    });

    container.addEventListener('status:cancel', () => {
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    });
  }

  private handleError(error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  }): void {
    this.loading = false;
    ApiErrorHandler.handle(error);

    // Clear existing content
    while (this.element.firstChild) {
      this.element.removeChild(this.element.firstChild);
    }

    // Render error state
    const errorDiv = document.createElement('div');
    errorDiv.className = 'note-detail__error';
    errorDiv.setAttribute('role', 'alert');
    errorDiv.innerHTML = `
      <p>Error loading note: ${this.escapeHtml(error.message)}</p>
      <button type="button" class="retry-button">Retry</button>
    `;

    const retryButton = errorDiv.querySelector('.retry-button') as HTMLButtonElement;
    if (retryButton) {
      retryButton.addEventListener('click', () => {
        this.loadNote();
      });
    }

    this.element.appendChild(errorDiv);
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
