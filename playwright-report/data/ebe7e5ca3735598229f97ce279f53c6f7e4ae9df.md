# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: coding-workspace.spec.ts >> Phase 3 Step 1: Coding Workspace & Problem Player >> Workspace loads correctly without hydration warnings
- Location: tests\e2e\coding-workspace.spec.ts:11:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h1:has-text("Coding Workspace")')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('h1:has-text("Coding Workspace")')

```

```yaml
- banner:
  - link "NEXTHIRE":
    - /url: /
  - navigation:
    - link "Home":
      - /url: /
    - link "Features":
      - /url: /#features
    - link "How It Works":
      - /url: /#how-it-works
    - link "Placement Hub":
      - /url: /placement-hub
    - link "Live Voice AI":
      - /url: /voice-interviewer
    - link "Coding":
      - /url: /coding
    - link "About":
      - /url: /#about
- main:
  - main:
    - img
    - img "NextHire Logo"
    - heading "NEXTHIRE AI" [level=1]
    - paragraph: Placement Performance Workspace
    - button "Continue with Google":
      - img
      - text: Continue with Google
    - text: OAuth 2.0 Encrypted Auth
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Phase 3 Step 1: Coding Workspace & Problem Player', () => {
  4  |   const MOCK_PROBLEM_ID = '55555555-5555-5555-5555-555555555555';
  5  | 
  6  |   test.beforeEach(async ({ page }) => {
  7  |     // Navigate to the coding workspace
  8  |     await page.goto(`/coding/problem/${MOCK_PROBLEM_ID}`);
  9  |   });
  10 | 
  11 |   test('Workspace loads correctly without hydration warnings', async ({ page }) => {
  12 |     // We expect the main interface to load
> 13 |     await expect(page.locator('h1:has-text("Coding Workspace")')).toBeVisible();
     |                                                                   ^ Error: expect(locator).toBeVisible() failed
  14 |     await expect(page.locator('h2')).toContainText('Two Sum');
  15 |     const constraintsHeader = page.locator('text=Constraints');
  16 |     await expect(constraintsHeader).toBeAttached();
  17 |     
  18 |     // Check Monaco Editor wrapper existence
  19 |     await expect(page.locator('.monaco-editor')).toBeVisible();
  20 |   });
  21 | 
  22 |   test('Switching languages updates starter code', async ({ page }) => {
  23 |     // Ensure we start with a known state by explicitly selecting javascript first, just in case session restored python
  24 |     const select = page.locator('select');
  25 |     await select.selectOption('javascript');
  26 |     await expect(select).toHaveValue('javascript');
  27 | 
  28 |     // Select Python
  29 |     await select.selectOption('python');
  30 |     await expect(select).toHaveValue('python');
  31 | 
  32 |     // The editor text should now have python starter code
  33 |     await expect(page.locator('.monaco-editor')).toContainText('def twoSum');
  34 |   });
  35 | 
  36 |   test('Mock run execution works', async ({ page }) => {
  37 |     const runBtn = page.locator('button:has-text("Run Code")');
  38 |     await expect(runBtn).toBeEnabled();
  39 |     
  40 |     await runBtn.click();
  41 |     
  42 |     // Check console output pane for queued status
  43 |     await expect(page.getByText('Queued', { exact: true })).toBeVisible({ timeout: 5000 });
  44 |     await expect(page.locator('text="Execution queued."')).toBeVisible();
  45 |   });
  46 | 
  47 |   test('Mock submission works', async ({ page }) => {
  48 |     const submitBtn = page.locator('button:has-text("Submit")');
  49 |     await expect(submitBtn).toBeEnabled();
  50 |     
  51 |     await submitBtn.click();
  52 |     
  53 |     // Check console output pane for submission result queued status
  54 |     await expect(page.getByText('Queued', { exact: true })).toBeVisible({ timeout: 5000 });
  55 |     await expect(page.locator('text="Execution queued."')).toBeVisible();
  56 |   });
  57 | });
  58 | 
```