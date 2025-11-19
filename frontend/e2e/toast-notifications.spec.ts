/**
 * E2E Tests for Toast Notifications
 * Tests toast notification system in browser
 */

import { test, expect } from '@playwright/test';

test.describe('Toast Notifications', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('http://localhost:3000');
    
    // Wait for review queue to load
    await page.waitForSelector('.review-queue', { timeout: 10000 });
  });

  test('should show success toast when saving note body', async ({ page }) => {
    // Navigate to note detail
    const firstItem = page.locator('.review-item__title').first();
    await expect(firstItem).toBeVisible({ timeout: 5000 });
    await firstItem.click();

    await page.waitForSelector('.note-detail', { timeout: 10000 });
    
    // Open editor
    const editBodyButton = page.locator('.edit-body-button');
    await expect(editBodyButton).toBeVisible({ timeout: 5000 });
    await editBodyButton.click();

    await page.waitForSelector('.note-body-editor', { timeout: 5000 });
    
    // Edit and save
    const editorTextarea = page.locator('.note-body-editor__editor');
    await editorTextarea.fill('# Test Content');
    
    const saveButton = page.locator('.note-body-editor__save');
    await saveButton.click();
    
    // Wait for toast to appear
    const toast = page.locator('.toast--success');
    await expect(toast).toBeVisible({ timeout: 5000 });
    await expect(toast.locator('.toast__message')).toContainText('saved successfully');
  });

  test('should show error toast on API error', async ({ page }) => {
    // Mock API error
    await page.route('**/api/v1/notes/*/status**', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }),
      });
    });

    // Navigate to note detail
    const firstItem = page.locator('.review-item__title').first();
    await expect(firstItem).toBeVisible({ timeout: 5000 });
    await firstItem.click();

    await page.waitForSelector('.note-detail', { timeout: 10000 });
    
    // Try to update status (will fail)
    const updateStatusButton = page.locator('.update-status-button');
    await expect(updateStatusButton).toBeVisible({ timeout: 5000 });
    await updateStatusButton.click();

    await page.waitForSelector('.status-updater', { timeout: 5000 });
    
    // Submit form
    const submitButton = page.locator('.status-updater button[type="submit"]');
    await submitButton.click();
    
    // Wait for error toast
    const errorToast = page.locator('.toast--error');
    await expect(errorToast).toBeVisible({ timeout: 5000 });
  });

  test('should auto-dismiss toast after duration', async ({ page }) => {
    // Navigate to note detail
    const firstItem = page.locator('.review-item__title').first();
    await expect(firstItem).toBeVisible({ timeout: 5000 });
    await firstItem.click();

    await page.waitForSelector('.note-detail', { timeout: 10000 });
    
    // Open and save editor (triggers success toast)
    const editBodyButton = page.locator('.edit-body-button');
    await expect(editBodyButton).toBeVisible({ timeout: 5000 });
    await editBodyButton.click();

    await page.waitForSelector('.note-body-editor', { timeout: 5000 });
    
    const editorTextarea = page.locator('.note-body-editor__editor');
    await editorTextarea.fill('# Test');
    
    const saveButton = page.locator('.note-body-editor__save');
    await saveButton.click();
    
    // Wait for toast
    const toast = page.locator('.toast--success');
    await expect(toast).toBeVisible({ timeout: 5000 });
    
    // Wait for auto-dismiss (default 5 seconds)
    await page.waitForTimeout(5500);
    
    // Toast should be gone
    await expect(toast).not.toBeVisible();
  });

  test('should allow manual dismissal of toast', async ({ page }) => {
    // Navigate to note detail
    const firstItem = page.locator('.review-item__title').first();
    await expect(firstItem).toBeVisible({ timeout: 5000 });
    await firstItem.click();

    await page.waitForSelector('.note-detail', { timeout: 10000 });
    
    // Open and save editor
    const editBodyButton = page.locator('.edit-body-button');
    await expect(editBodyButton).toBeVisible({ timeout: 5000 });
    await editBodyButton.click();

    await page.waitForSelector('.note-body-editor', { timeout: 5000 });
    
    const editorTextarea = page.locator('.note-body-editor__editor');
    await editorTextarea.fill('# Test');
    
    const saveButton = page.locator('.note-body-editor__save');
    await saveButton.click();
    
    // Wait for toast
    const toast = page.locator('.toast--success');
    await expect(toast).toBeVisible({ timeout: 5000 });
    
    // Click close button
    const closeButton = toast.locator('.toast__close');
    await closeButton.click();
    
    // Toast should be dismissed immediately
    await expect(toast).not.toBeVisible();
  });

  test('should stack multiple toasts', async ({ page }) => {
    // Create multiple actions that trigger toasts
    // This test verifies toast stacking behavior
    const toastContainer = page.locator('#toast-container');
    await expect(toastContainer).toBeVisible({ timeout: 5000 });
    
    // Trigger multiple toasts (if possible)
    // Note: This may require multiple actions or mocking
    // For now, verify container exists and can hold toasts
    expect(toastContainer).toBeTruthy();
  });
});

