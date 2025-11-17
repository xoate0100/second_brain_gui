/**
 * ReviewPagination Component Tests
 * Tests for pagination controls component
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ReviewPagination } from './ReviewPagination';
import type { Pagination } from '../../api/types';

describe('ReviewPagination', () => {
  let container: HTMLElement;
  let component: ReviewPagination;
  let paginationData: Pagination;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    paginationData = {
      page: 1,
      page_size: 50,
      total_items: 150,
      total_pages: 3,
      has_next: true,
      has_previous: false,
    };

    component = new ReviewPagination(container, paginationData);
  });

  afterEach(() => {
    if (container.parentNode) {
      container.remove();
    }
  });

  describe('render', () => {
    it('should render pagination controls', () => {
      const element = component.render();
      expect(element).toBeInstanceOf(HTMLElement);
      expect(element.querySelector('button[data-action="prev"]')).toBeTruthy();
      expect(element.querySelector('button[data-action="next"]')).toBeTruthy();
    });

    it('should display current page and total pages', () => {
      const element = component.render();
      expect(element.textContent).toContain('1');
      expect(element.textContent).toContain('3');
    });

    it('should disable prev button on first page', () => {
      const element = component.render();
      const prevButton = element.querySelector('button[data-action="prev"]') as HTMLButtonElement;
      expect(prevButton.disabled).toBe(true);
    });

    it('should enable next button when has_next is true', () => {
      const element = component.render();
      const nextButton = element.querySelector('button[data-action="next"]') as HTMLButtonElement;
      expect(nextButton.disabled).toBe(false);
    });
  });

  describe('update', () => {
    it('should update pagination data', () => {
      const newData: Pagination = {
        page: 2,
        page_size: 50,
        total_items: 150,
        total_pages: 3,
        has_next: true,
        has_previous: true,
      };

      component.update(newData);
      const element = component.render();
      expect(element.textContent).toContain('2');
    });
  });

  describe('events', () => {
    it('should emit page:change event on next click', () => {
      const element = component.render();
      let newPage: number | null = null;

      container.addEventListener('page:change', ((e: CustomEvent) => {
        newPage = e.detail.page;
      }) as EventListener);

      const nextButton = element.querySelector('button[data-action="next"]') as HTMLButtonElement;
      nextButton.click();

      expect(newPage).toBe(2);
    });

    it('should emit page:change event on prev click', () => {
      // Set to page 2 first
      const page2Data: Pagination = {
        page: 2,
        page_size: 50,
        total_items: 150,
        total_pages: 3,
        has_next: true,
        has_previous: true,
      };
      component.update(page2Data);
      const element = component.render();

      let newPage: number | null = null;
      container.addEventListener('page:change', ((e: CustomEvent) => {
        newPage = e.detail.page;
      }) as EventListener);

      const prevButton = element.querySelector('button[data-action="prev"]') as HTMLButtonElement;
      prevButton.click();

      expect(newPage).toBe(1);
    });

    it('should emit page:change event on page number click', () => {
      const element = component.render();
      let newPage: number | null = null;

      container.addEventListener('page:change', ((e: CustomEvent) => {
        newPage = e.detail.page;
      }) as EventListener);

      const pageButton = element.querySelector('button[data-page="2"]') as HTMLButtonElement;
      if (pageButton) {
        pageButton.click();
        expect(newPage).toBe(2);
      }
    });
  });
});
