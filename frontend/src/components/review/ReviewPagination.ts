/**
 * ReviewPagination Component
 * Pagination controls for review queue
 *
 * Responsibilities:
 * - Display pagination information
 * - Handle page navigation
 * - Emit page change events
 *
 * SOLID Principles:
 * - SRP: Single responsibility - pagination controls
 * - OCP: Extensible via Component base class
 */

import { Component } from '../base/Component';
import type { Pagination } from '../../api/types';

export class ReviewPagination extends Component {
  private pagination: Pagination;

  constructor(container: HTMLElement, pagination: Pagination) {
    super(container);
    this.pagination = pagination;
  }

  render(): HTMLElement {
    const nav = document.createElement('nav');
    nav.className = 'review-pagination';
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'Review queue pagination');

    const { page, total_pages, has_previous, has_next } = this.pagination;

    nav.innerHTML = `
      <div class="review-pagination__info">
        Page ${page} of ${total_pages}
      </div>
      <div class="review-pagination__controls">
        <button type="button" class="review-pagination__button" data-action="prev"
                ${has_previous ? '' : 'disabled'}
                aria-label="Previous page">
          Previous
        </button>
        <div class="review-pagination__page-numbers">
          ${this.renderPageNumbers(page, total_pages)}
        </div>
        <button type="button" class="review-pagination__button" data-action="next"
                ${has_next ? '' : 'disabled'}
                aria-label="Next page">
          Next
        </button>
      </div>
    `;

    // Add event listeners
    const prevButton = nav.querySelector('[data-action="prev"]') as HTMLButtonElement;
    if (prevButton && has_previous) {
      prevButton.addEventListener('click', () => {
        this.emit('page:change', { page: page - 1 });
      });
    }

    const nextButton = nav.querySelector('[data-action="next"]') as HTMLButtonElement;
    if (nextButton && has_next) {
      nextButton.addEventListener('click', () => {
        this.emit('page:change', { page: page + 1 });
      });
    }

    // Add page number click handlers
    const pageButtons = nav.querySelectorAll('[data-page]');
    pageButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const pageNum = parseInt((button as HTMLElement).getAttribute('data-page') || '0', 10);
        if (pageNum > 0 && pageNum !== page) {
          this.emit('page:change', { page: pageNum });
        }
      });
    });

    return nav;
  }

  update(data: unknown): void {
    if (this.isPagination(data)) {
      this.pagination = data;
      // Re-render if element exists
      const existing = this.element.querySelector('.review-pagination');
      if (existing) {
        existing.remove();
        this.element.appendChild(this.render());
      }
    }
  }

  private renderPageNumbers(currentPage: number, totalPages: number): string {
    if (totalPages <= 1) {
      return '';
    }

    const pages: string[] = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const endPage = Math.min(totalPages, startPage + maxVisible - 1);

    // Adjust start if we're near the end
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    // Add first page and ellipsis if needed
    if (startPage > 1) {
      const firstPageClass =
        1 === currentPage ? 'review-pagination__button--active' : 'review-pagination__button';
      pages.push(`<button type="button" data-page="1" class="${firstPageClass}">1</button>`);
      if (startPage > 2) {
        pages.push('<span class="ellipsis">...</span>');
      }
    }

    // Add visible page numbers
    for (let i = startPage; i <= endPage; i++) {
      const activeClass =
        i === currentPage ? 'review-pagination__button--active' : 'review-pagination__button';
      pages.push(
        `<button type="button" data-page="${i}" class="${activeClass}"
                 ${i === currentPage ? 'aria-current="page"' : ''}>
          ${i}
        </button>`
      );
    }

    // Add last page and ellipsis if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('<span class="ellipsis">...</span>');
      }
      const lastPageClass =
        totalPages === currentPage
          ? 'review-pagination__button--active'
          : 'review-pagination__button';
      pages.push(
        `<button type="button" data-page="${totalPages}" class="${lastPageClass}">${totalPages}</button>`
      );
    }

    return pages.join('');
  }

  private isPagination(data: unknown): data is Pagination {
    return (
      typeof data === 'object' &&
      data !== null &&
      'page' in data &&
      'page_size' in data &&
      'total_items' in data &&
      'total_pages' in data &&
      'has_next' in data &&
      'has_previous' in data
    );
  }
}
