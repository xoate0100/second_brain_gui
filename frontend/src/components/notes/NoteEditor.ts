/**
 * NoteEditor Component
 * Form component for editing note metadata
 *
 * Responsibilities:
 * - Display and edit note metadata fields
 * - Submit metadata updates via API
 * - Emit events for updates
 *
 * SOLID Principles:
 * - SRP: Single responsibility - note metadata editing
 * - DIP: Depends on NotesApiClient interface
 */

import { ValidatedComponent } from '../base/ValidatedComponent';
import { NotesApiClient } from '../../api/notes-api';
import { ApiErrorHandler } from '../../api/errors';
import type { NoteDetailResponse, NoteUpdateRequest, NoteUpdateResponse } from '../../api/types';
import type { ApiResponse } from '../../types/api';

export class NoteEditor extends ValidatedComponent {
  private notesApi: NotesApiClient;
  private noteId: string;
  private noteData: NoteDetailResponse | null = null;

  constructor(container: HTMLElement, notesApi: NotesApiClient, noteId: string) {
    super(container);
    this.notesApi = notesApi;
    this.noteId = noteId;
  }

  render(): HTMLElement {
    const form = document.createElement('form');
    form.className = 'note-editor';
    form.setAttribute('role', 'form');
    form.setAttribute('aria-label', 'Edit note metadata');

    const frontmatter = this.noteData?.frontmatter || {
      id: '',
      title: '',
      status: '',
      venture: '',
      domain: '',
      tags: [],
      ai_summary: '',
      momentum_score: 0,
      age_days: 0,
      aging_stage: '',
    };

    form.innerHTML = `
      <div class="note-editor__field">
        <label for="venture">Venture</label>
        <select id="venture" name="venture" aria-label="Venture">
          <option value="SWS" ${frontmatter.venture === 'SWS' ? 'selected' : ''}>SWS</option>
          <option value="CRL" ${frontmatter.venture === 'CRL' ? 'selected' : ''}>CRL</option>
          <option value="ERA" ${frontmatter.venture === 'ERA' ? 'selected' : ''}>ERA</option>
          <option value="SAE" ${frontmatter.venture === 'SAE' ? 'selected' : ''}>SAE</option>
          <option value="Personal"
                  ${frontmatter.venture === 'Personal' ? 'selected' : ''}>
            Personal
          </option>
        </select>
      </div>
      <div class="note-editor__field">
        <label for="domain">Domain</label>
        <input type="text" id="domain" name="domain"
               value="${this.escapeHtml(frontmatter.domain || '')}"
               aria-label="Domain">
      </div>
      <div class="note-editor__field">
        <label for="tags">Tags (comma-separated)</label>
        <input type="text" id="tags" name="tags"
               value="${this.escapeHtml((frontmatter.tags || []).join(', '))}"
               aria-label="Tags">
      </div>
      <div class="note-editor__field">
        <label for="first-action">First Action</label>
        <input type="text" id="first-action" name="first_action"
               value="${this.escapeHtml(frontmatter.first_action || '')}"
               aria-label="First action">
      </div>
      <div class="note-editor__field">
        <label for="effort-estimate">Effort Estimate (min)</label>
        <input type="number" id="effort-estimate" name="effort_estimate_min"
               value="${frontmatter.effort_estimate_min || ''}"
               min="0" aria-label="Effort estimate in minutes">
      </div>
      <div class="note-editor__field">
        <label for="resume-hint">Resume Hint</label>
        <textarea id="resume-hint" name="resume_hint" rows="2"
                  aria-label="Resume hint">
          ${this.escapeHtml(frontmatter.resume_hint || '')}
        </textarea>
      </div>
      <div class="note-editor__actions">
        <button type="submit" class="btn btn--primary">Save Changes</button>
        <button type="button" class="btn btn--secondary">Cancel</button>
      </div>
      <div class="note-editor__validation" role="alert" aria-live="polite"></div>
    `;

    // Add form submit handler
    form.addEventListener('submit', async (e: Event) => {
      e.preventDefault();
      await this.handleSubmit(form);
    });

    // Add cancel handler
    const cancelButton = form.querySelector('.cancel-button') as HTMLButtonElement;
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        this.emit('editor:cancel', {});
      });
    }

    return form;
  }

  update(data: unknown): void {
    if (this.isNoteDetailResponse(data)) {
      this.noteData = data;
      // Re-render if form exists
      const existing = this.element.querySelector('form');
      if (existing) {
        existing.remove();
        this.element.appendChild(this.render());
      }
    }
  }

  async submitUpdate(request: NoteUpdateRequest): Promise<void> {
    try {
      const response: ApiResponse<NoteUpdateResponse> = await this.notesApi.updateNote(
        this.noteId,
        request
      );

      if (!response.success || !response.data) {
        const error = response.error || {
          code: 'UNKNOWN_ERROR',
          message: 'Failed to update note',
          details: {},
        };
        ApiErrorHandler.handle(error);
        this.emit('editor:error', { error });
        return;
      }

      this.emit('editor:updated', {
        note_id: response.data.note_id,
        updated_fields: response.data.updated_fields,
        updated_at: response.data.updated_at,
      });
    } catch (error) {
      const apiError = {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Network error',
        details: {},
      };
      ApiErrorHandler.handle(apiError);
      this.emit('editor:error', { error: apiError });
    }
  }

  private async handleSubmit(form: HTMLFormElement): Promise<void> {
    const formData = new FormData(form);
    const request: NoteUpdateRequest = {};

    const venture = formData.get('venture') as string;
    if (venture) {
      request.venture = venture;
    }

    const domain = formData.get('domain') as string;
    if (domain) {
      request.domain = domain;
    }

    const tags = formData.get('tags') as string;
    if (tags) {
      request.tags = tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
    }

    const firstAction = formData.get('first_action') as string;
    if (firstAction) {
      request.first_action = firstAction;
    }

    const effortEstimate = formData.get('effort_estimate_min') as string;
    if (effortEstimate) {
      request.effort_estimate_min = parseInt(effortEstimate, 10);
    }

    const resumeHint = formData.get('resume_hint') as string;
    if (resumeHint) {
      request.resume_hint = resumeHint;
    }

    await this.submitUpdate(request);
  }

  protected getValidationRules(): Record<string, (value: unknown) => string | null> {
    return {
      domain: (value: unknown): string | null => {
        if (value && typeof value === 'string' && value.length > 100) {
          return 'Domain must be 100 characters or less';
        }
        return null;
      },
      effort_estimate_min: (value: unknown): string | null => {
        if (value && (typeof value !== 'string' || isNaN(parseInt(value, 10)))) {
          return 'Effort estimate must be a number';
        }
        return null;
      },
    };
  }

  protected validateForm(_form: HTMLFormElement): boolean {
    return this.validateAll();
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private isNoteDetailResponse(data: unknown): data is NoteDetailResponse {
    return (
      typeof data === 'object' &&
      data !== null &&
      'note_id' in data &&
      'frontmatter' in data &&
      'body' in data
    );
  }
}
