/**
 * ToastManager Service
 * Manages toast notifications globally
 *
 * Responsibilities:
 * - Create and display toast notifications
 * - Manage toast stacking and positioning
 * - Limit maximum number of toasts
 * - Provide convenience methods for different toast types
 *
 * SOLID Principles:
 * - SRP: Single responsibility - toast lifecycle management
 * - Singleton pattern for global access
 */

import { Toast, ToastType } from '../components/common/Toast';

export class ToastManager {
  private static instance: ToastManager;
  private container: HTMLElement;
  private maxToasts: number = 5;
  private toasts: Toast[] = [];

  private constructor() {
    this.initializeContainer();
  }

  static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  private initializeContainer(): void {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    this.container = container;
  }

  show(message: string, type: ToastType = 'info', duration: number = 5000): void {
    const toast = new Toast(this.container, message, type, duration);
    const element = toast.render();
    
    // Add dismiss listener to remove from array
    element.addEventListener('toast:dismiss', () => {
      this.toasts = this.toasts.filter(t => t !== toast);
    });

    this.toasts.push(toast);
    this.container.appendChild(element);

    // Enforce max toasts limit
    if (this.toasts.length > this.maxToasts) {
      const oldestToast = this.toasts.shift();
      if (oldestToast) {
        oldestToast.dismiss();
      }
    }
  }

  success(message: string, duration?: number): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration?: number): void {
    this.show(message, 'error', duration);
  }

  warning(message: string, duration?: number): void {
    this.show(message, 'warning', duration);
  }

  info(message: string, duration?: number): void {
    this.show(message, 'info', duration);
  }

  clear(): void {
    this.toasts.forEach(toast => toast.dismiss());
    this.toasts = [];
  }

  setMaxToasts(max: number): void {
    this.maxToasts = max;
    // Remove excess toasts if needed
    while (this.toasts.length > this.maxToasts) {
      const oldestToast = this.toasts.shift();
      if (oldestToast) {
        oldestToast.dismiss();
      }
    }
  }

  // For testing: reset singleton instance
  static reset(): void {
    if (ToastManager.instance) {
      ToastManager.instance.clear();
      const container = document.getElementById('toast-container');
      if (container) {
        container.remove();
      }
    }
    ToastManager.instance = null as unknown as ToastManager;
  }
}

