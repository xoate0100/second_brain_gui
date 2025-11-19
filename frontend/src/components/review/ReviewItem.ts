/**
 * ReviewItem Component
 * Displays a single review item row
 *
 * Responsibilities:
 * - Render individual review item with all metadata
 * - Handle item selection
 * - Emit events for item interactions
 *
 * SOLID Principles:
 * - SRP: Single responsibility - display one review item
 * - OCP: Extensible via Component base class
 */

import { Component } from '../base/Component';
import type { ReviewItem as ReviewItemType } from '../../api/types';

export class ReviewItem extends Component {
  private selected = false;
  private itemData: ReviewItemType;

  constructor(container: HTMLElement, itemData: ReviewItemType) {
    super(container);
    this.itemData = itemData;
  }

  render(): HTMLElement {
    const item = document.createElement('div');
    item.className = 'review-item';
    item.setAttribute('data-note-id', this.itemData.note_id);
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', `Review item: ${this.itemData.title}`);

    if (this.selected) {
      item.classList.add('review-item--selected');
    }

    // Build review workflow indicators
    const reviewIndicators: string[] = [];
    if (this.itemData.review_stage) {
      const stageClass = `review-item__stage--${this.itemData.review_stage.replace('_', '-')}`;
      const stageLabel =
        this.itemData.review_stage === 'in_progress'
          ? 'In Progress'
          : this.itemData.review_stage === 'complete'
            ? 'Complete'
            : 'Unreviewed';
      reviewIndicators.push(
        `<span class="review-item__stage ${stageClass}" title="Review Stage: ${stageLabel}">${stageLabel}</span>`
      );
    }
    if (this.itemData.needs_review) {
      reviewIndicators.push(
        '<span class="review-item__needs-review" title="Needs Review">⚠️</span>'
      );
    }
    if (this.itemData.review_fields && this.itemData.review_fields.length > 0) {
      reviewIndicators.push(
        `<span class="review-item__fields-count" title="Fields to review: ${this.itemData.review_fields.join(', ')}">${this.itemData.review_fields.length} fields</span>`
      );
    }

    // Build ADHD-critical action hints (visible in queue)
    const actionHints: string[] = [];
    if (this.itemData.first_action) {
      actionHints.push(
        `<div class="review-item__action-hint review-item__first-action" title="First Action">
          <strong>Start:</strong> ${this.escapeHtml(this.itemData.first_action)}
        </div>`
      );
    }
    if (this.itemData.resume_hint) {
      actionHints.push(
        `<div class="review-item__action-hint review-item__resume-hint" title="Resume Hint">
          <strong>Resume:</strong> ${this.escapeHtml(this.itemData.resume_hint)}
        </div>`
      );
    }

    item.innerHTML = `
      <input type="checkbox" class="review-item__checkbox" ${this.selected ? 'checked' : ''}
             aria-label="Select ${this.itemData.title}">
      <div class="review-item__content">
        <div class="review-item__title">${this.escapeHtml(this.itemData.title)}</div>
        ${actionHints.length > 0 ? `<div class="review-item__action-hints">${actionHints.join('')}</div>` : ''}
        <div class="review-item__meta">
          <span class="review-item__meta-item">
            <strong>Venture:</strong> ${this.escapeHtml(this.itemData.venture)}
          </span>
          <span class="review-item__meta-item">
            <strong>Domain:</strong> ${this.escapeHtml(this.itemData.domain)}
          </span>
          <span class="review-item__meta-item">
            <strong>Status:</strong> ${this.escapeHtml(this.itemData.status)}
          </span>
          ${reviewIndicators.length > 0 ? `<div class="review-item__review-indicators">${reviewIndicators.join('')}</div>` : ''}
        </div>
      </div>
      <div class="review-item__scores">
        <span class="review-item__momentum">Momentum: ${this.itemData.momentum_score.toFixed(2)}</span>
        <span class="review-item__age">Age: ${this.itemData.age_days} days</span>
      </div>
    `;

    // Add click handler - navigate to detail view
    // Only trigger navigation if clicking on content area (not checkbox)
    item.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't navigate if clicking directly on checkbox
      if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') {
        return; // Let checkbox handle its own click
      }
      // Navigate to detail view - emit event that bubbles to App
      // Dispatch directly on the item element so it bubbles through the DOM
      item.dispatchEvent(
        new CustomEvent('item:select', {
          detail: { note_id: this.itemData.note_id },
          bubbles: true,
          cancelable: true,
        })
      );
    });

    // Add keyboard handler
    item.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.emit('item:select', { note_id: this.itemData.note_id });
      }
    });

    // Add checkbox handler - only for selection, not navigation
    const checkbox = item.querySelector('input[type="checkbox"]') as HTMLInputElement;
    if (checkbox) {
      checkbox.addEventListener('click', (e: MouseEvent) => {
        // Stop propagation to prevent item click handler from firing
        e.stopPropagation();
      });
      checkbox.addEventListener('change', () => {
        this.toggleSelection();
        // Emit selection change event (not item:select, which is for navigation)
        this.emit('item:selection-change', {
          note_id: this.itemData.note_id,
          selected: this.selected,
        });
      });
    }

    return item;
  }

  update(data: unknown): void {
    if (this.isReviewItem(data)) {
      this.itemData = data;
      // Re-render if element exists
      const existing = this.element.querySelector('.review-item');
      if (existing) {
        existing.remove();
        this.element.appendChild(this.render());
      }
    }
  }

  toggleSelection(): void {
    this.selected = !this.selected;
    const item = this.element.querySelector('.review-item');
    if (item) {
      if (this.selected) {
        item.classList.add('review-item--selected');
      } else {
        item.classList.remove('review-item--selected');
      }
      const checkbox = item.querySelector('input[type="checkbox"]') as HTMLInputElement;
      if (checkbox) {
        checkbox.checked = this.selected;
      }
    }
  }

  isSelected(): boolean {
    return this.selected;
  }

  getNoteId(): string {
    return this.itemData.note_id;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  destroy(): void {
    // Remove the rendered item element from DOM
    const item = this.element.querySelector('.review-item');
    if (item && item.parentNode) {
      item.parentNode.removeChild(item);
    }
  }

  private isReviewItem(data: unknown): data is ReviewItemType {
    return (
      typeof data === 'object' &&
      data !== null &&
      'note_id' in data &&
      'title' in data &&
      'venture' in data &&
      'domain' in data &&
      'status' in data &&
      'age_days' in data &&
      'momentum_score' in data
    );
  }
}
