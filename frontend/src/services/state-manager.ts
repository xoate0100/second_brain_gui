/**
 * State Manager Service
 * Lightweight state management for the Review GUI Frontend
 */

export interface AppState {
  currentView: 'queue' | 'detail' | 'suggestions';
  selectedNoteId: string | null;
  selectedItemIds: Set<string>;
  filters: Record<string, unknown>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  } | null;
}

type StateListener = (state: AppState) => void;

/**
 * StateManager - Simple state management without external libraries
 */
export class StateManager {
  private state: AppState;
  private listeners: Set<StateListener> = new Set();

  constructor(initialState?: Partial<AppState>) {
    this.state = {
      currentView: 'queue',
      selectedNoteId: null,
      selectedItemIds: new Set(),
      filters: {},
      pagination: null,
      ...initialState,
    };
  }

  /**
   * Get current state
   */
  getState(): AppState {
    return { ...this.state };
  }

  /**
   * Update state and notify listeners
   */
  setState(updates: Partial<AppState>): void {
    this.state = {
      ...this.state,
      ...updates,
    };
    this.notifyListeners();
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    const currentState = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(currentState);
      } catch (error) {
        console.error('[StateManager] Error in listener:', error);
      }
    });
  }

  /**
   * Navigate to a view
   */
  navigateTo(view: AppState['currentView'], noteId?: string): void {
    this.setState({
      currentView: view,
      selectedNoteId: noteId || null,
    });
  }

  /**
   * Select an item
   */
  selectItem(itemId: string): void {
    const newSelected = new Set(this.state.selectedItemIds);
    newSelected.add(itemId);
    this.setState({ selectedItemIds: newSelected });
  }

  /**
   * Deselect an item
   */
  deselectItem(itemId: string): void {
    const newSelected = new Set(this.state.selectedItemIds);
    newSelected.delete(itemId);
    this.setState({ selectedItemIds: newSelected });
  }

  /**
   * Select all items
   */
  selectAll(itemIds: string[]): void {
    this.setState({ selectedItemIds: new Set(itemIds) });
  }

  /**
   * Deselect all items
   */
  deselectAll(): void {
    this.setState({ selectedItemIds: new Set() });
  }

  /**
   * Update filters
   */
  updateFilters(filters: Record<string, unknown>): void {
    this.setState({ filters });
  }

  /**
   * Update pagination
   */
  updatePagination(pagination: AppState['pagination']): void {
    this.setState({ pagination });
  }
}
