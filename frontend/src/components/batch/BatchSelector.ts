/**
 * BatchSelector Component
 * Multi-select checkbox component for batch operations
 * 
 * Responsibilities:
 * - Track selected items
 * - Provide select all/deselect all functionality
 * - Emit selection change events
 * 
 * SOLID Principles:
 * - SRP: Single responsibility - item selection tracking
 * - OCP: Extensible via Component base class
 */

import { Component } from '../base/Component';

export class BatchSelector extends Component {
  private itemIds: string[];
  private selectedIds: Set<string> = new Set();

  constructor(container: HTMLElement, itemIds: string[]) {
    super(container);
    this.itemIds = itemIds;
  }

  render(): HTMLElement {
    const selector = document.createElement('div');
    selector.className = 'batch-selector';
    selector.setAttribute('role', 'toolbar');
    selector.setAttribute('aria-label', 'Batch selection controls');

    selector.innerHTML = `
      <div class="batch-selector__controls">
        <label>
          <input type="checkbox" data-action="select-all" 
                 aria-label="Select all items">
          Select All
        </label>
        <button type="button" data-action="deselect-all" 
                aria-label="Deselect all items">
          Deselect All
        </button>
        <span class="batch-selector__count">
          <span class="selected-count">${this.selectedIds.size}</span> of 
          <span class="total-count">${this.itemIds.length}</span> selected
        </span>
      </div>
    `;

    // Add event listeners
    const selectAllCheckbox = selector.querySelector(
      '[data-action="select-all"]'
    ) as HTMLInputElement;
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener('change', () => {
        if (selectAllCheckbox.checked) {
          this.selectAll();
        } else {
          this.deselectAll();
        }
      });
    }

    const deselectAllButton = selector.querySelector(
      '[data-action="deselect-all"]'
    ) as HTMLButtonElement;
    if (deselectAllButton) {
      deselectAllButton.addEventListener('click', () => {
        this.deselectAll();
      });
    }

    return selector;
  }

  update(data: unknown): void {
    if (Array.isArray(data)) {
      this.itemIds = data as string[];
      // Re-render if element exists
      const existing = this.element.querySelector('.batch-selector');
      if (existing) {
        existing.remove();
        this.element.appendChild(this.render());
      }
    }
  }

  toggleItem(itemId: string): void {
    if (this.selectedIds.has(itemId)) {
      this.selectedIds.delete(itemId);
    } else {
      this.selectedIds.add(itemId);
    }
    this.updateSelectionDisplay();
    this.emit('selection:change', { selected: this.getSelectedItems() });
  }

  selectAll(): void {
    this.itemIds.forEach((id) => this.selectedIds.add(id));
    this.updateSelectionDisplay();
    this.emit('selection:change', { selected: this.getSelectedItems() });
  }

  deselectAll(): void {
    this.selectedIds.clear();
    this.updateSelectionDisplay();
    this.emit('selection:change', { selected: this.getSelectedItems() });
  }

  getSelectedItems(): string[] {
    return Array.from(this.selectedIds);
  }

  getSelectedCount(): number {
    return this.selectedIds.size;
  }

  private updateSelectionDisplay(): void {
    const selectedCountEl = this.element.querySelector('.selected-count');
    if (selectedCountEl) {
      selectedCountEl.textContent = String(this.selectedIds.size);
    }

    const selectAllCheckbox = this.element.querySelector(
      '[data-action="select-all"]'
    ) as HTMLInputElement;
    if (selectAllCheckbox) {
      selectAllCheckbox.checked = this.selectedIds.size === this.itemIds.length;
      selectAllCheckbox.indeterminate =
        this.selectedIds.size > 0 && this.selectedIds.size < this.itemIds.length;
    }
  }
}

