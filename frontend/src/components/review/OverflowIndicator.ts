/**
 * OverflowIndicator Component
 * Shows indicator when items are hidden due to limits
 *
 * Responsibilities:
 * - Display count of hidden items
 * - Provide "Show All" button
 * - Emit event when "Show All" is clicked
 *
 * SOLID Principles:
 * - SRP: Single responsibility - overflow indication only
 */

import { Component } from '../base/Component';

export class OverflowIndicator extends Component {
  private hiddenCount: number = 0;

  constructor(container: HTMLElement, hiddenCount: number = 0) {
    super(container);
    this.hiddenCount = hiddenCount;
  }

  render(): HTMLElement {
    const indicator = document.createElement('div');
    indicator.className = 'overflow-indicator';

    if (this.hiddenCount === 0) {
      indicator.innerHTML = '';
      this.element = indicator;
      return indicator;
    }

    indicator.innerHTML = `
      <div class="overflow-indicator__message">
        <span class="overflow-indicator__count">${this.hiddenCount}</span> more items hidden
      </div>
      <button type="button" class="overflow-indicator__show-all btn btn--secondary">
        Show All
      </button>
    `;

    this.element = indicator;
    this.setupEventListeners();

    return indicator;
  }

  update(data: number): void {
    this.hiddenCount = data || 0;
    
    if (!this.element) {
      return;
    }

    if (this.hiddenCount === 0) {
      this.element.innerHTML = '';
      return;
    }

    const countElement = this.element.querySelector('.overflow-indicator__count');
    if (countElement) {
      countElement.textContent = String(this.hiddenCount);
    } else {
      // Re-render if count element doesn't exist
      this.element.innerHTML = `
        <div class="overflow-indicator__message">
          <span class="overflow-indicator__count">${this.hiddenCount}</span> more items hidden
        </div>
        <button type="button" class="overflow-indicator__show-all btn btn--secondary">
          Show All
        </button>
      `;
      this.setupEventListeners();
    }
  }

  private setupEventListeners(): void {
    const showAllButton = this.element.querySelector('.overflow-indicator__show-all') as HTMLButtonElement;
    if (showAllButton) {
      showAllButton.addEventListener('click', () => {
        this.emit('overflow:show-all', { hiddenCount: this.hiddenCount });
      });
    }
  }
}

