import { test, expect } from '@playwright/test';

test.describe('Phase 3 Step 1: Coding Workspace & Problem Player', () => {
  const MOCK_PROBLEM_ID = '55555555-5555-5555-5555-555555555555';

  test.beforeEach(async ({ page }) => {
    // Navigate to the coding workspace
    await page.goto(`/coding/problem/${MOCK_PROBLEM_ID}`);
  });

  test('Workspace loads correctly without hydration warnings', async ({ page }) => {
    // We expect the main interface to load
    await expect(page.locator('h1:has-text("Coding Workspace")')).toBeVisible();
    await expect(page.locator('h2')).toContainText('Two Sum');
    const constraintsHeader = page.locator('text=Constraints');
    await expect(constraintsHeader).toBeAttached();
    
    // Check Monaco Editor wrapper existence
    await expect(page.locator('.monaco-editor')).toBeVisible();
  });

  test('Switching languages updates starter code', async ({ page }) => {
    // Ensure we start with a known state by explicitly selecting javascript first, just in case session restored python
    const select = page.locator('select');
    await select.selectOption('javascript');
    await expect(select).toHaveValue('javascript');

    // Select Python
    await select.selectOption('python');
    await expect(select).toHaveValue('python');

    // The editor text should now have python starter code
    await expect(page.locator('.monaco-editor')).toContainText('def twoSum');
  });

  test('Mock run execution works', async ({ page }) => {
    const runBtn = page.locator('button:has-text("Run Code")');
    await expect(runBtn).toBeEnabled();
    
    await runBtn.click();
    
    // Check console output pane for queued status
    await expect(page.getByText('Queued', { exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text="Execution queued."')).toBeVisible();
  });

  test('Mock submission works', async ({ page }) => {
    const submitBtn = page.locator('button:has-text("Submit")');
    await expect(submitBtn).toBeEnabled();
    
    await submitBtn.click();
    
    // Check console output pane for submission result queued status
    await expect(page.getByText('Queued', { exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text="Execution queued."')).toBeVisible();
  });
});
