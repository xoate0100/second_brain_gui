/**
 * API Client Tests
 * Tests for the API client implementation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ApiClientImpl } from './client';
import type { ApiResponse } from '../types/api';

// Mock fetch
global.fetch = vi.fn();

describe('ApiClientImpl', () => {
  let client: ApiClientImpl;
  const apiKey = 'test-api-key';
  const baseUrl = 'http://localhost:8000';

  beforeEach(() => {
    client = new ApiClientImpl(baseUrl, apiKey);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET requests', () => {
    it('should make GET request with correct headers', async () => {
      const mockResponse: ApiResponse<{ id: string }> = {
        success: true,
        data: { id: '123' }
      };

      const mockHeaders = new Headers();
      mockHeaders.set('content-type', 'application/json');
      
      (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: mockHeaders
      });

      const result = await client.get<{ id: string }>('/api/v1/test');

      expect(fetch).toHaveBeenCalledWith(
        `${baseUrl}/api/v1/test`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'X-API-Key': apiKey,
            'Content-Type': 'application/json'
          })
        })
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: '123' });
    });

    it('should include X-Request-ID header', async () => {
      const mockResponse: ApiResponse<unknown> = {
        success: true,
        data: {}
      };

      const mockHeaders = new Headers();
      mockHeaders.set('content-type', 'application/json');
      
      (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: mockHeaders
      });

      await client.get('/api/v1/test');

      const callArgs = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
      const headers = callArgs[1].headers as Record<string, string>;
      
      expect(headers['X-Request-ID']).toBeTruthy();
    });
  });

  describe('POST requests', () => {
    it('should make POST request with body', async () => {
      const mockResponse: ApiResponse<{ id: string }> = {
        success: true,
        data: { id: '123' }
      };

      const requestData = { name: 'test' };

      const mockHeaders = new Headers();
      mockHeaders.set('content-type', 'application/json');
      
      (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: mockHeaders
      });

      const result = await client.post<{ id: string }>('/api/v1/test', requestData);

      expect(fetch).toHaveBeenCalledWith(
        `${baseUrl}/api/v1/test`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData)
        })
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle error response', async () => {
      const errorResponse: ApiResponse<unknown> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: {}
        }
      };

      (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => errorResponse,
        headers: new Headers({ 'content-type': 'application/json' })
      });

      const result = await client.get('/api/v1/test');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });

    it('should handle network errors', async () => {
      (fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await client.get('/api/v1/test');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
    });

    it('should handle 401 authentication error', async () => {
      const errorResponse: ApiResponse<unknown> = {
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Invalid API key',
          details: {}
        }
      };

      (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => errorResponse,
        headers: new Headers({ 'content-type': 'application/json' })
      });

      const result = await client.get('/api/v1/test');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('AUTHENTICATION_ERROR');
    });
  });

  describe('JWT authentication', () => {
    it('should include Authorization header when JWT provided', async () => {
      const jwtToken = 'test-jwt-token';
      const clientWithJwt = new ApiClientImpl(baseUrl, apiKey, jwtToken);

      const mockResponse: ApiResponse<unknown> = {
        success: true,
        data: {}
      };

      const mockHeaders = new Headers();
      mockHeaders.set('content-type', 'application/json');
      
      (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: mockHeaders
      });

      await clientWithJwt.get('/api/v1/test');

      const callArgs = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
      const headers = callArgs[1].headers as Record<string, string>;
      
      expect(headers['Authorization']).toBe(`Bearer ${jwtToken}`);
    });
  });
});

