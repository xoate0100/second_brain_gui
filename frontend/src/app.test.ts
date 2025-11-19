/**
 * App Tests
 * Tests for main application class
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { App } from './app';
import { ApiClientImpl } from './api/client';

// Mock the API clients
vi.mock('./api/client');
vi.mock('./api/review-api');
vi.mock('./api/notes-api');

describe('App', () => {
  let container: HTMLElement;
  let app: App;
  const config = {
    apiBaseUrl: 'http://localhost:8000',
    apiKey: 'test-api-key',
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    app = new App(container, config);
  });

  afterEach(() => {
    if (app) {
      app.destroy();
    }
    if (container.parentNode) {
      container.remove();
    }
  });

  describe('initialization', () => {
    it('should initialize with queue view', () => {
      const state = app.getState();
      expect(state.currentView).toBe('queue');
      expect(container.querySelector('.app-view--queue')).toBeTruthy();
    });

    it('should create API clients', () => {
      expect(ApiClientImpl).toHaveBeenCalledWith(config.apiBaseUrl, config.apiKey, undefined);
    });
  });

  describe('navigation', () => {
    it('should navigate to detail view', () => {
      app.navigateTo('detail', 'note-123');
      const state = app.getState();
      expect(state.currentView).toBe('detail');
      expect(state.selectedNoteId).toBe('note-123');
    });

    it('should navigate back to queue', () => {
      app.navigateTo('detail', 'note-123');
      app.navigateTo('queue');
      const state = app.getState();
      expect(state.currentView).toBe('queue');
      expect(state.selectedNoteId).toBeNull();
    });

    it('should render detail view when navigating', () => {
      app.navigateTo('detail', 'note-123');
      expect(container.querySelector('.app-view--detail')).toBeTruthy();
      expect(container.querySelector('.app-back-button')).toBeTruthy();
    });
  });

  describe('render', () => {
    it('should render queue view by default', () => {
      expect(container.querySelector('.app-view--queue')).toBeTruthy();
    });

    it('should render detail view when state is detail', () => {
      app.navigateTo('detail', 'note-123');
      expect(container.querySelector('.app-view--detail')).toBeTruthy();
    });

    it('should fallback to queue if detail view has no note ID', () => {
      // Access private stateManager for testing
      type AppWithStateManager = {
        stateManager: {
          setState: (updates: { currentView: string; selectedNoteId: null }) => void;
        };
      };
      const stateManager = (app as unknown as AppWithStateManager).stateManager;
      stateManager.setState({ currentView: 'detail', selectedNoteId: null });
      app.render();
      expect(container.querySelector('.app-view--queue')).toBeTruthy();
    });
  });

  describe('back button', () => {
    it('should navigate back to queue when back button clicked', () => {
      app.navigateTo('detail', 'note-123');
      const backButton = container.querySelector('.app-back-button') as HTMLButtonElement;
      backButton.click();
      const state = app.getState();
      expect(state.currentView).toBe('queue');
    });
  });

  describe('destroy', () => {
    it('should cleanup resources', () => {
      app.navigateTo('detail', 'note-123');
      app.destroy();
      expect(container.children.length).toBe(0);
    });
  });
});
