/**
 * SuggestionItem Component
 * Displays a single suggestion with apply/dismiss actions
 *
 * Responsibilities:
 * - Render individual suggestion with action, confidence, reason
 * - Handle apply and dismiss actions
 * - Emit events for user interactions
 *
 * SOLID Principles:
 * - SRP: Single responsibility - display one suggestion
 * - OCP: Extensible via Component base class
 */

import { Component } from '../base/Component';
import type { Suggestion } from '../../api/types';

export class SuggestionItem extends Component {
  private suggestionData: Suggestion;

  constructor(container: HTMLElement, suggestionData: Suggestion) {
    super(container);
    this.suggestionData = suggestionData;
  }

  render(): HTMLElement {
    const item = document.createElement('div');
    item.className = 'suggestion-item';
    item.setAttribute('data-note-id', this.suggestionData.note_id);
    item.setAttribute('data-action-type', this.suggestionData.suggested_action);
    item.setAttribute('role', 'article');
    item.setAttribute('aria-label', `Suggestion: ${this.suggestionData.suggested_action}`);

    const confidencePercent = Math.round(this.suggestionData.confidence * 100);

    item.innerHTML = `
      <div class="suggestion-item__content">
        <div class="suggestion-item__header">
          <span class="suggestion-item__action">${this.escapeHtml(this.suggestionData.suggested_action)}</span>
          <span class="suggestion-item__confidence">${confidencePercent}% confidence</span>
        </div>
        <div class="suggestion-item__summary">${this.escapeHtml(this.suggestionData.note_summary)}</div>
        <div class="suggestion-item__reason">${this.escapeHtml(this.suggestionData.reason)}</div>
      </div>
      <div class="suggestion-item__actions">
        <button type="button" class="btn btn--primary" data-action="apply"
                aria-label="Apply suggestion for ${this.suggestionData.note_id}">
          Apply
        </button>
        <button type="button" class="btn btn--secondary" data-action="dismiss"
                aria-label="Dismiss suggestion for ${this.suggestionData.note_id}">
          Dismiss
        </button>
      </div>
    `;

    // Add event listeners
    const applyButton = item.querySelector('[data-action="apply"]') as HTMLButtonElement;
    if (applyButton) {
      applyButton.addEventListener('click', () => {
        this.emit('suggestion:apply', { suggestion: this.suggestionData });
      });
    }

    const dismissButton = item.querySelector('[data-action="dismiss"]') as HTMLButtonElement;
    if (dismissButton) {
      dismissButton.addEventListener('click', () => {
        this.emit('suggestion:dismiss', { note_id: this.suggestionData.note_id });
      });
    }

    return item;
  }

  update(data: unknown): void {
    if (this.isSuggestion(data)) {
      this.suggestionData = data;
      // Re-render if element exists
      const existing = this.element.querySelector('.suggestion-item');
      if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
        this.element.appendChild(this.render());
      }
    }
  }

  protected escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private isSuggestion(data: unknown): data is Suggestion {
    return (
      typeof data === 'object' &&
      data !== null &&
      'note_id' in data &&
      'suggested_action' in data &&
      'confidence' in data &&
      'reason' in data &&
      'note_summary' in data
    );
  }
}
