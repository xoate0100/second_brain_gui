/**
 * ValidatedComponent Base Class Tests
 * Tests for the form validation base class
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ValidatedComponent } from './ValidatedComponent';

// Validation rules type
interface ValidationRules {
  [key: string]: (value: unknown) => string | null;
}

// Concrete implementation for testing
class TestValidatedComponent extends ValidatedComponent {
  render(): HTMLElement {
    const form = document.createElement('form');
    form.innerHTML = `
      <input type="text" name="testField" />
      <button type="submit">Submit</button>
    `;
    return form;
  }

  update(data: unknown): void {
    this.state = { ...this.state, ...(data as Record<string, unknown>) };
  }

  getValidationRules(): ValidationRules {
    return {
      testField: (value: unknown) => {
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return 'Field is required';
        }
        return null;
      }
    };
  }
}

describe('ValidatedComponent', () => {
  let container: HTMLElement;
  let component: TestValidatedComponent;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    component = new TestValidatedComponent(container);
  });

  it('should initialize with empty errors', () => {
    expect(component['errors']).toEqual({});
  });

  it('should validate field successfully', () => {
    const result = component['validateField']('testField', 'test value');
    expect(result).toBeNull();
    expect(component['errors']).toEqual({});
  });

  it('should validate field and return error', () => {
    const result = component['validateField']('testField', '');
    expect(result).toBe('Field is required');
    expect(component['errors']).toEqual({
      testField: 'Field is required'
    });
  });

  it('should validate all fields', () => {
    const form = component.render() as HTMLFormElement;
    container.appendChild(form);
    
    const isValid = component['validateAll']();
    expect(isValid).toBe(false);
    expect(component['errors']).toHaveProperty('testField');
  });

  it('should clear errors', () => {
    component['errors'] = { testField: 'Error message' };
    component['clearErrors']();
    expect(component['errors']).toEqual({});
  });

  it('should get error for field', () => {
    component['errors'] = { testField: 'Error message' };
    expect(component.getError('testField')).toBe('Error message');
    expect(component.getError('nonExistent')).toBeUndefined();
  });

  it('should check if field has error', () => {
    component['errors'] = { testField: 'Error message' };
    expect(component.hasError('testField')).toBe(true);
    expect(component.hasError('nonExistent')).toBe(false);
  });
});

