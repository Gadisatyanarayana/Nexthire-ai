# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: learning-dashboard.spec.ts >> Learning Workspace (Phase 2 - Step 7) >> Catalog search and filter debounces correctly
- Location: tests\e2e\learning-dashboard.spec.ts:37:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('input[placeholder*="Search catalog"]')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('input[placeholder*="Search catalog"]')

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
  3  | test.describe('Learning Workspace (Phase 2 - Step 7)', () => {
  4  |   const workspaceUrl = '/learn';
  5  | 
  6  |   test('Loads the Learning Workspace with all sections', async ({ page }) => {
  7  |     await page.goto(workspaceUrl);
  8  | 
  9  |     // Verify Header
  10 |     await expect(page.locator('h1')).toContainText('Learning Workspace');
  11 | 
  12 |     // Wait for the dynamic data to load
  13 |     await expect(page.locator('text=Today\'s Progress')).toBeVisible();
  14 | 
  15 |     // Verify Streaks and Goals
  16 |     await expect(page.locator('text=Daily Goal')).toBeVisible();
  17 |     await expect(page.locator('text=Streak')).toBeVisible();
  18 |     await expect(page.locator('text=Total XP')).toBeVisible();
  19 | 
  20 |     // Verify Catalog is present
  21 |     await expect(page.locator('text=Course Catalog')).toBeVisible();
  22 |     
  23 |     // Check that search input is rendered
  24 |     await expect(page.locator('input[placeholder*="Search catalog"]')).toBeVisible();
  25 |     
  26 |     // Check filters
  27 |     await expect(page.locator('select').first()).toBeVisible();
  28 | 
  29 |     // Verify Activity Feed or empty state
  30 |     await expect(page.locator('text=Recent Activity')).toBeVisible();
  31 |     
  32 |     // Quick Actions
  33 |     await expect(page.locator('text=Quick Actions')).toBeVisible();
  34 |     await expect(page.locator('text=Practice Coding')).toBeVisible();
  35 |   });
  36 | 
  37 |   test('Catalog search and filter debounces correctly', async ({ page }) => {
  38 |     await page.goto(workspaceUrl);
  39 |     
  40 |     // Wait for initial load
> 41 |     await expect(page.locator('input[placeholder*="Search catalog"]')).toBeVisible();
     |                                                                        ^ Error: expect(locator).toBeVisible() failed
  42 | 
  43 |     // Type in search
  44 |     await page.fill('input[placeholder*="Search catalog"]', 'System Design');
  45 |     
  46 |     // It should trigger a loading state or fetch
  47 |     // Since we mock/use a real DB, we just ensure it doesn't crash
  48 |     await page.waitForTimeout(500); // Wait for debounce
  49 | 
  50 |     // Change filter
  51 |     await page.selectOption('select:has(option[value="IN_PROGRESS"])', 'NOT_STARTED');
  52 |     await page.waitForTimeout(500); 
  53 |   });
  54 | });
  55 | 
```