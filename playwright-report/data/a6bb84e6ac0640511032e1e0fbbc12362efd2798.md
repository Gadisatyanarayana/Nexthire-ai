# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: assessment-workflow.spec.ts >> Assessment Engine Workflow >> Complete assessment workflow with timer and auto-save
- Location: tests\e2e\assessment-workflow.spec.ts:6:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('h1')
Expected substring: "Assessment: mock-assessment"
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
  3  | test.describe('Assessment Engine Workflow', () => {
  4  |   const assessmentUrl = '/learn/mock-domain/assessment/mock-assessment';
  5  | 
  6  |   test('Complete assessment workflow with timer and auto-save', async ({ page }) => {
  7  |     // Navigate to the assessment start page
  8  |     await page.goto(assessmentUrl);
  9  | 
  10 |     // Verify Start Page
> 11 |     await expect(page.locator('h1')).toContainText('Assessment: mock-assessment');
     |                                      ^ Error: expect(locator).toContainText(expected) failed
  12 |     await expect(page.locator('button')).toContainText('Start Assessment');
  13 | 
  14 |     // Start Assessment
  15 |     await page.click('button:has-text("Start Assessment")');
  16 | 
  17 |     // Wait for Player to load
  18 |     await expect(page.locator('text=Time Remaining')).toBeVisible();
  19 | 
  20 |     // Verify Question 1 is visible
  21 |     await expect(page.locator('h2')).toContainText('What is the primary purpose');
  22 |     
  23 |     // Answer Question 1
  24 |     await page.click('label:has-text("To record the start, duration, and score of a test session")');
  25 |     
  26 |     // Verify Auto-save debounce effect by waiting for a short moment
  27 |     await page.waitForTimeout(500); 
  28 | 
  29 |     // Next Question
  30 |     await page.click('button:has-text("Next Question")');
  31 |     await expect(page.locator('h2')).toContainText('database paradigms is used for \'Upserting\'');
  32 | 
  33 |     // Answer Question 2
  34 |     await page.click('label:has-text("ON CONFLICT DO UPDATE")');
  35 |     
  36 |     // Next Question
  37 |     await page.click('button:has-text("Next Question")');
  38 |     await expect(page.locator('h2')).toContainText('RLS stand for');
  39 | 
  40 |     // Leave Question 3 unanswered and attempt to review
  41 |     await page.click('button:has-text("Review & Submit")');
  42 | 
  43 |     // Verify Warning about unanswered questions
  44 |     await expect(page.locator('text=You still have unanswered questions!')).toBeVisible();
  45 | 
  46 |     // Go back and answer
  47 |     await page.click('button:has-text("Return to Assessment")');
  48 |     await page.click('label:has-text("Row Level Security")');
  49 | 
  50 |     // Go to Review
  51 |     await page.click('button:has-text("Review Answers")');
  52 |     
  53 |     // Final Submit
  54 |     await page.click('button:has-text("Final Submit")');
  55 | 
  56 |     // Wait for submission to complete (mocking takes <1s)
  57 |     await expect(page.locator('h1')).toContainText('Assessment Complete', { timeout: 10000 });
  58 |     
  59 |     // Check results
  60 |     await expect(page.locator('text=Score: 30 / 30')).toBeVisible();
  61 |     await expect(page.locator('text=PASSED')).toBeVisible();
  62 |   });
  63 | 
  64 |   test('Hydration warnings check', async ({ page }) => {
  65 |     const consoleErrors: string[] = [];
  66 |     page.on('console', msg => {
  67 |       if (msg.type() === 'error') {
  68 |         consoleErrors.push(msg.text());
  69 |       }
  70 |     });
  71 | 
  72 |     await page.goto(assessmentUrl);
  73 |     
  74 |     const hydrationErrors = consoleErrors.filter(e => e.toLowerCase().includes('hydration'));
  75 |     expect(hydrationErrors.length).toBe(0);
  76 |   });
  77 | });
  78 | 
```