import { test, expect } from '@playwright/test';

test.describe('End-to-End Learner Journey (Phase 2 Final Acceptance)', () => {
  const workspaceUrl = '/learn';
  const assessmentUrl = '/learn/mock-domain/assessment/mock-assessment';

  test('Complete learner journey from dashboard to assessment completion', async ({ page }) => {
    // 1. Learning Workspace
    await page.goto(workspaceUrl);
    await expect(page.locator('h1')).toContainText('Learning Workspace');

    // 2. Search Catalog
    await page.fill('input[placeholder*="Search catalog"]', 'System Design');
    await page.waitForTimeout(500);
    
    // 3. Open Lesson
    // We navigate straight to an assessment since this mock uses assessment
    await page.goto(assessmentUrl);

    // 4. Start Assessment
    await expect(page.locator('h1')).toContainText('Assessment: mock-assessment');
    await page.click('button:has-text("Start Assessment")');
    await expect(page.locator('text=Time Remaining')).toBeVisible();

    // 5. Answer Questions (Auto-save)
    await expect(page.locator('h2')).toContainText('What is the primary purpose');
    await page.click('label:has-text("To record the start, duration, and score of a test session")');
    await page.waitForTimeout(500); 

    await page.click('button:has-text("Next Question")');
    await page.click('label:has-text("ON CONFLICT DO UPDATE")');
    
    await page.click('button:has-text("Next Question")');
    await page.click('label:has-text("Row Level Security")');

    // 6. Submit & Score
    await page.click('button:has-text("Review Answers")');
    await page.click('button:has-text("Final Submit")');
    // Check if error is displayed
    const errorLocator = page.locator('.bg-red-100.text-red-700');
    if (await errorLocator.isVisible({ timeout: 2000 })) {
      const errorText = await errorLocator.textContent();
      throw new Error(`Assessment submission failed with error: ${errorText}`);
    }

    await expect(page.locator('h1')).toContainText('Assessment Complete', { timeout: 10000 });
    await expect(page.locator('text=Score: 30 / 30')).toBeVisible();
    await expect(page.locator('text=PASSED')).toBeVisible();

    // 7. Verify Dashboard Update (Return to dashboard)
    await page.goto(workspaceUrl);
    await expect(page.locator('h1')).toContainText('Learning Workspace');
    
    // Continue Learning should update (it might fallback to a Recommendation now since assessment is PASSED)
    await expect(page.locator('h2:has-text("Recent Activity")')).toBeVisible();
  });
});
