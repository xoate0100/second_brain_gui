/**
 * E2E Tests for Note Body Editor
 * Tests note body editing functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Note Body Editor', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('http://localhost:3000');
    
    // Wait for review queue to load
    await page.waitForSelector('.review-queue', { timeout: 10000 });
  });

  test('should open editor when clicking Edit Body button', async ({ page }) => {
    // Navigate to note detail
    const firstItem = page.locator('.review-item__title').first();
    await expect(firstItem).toBeVisible({ timeout: 5000 });
    await firstItem.click();

    // Wait for note detail to load
    await page.waitForSelector('.note-detail', { timeout: 10000 });
    
    // Click Edit Body button
    const editBodyButton = page.locator('.edit-body-button');
    await expect(editBodyButton).toBeVisible({ timeout: 5000 });
    await editBodyButton.click();

    // Verify editor is visible
    const editor = page.locator('.note-body-editor');
    await expect(editor).toBeVisible({ timeout: 5000 });
    
    // Verify editor has content
    const editorTextarea = page.locator('.note-body-editor__editor');
    await expect(editorTextarea).toBeVisible();
  });

  test('should save note body changes', async ({ page }) => {
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
    
    // Edit content
    const editorTextarea = page.locator('.note-body-editor__editor');
    await editorTextarea.fill('# Updated Heading\n\nUpdated content');
    
    // Click save button
    const saveButton = page.locator('.note-body-editor__save');
    await expect(saveButton).toBeVisible();
    await saveButton.click();
    
    // Wait for save to complete (editor should close, markdown should update)
    await page.waitForTimeout(1000);
    
    // Verify markdown renderer is visible again
    const markdownRenderer = page.locator('.markdown-renderer');
    await expect(markdownRenderer).toBeVisible({ timeout: 5000 });
  });

  test('should cancel editing without saving', async ({ page }) => {
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
    
    // Edit content
    const editorTextarea = page.locator('.note-body-editor__editor');
    await editorTextarea.fill('# Changed Content');
    
    // Click cancel button
    const cancelButton = page.locator('.note-body-editor__cancel');
    await expect(cancelButton).toBeVisible();
    await cancelButton.click();
    
    // Wait for editor to close
    await page.waitForTimeout(500);
    
    // Verify markdown renderer is visible again
    const markdownRenderer = page.locator('.markdown-renderer');
    await expect(markdownRenderer).toBeVisible({ timeout: 5000 });
  });

  test('should support Ctrl+S keyboard shortcut to save', async ({ page }) => {
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
    
    // Edit content
    const editorTextarea = page.locator('.note-body-editor__editor');
    await editorTextarea.fill('# Keyboard Save Test');
    
    // Press Ctrl+S
    await editorTextarea.press('Control+s');
    
    // Wait for save to complete
    await page.waitForTimeout(1000);
    
    // Verify markdown renderer is visible again
    const markdownRenderer = page.locator('.markdown-renderer');
    await expect(markdownRenderer).toBeVisible({ timeout: 5000 });
  });

  test('should support Esc keyboard shortcut to cancel', async ({ page }) => {
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
    
    // Edit content
    const editorTextarea = page.locator('.note-body-editor__editor');
    await editorTextarea.fill('# Esc Test');
    
    // Press Esc
    await editorTextarea.press('Escape');
    
    // Wait for editor to close
    await page.waitForTimeout(500);
    
    // Verify markdown renderer is visible again
    const markdownRenderer = page.locator('.markdown-renderer');
    await expect(markdownRenderer).toBeVisible({ timeout: 5000 });
  });
});

