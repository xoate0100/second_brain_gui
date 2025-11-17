/**
 * ReviewFilters Component Tests
 * Tests for filter controls component
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ReviewFilters } from './ReviewFilters';
import type { ReviewQueueParams } from '../../api/types';

describe('ReviewFilters', () => {
  let container: HTMLElement;
  let component: ReviewFilters;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    component = new ReviewFilters(container);
  });

  afterEach(() => {
    if (container.parentNode) {
      container.remove();
    }
  });

  describe('render', () => {
    it('should render filter controls', () => {
      const element = component.render();
      expect(element).toBeInstanceOf(HTMLElement);
      expect(element.querySelector('select[name="stage"]')).toBeTruthy();
      expect(element.querySelector('select[name="venture"]')).toBeTruthy();
      expect(element.querySelector('input[name="domain"]')).toBeTruthy();
      expect(element.querySelector('select[name="sort_by"]')).toBeTruthy();
      expect(element.querySelector('select[name="order"]')).toBeTruthy();
    });

    it('should have apply and reset buttons', () => {
      const element = component.render();
      expect(element.querySelector('button[type="submit"]')).toBeTruthy();
      expect(element.querySelector('button[type="reset"]')).toBeTruthy();
    });
  });

  describe('getFilterValues', () => {
    it('should return current filter values', () => {
      component.render();
      const values = component.getFilterValues();
      // Values are optional, so we just check the method returns an object
      expect(typeof values).toBe('object');
      expect(values).toBeDefined();
    });

    it('should return empty values by default', () => {
      component.render();
      const values = component.getFilterValues();
      expect(values.stage).toBeUndefined();
      expect(values.venture).toBeUndefined();
      expect(values.domain).toBeUndefined();
    });
  });

  describe('setFilterValues', () => {
    it('should update filter values', () => {
      component.render();
      const filters: ReviewQueueParams = {
        stage: 'unreviewed',
        venture: 'SWS',
        domain: 'test-domain',
        sort_by: 'momentum_score',
        order: 'desc',
      };

      component.setFilterValues(filters);
      const values = component.getFilterValues();
      expect(values.stage).toBe('unreviewed');
      expect(values.venture).toBe('SWS');
      expect(values.domain).toBe('test-domain');
      expect(values.sort_by).toBe('momentum_score');
      expect(values.order).toBe('desc');
    });
  });

  describe('events', () => {
    it('should emit filter:apply event on form submit', () => {
      const element = component.render();
      container.appendChild(element);
      let emittedValues: ReviewQueueParams | null = null;

      // Listen on the container (component's element) where events are dispatched via emit()
      container.addEventListener('filter:apply', ((e: CustomEvent) => {
        emittedValues = e.detail;
      }) as EventListener);

      const form = element as HTMLFormElement;
      // Manually trigger submit event - jsdom may not fully support requestSubmit()
      const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
      form.dispatchEvent(submitEvent);

      expect(emittedValues).not.toBeNull();
    });

    it('should emit filter:reset event on reset', () => {
      const element = component.render();
      container.appendChild(element);
      let resetEmitted = false;

      // Listen on the container (component's element) where events are dispatched via emit()
      container.addEventListener('filter:reset', () => {
        resetEmitted = true;
      });

      const form = element as HTMLFormElement;
      // Manually trigger reset event - jsdom may not fully support form.reset() event firing
      const resetEvent = new Event('reset', { cancelable: true, bubbles: true });
      form.dispatchEvent(resetEvent);

      expect(resetEmitted).toBe(true);
    });
  });
});
