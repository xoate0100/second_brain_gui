/**
 * Review GUI Frontend - Entry Point
 *
 * Main entry point for the Review GUI Frontend application.
 * Initializes the application and mounts it to the DOM.
 */

// Import styles
import './styles/variables.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';

import { App } from './app';

/**
 * Initialize the application
 */
function init(): void {
  const container = document.getElementById('app');
  if (!container) {
    throw new Error('Application container not found. Expected element with id="app"');
  }

  // Get configuration from runtime config (config.js) or environment variables or defaults
  // Priority: window.__APP_CONFIG__ > import.meta.env > defaults
  const runtimeConfig = (
    window as unknown as {
      __APP_CONFIG__?: { apiBaseUrl?: string; apiKey?: string; jwtToken?: string };
    }
  ).__APP_CONFIG__;
  const apiBaseUrl =
    runtimeConfig?.apiBaseUrl || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  const apiKey = runtimeConfig?.apiKey || import.meta.env.VITE_API_KEY || '';
  const jwtToken = runtimeConfig?.jwtToken || import.meta.env.VITE_JWT_TOKEN;

  // Log configuration source for debugging
  if (runtimeConfig) {
    console.log('[Config] Using runtime config from config.js');
  } else if (import.meta.env.VITE_API_KEY || import.meta.env.VITE_API_BASE_URL) {
    console.log('[Config] Using Vite environment variables');
  } else {
    console.log('[Config] Using default values');
  }

  if (!apiKey) {
    console.error('❌ API key not set! Check config.js or environment variables.');
    console.error('Expected: window.__APP_CONFIG__.apiKey or VITE_API_KEY');
  } else {
    console.log('✅ API key loaded:', apiKey.substring(0, 20) + '...');
  }

  console.log('✅ API Base URL:', apiBaseUrl);

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
