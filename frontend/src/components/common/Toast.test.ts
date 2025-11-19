/**
 * Toast Component Tests
 * Tests for toast notification component
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Toast } from './Toast';

describe('Toast', () => {
  let container: HTMLElement;
  let toast: Toast;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container.parentNode) {
      container.remove();
    }
  });

  it('should render toast with message', () => {
    toast = new Toast(container, 'Test message', 'success');
    const element = toast.render();
    expect(element).toBeTruthy();
    expect(element.textContent).toContain('Test message');
    expect(element.className).toContain('toast');
    expect(element.className).toContain('toast--success');
  });

  it('should render toast with different types', () => {
    const types = ['success', 'error', 'warning', 'info'] as const;
    types.forEach(type => {
      toast = new Toast(container, `Test ${type}`, type);
      const element = toast.render();
      expect(element.className).toContain(`toast--${type}`);
    });
  });

  it('should auto-dismiss after duration', async () => {
    toast = new Toast(container, 'Test message', 'success', 100);
    const element = toast.render();
    container.appendChild(element);
    expect(element.parentNode).toBeTruthy();
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Toast should be removed
    expect(element.parentNode).toBeFalsy();
  });

  it('should emit dismiss event when dismissed', () => {
    toast = new Toast(container, 'Test message', 'success');
    const element = toast.render();
    
    let dismissed = false;
    element.addEventListener('toast:dismiss', () => {
      dismissed = true;
    });

    toast.dismiss();
    expect(dismissed).toBe(true);
  });

  it('should allow manual dismissal via close button', () => {
    toast = new Toast(container, 'Test message', 'success');
    const element = toast.render();
    
    const closeButton = element.querySelector('.toast__close');
    expect(closeButton).toBeTruthy();
    
    let dismissed = false;
    element.addEventListener('toast:dismiss', () => {
      dismissed = true;
    });

    (closeButton as HTMLElement).click();
    expect(dismissed).toBe(true);
  });

  it('should stack multiple toasts correctly', () => {
    const toast1 = new Toast(container, 'Message 1', 'success');
    const toast2 = new Toast(container, 'Message 2', 'error');
    
    const element1 = toast1.render();
    const element2 = toast2.render();
    
    container.appendChild(element1);
    container.appendChild(element2);
    
    expect(element1).toBeTruthy();
    expect(element2).toBeTruthy();
    expect(container.children.length).toBe(2);
  });
});

