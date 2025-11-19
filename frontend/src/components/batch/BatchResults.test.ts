/**
 * BatchResults Component Tests
 * Tests for batch operation results display component
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BatchResults } from './BatchResults';
import type { BatchUpdateResponse } from '../../api/types';

describe('BatchResults', () => {
  let container: HTMLElement;
  let component: BatchResults;
  const mockResults: BatchUpdateResponse = {
    total: 3,
    succeeded: 2,
    failed: 1,
    results: [
      { note_id: 'note1', success: true },
      { note_id: 'note2', success: true },
      { note_id: 'note3', success: false, error: 'Not found' },
    ],
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    component = new BatchResults(container, mockResults);
  });

  afterEach(() => {
    if (container.parentNode) {
      container.remove();
    }
  });

  describe('render', () => {
    it('should render batch results', () => {
      const element = component.render();
      expect(element).toBeInstanceOf(HTMLElement);
      expect(element.classList.contains('batch-results')).toBe(true);
    });

    it('should display success and failure counts', () => {
      const element = component.render();
      expect(element.textContent).toContain('2');
      expect(element.textContent).toContain('1');
    });

    it('should display individual results', () => {
      const element = component.render();
      expect(element.querySelector('.batch-results__list')).toBeTruthy();
    });

    it('should have close button', () => {
      const element = component.render();
      expect(element.querySelector('[data-action="close"]')).toBeTruthy();
    });
  });

  describe('update', () => {
    it('should update with new results', () => {
      const newResults: BatchUpdateResponse = {
        total: 2,
        succeeded: 2,
        failed: 0,
        results: [
          { note_id: 'note1', success: true },
          { note_id: 'note2', success: true },
        ],
      };

      component.update(newResults);
      const element = component.render();
      expect(element.textContent).toContain('2');
      expect(element.textContent).toContain('0');
    });
  });

  describe('events', () => {
    it('should emit close event on close button click', () => {
      const element = component.render();
      let closed = false;
      container.addEventListener('results:close', () => {
        closed = true;
      });

      const closeButton = element.querySelector('[data-action="close"]') as HTMLButtonElement;
      if (closeButton) {
        closeButton.click();
        expect(closed).toBe(true);
      }
    });
  });
});
