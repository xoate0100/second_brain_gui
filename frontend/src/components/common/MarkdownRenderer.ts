/**
 * MarkdownRenderer Component
 * Renders markdown content as HTML
 *
 * Responsibilities:
 * - Convert markdown text to HTML
 * - Escape HTML to prevent XSS
 * - Apply markdown styling
 *
 * SOLID Principles:
 * - SRP: Single responsibility - markdown rendering only
 * - OCP: Extensible for additional markdown features
 * - DIP: Depends on marked library interface
 */

import { Component } from '../base/Component';
import { marked } from 'marked';

export class MarkdownRenderer extends Component {
  private content: string = '';

  constructor(container: HTMLElement) {
    super(container);
  }

  render(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'markdown-renderer';
    this.element = container;
    this.update(this.content);
    return container;
  }

  update(content: string | null | undefined): void {
    this.content = content || '';

    if (!this.element) {
      return;
    }

    if (!this.content.trim()) {
      this.element.innerHTML = '';
      return;
    }

    try {
      // Configure marked to escape HTML by default (XSS prevention)
      // marked escapes HTML in markdown, but we need to sanitize the output
      const html = marked.parse(this.content, {
        breaks: true,
        gfm: true, // GitHub Flavored Markdown
      });

      // Sanitize HTML to prevent XSS attacks
      const sanitized = this.sanitizeHtml(html as string);
      this.element.innerHTML = sanitized;
    } catch (error) {
      console.error('Error rendering markdown:', error);
      this.element.innerHTML = `<p class="markdown-error">Error rendering markdown content</p>`;
    }
  }

  /**
   * Sanitize HTML to prevent XSS attacks
   * Removes script tags and other dangerous elements
   */
  private sanitizeHtml(html: string): string {
    // Create a temporary div to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Remove script tags and event handlers
    const scripts = temp.querySelectorAll('script');
    scripts.forEach((script) => script.remove());

    // Remove event handlers from all elements
    const allElements = temp.querySelectorAll('*');
    allElements.forEach((el) => {
      // Remove all event handler attributes
      Array.from(el.attributes).forEach((attr) => {
        if (attr.name.startsWith('on')) {
          el.removeAttribute(attr.name);
        }
      });
    });

    return temp.innerHTML;
  }

  /**
   * Get current content
   */
  getContent(): string {
    return this.content;
  }
}
