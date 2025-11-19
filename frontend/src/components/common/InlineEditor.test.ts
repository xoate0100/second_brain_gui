/**
 * InlineEditor Component Tests
 * Tests for inline editing component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InlineEditor } from './InlineEditor';

describe('InlineEditor', () => {
  let container: HTMLElement;
  let editor: InlineEditor;
  const initialValue = 'Initial Value';
  const onSave = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    editor = new InlineEditor(container, initialValue, onSave, onCancel);
  });

  afterEach(() => {
    if (container.parentNode) {
      container.remove();
    }
    vi.clearAllMocks();
  });

  it('should render initial value as text', () => {
    const element = editor.render();
    expect(element).toBeTruthy();
    expect(element.textContent).toContain(initialValue);
    expect(element.className).toContain('inline-editor');
    expect(element.querySelector('.inline-editor__display')).toBeTruthy();
  });

  it('should switch to edit mode when clicked', () => {
    const element = editor.render();
    const display = element.querySelector('.inline-editor__display') as HTMLElement;

    display.click();

    const input = element.querySelector('.inline-editor__input') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.value).toBe(initialValue);
  });

  it('should save changes on Enter key', () => {
    const element = editor.render();
    const display = element.querySelector('.inline-editor__display') as HTMLElement;
    display.click();

    const input = element.querySelector('.inline-editor__input') as HTMLInputElement;
    input.value = 'Updated Value';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(onSave).toHaveBeenCalledWith('Updated Value');
  });

  it('should cancel editing on Esc key', () => {
    const element = editor.render();
    const display = element.querySelector('.inline-editor__display') as HTMLElement;
    display.click();

    const input = element.querySelector('.inline-editor__input') as HTMLInputElement;
    input.value = 'Changed Value';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(onCancel).toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('should save changes on blur', () => {
    const element = editor.render();
    const display = element.querySelector('.inline-editor__display') as HTMLElement;
    display.click();

    const input = element.querySelector('.inline-editor__input') as HTMLInputElement;
    input.value = 'Blur Value';
    input.dispatchEvent(new Event('blur'));

    expect(onSave).toHaveBeenCalledWith('Blur Value');
  });

  it('should update display value after save', () => {
    const element = editor.render();
    const display = element.querySelector('.inline-editor__display') as HTMLElement;
    display.click();

    const input = element.querySelector('.inline-editor__input') as HTMLInputElement;
    input.value = 'New Value';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    // Display should show new value
    expect(display.textContent).toContain('New Value');
  });

  it('should show loading state while saving', async () => {
    const slowSave = vi.fn(() => new Promise(resolve => setTimeout(() => resolve('Saved'), 100)));
    editor = new InlineEditor(container, initialValue, slowSave, onCancel);
    const element = editor.render();
    const display = element.querySelector('.inline-editor__display') as HTMLElement;
    display.click();

    const input = element.querySelector('.inline-editor__input') as HTMLInputElement;
    input.value = 'Loading Test';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    // Check for loading indicator
    const loading = element.querySelector('.inline-editor__loading');
    expect(loading).toBeTruthy();

    await new Promise(resolve => setTimeout(resolve, 150));
  });
});

