/**
 * ReviewQueue Component
 * Main review queue list component
 *
 * Responsibilities:
 * - Display paginated review queue
 * - Coordinate filters, pagination, and items
 * - Handle item selection
 * - Manage loading and error states
 *
 * SOLID Principles:
 * - SRP: Single responsibility - review queue display
 * - DIP: Depends on ReviewApiClient interface
 */

import { ApiComponent } from '../base/ApiComponent';
import { ReviewItem } from './ReviewItem';
import { ReviewFilters } from './ReviewFilters';
import { ReviewPagination } from './ReviewPagination';
import { ReviewApiClient } from '../../api/review-api';
import { ApiErrorHandler } from '../../api/errors';
import type { ApiClient, ApiResponse } from '../../types/api';
import type {
  ReviewQueueParams,
  ReviewQueueResponse,
  ReviewItem as ReviewItemType,
  Pagination,
} from '../../api/types';

export class ReviewQueue extends ApiComponent {
  private reviewApi: ReviewApiClient;
  private items: ReviewItem[] = [];
  private selectedItemIds: Set<string> = new Set();
  private currentFilters: ReviewQueueParams = {};
  private currentPagination: Pagination | null = null;
  private loading = false;

  constructor(container: HTMLElement, reviewApi: ReviewApiClient, apiClient: ApiClient) {
    super(container, apiClient);
    this.reviewApi = reviewApi;
  }

  render(): HTMLElement {
    const queue = document.createElement('div');
    queue.className = 'review-queue';
    queue.setAttribute('role', 'main');
    queue.setAttribute('aria-label', 'Review queue');

    if (this.loading) {
      queue.innerHTML = '<div class="review-queue__loading">Loading...</div>';
      return queue;
    }

    // Render filters
    const filtersContainer = document.createElement('div');
    filtersContainer.className = 'review-queue__filters';
    const filters = new ReviewFilters(filtersContainer);
    filters.setFilterValues(this.currentFilters);
    filtersContainer.appendChild(filters.render());
    queue.appendChild(filtersContainer);

    // Render items container
    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'review-queue__items';
    itemsContainer.setAttribute('role', 'list');
    itemsContainer.setAttribute('aria-label', 'Review items');

    if (this.items.length === 0) {
      // Show empty state message
      const emptyState = document.createElement('div');
      emptyState.className = 'review-queue__empty';
      emptyState.setAttribute('role', 'status');
      emptyState.setAttribute('aria-live', 'polite');
      emptyState.innerHTML = `
        <p class="review-queue__empty-message">No notes found in review queue.</p>
        <p class="review-queue__empty-hint">Try adjusting your filters or check back later.</p>
      `;
      itemsContainer.appendChild(emptyState);
    } else {
      this.items.forEach((item) => {
        const itemElement = item.render();
        itemsContainer.appendChild(itemElement);
      });
    }

    queue.appendChild(itemsContainer);

    // Render pagination
    if (this.currentPagination) {
      const paginationContainer = document.createElement('div');
      paginationContainer.className = 'review-queue__pagination';
      const pagination = new ReviewPagination(paginationContainer, this.currentPagination);
      paginationContainer.appendChild(pagination.render());
      queue.appendChild(paginationContainer);
    }

    // Add event listeners - must be set up on the queue element itself
    // since filters emit events that bubble up from filtersContainer
    this.setupEventListeners(queue, filters, itemsContainer);

    return queue;
  }

  async update(data: unknown): Promise<void> {
    if (this.isReviewQueueParams(data)) {
      this.currentFilters = { ...data };
      await this.loadQueue(this.currentFilters);
    }
  }

  async loadQueue(filters: ReviewQueueParams = {}): Promise<void> {
    this.loading = true;
    this.currentFilters = { ...filters };

    // Re-render to show loading state
    const existing = this.element.querySelector('.review-queue');
    if (existing) {
      existing.remove();
    }
    this.element.appendChild(this.render());

    try {
      const response: ApiResponse<ReviewQueueResponse> = await this.reviewApi.getQueue(filters);

      if (!response.success || !response.data) {
        const error = response.error || {
          code: 'UNKNOWN_ERROR',
          message: 'Failed to load review queue',
          details: {},
        };
        this.handleError({
          code: error.code,
          message: error.message,
          details: error.details || {},
        });
        return;
      }

      this.currentPagination = response.data.pagination;
      this.items = response.data.items.map((itemData: ReviewItemType) => {
        const itemContainer = document.createElement('div');
        const item = new ReviewItem(itemContainer, itemData);
        return item;
      });

      this.loading = false;

      // Re-render with data
      const existingQueue = this.element.querySelector('.review-queue');
      if (existingQueue) {
        existingQueue.remove();
      }
      this.element.appendChild(this.render());
    } catch (error) {
      this.loading = false;
      this.handleError({
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Network error',
        details: {},
      });
    }
  }

  getSelectedItems(): string[] {
    return Array.from(this.selectedItemIds);
  }

  clearSelection(): void {
    this.selectedItemIds.clear();
    this.items.forEach((item) => {
      if (item.isSelected()) {
        item.toggleSelection();
      }
    });
  }

  private setupEventListeners(
    queue: HTMLElement,
    _filters: ReviewFilters,
    itemsContainer: HTMLElement
  ): void {
    // Filter events - listen on the queue container (parent of filters)
    // Events from ReviewFilters will bubble up from filtersContainer
    queue.addEventListener('filter:apply', ((e: CustomEvent) => {
      e.stopPropagation(); // Prevent duplicate handling
      const filterValues = e.detail as ReviewQueueParams;
      console.log('[ReviewQueue] Filter apply event received:', filterValues);
      this.loadQueue(filterValues);
    }) as EventListener);

    queue.addEventListener('filter:reset', () => {
      console.log('[ReviewQueue] Filter reset event received');
      this.loadQueue({});
    });

    // Pagination events
    this.element.addEventListener('page:change', ((e: CustomEvent) => {
      const page = e.detail.page as number;
      const offset = this.currentPagination ? (page - 1) * this.currentPagination.page_size : 0;
      this.loadQueue({ ...this.currentFilters, offset });
    }) as EventListener);

    // Item selection events - handle checkbox selection changes
    // Navigation clicks emit 'item:select' and bubble to App
    // Checkbox changes emit 'item:selection-change' for selection state
    itemsContainer.addEventListener('item:selection-change', ((e: CustomEvent) => {
      const noteId = e.detail.note_id as string;
      const selected = e.detail.selected as boolean;

      if (selected) {
        this.selectedItemIds.add(noteId);
      } else {
        this.selectedItemIds.delete(noteId);
      }
      this.emit('selection:change', { selected: this.getSelectedItems() });
    }) as EventListener);

    // Allow 'item:select' events to bubble for navigation (handled by App)
  }

  private handleError(error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  }): void {
    this.loading = false;
    // Use ApiErrorHandler for centralized error handling
    ApiErrorHandler.handle(error);

    // Clear existing content
    while (this.element.firstChild) {
      this.element.removeChild(this.element.firstChild);
    }

    // Render error state
    const errorDiv = document.createElement('div');
    errorDiv.className = 'review-queue__error';
    errorDiv.setAttribute('role', 'alert');
    errorDiv.innerHTML = `
      <p>Error loading review queue: ${this.escapeHtml(error.message)}</p>
      <button type="button" class="retry-button">Retry</button>
    `;

    const retryButton = errorDiv.querySelector('.retry-button') as HTMLButtonElement;
    if (retryButton) {
      retryButton.addEventListener('click', () => {
        this.loadQueue(this.currentFilters);
      });
    }

    this.element.appendChild(errorDiv);
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private isReviewQueueParams(data: unknown): data is ReviewQueueParams {
    return typeof data === 'object' && data !== null;
  }
}
