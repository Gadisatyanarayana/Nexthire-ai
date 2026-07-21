import { test, expect } from '@playwright/test';

test.describe('Assessment Engine Workflow', () => {
  const assessmentUrl = '/learn/mock-domain/assessment/mock-assessment';

  test('Complete assessment workflow with timer and auto-save', async ({ page }) => {
    // Navigate to the assessment start page
    await page.goto(assessmentUrl);

    // Verify Start Page
    await expect(page.locator('h1')).toContainText('Assessment: mock-assessment');
    await expect(page.locator('button')).toContainText('Start Assessment');

    // Start Assessment
    await page.click('button:has-text("Start Assessment")');

    // Wait for Player to load
    await expect(page.locator('text=Time Remaining')).toBeVisible();

    // Verify Question 1 is visible
    await expect(page.locator('h2')).toContainText('What is the primary purpose');
    
    // Answer Question 1
    await page.click('label:has-text("To record the start, duration, and score of a test session")');
    
    // Verify Auto-save debounce effect by waiting for a short moment
    await page.waitForTimeout(500); 

    // Next Question
    await page.click('button:has-text("Next Question")');
    await expect(page.locator('h2')).toContainText('database paradigms is used for \'Upserting\'');

    // Answer Question 2
    await page.click('label:has-text("ON CONFLICT DO UPDATE")');
    
    // Next Question
    await page.click('button:has-text("Next Question")');
    await expect(page.locator('h2')).toContainText('RLS stand for');

    // Leave Question 3 unanswered and attempt to review
    await page.click('button:has-text("Review & Submit")');

    // Verify Warning about unanswered questions
    await expect(page.locator('text=You still have unanswered questions!')).toBeVisible();

    // Go back and answer
    await page.click('button:has-text("Return to Assessment")');
    await page.click('label:has-text("Row Level Security")');

    // Go to Review
    await page.click('button:has-text("Review Answers")');
    
    // Final Submit
    await page.click('button:has-text("Final Submit")');

    // Wait for submission to complete (mocking takes <1s)
    await expect(page.locator('h1')).toContainText('Assessment Complete', { timeout: 10000 });
    
    // Check results
    await expect(page.locator('text=Score: 30 / 30')).toBeVisible();
    await expect(page.locator('text=PASSED')).toBeVisible();
  });

  test('Hydration warnings check', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(assessmentUrl);
    
    const hydrationErrors = consoleErrors.filter(e => e.toLowerCase().includes('hydration'));
    expect(hydrationErrors.length).toBe(0);
  });
});
