/**
 * E2E Tests for Inline Editing
 * Tests inline editing functionality in note detail view
 */

import { test, expect } from '@playwright/test';

test.describe('Inline Editing', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('http://localhost:3000');
    
    // Wait for review queue to load
    await page.waitForSelector('.review-queue', { timeout: 10000 });
  });

  test('should allow inline editing of tags', async ({ page }) => {
    // Navigate to note detail
    const firstItem = page.locator('.review-item__title').first();
    await expect(firstItem).toBeVisible({ timeout: 5000 });
    await firstItem.click();

    await page.waitForSelector('.note-detail', { timeout: 10000 });
    
    // Find tags inline editor
    const tagsContainer = page.locator('[data-field="tags"]');
    await expect(tagsContainer).toBeVisible({ timeout: 5000 });
    
    // Click to edit
    const tagsDisplay = tagsContainer.locator('.inline-editor__display');
    await tagsDisplay.click();
    
    // Verify input appears
    const tagsInput = tagsContainer.locator('.inline-editor__input');
    await expect(tagsInput).toBeVisible();
    
    // Edit value
    await tagsInput.fill('tag1, tag2, tag3');
    
    // Press Enter to save
    await tagsInput.press('Enter');
    
    // Wait for save to complete
    await page.waitForTimeout(1000);
    
    // Verify display shows new value
    await expect(tagsDisplay).toContainText('tag1');
  });

  test('should allow inline editing of AI Summary', async ({ page }) => {
    // Navigate to note detail
    const firstItem = page.locator('.review-item__title').first();
    await expect(firstItem).toBeVisible({ timeout: 5000 });
    await firstItem.click();

    await page.waitForSelector('.note-detail', { timeout: 10000 });
    
    // Find AI Summary inline editor
    const summaryContainer = page.locator('[data-field="ai_summary"]');
    await expect(summaryContainer).toBeVisible({ timeout: 5000 });
    
    // Click to edit
    const summaryDisplay = summaryContainer.locator('.inline-editor__display');
    await summaryDisplay.click();
    
    // Verify input appears
    const summaryInput = summaryContainer.locator('.inline-editor__input');
    await expect(summaryInput).toBeVisible();
    
    // Edit value
    await summaryInput.fill('Updated AI Summary');
    
    // Press Enter to save
    await summaryInput.press('Enter');
    
    // Wait for save to complete
    await page.waitForTimeout(1000);
    
    // Verify display shows new value
    await expect(summaryDisplay).toContainText('Updated AI Summary');
  });

  test('should cancel editing on Esc key', async ({ page }) => {
    // Navigate to note detail
    const firstItem = page.locator('.review-item__title').first();
    await expect(firstItem).toBeVisible({ timeout: 5000 });
    await firstItem.click();

    await page.waitForSelector('.note-detail', { timeout: 10000 });
    
    // Find tags inline editor
    const tagsContainer = page.locator('[data-field="tags"]');
    await expect(tagsContainer).toBeVisible({ timeout: 5000 });
    
    // Get original value
    const tagsDisplay = tagsContainer.locator('.inline-editor__display');
    const originalValue = await tagsDisplay.textContent();
    
    // Click to edit
    await tagsDisplay.click();
    
    // Edit value
    const tagsInput = tagsContainer.locator('.inline-editor__input');
    await tagsInput.fill('Changed Value');
    
    // Press Esc to cancel
    await tagsInput.press('Escape');
    
    // Wait for edit mode to exit
    await page.waitForTimeout(500);
    
    // Verify original value is restored
    await expect(tagsDisplay).toContainText(originalValue || '');
  });

  test('should save on blur', async ({ page }) => {
    // Navigate to note detail
    const firstItem = page.locator('.review-item__title').first();
    await expect(firstItem).toBeVisible({ timeout: 5000 });
    await firstItem.click();

    await page.waitForSelector('.note-detail', { timeout: 10000 });
    
    // Find tags inline editor
    const tagsContainer = page.locator('[data-field="tags"]');
    await expect(tagsContainer).toBeVisible({ timeout: 5000 });
    
    // Click to edit
    const tagsDisplay = tagsContainer.locator('.inline-editor__display');
    await tagsDisplay.click();
    
    // Edit value
    const tagsInput = tagsContainer.locator('.inline-editor__input');
    await tagsInput.fill('Blur Save Test');
    
    // Click outside to trigger blur
    await page.click('body');
    
    // Wait for save to complete
    await page.waitForTimeout(1000);
    
    // Verify display shows new value
    await expect(tagsDisplay).toContainText('Blur Save Test');
  });
});

