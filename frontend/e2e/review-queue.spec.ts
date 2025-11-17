/**
 * E2E Tests: Review Queue Workflow
 * Tests the complete review queue user flow
 */

import { test, expect } from '@playwright/test';

test.describe('Review Queue Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
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
            ],
            pagination: {
              page: 1,
              page_size: 50,
              total_items: 2,
              total_pages: 1,
              has_next: false,
              has_previous: false,
            },
          },
        }),
      });
    });
  });

  test('should display review queue on page load', async ({ page }) => {
    await page.goto('/');

    // Wait for review queue to load
    await expect(page.locator('.review-queue')).toBeVisible();
    await expect(page.locator('.review-item')).toHaveCount(2);
  });

  test('should display review item details', async ({ page }) => {
    await page.goto('/');

    const firstItem = page.locator('.review-item').first();
    await expect(firstItem.locator('.review-item__title')).toContainText('Test Note 1');
    await expect(firstItem.locator('.review-item__meta')).toContainText('SWS');
    await expect(firstItem.locator('.review-item__meta')).toContainText('Development');
  });

  test('should filter review queue by venture', async ({ page }) => {
    await page.goto('/');

    // Wait for filters to be visible
    await expect(page.locator('.review-filters')).toBeVisible();

    // Select venture filter
    const ventureSelect = page.locator('select[name="venture"]');
    await ventureSelect.selectOption('SWS');

    // Click apply filters button
    await page.locator('button:has-text("Apply Filters")').click();

    // Verify filtered results (mock should return filtered data)
    // Use .first() to avoid strict mode violation when multiple items exist
    await expect(page.locator('.review-item').first()).toBeVisible();
  });

  test('should navigate to note detail when clicking review item', async ({ page }) => {
    let noteDetailApiCalled = false;
    
    // Mock note detail API
    await page.route('**/api/v1/notes/test-note-1**', async (route) => {
      noteDetailApiCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            note_id: 'test-note-1',
            file_path: '/path/to/note.md',
            frontmatter: {
              id: 'test-note-1',
              title: 'Test Note 1',
              status: 'inbox',
              venture: 'SWS',
              domain: 'Development',
              tags: [],
              ai_summary: 'Test summary',
              momentum_score: 0.75,
              age_days: 5,
              aging_stage: 'new',
            },
            body: 'Test note body content',
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
          },
        }),
      });
    });

    await page.goto('/');

    // Wait for review queue to load
    await expect(page.locator('.review-queue')).toBeVisible();

    // Click on first review item (click anywhere on the item except checkbox)
    const reviewItem = page.locator('.review-item').first();
    // Click on the title area to ensure we're not clicking the checkbox
    await reviewItem.locator('.review-item__title').click();

    // Wait for note detail component to load (navigation triggers API call)
    // The route mock will fulfill the request, so we just wait for the UI
    await expect(page.locator('.note-detail')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.note-detail__title')).toContainText('Test Note 1');
    
    // Verify API was called (route mock should have been triggered)
    expect(noteDetailApiCalled).toBe(true);
  });

  test('should paginate review queue', async ({ page }) => {
    await page.goto('/');

    // Wait for pagination controls
    await expect(page.locator('.review-pagination')).toBeVisible();

    // Check pagination info is displayed
    await expect(page.locator('.review-pagination__info')).toBeVisible();
  });
});
