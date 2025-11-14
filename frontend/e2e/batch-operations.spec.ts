/**
 * E2E Tests: Batch Operations Workflow
 * Tests the complete batch operations user flow
 */

import { test, expect } from '@playwright/test';

test.describe('Batch Operations Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock review queue API
    await page.route('**/api/v1/review/queue**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            items: [
              {
                note_id: 'test-note-1',
                title: 'Test Note 1',
                venture: 'SWS',
                domain: 'Development',
                status: 'inbox',
                age_days: 5,
                momentum_score: 0.75,
              },
              {
                note_id: 'test-note-2',
                title: 'Test Note 2',
                venture: 'CRL',
                domain: 'Research',
                status: 'ready',
                age_days: 10,
                momentum_score: 0.85,
              },
              {
                note_id: 'test-note-3',
                title: 'Test Note 3',
                venture: 'ERA',
                domain: 'Analysis',
                status: 'inbox',
                age_days: 3,
                momentum_score: 0.65,
              },
            ],
            pagination: {
              page: 1,
              page_size: 50,
              total_items: 3,
              total_pages: 1,
              has_next: false,
              has_previous: false,
            },
          },
        }),
      });
    });
  });

  test('should display batch selector', async ({ page }) => {
    await page.goto('/');

    // Wait for review queue to load
    await expect(page.locator('.review-queue')).toBeVisible();

    // Check for batch selector
    await expect(page.locator('.batch-selector')).toBeVisible();
  });

  test('should select multiple items for batch operations', async ({ page }) => {
    await page.goto('/');

    // Wait for review items to load
    await expect(page.locator('.review-item')).toHaveCount(3);

    // Select first item
    await page.locator('.review-item').first().locator('.review-item__checkbox').check();

    // Select second item
    await page.locator('.review-item').nth(1).locator('.review-item__checkbox').check();

    // Verify items are selected
    await expect(page.locator('.review-item').first().locator('.review-item__checkbox')).toBeChecked();
    await expect(page.locator('.review-item').nth(1).locator('.review-item__checkbox')).toBeChecked();
  });

  test('should display batch actions when items are selected', async ({ page }) => {
    await page.goto('/');

    // Select items
    await page.locator('.review-item').first().locator('.review-item__checkbox').check();
    await page.locator('.review-item').nth(1).locator('.review-item__checkbox').check();

    // Check for batch actions
    await expect(page.locator('.batch-actions')).toBeVisible();
  });

  test('should perform batch status update', async ({ page }) => {
    let batchUpdateCalled = false;

    // Mock batch update API
    await page.route('**/api/v1/notes/batch/update**', async (route) => {
      batchUpdateCalled = true;
      const request = route.request();
      const postData = request.postDataJSON();

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            total: 2,
            succeeded: 2,
            failed: 0,
            results: [
              {
                note_id: 'test-note-1',
                success: true,
              },
              {
                note_id: 'test-note-2',
                success: true,
              },
            ],
          },
        }),
      });
    });

    await page.goto('/');

    // Select items
    await page.locator('.review-item').first().locator('.review-item__checkbox').check();
    await page.locator('.review-item').nth(1).locator('.review-item__checkbox').check();

    // Click batch update status button
    await page.locator('.batch-actions button:has-text("Update Status")').click();

    // Wait for batch results modal
    await expect(page.locator('.batch-results')).toBeVisible();

    // Verify API was called
    await page.waitForTimeout(500);
    expect(batchUpdateCalled).toBe(true);
  });

  test('should display batch operation results', async ({ page }) => {
    // Mock batch update API with mixed results
    await page.route('**/api/v1/notes/batch/update**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            total: 2,
            succeeded: 1,
            failed: 1,
            results: [
              {
                note_id: 'test-note-1',
                success: true,
              },
              {
                note_id: 'test-note-2',
                success: false,
                error: 'Validation failed',
              },
            ],
          },
        }),
      });
    });

    await page.goto('/');

    // Select items
    await page.locator('.review-item').first().locator('.review-item__checkbox').check();
    await page.locator('.review-item').nth(1).locator('.review-item__checkbox').check();

    // Perform batch operation
    await page.locator('.batch-actions button:has-text("Update Status")').click();

    // Wait for results modal
    await expect(page.locator('.batch-results')).toBeVisible();

    // Check results summary
    await expect(page.locator('.batch-results__summary')).toBeVisible();
    await expect(page.locator('.batch-results__stat-value--success')).toContainText('1');
    await expect(page.locator('.batch-results__stat-value--error')).toContainText('1');
  });

  test('should close batch results modal', async ({ page }) => {
    // Mock batch update API
    await page.route('**/api/v1/notes/batch/update**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            total: 1,
            succeeded: 1,
            failed: 0,
            results: [
              {
                note_id: 'test-note-1',
                success: true,
              },
            ],
          },
        }),
      });
    });

    await page.goto('/');

    // Select item and perform batch operation
    await page.locator('.review-item').first().locator('.review-item__checkbox').check();
    await page.locator('.batch-actions button:has-text("Update Status")').click();

    // Wait for results modal
    await expect(page.locator('.batch-results')).toBeVisible();

    // Close modal
    await page.locator('.batch-results button:has-text("Close")').click();

    // Verify modal is closed
    await expect(page.locator('.batch-results')).not.toBeVisible();
  });
});

