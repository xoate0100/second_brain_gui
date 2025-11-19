/**
 * E2E Tests for Momentum Visualization
 * Tests momentum score visualization in review queue
 */

import { test, expect } from '@playwright/test';

test.describe('Momentum Visualization', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('http://localhost:3000');
    
    // Wait for review queue to load
    await page.waitForSelector('.review-queue', { timeout: 10000 });
  });

  test('should display momentum bar visualization', async ({ page }) => {
    // Mock API to return item with momentum score
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
            momentum_score: 0.75,
          }],
          pagination: { page: 1, page_size: 20, total_items: 1, total_pages: 1, has_next: false, has_previous: false },
        }),
      });
    });

    // Reload to trigger API call
    await page.reload();
    await page.waitForSelector('.review-queue', { timeout: 10000 });
    
    // Verify momentum bar is visible
    const momentumBar = page.locator('.review-item__momentum-bar');
    await expect(momentumBar).toBeVisible({ timeout: 5000 });
    
    // Verify momentum fill has correct width
    const momentumFill = page.locator('.review-item__momentum-fill');
    await expect(momentumFill).toBeVisible();
    const width = await momentumFill.evaluate(el => (el as HTMLElement).style.width);
    expect(width).toBe('75%');
  });

  test('should display momentum value', async ({ page }) => {
    // Mock API to return item with momentum score
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
            momentum_score: 0.65,
          }],
          pagination: { page: 1, page_size: 20, total_items: 1, total_pages: 1, has_next: false, has_previous: false },
        }),
      });
    });

    // Reload to trigger API call
    await page.reload();
    await page.waitForSelector('.review-queue', { timeout: 10000 });
    
    // Verify momentum value is displayed
    const momentumValue = page.locator('.review-item__momentum-value');
    await expect(momentumValue).toBeVisible({ timeout: 5000 });
    await expect(momentumValue).toContainText('0.65');
  });

  test('should cap momentum bar at 100%', async ({ page }) => {
    // Mock API to return item with momentum score > 1.0
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
            momentum_score: 1.5,
          }],
          pagination: { page: 1, page_size: 20, total_items: 1, total_pages: 1, has_next: false, has_previous: false },
        }),
      });
    });

    // Reload to trigger API call
    await page.reload();
    await page.waitForSelector('.review-queue', { timeout: 10000 });
    
    // Verify momentum fill is capped at 100%
    const momentumFill = page.locator('.review-item__momentum-fill');
    await expect(momentumFill).toBeVisible({ timeout: 5000 });
    const width = await momentumFill.evaluate(el => (el as HTMLElement).style.width);
    expect(width).toBe('100%');
  });
});

