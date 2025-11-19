/**
 * Validated Component Base Class
 * Extends Component with form validation capabilities
 *
 * Responsibilities:
 * - Provides field validation
 * - Manages validation errors
 * - Exposes validation state to subclasses
 *
 * SOLID Principles:
 * - SRP: Single responsibility - form validation
 * - OCP: Open for extension via abstract getValidationRules method
 * - ISP: Provides focused validation interface
 */

import { Component } from './Component';

export interface ValidationRules {
  [fieldName: string]: (value: unknown) => string | null;
}

export abstract class ValidatedComponent extends Component {
  protected errors: Record<string, string> = {};

  /**
   * Get validation rules for form fields
   * Must be implemented by subclasses
   */
  protected abstract getValidationRules(): ValidationRules;

  /**
   * Validate a single field
   * @param fieldName - Name of the field to validate
   * @param value - Value to validate
   * @returns Error message or null if valid
   */
  protected validateField(fieldName: string, value: unknown): string | null {
    const rules = this.getValidationRules();
    const validator = rules[fieldName];

    if (!validator) {
      return null;
    }

    const error = validator(value);

    if (error) {
      this.errors[fieldName] = error;
    } else {
      delete this.errors[fieldName];
    }

    return error;
  }

  /**
   * Validate all fields in the form
   * @returns true if all fields are valid, false otherwise
   */
  protected validateAll(): boolean {
    const rules = this.getValidationRules();
    let isValid = true;

    for (const fieldName of Object.keys(rules)) {
      const form = this.element.querySelector('form');
      if (!form) {
        continue;
      }

      const field = form.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        `[name="${fieldName}"]`
      );

      if (field) {
        const error = this.validateField(fieldName, field.value);
        if (error) {
          isValid = false;
        }
      }
    }

    return isValid;
  }

  /**
   * Clear all validation errors
   */
  protected clearErrors(): void {
    this.errors = {};
  }

  /**
   * Get error message for a field
   * @param fieldName - Name of the field
   * @returns Error message or undefined
   */
  getError(fieldName: string): string | undefined {
    return this.errors[fieldName];
  }

  /**
   * Check if a field has an error
   * @param fieldName - Name of the field
   * @returns true if field has error, false otherwise
   */
  hasError(fieldName: string): boolean {
    return fieldName in this.errors;
  }
}
