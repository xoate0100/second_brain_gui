/**
 * InlineEditor Component
 * Provides inline editing functionality for metadata fields
 *
 * Responsibilities:
 * - Display value as text (view mode)
 * - Switch to input field on click (edit mode)
 * - Save on Enter or blur
 * - Cancel on Esc
 * - Show loading state during save
 *
 * SOLID Principles:
 * - SRP: Single responsibility - inline editing only
 * - DIP: Depends on callback functions (onSave, onCancel)
 */

import { Component } from '../base/Component';

export class InlineEditor extends Component {
  private value: string;
  private onSave: (value: string) => void | Promise<void>;
  private onCancel: () => void;
  private isEditing: boolean = false;
  private isSaving: boolean = false;

  constructor(
    container: HTMLElement,
    initialValue: string,
    onSave: (value: string) => void | Promise<void>,
    onCancel: () => void
  ) {
    super(container);
    this.value = initialValue;
    this.onSave = onSave;
    this.onCancel = onCancel;
  }

  render(): HTMLElement {
    const editor = document.createElement('div');
    editor.className = 'inline-editor';

    editor.innerHTML = `
      <span class="inline-editor__display">${this.escapeHtml(this.value)}</span>
      <input type="text" class="inline-editor__input" style="display: none;" value="${this.escapeHtml(this.value)}">
      <span class="inline-editor__loading" style="display: none;">Saving...</span>
    `;

    this.element = editor;
    this.setupEventListeners();

    return editor;
  }

  update(data: string): void {
    this.value = data || '';
    const display = this.element.querySelector('.inline-editor__display') as HTMLElement;
    if (display) {
      display.textContent = this.value;
    }
    const input = this.element.querySelector('.inline-editor__input') as HTMLInputElement;
    if (input) {
      input.value = this.value;
    }
  }

  private setupEventListeners(): void {
    const display = this.element.querySelector('.inline-editor__display') as HTMLElement;
    const input = this.element.querySelector('.inline-editor__input') as HTMLInputElement;

    if (display) {
      display.addEventListener('click', () => {
        this.enterEditMode();
      });
    }

    if (input) {
      input.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleSave();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          this.handleCancel();
        }
      });

      input.addEventListener('blur', () => {
        if (this.isEditing && !this.isSaving) {
          this.handleSave();
        }
      });
    }
  }

  private enterEditMode(): void {
    if (this.isEditing || this.isSaving) {
      return;
    }

    this.isEditing = true;
    const display = this.element.querySelector('.inline-editor__display') as HTMLElement;
    const input = this.element.querySelector('.inline-editor__input') as HTMLInputElement;

    if (display && input) {
      display.style.display = 'none';
      input.style.display = 'block';
      input.focus();
      input.select();
    }
  }

  private exitEditMode(): void {
    this.isEditing = false;
    const display = this.element.querySelector('.inline-editor__display') as HTMLElement;
    const input = this.element.querySelector('.inline-editor__input') as HTMLInputElement;

    if (display && input) {
      display.style.display = '';
      input.style.display = 'none';
    }
  }

  private async handleSave(): Promise<void> {
    if (this.isSaving) {
      return;
    }

    const input = this.element.querySelector('.inline-editor__input') as HTMLInputElement;
    if (!input) {
      return;
    }

    const newValue = input.value.trim();

    // Don't save if value hasn't changed
    if (newValue === this.value) {
      this.exitEditMode();
      return;
    }

    this.isSaving = true;
    const loading = this.element.querySelector('.inline-editor__loading') as HTMLElement;
    if (loading) {
      loading.style.display = 'block';
    }

    try {
      const result = this.onSave(newValue);
      if (result instanceof Promise) {
        await result;
      }
      this.value = newValue;
      // Update display immediately
      const display = this.element.querySelector('.inline-editor__display') as HTMLElement;
      if (display) {
        display.textContent = newValue;
      }
      this.exitEditMode();
    } catch (error) {
      // Restore original value on error
      if (input) {
        input.value = this.value;
      }
    } finally {
      this.isSaving = false;
      if (loading) {
        loading.style.display = 'none';
      }
    }
  }

  private handleCancel(): void {
    const input = this.element.querySelector('.inline-editor__input') as HTMLInputElement;
    if (input) {
      input.value = this.value; // Restore original value
    }
    this.exitEditMode();
    this.onCancel();
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

