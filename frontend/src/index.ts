/**
 * Review GUI Frontend - Entry Point
 *
 * Main entry point for the Review GUI Frontend application.
 * Initializes the application and mounts it to the DOM.
 */

import { App } from './app';

/**
 * Initialize the application
 */
function init(): void {
  const container = document.getElementById('app');
  if (!container) {
    throw new Error('Application container not found. Expected element with id="app"');
  }

  // Get configuration from environment variables or defaults
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const apiKey = import.meta.env.VITE_API_KEY || '';
  const jwtToken = import.meta.env.VITE_JWT_TOKEN;

  if (!apiKey) {
    console.warn('VITE_API_KEY not set. API calls may fail. Set it in .env file or environment.');
  }

  // Initialize application
  const app = new App(container, {
    apiBaseUrl,
    apiKey,
    jwtToken,
  });

  // Make app available globally for debugging (development only)
  if (import.meta.env.DEV) {
    (window as unknown as { app: App }).app = app;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
