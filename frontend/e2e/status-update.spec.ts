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
    await page.goto('/');
    
    // Navigate to note detail (mock the click)
    await page.evaluate(() => {
      const event = new CustomEvent('note:selected', { detail: { noteId: 'test-note-1' } });
      window.dispatchEvent(event);
    });

    // Wait for note detail to load
    await expect(page.locator('.note-detail')).toBeVisible();
    await expect(page.locator('.status-updater')).toBeVisible();
  });

  test('should update status from inbox to ready', async ({ page }) => {
    let statusUpdateCalled = false;

    // Mock status update API
    await page.route('**/api/v1/notes/test-note-1/status**', async (route) => {
      statusUpdateCalled = true;
      const request = route.request();
      const postData = request.postDataJSON();

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
    });

    await page.goto('/');

    // Navigate to note detail
    await page.evaluate(() => {
      const event = new CustomEvent('note:selected', { detail: { noteId: 'test-note-1' } });
      window.dispatchEvent(event);
    });

    // Wait for status updater
    await expect(page.locator('.status-updater')).toBeVisible();

    // Select new status
    const statusSelect = page.locator('.status-updater select[name="status"]');
    await statusSelect.selectOption('ready');

    // Fill required fields for inbox -> ready transition
    const firstActionInput = page.locator('.status-updater input[name="first_action"]');
    if (await firstActionInput.isVisible()) {
      await firstActionInput.fill('Initial review');
    }

    const effortInput = page.locator('.status-updater input[name="effort_estimate_min"]');
    if (await effortInput.isVisible()) {
      await effortInput.fill('30');
    }

    // Submit status update
    await page.locator('.status-updater button[type="submit"]').click();

    // Wait for API call
    await page.waitForTimeout(500);
    expect(statusUpdateCalled).toBe(true);
  });

  test('should show validation errors for invalid status transitions', async ({ page }) => {
    await page.goto('/');

    // Navigate to note detail
    await page.evaluate(() => {
      const event = new CustomEvent('note:selected', { detail: { noteId: 'test-note-1' } });
      window.dispatchEvent(event);
    });

    // Wait for status updater
    await expect(page.locator('.status-updater')).toBeVisible();

    // Try to submit without required fields
    const statusSelect = page.locator('.status-updater select[name="status"]');
    await statusSelect.selectOption('ready');

    // Submit without filling required fields
    await page.locator('.status-updater button[type="submit"]').click();

    // Check for validation message
    await expect(page.locator('.status-updater__validation')).toBeVisible();
  });
});

