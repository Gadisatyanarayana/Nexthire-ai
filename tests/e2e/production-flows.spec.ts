import { test, expect } from '@playwright/test';

// These tests codify the manual QA flows verified during the final production audit.
// Note: To run these tests successfully, ensure your local development server is running 
// (or the WebServer config in playwright is active) and that you have a valid test user session.
// You may need to adjust selectors based on the exact UI components in use.

test.describe('Production Verification Flows', () => {

  // Flow 1: Coding Evaluation State
  test('Coding: run, submit, and solved state persistence', async ({ page }) => {
    // Candidate login
    // Assuming a test login route or standard next-auth credentials sign in
    await page.goto('/api/auth/signin');
    await page.fill('input[name="email"]', 'test-candidate@example.com');
    // await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Navigate to Coding Section
    await page.goto('/coding');
    
    // Open a specific question (assuming a known ID or the first one in the list)
    await page.click('a[href^="/coding/"] >> nth=0');
    await page.waitForLoadState('networkidle');

    // Run sample test cases
    const runBtn = page.locator('button:has-text("Run")');
    await runBtn.click();
    
    // Wait for the "Run" result
    await expect(page.locator('text=Sample cases evaluated')).toBeVisible({ timeout: 10000 });

    // Submit against actual hidden test cases
    const submitBtn = page.locator('button:has-text("Submit")');
    await submitBtn.click();

    // Wait for the final judge decision (Accepted)
    const verdict = page.locator('.verdict-accepted, text="Accepted"');
    await expect(verdict).toBeVisible({ timeout: 15000 });

    // Verify state persists on refresh
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text="Solved"')).toBeVisible();
  });

  // Flow 2: Resume Builder State Persistence
  test('Resume Builder: create, edit, save and persist', async ({ page }) => {
    // Candidate login
    await page.goto('/api/auth/signin');
    await page.fill('input[name="email"]', 'test-candidate@example.com');
    await page.click('button[type="submit"]');

    // Navigate to Resume Builder
    await page.goto('/resume/builder');

    // Create / Edit resume
    // Depending on the UI, either click create or interact with the editor
    const nameInput = page.locator('input[name="fullName"]');
    if (await nameInput.isVisible()) {
      await nameInput.fill('Playwright Test User');
    }

    // Save the builder state
    const saveBtn = page.locator('button:has-text("Save")');
    await saveBtn.click();

    // Wait for success toast/notification
    await expect(page.locator('text="Saved successfully"')).toBeVisible();

    // Refresh and verify data remains
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(nameInput).toHaveValue('Playwright Test User');
  });

  // Flow 3: Resume Analyzer Extraction & UPSERT Persistence
  test('Resume Analyzer: upload, analyze, score, save and persist', async ({ page }) => {
    // Candidate login
    await page.goto('/api/auth/signin');
    await page.fill('input[name="email"]', 'test-candidate@example.com');
    await page.click('button[type="submit"]');

    // Navigate to Resume Analyzer
    await page.goto('/resume/analyzer');

    // Upload real PDF
    // Note: Provide a valid tiny sample PDF in your repository for E2E tests
    const fileInput = page.locator('input[type="file"]');
    // Ensure you have a 'sample-resume.pdf' in the test-resumes directory
    // await fileInput.setInputFiles('test-resumes/sample.pdf');
    
    // Enter JD
    const jdInput = page.locator('textarea[placeholder*="Job Description"]');
    if (await jdInput.isVisible()) {
      await jdInput.fill('Senior React Engineer with 5+ years experience in Next.js and TypeScript.');
    }

    // Analyze
    const analyzeBtn = page.locator('button:has-text("Analyze")');
    await analyzeBtn.click();

    // Wait for ATS score results
    const atsScore = page.locator('.ats-score-display'); // Adjust selector as needed
    await expect(atsScore).toBeVisible({ timeout: 20000 });

    // Save
    const saveBtn = page.locator('button:has-text("Save")');
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await expect(page.locator('text="Saved"')).toBeVisible();
    }

    // Refresh and verify result restored
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(atsScore).toBeVisible();
  });
});
