/**
 * API Error Handling
 * Centralized error parsing and handling utilities
 * 
 * Responsibilities:
 * - Parse error responses from API
 * - Provide error handling utilities
 * - Map error codes to user-friendly messages
 * 
 * SOLID Principles:
 * - SRP: Single responsibility - error handling
 * - OCP: Open for extension via error handlers
 */

import type { ApiError, ApiResponse } from '../types/api';

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'UNKNOWN_ERROR';

export type ErrorType = 'auth' | 'validation' | 'rate_limit' | 'not_found' | 'generic';

export type ErrorHandler = (type: ErrorType, error: ApiError) => void;

/**
 * Parse error from API response or HTTP response
 */
export function parseApiError(response: unknown): ApiError {
  // Handle standard API error response
  if (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    typeof (response as { error: unknown }).error === 'object'
  ) {
    const apiResponse = response as ApiResponse<unknown>;
    if (apiResponse.error) {
      return apiResponse.error;
    }
  }

  // Handle HTTP Response object - need to parse JSON first
  // This is handled in the client, not here

  // Handle unknown format
  return {
    code: 'UNKNOWN_ERROR',
    message: 'Unknown error occurred',
    details: {}
  };
}

/**
 * Get error code from HTTP status
 */
function getErrorCodeFromStatus(status: number): ErrorCode {
  switch (status) {
    case 400:
      return 'VALIDATION_ERROR';
    case 401:
      return 'AUTHENTICATION_ERROR';
    case 403:
      return 'AUTHORIZATION_ERROR';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 429:
      return 'RATE_LIMIT_EXCEEDED';
    case 500:
      return 'INTERNAL_ERROR';
    case 503:
      return 'SERVICE_UNAVAILABLE';
    default:
      return 'UNKNOWN_ERROR';
  }
}

/**
 * API Error Handler
 * Provides centralized error handling with customizable handlers
 */
export class ApiErrorHandler {
  /**
   * Handle API error with appropriate handler
   * @param error - API error object
   * @param customHandler - Optional custom error handler
   */
  static handle(error: ApiError, customHandler?: ErrorHandler): void {
    const errorType = this.getErrorType(error.code);
    
    if (customHandler) {
      customHandler(errorType, error);
      return;
    }

    // Default handling
    this.handleDefault(errorType, error);
  }

  /**
   * Get error type from error code
   */
  private static getErrorType(code: string): ErrorType {
    switch (code) {
      case 'AUTHENTICATION_ERROR':
      case 'AUTHORIZATION_ERROR':
        return 'auth';
      case 'VALIDATION_ERROR':
        return 'validation';
      case 'RATE_LIMIT_EXCEEDED':
        return 'rate_limit';
      case 'NOT_FOUND':
        return 'not_found';
      default:
        return 'generic';
    }
  }

  /**
   * Default error handling
   */
  private static handleDefault(type: ErrorType, error: ApiError): void {
    switch (type) {
      case 'auth':
        console.error('[ApiErrorHandler] Authentication error:', error);
        // Emit event for UI to handle (e.g., show login prompt)
        window.dispatchEvent(
          new CustomEvent('api-auth-error', { detail: error })
        );
        break;
      case 'validation':
        console.warn('[ApiErrorHandler] Validation error:', error);
        break;
      case 'rate_limit':
        console.warn('[ApiErrorHandler] Rate limit exceeded:', error);
        window.dispatchEvent(
          new CustomEvent('api-rate-limit', { detail: error })
        );
        break;
      case 'not_found':
        console.warn('[ApiErrorHandler] Resource not found:', error);
        break;
      default:
        console.error('[ApiErrorHandler] Error:', error);
        window.dispatchEvent(
          new CustomEvent('api-error', { detail: error })
        );
    }
  }
}

