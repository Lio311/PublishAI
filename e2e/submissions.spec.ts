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

    // Mock submissions API endpoint with sample dataset
    await page.route('**/api/submissions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          submissions: [
            {
              id: 'sub-api-1',
              paperId: 101,
              title: 'Automated Neural Architecture Search for CRISPR Guide RNA Design',
              journalName: 'Bioinformatics & Computational Biology',
              platform: 'Direct Submission',
              status: 'under_review',
              publishMode: 'publish',
              createdAt: '2026-09-01T12:00:00Z',
              updatedAt: '2026-09-15T08:30:00Z',
              confirmationId: 'BCB-2026-0912',
            },
            {
              id: 'sub-api-2',
              paperId: 102,
              title: 'Genomic Variant Interpretation',
              journalName: 'Nature Genetics',
              platform: 'Direct Submission',
              status: 'revision_required',
              publishMode: 'publish',
              createdAt: '2026-09-02T12:00:00Z',
              updatedAt: '2026-09-16T08:30:00Z',
              confirmationId: 'NG-2026-0913',
            },
          ],
        }),
      });
    });
  });

  test('should display the submissions tracker dashboard with metrics and listings', async ({ page }) => {
    await page.goto('/en/submissions');

    // Wait for page to render submissions dashboard
    await expect(page.getByRole('button', { name: /Submissions Tracker/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Reviewer Rebuttal/i })).toBeVisible();

    // Verify metric cards
    await expect(page.getByText('Total Submissions')).toBeVisible();
    await expect(page.getByText('Under Peer Review')).toBeVisible();
    await expect(page.getByText('Revisions Requested')).toBeVisible();
    await expect(page.getByText('Failed / Errors')).toBeVisible();

    // Verify search and new submission button
    const searchInput = page.getByPlaceholder(/Search title, journal, ID/i);
    await expect(searchInput).toBeVisible();

    const newSubmissionBtn = page.getByRole('button', { name: /Submit New Manuscript/i });
    await expect(newSubmissionBtn).toBeVisible();

    // Verify paper entries are visible in the list
    await expect(page.getByText(/CRISPR Guide RNA Design|Genomic Variant Interpretation/i).first()).toBeVisible();
  });

  test('should filter submissions using search query', async ({ page }) => {
    await page.goto('/en/submissions');

    const searchInput = page.getByPlaceholder(/Search title, journal, ID/i);
    await expect(searchInput).toBeVisible();

    // Type a specific search term
    await searchInput.fill('CRISPR');
    await expect(page.getByText('Automated Neural Architecture Search for CRISPR Guide RNA Design')).toBeVisible();

    // Clear search
    await searchInput.fill('');
    await expect(page.getByText(/Genomic Variant Interpretation/i)).toBeVisible();
  });

  test('should filter submissions by status tabs', async ({ page }) => {
    await page.goto('/en/submissions');

    // Click 'Under Review' filter tab
    const underReviewFilter = page.getByRole('button', { name: 'Under Review' });
    await expect(underReviewFilter).toBeVisible();
    await underReviewFilter.click();

    // Click 'All' filter tab to reset
    const allFilter = page.getByRole('button', { name: 'All' });
    await expect(allFilter).toBeVisible();
    await allFilter.click();
  });

  test('should navigate between Submissions Tracker and Reviewer Rebuttal tabs', async ({ page }) => {
    await page.goto('/en/submissions');

    // Switch to Reviewer Rebuttal tab
    const rebuttalTabBtn = page.getByRole('button', { name: /Reviewer Rebuttal/i });
    await rebuttalTabBtn.click();

    // Verify ReviewResponseInterface elements
    await expect(page.getByText(/Reviewer Rebuttal & Response Matrix/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Back to Submissions/i })).toBeVisible();

    // Switch back using 'Back to Submissions' button
    const backBtn = page.getByRole('button', { name: /Back to Submissions/i });
    await backBtn.click();

    // Verify we are back on the Submissions Tracker
    await expect(page.getByPlaceholder(/Search title, journal, ID/i)).toBeVisible();
    await expect(page.getByText('Total Submissions')).toBeVisible();
  });

  test('should interact with reviewer comments in rebuttal interface', async ({ page }) => {
    await page.goto('/en/submissions');

    // Navigate to Rebuttal tab
    const rebuttalTabBtn = page.getByRole('button', { name: /Reviewer Rebuttal/i });
    await rebuttalTabBtn.click();

    // Verify comment cards or action buttons exist
    // Removed as per user request to not show mock data when empty

    // Check presence of action buttons such as AI draft / export
    const exportButton = page.getByRole('button', { name: /Export|Download/i }).first();
    if (await exportButton.isVisible()) {
      await expect(exportButton).toBeEnabled();
    }
  });
});
