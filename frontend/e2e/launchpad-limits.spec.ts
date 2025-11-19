/**
 * E2E Tests for Launchpad Limits
 * Tests anti-overwhelm limits in review queue
 */

import { test, expect } from '@playwright/test';

test.describe('Launchpad Limits', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('http://localhost:3000');

    // Wait for review queue to load
    await page.waitForSelector('.review-queue', { timeout: 10000 });
  });

  test('should limit items to 20 when showing all ventures', async ({ page }) => {
    // Mock API to return more than 20 items
    await page.route('**/api/v1/review/queue**', route => {
      const items = Array.from({ length: 30 }, (_, i) => ({
        note_id: `test-note-${i}`,
        title: `Test Note ${i}`,
        venture: 'SWS',
        domain: 'test',
        status: 'ready',
        age_days: 5,
        momentum_score: 0.5,
      }));
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          items,
          pagination: { page: 1, page_size: 20, total_items: 30, total_pages: 2, has_next: true, has_previous: false },
        }),
      });
    });

    // Reload page to trigger new API call
    await page.reload();
    await page.waitForSelector('.review-queue', { timeout: 10000 });

    // Verify only 20 items are displayed
    const items = page.locator('.review-item');
    const itemCount = await items.count();
    expect(itemCount).toBeLessThanOrEqual(20);

    // Verify overflow indicator is shown
    const overflowIndicator = page.locator('.overflow-indicator');
    await expect(overflowIndicator).toBeVisible({ timeout: 5000 });
  });

  test('should limit items to 8 per venture when filtered', async ({ page }) => {
    // Mock API to return more than 8 items for a venture
    await page.route('**/api/v1/review/queue?venture=SWS**', route => {
      const items = Array.from({ length: 15 }, (_, i) => ({
        note_id: `test-note-${i}`,
        title: `Test Note ${i}`,
        venture: 'SWS',
        domain: 'test',
        status: 'ready',
        age_days: 5,
        momentum_score: 0.5,
      }));
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          items,
          pagination: { page: 1, page_size: 8, total_items: 15, total_pages: 2, has_next: true, has_previous: false },
        }),
      });
    });

    // Apply venture filter
    const ventureFilter = page.locator('[name="venture"]');
    await ventureFilter.selectOption('SWS');

    const applyButton = page.locator('button:has-text("Apply Filters")');
    await applyButton.click();

    await page.waitForTimeout(1000);

    // Verify only 8 items are displayed
    const items = page.locator('.review-item');
    const itemCount = await items.count();
    expect(itemCount).toBeLessThanOrEqual(8);

    // Verify overflow indicator is shown
    const overflowIndicator = page.locator('.overflow-indicator');
    await expect(overflowIndicator).toBeVisible({ timeout: 5000 });
  });

  test('should show all items when "Show All" is clicked', async ({ page }) => {
    // Mock API to return more than 20 items
    await page.route('**/api/v1/review/queue**', route => {
      const items = Array.from({ length: 30 }, (_, i) => ({
        note_id: `test-note-${i}`,
        title: `Test Note ${i}`,
        venture: 'SWS',
        domain: 'test',
        status: 'ready',
        age_days: 5,
        momentum_score: 0.5,
      }));
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          items,
          pagination: { page: 1, page_size: 30, total_items: 30, total_pages: 1, has_next: false, has_previous: false },
        }),
      });
    });

    // Reload page
    await page.reload();
    await page.waitForSelector('.review-queue', { timeout: 10000 });

    // Click "Show All" button
    const showAllButton = page.locator('.overflow-indicator__show-all');
    await expect(showAllButton).toBeVisible({ timeout: 5000 });
    await showAllButton.click();

    // Wait for reload
    await page.waitForTimeout(1000);

    // Verify overflow indicator is hidden
    const overflowIndicator = page.locator('.overflow-indicator');
    await expect(overflowIndicator).not.toBeVisible();
  });
});

