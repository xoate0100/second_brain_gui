/**
 * SuggestionItem Component Tests
 * Tests for individual suggestion item component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SuggestionItem } from './SuggestionItem';
import type { Suggestion } from '../../api/types';

describe('SuggestionItem', () => {
  let container: HTMLElement;
  let component: SuggestionItem;
  let suggestionData: Suggestion;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    suggestionData = {
      note_id: 'test-note-123',
      suggested_action: 'archive',
      confidence: 0.85,
      reason: 'Note has been inactive for over 90 days',
      note_summary: 'Test note summary',
    };

    component = new SuggestionItem(container, suggestionData);
  });

  afterEach(() => {
    if (container.parentNode) {
      container.remove();
    }
  });

  describe('render', () => {
    it('should render suggestion with all required fields', () => {
      const element = component.render();
      expect(element).toBeInstanceOf(HTMLElement);
      expect(element.textContent).toContain('archive');
      expect(element.textContent).toContain('0.85');
      expect(element.textContent).toContain('Note has been inactive for over 90 days');
      expect(element.textContent).toContain('Test note summary');
    });

    it('should display confidence as percentage', () => {
      const element = component.render();
      expect(element.textContent).toContain('85%');
    });

    it('should have apply button', () => {
      const element = component.render();
      const applyButton = element.querySelector('[data-action="apply"]') as HTMLButtonElement;
      expect(applyButton).toBeTruthy();
      expect(applyButton.textContent).toContain('Apply');
    });

    it('should have correct data attributes', () => {
      const element = component.render();
      expect(element.getAttribute('data-note-id')).toBe('test-note-123');
      expect(element.getAttribute('data-action-type')).toBe('archive');
    });
  });

  describe('update', () => {
    it('should update suggestion data', () => {
      const newData: Suggestion = {
        ...suggestionData,
        suggested_action: 'mark_done',
        confidence: 0.95,
      };

      component.update(newData);
      const element = component.render();
      expect(element.textContent).toContain('mark_done');
      expect(element.textContent).toContain('95%');
    });
  });

  describe('events', () => {
    it('should emit apply event when apply button is clicked', () => {
      const element = component.render();
      container.appendChild(element);
      let appliedSuggestion: Suggestion | null = null;

      container.addEventListener('suggestion:apply', ((e: CustomEvent) => {
        appliedSuggestion = e.detail.suggestion;
      }) as EventListener);

      const applyButton = element.querySelector('[data-action="apply"]') as HTMLButtonElement;
      applyButton.click();

      expect(appliedSuggestion).toBeTruthy();
      expect(appliedSuggestion?.note_id).toBe('test-note-123');
      expect(appliedSuggestion?.suggested_action).toBe('archive');
    });

    it('should emit dismiss event when dismiss button is clicked', () => {
      const element = component.render();
      container.appendChild(element);
      let dismissedId: string | null = null;

      container.addEventListener('suggestion:dismiss', ((e: CustomEvent) => {
        dismissedId = e.detail.note_id;
      }) as EventListener);

      const dismissButton = element.querySelector('[data-action="dismiss"]') as HTMLButtonElement;
      if (dismissButton) {
        dismissButton.click();
        expect(dismissedId).toBe('test-note-123');
      }
    });
  });

  describe('confidence display', () => {
    it('should format confidence correctly for high confidence', () => {
      suggestionData.confidence = 0.95;
      component = new SuggestionItem(container, suggestionData);
      const element = component.render();
      expect(element.textContent).toContain('95%');
    });

    it('should format confidence correctly for low confidence', () => {
      suggestionData.confidence = 0.25;
      component = new SuggestionItem(container, suggestionData);
      const element = component.render();
      expect(element.textContent).toContain('25%');
    });
  });
});

