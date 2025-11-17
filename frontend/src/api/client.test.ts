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
        data: { id: '123' },
      };

      const mockHeaders = new Headers();
      mockHeaders.set('content-type', 'application/json');

      (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: mockHeaders,
      });

      const result = await client.get<{ id: string }>('/api/v1/test');

      expect(fetch).toHaveBeenCalledWith(
        `${baseUrl}/api/v1/test`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: '123' });
    });

    it('should include X-Request-ID header', async () => {
      const mockResponse: ApiResponse<unknown> = {
        success: true,
        data: {},
      };

      const mockHeaders = new Headers();
      mockHeaders.set('content-type', 'application/json');

      (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: mockHeaders,
      });

      await client.get('/api/v1/test');

      const callArgs = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
      const headers = callArgs[1].headers as Record<string, string>;
      expect(headers['X-Request-ID']).toBeDefined();
      expect(headers['X-Request-ID']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it('should include JWT token when set', async () => {
      const jwtToken = 'test-jwt-token';
      client.setJwtToken(jwtToken);

      const mockResponse: ApiResponse<unknown> = {
        success: true,
        data: {},
      };

      const mockHeaders = new Headers();
      mockHeaders.set('content-type', 'application/json');

      (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: mockHeaders,
      });

      await client.get('/api/v1/test');

      const callArgs = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
      const headers = callArgs[1].headers as Record<string, string>;
      expect(headers['Authorization']).toBe(`Bearer ${jwtToken}`);
    });

    it('should handle non-JSON responses', async () => {
      const mockHeaders = new Headers();
      mockHeaders.set('content-type', 'text/plain');

      (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ unexpected: 'format' }),
        headers: mockHeaders,
      });

      const result = await client.get('/api/v1/test');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
    });

    it('should handle HTTP error responses', async () => {
      const mockHeaders = new Headers();
      mockHeaders.set('content-type', 'application/json');

      (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Resource not found',
            details: {},
          },
        }),
        headers: mockHeaders,
      });

      const result = await client.get('/api/v1/test');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });

    it('should handle network errors', async () => {
      (fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await client.get('/api/v1/test');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
      expect(result.error?.message).toContain('Network error');
    });
  });

  describe('POST requests', () => {
    it('should make POST request with body', async () => {
      const mockResponse: ApiResponse<{ id: string }> = {
        success: true,
        data: { id: '123' },
      };

      const mockHeaders = new Headers();
      mockHeaders.set('content-type', 'application/json');

      (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: mockHeaders,
      });

      const requestData = { name: 'Test' };
      await client.post('/api/v1/test', requestData);

      const callArgs = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(callArgs[1].method).toBe('POST');
      expect(callArgs[1].body).toBe(JSON.stringify(requestData));
    });
  });

  describe('PUT requests', () => {
    it('should make PUT request with body', async () => {
      const mockResponse: ApiResponse<{ id: string }> = {
        success: true,
        data: { id: '123' },
      };

      const mockHeaders = new Headers();
      mockHeaders.set('content-type', 'application/json');

      (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: mockHeaders,
      });

      const requestData = { name: 'Updated' };
      await client.put('/api/v1/test', requestData);

      const callArgs = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(callArgs[1].method).toBe('PUT');
      expect(callArgs[1].body).toBe(JSON.stringify(requestData));
    });
  });

  describe('DELETE requests', () => {
    it('should make DELETE request', async () => {
      const mockResponse: ApiResponse<unknown> = {
        success: true,
        data: {},
      };

      const mockHeaders = new Headers();
      mockHeaders.set('content-type', 'application/json');

      (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: mockHeaders,
      });

      await client.delete('/api/v1/test');

      const callArgs = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(callArgs[1].method).toBe('DELETE');
    });
  });

  describe('JWT token management', () => {
    it('should set JWT token', () => {
      const token = 'new-token';
      client.setJwtToken(token);
      expect(client['jwtToken']).toBe(token);
    });

    it('should clear JWT token by setting to undefined', () => {
      client.setJwtToken('test-token');
      client.setJwtToken(undefined);
      expect(client['jwtToken']).toBeUndefined();
    });
  });

  describe('error code mapping', () => {
    it('should map HTTP status codes to error codes', async () => {
      const statusCodes = [
        { status: 400, expectedCode: 'VALIDATION_ERROR' },
        { status: 401, expectedCode: 'AUTHENTICATION_ERROR' },
        { status: 403, expectedCode: 'AUTHORIZATION_ERROR' },
        { status: 404, expectedCode: 'NOT_FOUND' },
        { status: 409, expectedCode: 'CONFLICT' },
        { status: 429, expectedCode: 'RATE_LIMIT_EXCEEDED' },
        { status: 500, expectedCode: 'INTERNAL_ERROR' },
        { status: 503, expectedCode: 'SERVICE_UNAVAILABLE' },
      ];

      for (const { status, expectedCode } of statusCodes) {
        const mockHeaders = new Headers();
        mockHeaders.set('content-type', 'application/json');

        (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          ok: false,
          status,
          statusText: 'Error',
          json: async () => ({ message: 'Error' }),
          headers: mockHeaders,
        });

        const result = await client.get('/api/v1/test');
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(expectedCode);
      }
    });
  });
});
