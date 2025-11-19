/**
 * ApiComponent Base Class Tests
 * Tests for the API-aware component base class
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiComponent } from './ApiComponent';
import type { ApiClient, ApiResponse, ApiError } from '../../types/api';

// Mock API client
class MockApiClient implements ApiClient {
  async get<T>(_url: string): Promise<ApiResponse<T>> {
    return { success: true, data: {} as T };
  }

  async post<T>(_url: string, _data: unknown): Promise<ApiResponse<T>> {
    return { success: true, data: {} as T };
  }

  async put<T>(_url: string, _data: unknown): Promise<ApiResponse<T>> {
    return { success: true, data: {} as T };
  }

  async delete<T>(_url: string): Promise<ApiResponse<T>> {
    return { success: true, data: {} as T };
  }
}

// Concrete implementation for testing
class TestApiComponent extends ApiComponent {
  render(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'test-api-component';
    return div;
  }

  update(data: unknown): void {
    this.state = { ...this.state, ...(data as Record<string, unknown>) };
  }
}

describe('ApiComponent', () => {
  let container: HTMLElement;
  let apiClient: ApiClient;
  let component: TestApiComponent;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    apiClient = new MockApiClient();
    component = new TestApiComponent(container, apiClient);
  });

  it('should initialize with container and API client', () => {
    expect(component['element']).toBe(container);
    expect(component['apiClient']).toBe(apiClient);
  });

  it('should handle API errors', async () => {
    const error: ApiError = {
      code: 'TEST_ERROR',
      message: 'Test error message',
      details: { field: 'value' },
    };

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await component['handleApiError'](error);

    expect(consoleErrorSpy).toHaveBeenCalledWith('[ApiComponent] API Error:', error);

    consoleErrorSpy.mockRestore();
  });

  it('should render component', () => {
    const rendered = component.render();
    expect(rendered).toBeInstanceOf(HTMLElement);
    expect(rendered.className).toBe('test-api-component');
  });
});
