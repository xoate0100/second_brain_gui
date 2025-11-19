/**
 * ToastManager Service Tests
 * Tests for toast notification manager service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ToastManager } from './ToastManager';

describe('ToastManager', () => {
  let container: HTMLElement;
  let manager: ToastManager;

  beforeEach(() => {
    ToastManager.reset();
    manager = ToastManager.getInstance();
    container = document.getElementById('toast-container') as HTMLElement;
  });

  afterEach(() => {
    manager.clear();
    if (container.parentNode) {
      container.remove();
    }
  });

  it('should be a singleton', () => {
    const instance1 = ToastManager.getInstance();
    const instance2 = ToastManager.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should show success toast', () => {
    manager.success('Success message');
    const toasts = container.querySelectorAll('.toast');
    expect(toasts.length).toBe(1);
    expect(toasts[0].textContent).toContain('Success message');
    expect(toasts[0].className).toContain('toast--success');
  });

  it('should show error toast', () => {
    manager.error('Error message');
    const toasts = container.querySelectorAll('.toast');
    expect(toasts.length).toBe(1);
    expect(toasts[0].textContent).toContain('Error message');
    expect(toasts[0].className).toContain('toast--error');
  });

  it('should show warning toast', () => {
    manager.warning('Warning message');
    const toasts = container.querySelectorAll('.toast');
    expect(toasts.length).toBe(1);
    expect(toasts[0].textContent).toContain('Warning message');
    expect(toasts[0].className).toContain('toast--warning');
  });

  it('should show info toast', () => {
    manager.info('Info message');
    const toasts = container.querySelectorAll('.toast');
    expect(toasts.length).toBe(1);
    expect(toasts[0].textContent).toContain('Info message');
    expect(toasts[0].className).toContain('toast--info');
  });

  it('should stack multiple toasts', () => {
    manager.success('Message 1');
    manager.error('Message 2');
    manager.info('Message 3');
    
    const toasts = container.querySelectorAll('.toast');
    expect(toasts.length).toBe(3);
  });

  it('should auto-dismiss toasts after duration', async () => {
    manager.success('Test message', 100);
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const toasts = container.querySelectorAll('.toast');
    expect(toasts.length).toBe(0);
  });

  it('should clear all toasts', () => {
    manager.success('Message 1');
    manager.error('Message 2');
    manager.info('Message 3');
    
    expect(container.querySelectorAll('.toast').length).toBe(3);
    
    manager.clear();
    expect(container.querySelectorAll('.toast').length).toBe(0);
  });

  it('should limit maximum number of toasts', () => {
    // Set max toasts to 3
    manager.setMaxToasts(3);
    
    manager.success('Message 1');
    manager.error('Message 2');
    manager.info('Message 3');
    manager.warning('Message 4'); // Should remove oldest
    
    const toasts = container.querySelectorAll('.toast');
    expect(toasts.length).toBe(3);
    // Message 1 should be removed
    expect(container.textContent).not.toContain('Message 1');
  });
});

