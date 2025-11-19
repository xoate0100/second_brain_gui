/**
 * Toast Component
 * Displays a single toast notification
 *
 * Responsibilities:
 * - Display toast message with type styling
 * - Handle auto-dismiss after duration
 * - Provide manual dismiss button
 *
 * SOLID Principles:
 * - SRP: Single responsibility - toast display only
 * - OCP: Extensible for additional toast types
 */

import { Component } from '../base/Component';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export class Toast extends Component {
  private message: string;
  private type: ToastType;
  private duration: number;
  private dismissTimer: number | null = null;

  constructor(
    container: HTMLElement,
    message: string,
    type: ToastType = 'info',
    duration: number = 5000
  ) {
    super(container);
    this.message = message;
    this.type = type;
    this.duration = duration;
  }

  render(): HTMLElement {
    const toast = document.createElement('div');
    toast.className = `toast toast--${this.type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');

    toast.innerHTML = `
      <div class="toast__content">
        <span class="toast__message">${this.escapeHtml(this.message)}</span>
        <button type="button" class="toast__close" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    `;

    this.element = toast;
    this.setupEventListeners();
    this.startAutoDismiss();

    return toast;
  }

  update(data: unknown): void {
    // Toast content is static, no update needed
  }

  private setupEventListeners(): void {
    const closeButton = this.element.querySelector('.toast__close') as HTMLButtonElement;
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.dismiss();
      });
    }
  }

  private startAutoDismiss(): void {
    if (this.duration > 0) {
      this.dismissTimer = window.setTimeout(() => {
        this.dismiss();
      }, this.duration);
    }
  }

  dismiss(): void {
    if (this.dismissTimer !== null) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }

    this.emit('toast:dismiss', { message: this.message, type: this.type });
    this.element.remove();
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

