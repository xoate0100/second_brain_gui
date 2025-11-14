/**
 * SuggestionList Component
 * Displays a list of smart suggestions for review items
 *
 * Responsibilities:
 * - Fetch suggestions from API
 * - Display list of suggestions
 * - Handle loading and error states
 * - Coordinate SuggestionItem components
 * - Emit events for suggestion actions
 *
 * SOLID Principles:
 * - SRP: Single responsibility - suggestions list display
 * - DIP: Depends on ReviewApiClient and ApiClient interfaces
 */

import { ApiComponent } from '../base/ApiComponent';
import { SuggestionItem } from './SuggestionItem';
import { ReviewApiClient } from '../../api/review-api';
import { ApiErrorHandler } from '../../api/errors';
import type { ApiClient, ApiResponse } from '../../types/api';
import type { SuggestionParams, SuggestionResponse, Suggestion } from '../../api/types';

export class SuggestionList extends ApiComponent {
  private reviewApi: ReviewApiClient;
  private suggestions: Suggestion[] = [];
  private items: SuggestionItem[] = [];
  private loading = false;

  constructor(container: HTMLElement, reviewApi: ReviewApiClient, apiClient: ApiClient) {
    super(container, apiClient);
    this.reviewApi = reviewApi;
  }

  render(): HTMLElement {
    const list = document.createElement('div');
    list.className = 'suggestion-list';
    list.setAttribute('role', 'main');
    list.setAttribute('aria-label', 'Smart suggestions');

    if (this.loading) {
      list.innerHTML = '<div class="suggestion-list__loading">Loading suggestions...</div>';
      return list;
    }

    if (this.suggestions.length === 0) {
      list.innerHTML = '<div class="suggestion-list__empty">No suggestions available</div>';
      return list;
    }

    const listContainer = document.createElement('div');
    listContainer.className = 'suggestion-list__items';

    // Clear existing items
    this.items = [];

    // Create SuggestionItem for each suggestion
    this.suggestions.forEach((suggestion) => {
      const itemContainer = document.createElement('div');
      listContainer.appendChild(itemContainer);

      const item = new SuggestionItem(itemContainer, suggestion);
      const itemElement = item.render();
      itemContainer.appendChild(itemElement);

      // Listen for item events and forward them
      itemElement.addEventListener('suggestion:apply', ((e: CustomEvent) => {
        this.emit('suggestion:apply', { suggestion: e.detail.suggestion });
      }) as EventListener);

      itemElement.addEventListener('suggestion:dismiss', ((e: CustomEvent) => {
        this.emit('suggestion:dismiss', { note_id: e.detail.note_id });
      }) as EventListener);

      this.items.push(item);
    });

    list.appendChild(listContainer);
    return list;
  }

  update(data: unknown): void {
    if (this.isSuggestionResponse(data)) {
      this.suggestions = data.suggestions;
      // Re-render if element exists
      const existing = this.element.querySelector('.suggestion-list');
      if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
        this.element.appendChild(this.render());
      }
    }
  }

  /**
   * Load suggestions from API
   */
  async loadSuggestions(params: SuggestionParams = {}): Promise<void> {
    this.loading = true;
    this.render();

    try {
      const response: ApiResponse<SuggestionResponse> = await this.reviewApi.getSuggestions(params);

      this.loading = false;

      if (!response.success || !response.data) {
        const error = response.error || {
          code: 'UNKNOWN_ERROR',
          message: 'Failed to load suggestions',
          details: {},
        };
        ApiErrorHandler.handle(error);
        this.emit('suggestion:error', { error });
        this.suggestions = [];
        this.render();
        return;
      }

      this.suggestions = response.data.suggestions;
      this.render();
    } catch (error) {
      this.loading = false;
      const apiError = {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Network error',
        details: {},
      };
      ApiErrorHandler.handle(apiError);
      this.emit('suggestion:error', { error: apiError });
      this.suggestions = [];
      this.render();
    }
  }

  private isSuggestionResponse(data: unknown): data is SuggestionResponse {
    return (
      typeof data === 'object' &&
      data !== null &&
      'suggestions' in data &&
      Array.isArray((data as SuggestionResponse).suggestions)
    );
  }
}

