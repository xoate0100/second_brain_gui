/**
 * API Error Handling Tests
 * Tests for error parsing and handling utilities
 */

import { describe, it, expect, vi } from 'vitest';
import { parseApiError, ApiErrorHandler } from './errors';
import type { ApiError } from '../types/api';

describe('parseApiError', () => {
  it('should parse standard error response', () => {
    const errorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: { field: 'status' },
        trace_id: 'trace-123'
      }
    };

    const error = parseApiError(errorResponse);
    
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).toBe('Invalid input');
    expect(error.details).toEqual({ field: 'status' });
    expect(error.trace_id).toBe('trace-123');
  });

  it('should parse error from API response object', () => {
    const errorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input'
      }
    };

    const error = parseApiError(errorResponse);
    
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).toBe('Invalid input');
  });

  it('should create generic error for unknown format', () => {
    const unknown = { something: 'wrong' };
    const error = parseApiError(unknown);
    
    expect(error.code).toBe('UNKNOWN_ERROR');
    expect(error.message).toContain('Unknown error');
  });
});

describe('ApiErrorHandler', () => {
  it('should handle authentication error', () => {
    const error = {
      code: 'AUTHENTICATION_ERROR',
      message: 'Invalid API key',
      details: {}
    };

    const handler = vi.fn();
    ApiErrorHandler.handle(error, handler);
    
    expect(handler).toHaveBeenCalledWith('auth', error);
  });

  it('should handle validation error', () => {
    const error = {
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      details: { field: 'status' }
    };

    const handler = vi.fn();
    ApiErrorHandler.handle(error, handler);
    
    expect(handler).toHaveBeenCalledWith('validation', error);
  });

  it('should handle rate limit error', () => {
    const error = {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests',
      details: { retry_after: 60 }
    };

    const handler = vi.fn();
    ApiErrorHandler.handle(error, handler);
    
    expect(handler).toHaveBeenCalledWith('rate_limit', error);
  });

  it('should handle generic error', () => {
    const error = {
      code: 'INTERNAL_ERROR',
      message: 'Server error',
      details: {}
    };

    const handler = vi.fn();
    ApiErrorHandler.handle(error, handler);
    
    expect(handler).toHaveBeenCalledWith('generic', error);
  });
});

