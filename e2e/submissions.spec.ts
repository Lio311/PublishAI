import { test, expect } from '@playwright/test';

test.describe('Submissions and Review Rebuttal Flows', () => {
  test.beforeEach(async ({ context, page }) => {
    // Bypass PIN gate via localStorage
    await context.addInitScript(() => {
      window.localStorage.setItem('publishai_global_auth_time_v2', Date.now().toString());
    });

    // Mock NextAuth session endpoint to appear authenticated
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            name: 'Dr. Test Researcher',
            email: 'researcher@university.edu',
            image: null,
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
    });
  });

  test('should display the submissions tracker dashboard with empty state', async ({ page }) => {
    await page.goto('/en/submissions');

    // Wait for page to render submissions dashboard
    await expect(page.getByRole('button', { name: /Submissions Tracker/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Reviewer Rebuttal/i })).toBeVisible();

    // Verify metric cards
    await expect(page.getByText('Total Submissions')).toBeVisible();
    await expect(page.getByText('Under Peer Review')).toBeVisible();

    // Verify search and new submission button
    const searchInput = page.getByPlaceholder(/Search title, journal, ID/i);
    await expect(searchInput).toBeVisible();

    const newSubmissionBtn = page.getByRole('button', { name: /Submit New Manuscript/i });
    await expect(newSubmissionBtn).toBeVisible();

    // Verify empty state is visible
    await expect(page.getByText(/No submissions found|לא נמצאו הגשות תואמות/i).first()).toBeVisible();
  });

  test('should navigate between Submissions Tracker and Reviewer Rebuttal tabs', async ({ page }) => {
    await page.goto('/en/submissions');

    // Switch to Reviewer Rebuttal tab
    const rebuttalTabBtn = page.getByRole('button', { name: /Reviewer Rebuttal/i });
    await rebuttalTabBtn.click();

    // Verify ReviewResponseInterface elements (e.g. Back button and empty state)
    await expect(page.getByRole('button', { name: /Back to Submissions/i })).toBeVisible();

    // Switch back using 'Back to Submissions' button
    const backBtn = page.getByRole('button', { name: /Back to Submissions/i });
    await backBtn.click();

    // Verify we are back on the Submissions Tracker
    await expect(page.getByPlaceholder(/Search title, journal, ID/i)).toBeVisible();
  });

});
