/**
 * State Manager Tests
 * Tests for state management service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { StateManager, type AppState } from './state-manager';

describe('StateManager', () => {
  let stateManager: StateManager;

  beforeEach(() => {
    stateManager = new StateManager();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const state = stateManager.getState();
      expect(state.currentView).toBe('queue');
      expect(state.selectedNoteId).toBeNull();
      expect(state.selectedItemIds.size).toBe(0);
      expect(state.filters).toEqual({});
      expect(state.pagination).toBeNull();
    });

    it('should initialize with custom state', () => {
      const customState = new StateManager({
        currentView: 'detail',
        selectedNoteId: 'note-123',
      });
      const state = customState.getState();
      expect(state.currentView).toBe('detail');
      expect(state.selectedNoteId).toBe('note-123');
    });
  });

  describe('setState', () => {
    it('should update state', () => {
      stateManager.setState({ currentView: 'detail' });
      const state = stateManager.getState();
      expect(state.currentView).toBe('detail');
    });

    it('should merge state updates', () => {
      stateManager.setState({ currentView: 'detail' });
      stateManager.setState({ selectedNoteId: 'note-123' });
      const state = stateManager.getState();
      expect(state.currentView).toBe('detail');
      expect(state.selectedNoteId).toBe('note-123');
    });
  });

  describe('subscribe', () => {
    it('should notify listeners on state change', () => {
      let notifiedState: AppState | null = null;
      const unsubscribe = stateManager.subscribe((state: AppState) => {
        notifiedState = state;
      });

      stateManager.setState({ currentView: 'detail' });

      expect(notifiedState).not.toBeNull();
      expect(notifiedState).toBeTruthy();
      // TypeScript control flow analysis - use type assertion after null check
      if (notifiedState !== null) {
        const state = notifiedState as AppState;
        expect(state.currentView).toBe('detail');
      } else {
        throw new Error('State should not be null');
      }

      unsubscribe();
    });

    it('should allow unsubscribing', () => {
      let callCount = 0;
      const unsubscribe = stateManager.subscribe(() => {
        callCount++;
      });

      stateManager.setState({ currentView: 'detail' });
      expect(callCount).toBe(1);

      unsubscribe();
      stateManager.setState({ currentView: 'queue' });
      expect(callCount).toBe(1); // Should not increment
    });

    it('should handle listener errors gracefully', () => {
      const unsubscribe = stateManager.subscribe(() => {
        throw new Error('Listener error');
      });

      // Should not throw
      expect(() => {
        stateManager.setState({ currentView: 'detail' });
      }).not.toThrow();

      unsubscribe();
    });
  });

  describe('navigation', () => {
    it('should navigate to a view', () => {
      stateManager.navigateTo('detail', 'note-123');
      const state = stateManager.getState();
      expect(state.currentView).toBe('detail');
      expect(state.selectedNoteId).toBe('note-123');
    });

    it('should navigate without note ID', () => {
      stateManager.navigateTo('queue');
      const state = stateManager.getState();
      expect(state.currentView).toBe('queue');
      expect(state.selectedNoteId).toBeNull();
    });
  });

  describe('item selection', () => {
    it('should select an item', () => {
      stateManager.selectItem('item-1');
      const state = stateManager.getState();
      expect(state.selectedItemIds.has('item-1')).toBe(true);
    });

    it('should deselect an item', () => {
      stateManager.selectItem('item-1');
      stateManager.deselectItem('item-1');
      const state = stateManager.getState();
      expect(state.selectedItemIds.has('item-1')).toBe(false);
    });

    it('should select all items', () => {
      stateManager.selectAll(['item-1', 'item-2', 'item-3']);
      const state = stateManager.getState();
      expect(state.selectedItemIds.size).toBe(3);
      expect(state.selectedItemIds.has('item-1')).toBe(true);
      expect(state.selectedItemIds.has('item-2')).toBe(true);
      expect(state.selectedItemIds.has('item-3')).toBe(true);
    });

    it('should deselect all items', () => {
      stateManager.selectAll(['item-1', 'item-2']);
      stateManager.deselectAll();
      const state = stateManager.getState();
      expect(state.selectedItemIds.size).toBe(0);
    });
  });

  describe('filters', () => {
    it('should update filters', () => {
      stateManager.updateFilters({ stage: 'unreviewed', venture: 'SWS' });
      const state = stateManager.getState();
      expect(state.filters).toEqual({ stage: 'unreviewed', venture: 'SWS' });
    });
  });

  describe('pagination', () => {
    it('should update pagination', () => {
      const pagination = {
        page: 2,
        pageSize: 20,
        total: 100,
      };
      stateManager.updatePagination(pagination);
      const state = stateManager.getState();
      expect(state.pagination).toEqual(pagination);
    });
  });
});
