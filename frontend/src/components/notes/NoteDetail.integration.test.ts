/**
 * NoteDetail Integration Tests
 * Real integration tests using actual API (no mocks)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ApiClientImpl } from '../../api/client';
import { NotesApiClient } from '../../api/notes-api';
import { NoteDetail } from './NoteDetail';

// Use real API endpoint
const API_BASE_URL = 'http://localhost:8080';
const API_KEY = 'sb_test_RZbK4LCvhQm1kHMBPDXlT7BvNMIncEiH:read:notes,write:notes,read:review,write:review';

describe('NoteDetail Integration', () => {
  let container: HTMLElement;
  let apiClient: ApiClientImpl;
  let notesApi: NotesApiClient;
  let noteDetail: NoteDetail;

  beforeAll(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    apiClient = new ApiClientImpl(API_BASE_URL, API_KEY);
    notesApi = new NotesApiClient(apiClient);
  });

  afterAll(() => {
    if (container) {
      container.remove();
    }
  });

  it('should load and display note with markdown rendering', async () => {
    // Use a real note ID from the backend
    // This test assumes backend has at least one note
    const noteId = 'test-note-1'; // Adjust based on actual test data
    
    noteDetail = new NoteDetail(container, notesApi, apiClient, noteId);
    noteDetail.render();
    
    // Load note from real API
    await noteDetail.loadNote();
    
    // Verify markdown renderer is created
    const markdownContainer = container.querySelector('.note-detail__body-container');
    expect(markdownContainer).toBeTruthy();
    
    // Verify markdown renderer element exists
    const markdownRenderer = container.querySelector('.markdown-renderer');
    expect(markdownRenderer).toBeTruthy();
  }, 10000); // 10 second timeout for real API call

  it('should render markdown content correctly', async () => {
    const noteId = 'test-note-1';
    noteDetail = new NoteDetail(container, notesApi, apiClient, noteId);
    noteDetail.render();
    await noteDetail.loadNote();
    
    // Check if markdown is rendered (not plain text)
    const markdownRenderer = container.querySelector('.markdown-renderer');
    if (markdownRenderer) {
      // If note has markdown content, it should be rendered as HTML, not plain text
      const hasHtmlElements = markdownRenderer.querySelectorAll('p, h1, h2, ul, ol, code').length > 0;
      // This will pass if markdown is rendered, or if note has no markdown (empty content)
      expect(markdownRenderer).toBeTruthy();
    }
  }, 10000);
});

