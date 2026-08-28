# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: production-flows.spec.ts >> Production Verification Flows >> Resume Analyzer: upload, analyze, score, save and persist
- Location: tests\e2e\production-flows.spec.ts:78:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[name="email"]')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - link "NEXTHIRE" [ref=e4] [cursor=pointer]:
        - /url: /
      - navigation [ref=e5]:
        - link "Home" [ref=e6] [cursor=pointer]:
          - /url: /
        - link "Features" [ref=e7] [cursor=pointer]:
          - /url: /#features
        - link "How It Works" [ref=e8] [cursor=pointer]:
          - /url: /#how-it-works
        - link "Placement Hub" [ref=e9] [cursor=pointer]:
          - /url: /placement-hub
        - link "Live Voice AI" [ref=e10] [cursor=pointer]:
          - /url: /voice-interviewer
        - link "Coding" [ref=e11] [cursor=pointer]:
          - /url: /coding
        - link "About" [ref=e12] [cursor=pointer]:
          - /url: /#about
  - main [ref=e13]:
    - main [ref=e14]:
      - generic:
        - img
      - generic [ref=e15]:
        - generic [ref=e16]:
          - img "NextHire Logo" [ref=e17]
          - generic [ref=e18]:
            - heading "NEXTHIRE AI" [level=1] [ref=e19]
            - paragraph [ref=e20]: Placement Performance Workspace
        - button "Continue with Google" [ref=e22]:
          - img [ref=e23]
          - generic [ref=e29]: Continue with Google
        - generic [ref=e30]:
          - img [ref=e31]
          - generic [ref=e34]: OAuth 2.0 Encrypted Auth
  - alert [ref=e35]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | // These tests codify the manual QA flows verified during the final production audit.
  4   | // Note: To run these tests successfully, ensure your local development server is running 
  5   | // (or the WebServer config in playwright is active) and that you have a valid test user session.
  6   | // You may need to adjust selectors based on the exact UI components in use.
  7   | 
  8   | test.describe('Production Verification Flows', () => {
  9   | 
  10  |   // Flow 1: Coding Evaluation State
  11  |   test('Coding: run, submit, and solved state persistence', async ({ page }) => {
  12  |     // Candidate login
  13  |     // Assuming a test login route or standard next-auth credentials sign in
  14  |     await page.goto('/api/auth/signin');
  15  |     await page.fill('input[name="email"]', 'test-candidate@example.com');
  16  |     // await page.fill('input[name="password"]', 'password');
  17  |     await page.click('button[type="submit"]');
  18  |     
  19  |     // Navigate to Coding Section
  20  |     await page.goto('/coding');
  21  |     
  22  |     // Open a specific question (assuming a known ID or the first one in the list)
  23  |     await page.click('a[href^="/coding/"] >> nth=0');
  24  |     await page.waitForLoadState('networkidle');
  25  | 
  26  |     // Run sample test cases
  27  |     const runBtn = page.locator('button:has-text("Run")');
  28  |     await runBtn.click();
  29  |     
  30  |     // Wait for the "Run" result
  31  |     await expect(page.locator('text=Sample cases evaluated')).toBeVisible({ timeout: 10000 });
  32  | 
  33  |     // Submit against actual hidden test cases
  34  |     const submitBtn = page.locator('button:has-text("Submit")');
  35  |     await submitBtn.click();
  36  | 
  37  |     // Wait for the final judge decision (Accepted)
  38  |     const verdict = page.locator('.verdict-accepted, text="Accepted"');
  39  |     await expect(verdict).toBeVisible({ timeout: 15000 });
  40  | 
  41  |     // Verify state persists on refresh
  42  |     await page.reload();
  43  |     await page.waitForLoadState('networkidle');
  44  |     await expect(page.locator('text="Solved"')).toBeVisible();
  45  |   });
  46  | 
  47  |   // Flow 2: Resume Builder State Persistence
  48  |   test('Resume Builder: create, edit, save and persist', async ({ page }) => {
  49  |     // Candidate login
  50  |     await page.goto('/api/auth/signin');
  51  |     await page.fill('input[name="email"]', 'test-candidate@example.com');
  52  |     await page.click('button[type="submit"]');
  53  | 
  54  |     // Navigate to Resume Builder
  55  |     await page.goto('/resume/builder');
  56  | 
  57  |     // Create / Edit resume
  58  |     // Depending on the UI, either click create or interact with the editor
  59  |     const nameInput = page.locator('input[name="fullName"]');
  60  |     if (await nameInput.isVisible()) {
  61  |       await nameInput.fill('Playwright Test User');
  62  |     }
  63  | 
  64  |     // Save the builder state
  65  |     const saveBtn = page.locator('button:has-text("Save")');
  66  |     await saveBtn.click();
  67  | 
  68  |     // Wait for success toast/notification
  69  |     await expect(page.locator('text="Saved successfully"')).toBeVisible();
  70  | 
  71  |     // Refresh and verify data remains
  72  |     await page.reload();
  73  |     await page.waitForLoadState('networkidle');
  74  |     await expect(nameInput).toHaveValue('Playwright Test User');
  75  |   });
  76  | 
  77  |   // Flow 3: Resume Analyzer Extraction & UPSERT Persistence
  78  |   test('Resume Analyzer: upload, analyze, score, save and persist', async ({ page }) => {
  79  |     // Candidate login
  80  |     await page.goto('/api/auth/signin');
> 81  |     await page.fill('input[name="email"]', 'test-candidate@example.com');
      |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  82  |     await page.click('button[type="submit"]');
  83  | 
  84  |     // Navigate to Resume Analyzer
  85  |     await page.goto('/resume/analyzer');
  86  | 
  87  |     // Upload real PDF
  88  |     // Note: Provide a valid tiny sample PDF in your repository for E2E tests
  89  |     const fileInput = page.locator('input[type="file"]');
  90  |     // Ensure you have a 'sample-resume.pdf' in the test-resumes directory
  91  |     // await fileInput.setInputFiles('test-resumes/sample.pdf');
  92  |     
  93  |     // Enter JD
  94  |     const jdInput = page.locator('textarea[placeholder*="Job Description"]');
  95  |     if (await jdInput.isVisible()) {
  96  |       await jdInput.fill('Senior React Engineer with 5+ years experience in Next.js and TypeScript.');
  97  |     }
  98  | 
  99  |     // Analyze
  100 |     const analyzeBtn = page.locator('button:has-text("Analyze")');
  101 |     await analyzeBtn.click();
  102 | 
  103 |     // Wait for ATS score results
  104 |     const atsScore = page.locator('.ats-score-display'); // Adjust selector as needed
  105 |     await expect(atsScore).toBeVisible({ timeout: 20000 });
  106 | 
  107 |     // Save
  108 |     const saveBtn = page.locator('button:has-text("Save")');
  109 |     if (await saveBtn.isVisible()) {
  110 |       await saveBtn.click();
  111 |       await expect(page.locator('text="Saved"')).toBeVisible();
  112 |     }
  113 | 
  114 |     // Refresh and verify result restored
  115 |     await page.reload();
  116 |     await page.waitForLoadState('networkidle');
  117 |     await expect(atsScore).toBeVisible();
  118 |   });
  119 | });
  120 | 
```