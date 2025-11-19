/**
 * BatchSelector Component Tests
 * Tests for multi-select checkbox component
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BatchSelector } from './BatchSelector';

describe('BatchSelector', () => {
  let container: HTMLElement;
  let component: BatchSelector;
  const itemIds = ['note1', 'note2', 'note3'];

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    component = new BatchSelector(container, itemIds);
  });

  afterEach(() => {
    if (container.parentNode) {
      container.remove();
    }
  });

  describe('render', () => {
    it('should render batch selector controls', () => {
      const element = component.render();
      expect(element).toBeInstanceOf(HTMLElement);
      const selectAllCheckbox = element.querySelector(
        'input[type="checkbox"][data-action="select-all"]'
      );
      expect(selectAllCheckbox).toBeTruthy();
      expect(element.querySelector('.batch-selector__count')).toBeTruthy();
    });

    it('should display selected count', () => {
      const element = component.render();
      expect(element.textContent).toContain('0');
    });
  });

  describe('selection', () => {
    it('should track selected items', () => {
      expect(component.getSelectedItems()).toEqual([]);
      component.toggleItem('note1');
      expect(component.getSelectedItems()).toContain('note1');
    });

    it('should select all items', () => {
      component.selectAll();
      expect(component.getSelectedItems().length).toBe(3);
      expect(component.getSelectedItems()).toEqual(itemIds);
    });

    it('should deselect all items', () => {
      component.selectAll();
      component.deselectAll();
      expect(component.getSelectedItems().length).toBe(0);
    });

    it('should emit selection change events', () => {
      component.render();
      let selectedCount = 0;
      container.addEventListener('selection:change', ((e: CustomEvent) => {
        selectedCount = e.detail.selected.length;
      }) as EventListener);

      component.toggleItem('note1');
      expect(selectedCount).toBe(1);
    });
  });
});
