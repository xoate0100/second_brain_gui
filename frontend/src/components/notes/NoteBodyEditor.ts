/**
 * NoteBodyEditor Component
 * Rich text/markdown editor for note body content
 *
 * Responsibilities:
 * - Provide markdown editing interface
 * - Handle save/cancel actions
 * - Support keyboard shortcuts (Ctrl+S, Esc)
 * - Provide syntax highlighting (CodeMirror integration - TODO: enhance)
 *
 * SOLID Principles:
 * - SRP: Single responsibility - note body editing only
 * - DIP: Depends on NotesApiClient interface
 */

import { Component } from '../base/Component';
import { NotesApiClient } from '../../api/notes-api';
import { ToastManager } from '../../services/ToastManager';

export class NoteBodyEditor extends Component {
  private notesApi: NotesApiClient;
  private noteId: string;
  private content: string = '';
  private editorElement: HTMLTextAreaElement | null = null;
  private saving: boolean = false;

  constructor(container: HTMLElement, notesApi: NotesApiClient, noteId: string) {
    super(container);
    this.notesApi = notesApi;
    this.noteId = noteId;
  }

  render(): HTMLElement {
    const editorContainer = document.createElement('div');
    editorContainer.className = 'note-body-editor';

    editorContainer.innerHTML = `
      <div class="note-body-editor__header">
        <h3>Edit Note Body</h3>
      </div>
      <div class="note-body-editor__editor-container">
        <textarea class="note-body-editor__editor cm-editor" contenteditable="true"></textarea>
      </div>
      <div class="note-body-editor__loading" style="display: none;">Saving...</div>
      <div class="note-body-editor__actions">
        <button type="button" class="note-body-editor__save">Save</button>
        <button type="button" class="note-body-editor__cancel">Cancel</button>
      </div>
    `;

    this.element = editorContainer;
    this.setupEventListeners();
    this.initializeEditor();

    return editorContainer;
  }

  update(data: string): void {
    this.content = data || '';
    if (this.editorElement) {
      this.editorElement.value = this.content;
    }
  }

  private initializeEditor(): void {
    this.editorElement = this.element.querySelector('.note-body-editor__editor') as HTMLTextAreaElement;
    if (!this.editorElement) {
      return;
    }

    this.editorElement.value = this.content;

    // Add keyboard shortcuts
    this.editorElement.addEventListener('keydown', (e: KeyboardEvent) => {
      // Ctrl+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.handleSave();
      }
      // Esc to cancel
      if (e.key === 'Escape') {
        this.handleCancel();
      }
    });

    // Update content on input
    this.editorElement.addEventListener('input', () => {
      if (this.editorElement) {
        this.content = this.editorElement.value;
      }
    });
  }

  private setupEventListeners(): void {
    const saveButton = this.element.querySelector('.note-body-editor__save') as HTMLButtonElement;
    const cancelButton = this.element.querySelector('.note-body-editor__cancel') as HTMLButtonElement;

    if (saveButton) {
      saveButton.addEventListener('click', () => this.handleSave());
    }

    if (cancelButton) {
      cancelButton.addEventListener('click', () => this.handleCancel());
    }
  }

  private async handleSave(): Promise<void> {
    if (this.saving) {
      return;
    }

    this.saving = true;
    const loadingIndicator = this.element.querySelector('.note-body-editor__loading') as HTMLElement;
    if (loadingIndicator) {
      loadingIndicator.style.display = 'block';
    }

    try {
      const response = await this.notesApi.updateNote(this.noteId, {
        body: this.content,
      });

      if (response.success) {
        ToastManager.getInstance().success('Note body saved successfully');
        this.emit('editor:save', { content: this.content });
      } else {
        const errorMessage = response.error?.message || 'Failed to save';
        ToastManager.getInstance().error(errorMessage);
        this.emit('editor:error', {
          code: response.error?.code || 'UNKNOWN_ERROR',
          message: errorMessage,
        });
      }
    } catch (error) {
      this.emit('editor:error', {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to save',
      });
    } finally {
      this.saving = false;
      if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
      }
    }
  }

  private handleCancel(): void {
    this.emit('editor:cancel', {});
  }

  /**
   * Get current editor content
   */
  getContent(): string {
    return this.content;
  }

  /**
   * Destroy editor and clean up
   */
  destroy(): void {
    if (this.editorView) {
      this.editorView.destroy();
      this.editorView = null;
    }
    super.destroy();
  }
}

