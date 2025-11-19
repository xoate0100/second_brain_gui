/**
 * E2E Tests for Visible Action Hints
 * Tests first_action and resume_hint display in review queue
 */

import { test, expect } from '@playwright/test';

test.describe('Visible Action Hints', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('http://localhost:3000');
    
    // Wait for review queue to load
    await page.waitForSelector('.review-queue', { timeout: 10000 });
  });

  test('should display first_action in review queue', async ({ page }) => {
    // Mock API to return item with first_action
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
            first_action: 'Review the proposal document',
          }],
          pagination: { page: 1, page_size: 20, total_items: 1, total_pages: 1, has_next: false, has_previous: false },
        }),
      });
    });

    // Reload to trigger API call
    await page.reload();
    await page.waitForSelector('.review-queue', { timeout: 10000 });
    
    // Verify first_action is visible
    const firstAction = page.locator('.review-item__first-action');
    await expect(firstAction).toBeVisible({ timeout: 5000 });
    await expect(firstAction).toContainText('Review the proposal document');
  });

  test('should display resume_hint in review queue', async ({ page }) => {
    // Mock API to return item with resume_hint
    await page.route('**/api/v1/review/queue**', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          items: [{
            note_id: 'test-note-1',
            title: 'Test Note',
            venture: 'SWS',
            domain: 'test',
            status: 'in-progress',
            age_days: 5,
            momentum_score: 0.5,
            resume_hint: 'Continue from section 3',
          }],
          pagination: { page: 1, page_size: 20, total_items: 1, total_pages: 1, has_next: false, has_previous: false },
        }),
      });
    });

    // Reload to trigger API call
    await page.reload();
    await page.waitForSelector('.review-queue', { timeout: 10000 });
    
    // Verify resume_hint is visible
    const resumeHint = page.locator('.review-item__resume-hint');
    await expect(resumeHint).toBeVisible({ timeout: 5000 });
    await expect(resumeHint).toContainText('Continue from section 3');
  });

  test('should display both first_action and resume_hint when both present', async ({ page }) => {
    // Mock API to return item with both fields
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
            first_action: 'Start here',
            resume_hint: 'Resume here',
          }],
          pagination: { page: 1, page_size: 20, total_items: 1, total_pages: 1, has_next: false, has_previous: false },
        }),
      });
    });

    // Reload to trigger API call
    await page.reload();
    await page.waitForSelector('.review-queue', { timeout: 10000 });
    
    // Verify both are visible
    const firstAction = page.locator('.review-item__first-action');
    const resumeHint = page.locator('.review-item__resume-hint');
    await expect(firstAction).toBeVisible({ timeout: 5000 });
    await expect(resumeHint).toBeVisible({ timeout: 5000 });
  });
});

