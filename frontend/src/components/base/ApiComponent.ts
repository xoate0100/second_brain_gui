/**
 * API-Aware Component Base Class
 * Extends Component with API client integration
 * 
 * Responsibilities:
 * - Provides API client to subclasses
 * - Centralizes API error handling
 * 
 * SOLID Principles:
 * - SRP: Single responsibility - API integration
 * - OCP: Open for extension via abstract methods
 * - DIP: Depends on ApiClient interface, not concrete implementation
 */

import { Component } from './Component';
import type { ApiClient, ApiError } from '../../types/api';

export abstract class ApiComponent extends Component {
  constructor(
    container: HTMLElement,
    protected apiClient: ApiClient
  ) {
    super(container);
  }

  /**
   * Handle API errors consistently
   * Can be overridden by subclasses for custom error handling
   * @param error - API error object
   */
  protected async handleApiError(error: ApiError): Promise<void> {
    console.error('[ApiComponent] API Error:', error);
    
    // Emit error event for parent components to handle
    this.emit('api-error', { error });
  }
}


