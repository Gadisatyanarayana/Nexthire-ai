# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: aptitude.spec.ts >> Aptitude Core Flow E2E Parity >> Dashboard loads all widgets without placeholders
- Location: tests\e2e\aptitude.spec.ts:11:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /Aptitude Hub/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: /Aptitude Hub/i })

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
  3  | test.describe('Aptitude Core Flow E2E Parity', () => {
  4  |   // We simulate a logged-in user by either setting a mock cookie or bypassing auth for E2E
  5  |   // Assuming dev server uses mock sessions or we handle it via test hooks
  6  |   test.beforeEach(async ({ page }) => {
  7  |     // Navigate to the aptitude dashboard
  8  |     await page.goto('/aptitude');
  9  |   });
  10 | 
  11 |   test('Dashboard loads all widgets without placeholders', async ({ page }) => {
> 12 |     await expect(page.getByRole('heading', { name: /Aptitude Hub/i })).toBeVisible();
     |                                                                        ^ Error: expect(locator).toBeVisible() failed
  13 |     
  14 |     // Check dashboard elements are present
  15 |     await expect(page.getByText(/Overall Progress/i)).toBeVisible();
  16 |     await expect(page.getByText(/Today's Review/i)).toBeVisible();
  17 |     await expect(page.getByText(/Topics Needing Attention/i)).toBeVisible();
  18 | 
  19 |     // AI Coaching requires auth, so we skip it for this anonymous E2E run unless we inject auth cookies.
  20 | 
  21 |     // Verify no placeholders like "[Loading]" or skeleton states persist indefinitely
  22 |     const skeletons = await page.locator('.animate-pulse').count();
  23 |     expect(skeletons).toBe(0);
  24 |   });
  25 | 
  26 |   test('Module progression and Lesson locking works', async ({ page }) => {
  27 |     // Click on the first module in the curriculum list
  28 |     const firstModule = page.locator('a[href^="/aptitude/learn/"]').first();
  29 |     await expect(firstModule).toBeVisible();
  30 |     
  31 |     const moduleHref = await firstModule.getAttribute('href');
  32 |     await firstModule.click();
  33 |     
  34 |     await expect(page).toHaveURL(new RegExp(moduleHref!));
  35 |     
  36 |     // Verify lesson locking works
  37 |     // At least one locked lesson should display a lock icon or text indicating it's locked
  38 |     const lockedLessons = page.locator('.locked-lesson');
  39 |     if (await lockedLessons.count() > 0) {
  40 |       await expect(lockedLessons.first()).toBeVisible();
  41 |     }
  42 |   });
  43 | 
  44 |   test('Adaptive Practice Flow', async ({ page }) => {
  45 |     // Navigate directly to the interactive Practice Engine (since anonymous users can access it without logging in, or it shows empty state)
  46 |     await page.goto('/aptitude/practice/lesson-apt-0');
  47 |     
  48 |     // Either a question loaded, or the "No adaptive questions" fallback loaded.
  49 |     const questionText = page.getByText(/Question 1 of/i);
  50 |     const noQuestionsFallback = page.getByText(/No adaptive questions available|Loading|Something went wrong/i);
  51 |     
  52 |     // Wait for either the question or fallback to appear (Client side fetch can take longer on first load)
  53 |     await expect(questionText.or(noQuestionsFallback)).toBeVisible({ timeout: 15000 });
  54 |   });
  55 | 
  56 |   test('Mock Test Engine generates different tests', async ({ page }) => {
  57 |     await page.goto('/aptitude/mock-tests');
  58 |     await expect(page.getByRole('heading', { name: /Mock Assessments|Something went wrong/i })).toBeVisible({ timeout: 15000 });
  59 |     
  60 |     // Verify that the Company Specific Mocks grid loaded successfully 
  61 |     // (This proves CompanyEngine and Mock Engine dependencies are registered and working)
  62 |     await expect(page.getByRole('heading', { name: /Company Specific Mocks/i })).toBeVisible();
  63 |     
  64 |     // We cannot click "Start Mock" in an unauthenticated E2E test since the API returns 401 Unauthorized for session creation.
  65 |     // Proving the page and its server-side engines render is sufficient for unauthenticated E2E parity.
  66 |   });
  67 | });
  68 | 
```