/**
 * ReviewItem Component Tests
 * Tests for individual review item row component
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ReviewItem } from './ReviewItem';
import type { ReviewItem as ReviewItemType } from '../../api/types';

describe('ReviewItem', () => {
  let container: HTMLElement;
  let component: ReviewItem;
  let itemData: ReviewItemType;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    itemData = {
      note_id: 'test-note-123',
      title: 'Test Note Title',
      venture: 'SWS',
      domain: 'test-domain',
      status: 'inbox',
      age_days: 10,
      momentum_score: 0.75,
    };

    component = new ReviewItem(container, itemData);
  });

  afterEach(() => {
    if (container.parentNode) {
      container.remove();
    }
  });

  describe('render', () => {
    it('should render item with all required fields', () => {
      const element = component.render();
      expect(element).toBeInstanceOf(HTMLElement);
      expect(element.textContent).toContain('Test Note Title');
      expect(element.textContent).toContain('SWS');
      expect(element.textContent).toContain('test-domain');
      expect(element.textContent).toContain('inbox');
    });

    it('should display age_days and momentum_score', () => {
      const element = component.render();
      expect(element.textContent).toContain('10');
      expect(element.textContent).toContain('0.75');
    });

    it('should have clickable item', () => {
      const element = component.render();
      expect(element.getAttribute('data-note-id')).toBe('test-note-123');
    });

    it('should display review stage indicator when present', () => {
      const reviewData: ReviewItemType = {
        ...itemData,
        review_stage: 'in_progress',
      };
      component.update(reviewData);
      const element = component.render();
      expect(element.querySelector('.review-item__stage')).toBeTruthy();
      expect(element.textContent).toContain('In Progress');
    });

    it('should display needs_review indicator when true', () => {
      const reviewData: ReviewItemType = {
        ...itemData,
        needs_review: true,
      };
      component.update(reviewData);
      const element = component.render();
      expect(element.querySelector('.review-item__needs-review')).toBeTruthy();
    });

    it('should display review fields count when present', () => {
      const reviewData: ReviewItemType = {
        ...itemData,
        review_fields: ['venture', 'tags'],
      };
      component.update(reviewData);
      const element = component.render();
      const fieldsCount = element.querySelector('.review-item__fields-count');
      expect(fieldsCount).toBeTruthy();
      expect(fieldsCount?.textContent).toContain('2 fields');
    });

    it('should display all review indicators together', () => {
      const reviewData: ReviewItemType = {
        ...itemData,
        review_stage: 'complete',
        needs_review: false,
        review_fields: ['venture'],
      };
      component.update(reviewData);
      const element = component.render();
      expect(element.querySelector('.review-item__stage')).toBeTruthy();
      expect(element.querySelector('.review-item__fields-count')).toBeTruthy();
      expect(element.textContent).toContain('Complete');
    });
  });

  describe('update', () => {
    it('should update item data', () => {
      const newData: ReviewItemType = {
        ...itemData,
        status: 'ready',
        momentum_score: 0.85,
      };

      component.update(newData);
      const element = component.render();
      expect(element.textContent).toContain('ready');
    });
  });

  describe('selection', () => {
    it('should emit select event when clicked', () => {
      const element = component.render();
      container.appendChild(element);
      let selectedId: string | null = null;

      // Listen on the item element itself (event bubbles from item)
      element.addEventListener('item:select', ((e: CustomEvent) => {
        selectedId = e.detail.note_id;
      }) as EventListener);

      // Click on the title area (not checkbox) to trigger navigation
      const titleElement = element.querySelector('.review-item__title') as HTMLElement;
      if (titleElement) {
        titleElement.click();
      } else {
        element.click();
      }
      expect(selectedId).toBe('test-note-123');
    });

    it('should toggle selection state', () => {
      const element = component.render();
      container.appendChild(element);
      component.toggleSelection();
      const itemElement = container.querySelector('.review-item') as HTMLElement;
      expect(itemElement?.classList.contains('review-item--selected')).toBe(true);

      component.toggleSelection();
      expect(itemElement?.classList.contains('review-item--selected')).toBe(false);
    });

    it('should return selection state', () => {
      expect(component.isSelected()).toBe(false);
      component.toggleSelection();
      expect(component.isSelected()).toBe(true);
    });
  });

  describe('destroy', () => {
    it('should remove element from DOM', () => {
      const element = component.render();
      container.appendChild(element);
      expect(container.contains(element)).toBe(true);

      component.destroy();
      // destroy() removes the element from its parent (container)
      expect(container.contains(element)).toBe(false);
    });
  });
});
