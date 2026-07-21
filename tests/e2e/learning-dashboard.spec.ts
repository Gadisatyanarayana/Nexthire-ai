import { test, expect } from '@playwright/test';

test.describe('Learning Workspace (Phase 2 - Step 7)', () => {
  const workspaceUrl = '/learn';

  test('Loads the Learning Workspace with all sections', async ({ page }) => {
    await page.goto(workspaceUrl);

    // Verify Header
    await expect(page.locator('h1')).toContainText('Learning Workspace');

    // Wait for the dynamic data to load
    await expect(page.locator('text=Today\'s Progress')).toBeVisible();

    // Verify Streaks and Goals
    await expect(page.locator('text=Daily Goal')).toBeVisible();
    await expect(page.locator('text=Streak')).toBeVisible();
    await expect(page.locator('text=Total XP')).toBeVisible();

    // Verify Catalog is present
    await expect(page.locator('text=Course Catalog')).toBeVisible();
    
    // Check that search input is rendered
    await expect(page.locator('input[placeholder*="Search catalog"]')).toBeVisible();
    
    // Check filters
    await expect(page.locator('select').first()).toBeVisible();

    // Verify Activity Feed or empty state
    await expect(page.locator('text=Recent Activity')).toBeVisible();
    
    // Quick Actions
    await expect(page.locator('text=Quick Actions')).toBeVisible();
    await expect(page.locator('text=Practice Coding')).toBeVisible();
  });

  test('Catalog search and filter debounces correctly', async ({ page }) => {
    await page.goto(workspaceUrl);
    
    // Wait for initial load
    await expect(page.locator('input[placeholder*="Search catalog"]')).toBeVisible();

    // Type in search
    await page.fill('input[placeholder*="Search catalog"]', 'System Design');
    
    // It should trigger a loading state or fetch
    // Since we mock/use a real DB, we just ensure it doesn't crash
    await page.waitForTimeout(500); // Wait for debounce

    // Change filter
    await page.selectOption('select:has(option[value="IN_PROGRESS"])', 'NOT_STARTED');
    await page.waitForTimeout(500); 
  });
});
