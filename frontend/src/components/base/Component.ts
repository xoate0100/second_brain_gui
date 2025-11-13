/**
 * Base Component Class
 * Abstract base class for all UI components following SOLID principles
 * 
 * Responsibilities:
 * - Provides common component lifecycle (render, update, destroy)
 * - Manages component state
 * - Handles event emission
 * 
 * SOLID Principles:
 * - SRP: Single responsibility - component lifecycle management
 * - OCP: Open for extension via abstract methods
 * - LSP: Subtypes must be substitutable for Component
 */

export abstract class Component {
  protected element: HTMLElement;
  protected state: Record<string, unknown>;

  constructor(container: HTMLElement) {
    this.element = container;
    this.state = {};
  }

  /**
   * Render the component
   * Must be implemented by subclasses
   */
  abstract render(): HTMLElement;

  /**
   * Update component with new data
   * Must be implemented by subclasses
   */
  abstract update(data: unknown): void;

  /**
   * Emit a custom event from the component
   * @param event - Event name
   * @param data - Event data
   */
  protected emit(event: string, data: unknown): void {
    this.element.dispatchEvent(
      new CustomEvent(event, { detail: data })
    );
  }

  /**
   * Destroy the component and remove from DOM
   */
  destroy(): void {
    this.element.remove();
  }
}

