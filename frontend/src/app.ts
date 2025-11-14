/**
 * Main Application Class
 * Coordinates all components and manages application lifecycle
 */

import { ApiClientImpl } from './api/client';
import { ReviewApiClient } from './api/review-api';
import { NotesApiClient } from './api/notes-api';
import { ReviewQueue } from './components/review/ReviewQueue';
import { NoteDetail } from './components/notes/NoteDetail';
import { StateManager, type AppState } from './services/state-manager';
import type { ApiClient } from './types/api';

export interface AppConfig {
  apiBaseUrl: string;
  apiKey: string;
  jwtToken?: string;
}

/**
 * Main Application class
 * Coordinates components and manages application state
 */
export class App {
  private apiClient: ApiClient;
  private reviewApi: ReviewApiClient;
  private notesApi: NotesApiClient;
  private stateManager: StateManager;
  private container: HTMLElement;
  private reviewQueue: ReviewQueue | null = null;
  private noteDetail: NoteDetail | null = null;
  private currentView: HTMLElement | null = null;

  constructor(container: HTMLElement, config: AppConfig) {
    this.container = container;
    this.apiClient = new ApiClientImpl(config.apiBaseUrl, config.apiKey, config.jwtToken);
    this.reviewApi = new ReviewApiClient(this.apiClient);
    this.notesApi = new NotesApiClient(this.apiClient);
    this.stateManager = new StateManager();

    // Subscribe to state changes
    this.stateManager.subscribe((state) => {
      this.handleStateChange(state);
    });

    // Initialize with queue view
    this.render();
  }

  /**
   * Render the application based on current state
   */
  render(): void {
    const state = this.stateManager.getState();

    // Clear container
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }

    // Render based on current view
    switch (state.currentView) {
      case 'queue':
        this.renderQueueView();
        break;
      case 'detail':
        if (state.selectedNoteId) {
          this.renderDetailView(state.selectedNoteId);
        } else {
          // Fallback to queue if no note ID
          this.stateManager.navigateTo('queue');
        }
        break;
      case 'suggestions':
        // TODO: Implement suggestions view in future task
        this.renderQueueView();
        break;
      default:
        this.renderQueueView();
    }
  }

  /**
   * Render the review queue view
   */
  private renderQueueView(): void {
    const queueContainer = document.createElement('div');
    queueContainer.className = 'app-view app-view--queue';
    this.container.appendChild(queueContainer);

    this.reviewQueue = new ReviewQueue(queueContainer, this.reviewApi, this.apiClient);
    this.reviewQueue.render();

    // Listen for item selection events
    queueContainer.addEventListener('item:select', ((e: CustomEvent) => {
      const { note_id } = e.detail;
      this.stateManager.navigateTo('detail', note_id);
    }) as EventListener);

    // Listen for selection changes
    queueContainer.addEventListener('selection:change', ((e: CustomEvent) => {
      const { selected } = e.detail;
      const selectedIds = selected.map((item: { note_id: string }) => item.note_id);
      this.stateManager.selectAll(selectedIds);
    }) as EventListener);

    // Load initial queue
    this.reviewQueue.loadQueue();

    this.currentView = queueContainer;
  }

  /**
   * Render the note detail view
   */
  private renderDetailView(noteId: string): void {
    const detailContainer = document.createElement('div');
    detailContainer.className = 'app-view app-view--detail';
    this.container.appendChild(detailContainer);

    // Add back button
    const backButton = document.createElement('button');
    backButton.className = 'app-back-button';
    backButton.textContent = '← Back to Queue';
    backButton.setAttribute('aria-label', 'Back to review queue');
    backButton.addEventListener('click', () => {
      this.stateManager.navigateTo('queue');
    });
    detailContainer.appendChild(backButton);

    const detailContent = document.createElement('div');
    detailContent.className = 'app-detail-content';
    detailContainer.appendChild(detailContent);

    this.noteDetail = new NoteDetail(detailContent, this.notesApi, this.apiClient, noteId);
    this.noteDetail.render();

    // Load note data
    this.noteDetail.loadNote();

    // Listen for note updates
    detailContent.addEventListener('note:updated', () => {
      // Optionally refresh queue if we go back
    });

    detailContent.addEventListener('note:status-updated', () => {
      // Optionally refresh queue if we go back
    });

    this.currentView = detailContainer;
  }

  /**
   * Handle state changes
   */
  private handleStateChange(state: AppState): void {
    // Re-render if view changed
    if (this.currentView?.className !== `app-view app-view--${state.currentView}`) {
      this.render();
    }
  }

  /**
   * Get current state
   */
  getState(): AppState {
    return this.stateManager.getState();
  }

  /**
   * Navigate to a view
   */
  navigateTo(view: AppState['currentView'], noteId?: string): void {
    this.stateManager.navigateTo(view, noteId);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.reviewQueue) {
      this.reviewQueue.destroy();
    }
    if (this.noteDetail) {
      this.noteDetail.destroy();
    }
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
  }
}

