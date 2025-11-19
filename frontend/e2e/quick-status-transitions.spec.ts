/**
 * E2E Tests for Quick Status Transitions
 * Tests quick status transition buttons in review queue
 */

import { test, expect } from '@playwright/test';

test.describe('Quick Status Transitions', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('http://localhost:3000');

    // Wait for review queue to load
    await page.waitForSelector('.review-queue', { timeout: 10000 });
  });

  test('should show quick action buttons for inbox status', async ({ page }) => {
    // Mock API to return item with inbox status
    await page.route('**/api/v1/review/queue**', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          items: [{
            note_id: 'test-note-1',
            title: 'Test Note',
            venture: 'SWS',
            domain: 'test',
            status: 'inbox',
            age_days: 5,
            momentum_score: 0.5,
          }],
          pagination: { page: 1, page_size: 20, total_items: 1, total_pages: 1, has_next: false, has_previous: false },
        }),
      });
    });

    // Reload to trigger API call
    await page.reload();
    await page.waitForSelector('.review-queue', { timeout: 10000 });

    // Verify quick action buttons are visible
    const quickActions = page.locator('.review-item__quick-action');
    await expect(quickActions.first()).toBeVisible({ timeout: 5000 });

    // Verify "Ready" button exists for inbox status
    const readyButton = page.locator('.review-item__quick-action[data-status="ready"]');
    await expect(readyButton).toBeVisible();
  });

  test('should show quick action buttons for ready status', async ({ page }) => {
    // Mock API to return item with ready status
    await page.route('**/api/v1/review/queue**', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          items: [{
            note_id: 'test-note-1',
            title: 'Test Note',
            venture: 'SWS',
            domain: 'test',
            status: 'ready',
            age_days: 5,
            momentum_score: 0.5,
          }],
          pagination: { page: 1, page_size: 20, total_items: 1, total_pages: 1, has_next: false, has_previous: false },
        }),
      });
    });

    // Reload to trigger API call
    await page.reload();
    await page.waitForSelector('.review-queue', { timeout: 10000 });

    // Verify "Start" button exists for ready status
    const startButton = page.locator('.review-item__quick-action[data-status="in-progress"]');
    await expect(startButton).toBeVisible({ timeout: 5000 });
  });

  test('should update status when quick action button clicked', async ({ page }) => {
    let statusUpdateCalled = false;

    // Mock status update API
    await page.route('**/api/v1/notes/test-note-1/status**', route => {
      statusUpdateCalled = true;
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          note_id: 'test-note-1',
          status: 'ready',
          previous_status: 'inbox',
          momentum_delta: 0.1,
          updated_at: new Date().toISOString(),
        }),
      });
    });

    // Mock queue API
    await page.route('**/api/v1/review/queue**', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          items: [{
            note_id: 'test-note-1',
            title: 'Test Note',
            venture: 'SWS',
            domain: 'test',
            status: 'inbox',
            age_days: 5,
            momentum_score: 0.5,
          }],
          pagination: { page: 1, page_size: 20, total_items: 1, total_pages: 1, has_next: false, has_previous: false },
        }),
      });
    });

    // Reload to trigger API call
    await page.reload();
    await page.waitForSelector('.review-queue', { timeout: 10000 });

    // Click quick action button
    const readyButton = page.locator('.review-item__quick-action[data-status="ready"]');
    await expect(readyButton).toBeVisible({ timeout: 5000 });
    await readyButton.click();

    // Wait for API call
    await page.waitForTimeout(1000);

    // Verify status update was called
    expect(statusUpdateCalled).toBe(true);

    // Verify success toast appears
    const successToast = page.locator('.toast--success');
    await expect(successToast).toBeVisible({ timeout: 5000 });
  });
});

