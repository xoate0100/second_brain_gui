/**
 * NoteBodyEditor Component Tests
 * Tests for markdown/rich text editor for note body
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NoteBodyEditor } from './NoteBodyEditor';
import { NotesApiClient } from '../../api/notes-api';
import { ApiClientImpl } from '../../api/client';

describe('NoteBodyEditor', () => {
  let container: HTMLElement;
  let notesApi: NotesApiClient;
  let apiClient: ApiClientImpl;
  let editor: NoteBodyEditor;
  const noteId = 'test-note-123';
  const initialBody = '# Heading\n\nThis is **bold** text.';

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    apiClient = new ApiClientImpl('http://localhost:8080', 'test-api-key');
    notesApi = new NotesApiClient(apiClient);
    editor = new NoteBodyEditor(container, notesApi, noteId);
  });

  afterEach(() => {
    if (container.parentNode) {
      container.remove();
    }
  });

  it('should render editor component', () => {
    const element = editor.render();
    expect(element).toBeTruthy();
    expect(element.className).toContain('note-body-editor');
  });

  it('should initialize with note body content', () => {
    editor.update(initialBody);
    const element = editor.render();
    expect(element).toBeTruthy();
    // Editor should contain the initial content
    const editorContent = element.querySelector('.note-body-editor__editor');
    expect(editorContent).toBeTruthy();
  });

  it('should allow editing markdown content', () => {
    editor.update(initialBody);
    const element = editor.render();
    const editorElement = element.querySelector('.note-body-editor__editor') as HTMLElement;
    expect(editorElement).toBeTruthy();
    // Editor should be editable
    expect(editorElement.getAttribute('contenteditable')).toBe('true');
  });

  it('should emit save event when save button is clicked', async () => {
    editor.update(initialBody);
    const element = editor.render();
    
    let saveEmitted = false;
    element.addEventListener('editor:save', () => {
      saveEmitted = true;
    });

    const saveButton = element.querySelector('.note-body-editor__save') as HTMLButtonElement;
    expect(saveButton).toBeTruthy();
    
    // Mock API call
    vi.spyOn(notesApi, 'updateNote').mockResolvedValue({
      success: true,
      data: {
        note_id: noteId,
        file_path: '/path/to/note.md',
        frontmatter: {} as any,
        body: initialBody,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    });

    saveButton.click();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(saveEmitted).toBe(true);
  });

  it('should emit cancel event when cancel button is clicked', () => {
    editor.update(initialBody);
    const element = editor.render();
    
    let cancelEmitted = false;
    element.addEventListener('editor:cancel', () => {
      cancelEmitted = true;
    });

    const cancelButton = element.querySelector('.note-body-editor__cancel') as HTMLButtonElement;
    expect(cancelButton).toBeTruthy();
    cancelButton.click();
    
    expect(cancelEmitted).toBe(true);
  });

  it('should save content on Ctrl+S keyboard shortcut', async () => {
    editor.update(initialBody);
    const element = editor.render();
    
    let saveEmitted = false;
    element.addEventListener('editor:save', () => {
      saveEmitted = true;
    });

    const editorElement = element.querySelector('.note-body-editor__editor') as HTMLElement;
    
    // Mock API call
    vi.spyOn(notesApi, 'updateNote').mockResolvedValue({
      success: true,
      data: {
        note_id: noteId,
        file_path: '/path/to/note.md',
        frontmatter: {} as any,
        body: initialBody,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    });

    // Simulate Ctrl+S
    const ctrlS = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true,
    });
    editorElement.dispatchEvent(ctrlS);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(saveEmitted).toBe(true);
  });

  it('should cancel editing on Esc keyboard shortcut', () => {
    editor.update(initialBody);
    const element = editor.render();
    
    let cancelEmitted = false;
    element.addEventListener('editor:cancel', () => {
      cancelEmitted = true;
    });

    const editorElement = element.querySelector('.note-body-editor__editor') as HTMLElement;
    
    // Simulate Esc
    const esc = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
    });
    editorElement.dispatchEvent(esc);
    
    expect(cancelEmitted).toBe(true);
  });

  it('should show loading state while saving', async () => {
    editor.update(initialBody);
    const element = editor.render();
    
    // Mock slow API call
    vi.spyOn(notesApi, 'updateNote').mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        success: true,
        data: {
          note_id: noteId,
          file_path: '/path/to/note.md',
          frontmatter: {} as any,
          body: initialBody,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      }), 100))
    );

    const saveButton = element.querySelector('.note-body-editor__save') as HTMLButtonElement;
    saveButton.click();
    
    // Check for loading state
    const loadingIndicator = element.querySelector('.note-body-editor__loading');
    expect(loadingIndicator).toBeTruthy();
    
    await new Promise(resolve => setTimeout(resolve, 150));
  });

  it('should handle save errors gracefully', async () => {
    editor.update(initialBody);
    const element = editor.render();
    
    let errorEmitted = false;
    element.addEventListener('editor:error', () => {
      errorEmitted = true;
    });

    // Mock API error
    vi.spyOn(notesApi, 'updateNote').mockResolvedValue({
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Failed to save',
        details: {},
      },
    });

    const saveButton = element.querySelector('.note-body-editor__save') as HTMLButtonElement;
    saveButton.click();
    
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(errorEmitted).toBe(true);
  });

  it('should provide syntax highlighting for markdown', () => {
    editor.update(initialBody);
    const element = editor.render();
    const editorElement = element.querySelector('.note-body-editor__editor');
    expect(editorElement).toBeTruthy();
    // CodeMirror should add syntax highlighting classes
    expect(element.querySelector('.cm-editor')).toBeTruthy();
  });
});

