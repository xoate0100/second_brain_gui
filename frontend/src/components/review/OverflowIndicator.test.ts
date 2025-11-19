/**
 * OverflowIndicator Component Tests
 * Tests for overflow indicator showing hidden items
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OverflowIndicator } from './OverflowIndicator';

describe('OverflowIndicator', () => {
  let container: HTMLElement;
  let indicator: OverflowIndicator;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container.parentNode) {
      container.remove();
    }
  });

  it('should render overflow indicator with count', () => {
    indicator = new OverflowIndicator(container, 10);
    const element = indicator.render();
    expect(element).toBeTruthy();
    expect(element.textContent).toContain('10');
    expect(element.className).toContain('overflow-indicator');
  });

  it('should show "Show All" button when items are hidden', () => {
    indicator = new OverflowIndicator(container, 5);
    const element = indicator.render();
    const showAllButton = element.querySelector('.overflow-indicator__show-all');
    expect(showAllButton).toBeTruthy();
  });

  it('should emit show-all event when button clicked', () => {
    indicator = new OverflowIndicator(container, 3);
    const element = indicator.render();

    let showAllEmitted = false;
    element.addEventListener('overflow:show-all', () => {
      showAllEmitted = true;
    });

    const showAllButton = element.querySelector('.overflow-indicator__show-all') as HTMLButtonElement;
    showAllButton.click();

    expect(showAllEmitted).toBe(true);
  });

  it('should not render when count is 0', () => {
    indicator = new OverflowIndicator(container, 0);
    const element = indicator.render();
    expect(element.textContent).toBe('');
  });

  it('should update count', () => {
    indicator = new OverflowIndicator(container, 5);
    const element = indicator.render();
    expect(element.textContent).toContain('5');

    indicator.update(10);
    expect(element.textContent).toContain('10');
  });
});

