# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: learner-journey.spec.ts >> End-to-End Learner Journey (Phase 2 Final Acceptance) >> Complete learner journey from dashboard to assessment completion
- Location: tests\e2e\learner-journey.spec.ts:7:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('h1')
Expected substring: "Learning Workspace"
Received string:    "NEXTHIRE AI"
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('h1')
    13 × locator resolved to <h1 class="text-3xl font-black tracking-wider bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent uppercase">NEXTHIRE AI</h1>
       - unexpected value "NEXTHIRE AI"

```

```yaml
- heading "NEXTHIRE AI" [level=1]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('End-to-End Learner Journey (Phase 2 Final Acceptance)', () => {
  4  |   const workspaceUrl = '/learn';
  5  |   const assessmentUrl = '/learn/mock-domain/assessment/mock-assessment';
  6  | 
  7  |   test('Complete learner journey from dashboard to assessment completion', async ({ page }) => {
  8  |     // 1. Learning Workspace
  9  |     await page.goto(workspaceUrl);
> 10 |     await expect(page.locator('h1')).toContainText('Learning Workspace');
     |                                      ^ Error: expect(locator).toContainText(expected) failed
  11 | 
  12 |     // 2. Search Catalog
  13 |     await page.fill('input[placeholder*="Search catalog"]', 'System Design');
  14 |     await page.waitForTimeout(500);
  15 |     
  16 |     // 3. Open Lesson
  17 |     // We navigate straight to an assessment since this mock uses assessment
  18 |     await page.goto(assessmentUrl);
  19 | 
  20 |     // 4. Start Assessment
  21 |     await expect(page.locator('h1')).toContainText('Assessment: mock-assessment');
  22 |     await page.click('button:has-text("Start Assessment")');
  23 |     await expect(page.locator('text=Time Remaining')).toBeVisible();
  24 | 
  25 |     // 5. Answer Questions (Auto-save)
  26 |     await expect(page.locator('h2')).toContainText('What is the primary purpose');
  27 |     await page.click('label:has-text("To record the start, duration, and score of a test session")');
  28 |     await page.waitForTimeout(500); 
  29 | 
  30 |     await page.click('button:has-text("Next Question")');
  31 |     await page.click('label:has-text("ON CONFLICT DO UPDATE")');
  32 |     
  33 |     await page.click('button:has-text("Next Question")');
  34 |     await page.click('label:has-text("Row Level Security")');
  35 | 
  36 |     // 6. Submit & Score
  37 |     await page.click('button:has-text("Review Answers")');
  38 |     await page.click('button:has-text("Final Submit")');
  39 |     // Check if error is displayed
  40 |     const errorLocator = page.locator('.bg-red-100.text-red-700');
  41 |     if (await errorLocator.isVisible({ timeout: 2000 })) {
  42 |       const errorText = await errorLocator.textContent();
  43 |       throw new Error(`Assessment submission failed with error: ${errorText}`);
  44 |     }
  45 | 
  46 |     await expect(page.locator('h1')).toContainText('Assessment Complete', { timeout: 10000 });
  47 |     await expect(page.locator('text=Score: 30 / 30')).toBeVisible();
  48 |     await expect(page.locator('text=PASSED')).toBeVisible();
  49 | 
  50 |     // 7. Verify Dashboard Update (Return to dashboard)
  51 |     await page.goto(workspaceUrl);
  52 |     await expect(page.locator('h1')).toContainText('Learning Workspace');
  53 |     
  54 |     // Continue Learning should update (it might fallback to a Recommendation now since assessment is PASSED)
  55 |     await expect(page.locator('h2:has-text("Recent Activity")')).toBeVisible();
  56 |   });
  57 | });
  58 | 
```