/**
 * MarkdownRenderer Component Tests
 * Tests for markdown rendering functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MarkdownRenderer } from './MarkdownRenderer';

describe('MarkdownRenderer', () => {
  let container: HTMLElement;
  let renderer: MarkdownRenderer;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    renderer = new MarkdownRenderer(container);
  });

  it('should render markdown text as HTML', () => {
    const markdown = '# Heading\n\nThis is **bold** text.';
    const element = renderer.render();
    renderer.update(markdown);

    expect(element.querySelector('h1')).toBeTruthy();
    expect(element.textContent).toContain('Heading');
    expect(element.querySelector('strong')).toBeTruthy();
    expect(element.textContent).toContain('bold');
  });

  it('should handle code blocks with syntax highlighting', () => {
    const markdown = '```typescript\nconst x = 1;\n```';
    const element = renderer.render();
    renderer.update(markdown);

    const codeBlock = element.querySelector('pre code');
    expect(codeBlock).toBeTruthy();
    expect(codeBlock?.textContent).toContain('const x = 1;');
  });

  it('should escape HTML in markdown to prevent XSS', () => {
    const markdown = '<script>alert("xss")</script>';
    const element = renderer.render();
    renderer.update(markdown);

    // Should not execute script, should remove it entirely
    expect(element.querySelector('script')).toBeFalsy();
    // Script tag should be removed, not present in DOM
    expect(element.innerHTML).not.toContain('<script>');
  });

  it('should handle empty or null content', () => {
    const element = renderer.render();

    // Test empty string
    renderer.update('');
    expect(element.textContent).toBe('');

    // Test null/undefined (should handle gracefully)
    renderer.update(null as unknown as string);
    expect(element.textContent).toBe('');
  });

  it('should handle links correctly', () => {
    const markdown = '[Link text](https://example.com)';
    const element = renderer.render();
    renderer.update(markdown);

    const link = element.querySelector('a');
    expect(link).toBeTruthy();
    expect(link?.getAttribute('href')).toBe('https://example.com');
    expect(link?.textContent).toBe('Link text');
  });

  it('should handle lists correctly', () => {
    const markdown = '- Item 1\n- Item 2\n- Item 3';
    const element = renderer.render();
    renderer.update(markdown);

    const list = element.querySelector('ul');
    expect(list).toBeTruthy();
    expect(list?.querySelectorAll('li').length).toBe(3);
  });

  it('should handle tables correctly', () => {
    const markdown = '| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |';
    const element = renderer.render();
    renderer.update(markdown);

    const table = element.querySelector('table');
    expect(table).toBeTruthy();
    expect(table?.querySelectorAll('th').length).toBe(2);
    expect(table?.querySelectorAll('td').length).toBe(2);
  });

  it('should apply markdown-renderer CSS class', () => {
    const element = renderer.render();
    expect(element.className).toContain('markdown-renderer');
  });
});
