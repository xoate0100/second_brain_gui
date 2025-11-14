/**
 * Component Base Class Tests
 * Tests for the base Component class following TDD
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Component } from './Component';

// Concrete implementation for testing
class TestComponent extends Component {
  render(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'test-component';
    div.textContent = 'Test Component';
    return div;
  }

  update(data: unknown): void {
    this.state = { ...this.state, ...(data as Record<string, unknown>) };
  }
}

describe('Component', () => {
  let container: HTMLElement;
  let component: TestComponent;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    component = new TestComponent(container);
  });

  it('should initialize with container element', () => {
    expect(component['element']).toBe(container);
    expect(component['state']).toEqual({});
  });

  it('should render component', () => {
    const rendered = component.render();
    expect(rendered).toBeInstanceOf(HTMLElement);
    expect(rendered.className).toBe('test-component');
  });

  it('should update state', () => {
    component.update({ test: 'value' });
    expect(component['state']).toEqual({ test: 'value' });
  });

  it('should emit custom events', () => {
    const handler = vi.fn();
    container.addEventListener('test-event', handler);

    component['emit']('test-event', { data: 'test' });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'test-event',
        detail: { data: 'test' },
      })
    );
  });

  it('should destroy component and remove element', () => {
    component.destroy();
    expect(container.parentNode).toBeNull();
  });
});
