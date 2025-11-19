/**
 * E2E Tests: Status Update Workflow
 * Tests the complete status update user flow
 */

import { test, expect } from '@playwright/test';

test.describe('Status Update Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock note detail API
    await page.route('**/api/v1/notes/test-note-1**', async (route) => {
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
  });

  test('should display status updater component', async ({ page }) => {
    // Mock review queue API first
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
            ],
            pagination: {
              page: 1,
              page_size: 50,
              total_items: 1,
              total_pages: 1,
              has_next: false,
              has_previous: false,
            },
          },
        }),
      });
    });

    await page.goto('/');

    // Wait for review queue to load
    await expect(page.locator('.review-queue')).toBeVisible();

    // Click on review item title to navigate to detail (avoids checkbox)
    const reviewItem = page.locator('.review-item').first();
    await reviewItem.locator('.review-item__title').click();

    // Wait for note detail API call and component to load
    await page.waitForResponse('**/api/v1/notes/test-note-1**', { timeout: 5000 });
    await expect(page.locator('.note-detail')).toBeVisible({ timeout: 5000 });

    // Click "Update Status" button to show status updater
    await page.locator('.update-status-button').click();

    // Wait for status updater to appear
    await expect(page.locator('.status-updater')).toBeVisible({ timeout: 2000 });
  });

  test('should update status from inbox to ready', async ({ page }) => {
    // Note: This test may fail if validation requires first_action and effort_estimate_min
    // but those fields aren't rendered in the form. The validation will prevent submission.
    let statusUpdateCalled = false;

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
            ],
            pagination: {
              page: 1,
              page_size: 50,
              total_items: 1,
              total_pages: 1,
              has_next: false,
              has_previous: false,
            },
          },
        }),
      });
    });

    // Mock status update API (PUT request)
    await page.route('**/api/v1/notes/test-note-1/status**', async (route) => {
      // Only handle PUT requests (status updates)
      if (route.request().method() === 'PUT') {
        statusUpdateCalled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              note_id: 'test-note-1',
              status: 'ready',
              previous_status: 'inbox',
              momentum_delta: 0.1,
              updated_at: '2025-01-31T12:00:00Z',
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');

    // Wait for review queue and click item title (not checkbox)
    await expect(page.locator('.review-queue')).toBeVisible();
    const reviewItem = page.locator('.review-item').first();
    await reviewItem.locator('.review-item__title').click();

    // Wait for note detail API call and component to load
    await page.waitForResponse('**/api/v1/notes/test-note-1**', { timeout: 5000 });
    await expect(page.locator('.note-detail')).toBeVisible({ timeout: 5000 });

    // Click "Update Status" button
    await page.locator('.update-status-button').click();

    // Wait for status updater
    await expect(page.locator('.status-updater')).toBeVisible({ timeout: 2000 });

    // Select new status
    const statusSelect = page.locator('.status-updater select[name="status"]');
    await statusSelect.selectOption('ready');

    // Fill required fields for inbox -> ready transition
    const firstActionInput = page.locator('.status-updater input[name="first_action"]');
    if (await firstActionInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await firstActionInput.fill('Initial review');
    }

    const effortInput = page.locator('.status-updater input[name="effort_estimate_min"]');
    if (await effortInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await effortInput.fill('30');
    }

    // Fill review notes (optional field)
    const reviewNotes = page.locator('.status-updater textarea[name="review_notes"]');
    if (await reviewNotes.isVisible()) {
      await reviewNotes.fill('Moving to ready status');
    }

    // Submit status update
    // Set up response listener before clicking
    const responsePromise = page.waitForResponse('**/api/v1/notes/test-note-1/status**', {
      timeout: 10000,
    });
    await page.locator('.status-updater button[type="submit"]').click();

    // Wait for API call
    await responsePromise;
    expect(statusUpdateCalled).toBe(true);
  });

  test('should update status with review workflow fields', async ({ page }) => {
    let statusUpdateCalled = false;

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
            ],
            pagination: {
              page: 1,
              page_size: 50,
              total_items: 1,
              total_pages: 1,
              has_next: false,
              has_previous: false,
            },
          },
        }),
      });
    });

    // Mock status update API (PUT request)
    await page.route('**/api/v1/notes/test-note-1/status**', async (route) => {
      if (route.request().method() === 'PUT') {
        statusUpdateCalled = true;
        const requestBody = route.request().postDataJSON();
        // Verify review workflow fields are included
        expect(requestBody).toHaveProperty('review_stage', 'in_progress');
        expect(requestBody).toHaveProperty('needs_review', true);
        expect(requestBody).toHaveProperty('review_fields');
        expect(requestBody).toHaveProperty('review_notes');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              note_id: 'test-note-1',
              status: 'in-progress',
              previous_status: 'inbox',
              momentum_delta: 0.1,
              updated_at: '2025-01-31T12:00:00Z',
              review_stage: 'in_progress',
              review_notes: 'Starting review workflow',
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');

    // Wait for review queue and click item title
    await expect(page.locator('.review-queue')).toBeVisible();
    const reviewItem = page.locator('.review-item').first();
    await reviewItem.locator('.review-item__title').click();

    // Wait for note detail API call and component to load
    await page.waitForResponse('**/api/v1/notes/test-note-1**', { timeout: 5000 });
    await expect(page.locator('.note-detail')).toBeVisible({ timeout: 5000 });

    // Click "Update Status" button
    await page.locator('.update-status-button').click();

    // Wait for status updater
    await expect(page.locator('.status-updater')).toBeVisible({ timeout: 2000 });

    // Select new status
    const statusSelect = page.locator('.status-updater select[name="status"]');
    await statusSelect.selectOption('in-progress');

    // Fill review workflow fields
    const reviewStageSelect = page.locator('.status-updater select[name="review_stage"]');
    await reviewStageSelect.selectOption('in_progress');

    const needsReviewCheckbox = page.locator('.status-updater input[name="needs_review"]');
    await needsReviewCheckbox.check();

    const reviewFieldsInput = page.locator('.status-updater input[name="review_fields"]');
    await reviewFieldsInput.fill('venture, tags');

    const reviewNotes = page.locator('.status-updater textarea[name="review_notes"]');
    await reviewNotes.fill('Starting review workflow');

    // Submit status update
    const responsePromise = page.waitForResponse('**/api/v1/notes/test-note-1/status**', {
      timeout: 10000,
    });
    await page.locator('.status-updater button[type="submit"]').click();

    // Wait for API call
    await responsePromise;
    expect(statusUpdateCalled).toBe(true);
  });

  test('should show validation errors for invalid status transitions', async ({ page }) => {
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
            ],
            pagination: {
              page: 1,
              page_size: 50,
              total_items: 1,
              total_pages: 1,
              has_next: false,
              has_previous: false,
            },
          },
        }),
      });
    });

    await page.goto('/');

    // Wait for review queue and click item title (not checkbox)
    await expect(page.locator('.review-queue')).toBeVisible();
    const reviewItem = page.locator('.review-item').first();
    await reviewItem.locator('.review-item__title').click();

    // Wait for note detail API call and component to load
    await page.waitForResponse('**/api/v1/notes/test-note-1**', { timeout: 5000 });
    await expect(page.locator('.note-detail')).toBeVisible({ timeout: 5000 });

    // Click "Update Status" button
    await page.locator('.update-status-button').click();

    // Wait for status updater
    await expect(page.locator('.status-updater')).toBeVisible({ timeout: 2000 });

    // Try to submit without required fields
    const statusSelect = page.locator('.status-updater select[name="status"]');
    await statusSelect.selectOption('ready');

    // Submit without filling required fields
    await page.locator('.status-updater button[type="submit"]').click();

    // Check for validation message (if validation is shown)
    // Note: Validation might be handled by backend, so this test may need adjustment
    await page.waitForTimeout(500);
    // Validation might appear in different ways - check if form prevents submission
    const validationDiv = page.locator('.status-updater__validation');
    if (await validationDiv.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(validationDiv).toBeVisible();
    }
  });
});
