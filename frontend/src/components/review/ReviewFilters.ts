/**
 * ReviewFilters Component
 * Filter controls for review queue
 *
 * Responsibilities:
 * - Render filter form controls
 * - Manage filter state
 * - Emit filter events
 *
 * SOLID Principles:
 * - SRP: Single responsibility - filter controls
 * - OCP: Extensible via Component base class
 */

import { Component } from '../base/Component';
import type { ReviewQueueParams } from '../../api/types';

export class ReviewFilters extends Component {
  private filterValues: ReviewQueueParams = {};

  render(): HTMLElement {
    const form = document.createElement('form');
    form.className = 'review-filters';
    form.setAttribute('role', 'search');
    form.setAttribute('aria-label', 'Review queue filters');

    form.innerHTML = `
      <div class="review-filters__form">
        <div class="review-filters__field">
          <label for="filter-stage" class="review-filters__label">Stage</label>
          <select id="filter-stage" name="stage" class="review-filters__select" aria-label="Filter by stage">
            <option value="">All</option>
            <option value="unreviewed">Unreviewed</option>
            <option value="in_progress">In Progress</option>
            <option value="complete">Complete</option>
          </select>
        </div>
        <div class="review-filters__field">
          <label for="filter-venture" class="review-filters__label">Venture</label>
          <select id="filter-venture" name="venture" class="review-filters__select" aria-label="Filter by venture">
            <option value="">All</option>
            <option value="SWS">SWS</option>
            <option value="CRL">CRL</option>
            <option value="ERA">ERA</option>
            <option value="SAE">SAE</option>
            <option value="Personal">Personal</option>
          </select>
        </div>
        <div class="review-filters__field">
          <label for="filter-domain" class="review-filters__label">Domain</label>
          <input type="text" id="filter-domain" name="domain" class="review-filters__input"
                 placeholder="Filter by domain" aria-label="Filter by domain">
        </div>
        <div class="review-filters__field">
          <label for="filter-sort" class="review-filters__label">Sort By</label>
          <select id="filter-sort" name="sort_by" class="review-filters__select" aria-label="Sort by">
            <option value="momentum_score">Momentum Score</option>
            <option value="created">Created Date</option>
            <option value="age_days">Age (Days)</option>
          </select>
        </div>
        <div class="review-filters__field">
          <label for="filter-order" class="review-filters__label">Order</label>
          <select id="filter-order" name="order" class="review-filters__select" aria-label="Sort order">
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
        <div class="review-filters__actions">
          <button type="submit" class="btn btn--primary">Apply Filters</button>
          <button type="reset" class="btn btn--secondary">Reset</button>
        </div>
      </div>
    `;

    // Set initial values
    this.applyFilterValues(form);

    // Add event listeners - use emit() to dispatch on component's container
    form.addEventListener('submit', (e: Event) => {
      e.preventDefault();
      this.filterValues = this.extractFilterValues(form);
      this.emit('filter:apply', this.filterValues);
    });

    form.addEventListener('reset', () => {
      this.filterValues = {};
      this.emit('filter:reset', {});
    });

    return form;
  }

  update(data: unknown): void {
    if (this.isReviewQueueParams(data)) {
      this.setFilterValues(data);
    }
  }

  getFilterValues(): ReviewQueueParams {
    return { ...this.filterValues };
  }

  setFilterValues(filters: ReviewQueueParams): void {
    this.filterValues = { ...filters };
    const form = this.element.querySelector('form');
    if (form) {
      this.applyFilterValues(form);
    }
  }

  private extractFilterValues(form: HTMLFormElement): ReviewQueueParams {
    const formData = new FormData(form);
    const params: ReviewQueueParams = {};

    const stage = formData.get('stage') as string;
    if (stage) {
      params.stage = stage as 'unreviewed' | 'in_progress' | 'complete';
    }

    const venture = formData.get('venture') as string;
    if (venture) {
      params.venture = venture as 'SWS' | 'CRL' | 'ERA' | 'SAE' | 'Personal';
    }

    const domain = formData.get('domain') as string;
    if (domain) {
      params.domain = domain;
    }

    const sortBy = formData.get('sort_by') as string;
    if (sortBy) {
      params.sort_by = sortBy as 'momentum_score' | 'created' | 'age_days';
    }

    const order = formData.get('order') as string;
    if (order) {
      params.order = order as 'asc' | 'desc';
    }

    return params;
  }

  private applyFilterValues(form: HTMLFormElement): void {
    const stageSelect = form.querySelector('[name="stage"]') as HTMLSelectElement;
    if (stageSelect && this.filterValues.stage) {
      stageSelect.value = this.filterValues.stage;
    }

    const ventureSelect = form.querySelector('[name="venture"]') as HTMLSelectElement;
    if (ventureSelect && this.filterValues.venture) {
      ventureSelect.value = this.filterValues.venture;
    }

    const domainInput = form.querySelector('[name="domain"]') as HTMLInputElement;
    if (domainInput && this.filterValues.domain) {
      domainInput.value = this.filterValues.domain;
    }

    const sortBySelect = form.querySelector('[name="sort_by"]') as HTMLSelectElement;
    if (sortBySelect && this.filterValues.sort_by) {
      sortBySelect.value = this.filterValues.sort_by;
    }

    const orderSelect = form.querySelector('[name="order"]') as HTMLSelectElement;
    if (orderSelect && this.filterValues.order) {
      orderSelect.value = this.filterValues.order;
    }
  }

  private isReviewQueueParams(data: unknown): data is ReviewQueueParams {
    return typeof data === 'object' && data !== null;
  }
}
