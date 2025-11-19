/**
 * BatchResults Component
 * Results display modal for batch operations
 *
 * Responsibilities:
 * - Display batch operation results
 * - Show success/failure counts
 * - List individual item results
 * - Emit close events
 *
 * SOLID Principles:
 * - SRP: Single responsibility - results display
 * - OCP: Extensible via Component base class
 */

import { Component } from '../base/Component';
import type { BatchUpdateResponse, BatchUpdateResult } from '../../api/types';

export class BatchResults extends Component {
  private results: BatchUpdateResponse;

  constructor(container: HTMLElement, results: BatchUpdateResponse) {
    super(container);
    this.results = results;
  }

  render(): HTMLElement {
    const modal = document.createElement('div');
    modal.className = 'batch-results';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-label', 'Batch operation results');
    modal.setAttribute('aria-modal', 'true');

    const { total, succeeded, failed, results: itemResults } = this.results;

    modal.innerHTML = `
      <div class="batch-results__header">
        <h2>Batch Operation Results</h2>
        <button type="button" data-action="close" 
                aria-label="Close results">
          ×
        </button>
      </div>
      <div class="batch-results__summary">
        <div class="batch-results__stat">
          <span class="batch-results__stat-label">Total:</span>
          <span class="batch-results__stat-value">${total}</span>
        </div>
        <div class="batch-results__stat">
          <span class="batch-results__stat-label">Succeeded:</span>
          <span class="batch-results__stat-value batch-results__stat-value--success">${succeeded}</span>
        </div>
        <div class="batch-results__stat">
          <span class="batch-results__stat-label">Failed:</span>
          <span class="batch-results__stat-value batch-results__stat-value--error">${failed}</span>
        </div>
      </div>
      <div class="batch-results__list">
        <h3>Individual Results</h3>
        <ul>
          ${itemResults.map((result) => this.renderResultItem(result)).join('')}
        </ul>
      </div>
      <div class="batch-results__actions">
        <button type="button" class="btn btn--secondary" data-action="close">Close</button>
      </div>
    `;

    // Add close button handlers
    const closeButtons = modal.querySelectorAll('[data-action="close"]');
    closeButtons.forEach((button) => {
      button.addEventListener('click', () => {
        this.emit('results:close', {});
      });
    });

    // Close on backdrop click
    modal.addEventListener('click', (e: MouseEvent) => {
      if (e.target === modal) {
        this.emit('results:close', {});
      }
    });

    // Close on Escape key
    modal.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.emit('results:close', {});
      }
    });

    return modal;
  }

  update(data: unknown): void {
    if (this.isBatchUpdateResponse(data)) {
      this.results = data;
      // Re-render if element exists
      const existing = this.element.querySelector('.batch-results');
      if (existing) {
        existing.remove();
        this.element.appendChild(this.render());
      }
    }
  }

  private renderResultItem(result: BatchUpdateResult): string {
    const statusClass = result.success ? 'success' : 'failed';
    const statusIcon = result.success ? '✓' : '✗';
    const errorText = result.error ? ` - ${this.escapeHtml(result.error)}` : '';

    return `
      <li class="batch-results__item batch-results__item--${statusClass}">
        <span class="batch-results__icon">${statusIcon}</span>
        <span class="batch-results__note-id">${this.escapeHtml(result.note_id)}</span>
        ${errorText ? `<span class="batch-results__error">${errorText}</span>` : ''}
      </li>
    `;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private isBatchUpdateResponse(data: unknown): data is BatchUpdateResponse {
    return (
      typeof data === 'object' &&
      data !== null &&
      'total' in data &&
      'succeeded' in data &&
      'failed' in data &&
      'results' in data
    );
  }
}
