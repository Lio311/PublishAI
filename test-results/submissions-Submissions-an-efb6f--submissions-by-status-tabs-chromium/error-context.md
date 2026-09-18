# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: submissions.spec.ts >> Submissions and Review Rebuttal Flows >> should filter submissions by status tabs
- Location: e2e/submissions.spec.ts:103:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Under Review' })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('button', { name: 'Under Review' }) with timeout 10000ms
  - waiting for getByRole('button', { name: 'Under Review' })

```

```yaml
- region "Notifications alt+T"
- alert
```

# Test source

```ts
  8   |       window.localStorage.setItem('playwright_bypass_auth', 'true');
  9   |     });
  10  | 
  11  |     // Mock NextAuth session endpoint to appear authenticated
  12  |     await page.route('**/api/auth/session', async (route) => {
  13  |       await route.fulfill({
  14  |         status: 200,
  15  |         contentType: 'application/json',
  16  |         body: JSON.stringify({
  17  |           user: {
  18  |             name: 'Dr. Test Researcher',
  19  |             email: 'researcher@university.edu',
  20  |             image: null,
  21  |           },
  22  |           expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  23  |         }),
  24  |       });
  25  |     });
  26  | 
  27  |     // Mock submissions API endpoint with sample dataset
  28  |     await page.route('**/api/submissions', async (route) => {
  29  |       await route.fulfill({
  30  |         status: 200,
  31  |         contentType: 'application/json',
  32  |         body: JSON.stringify({
  33  |           submissions: [
  34  |             {
  35  |               id: 'sub-api-1',
  36  |               paperId: 101,
  37  |               title: 'Automated Neural Architecture Search for CRISPR Guide RNA Design',
  38  |               journalName: 'Bioinformatics & Computational Biology',
  39  |               platform: 'Direct Submission',
  40  |               status: 'under_review',
  41  |               publishMode: 'publish',
  42  |               createdAt: '2026-09-01T12:00:00Z',
  43  |               updatedAt: '2026-09-15T08:30:00Z',
  44  |               confirmationId: 'BCB-2026-0912',
  45  |             },
  46  |             {
  47  |               id: 'sub-api-2',
  48  |               paperId: 102,
  49  |               title: 'Genomic Variant Interpretation',
  50  |               journalName: 'Nature Genetics',
  51  |               platform: 'Direct Submission',
  52  |               status: 'revision_required',
  53  |               publishMode: 'publish',
  54  |               createdAt: '2026-09-02T12:00:00Z',
  55  |               updatedAt: '2026-09-16T08:30:00Z',
  56  |               confirmationId: 'NG-2026-0913',
  57  |             },
  58  |           ],
  59  |         }),
  60  |       });
  61  |     });
  62  |   });
  63  | 
  64  |   test('should display the submissions tracker dashboard with metrics and listings', async ({ page }) => {
  65  |     await page.goto('/en/submissions');
  66  | 
  67  |     // Wait for page to render submissions dashboard
  68  |     await expect(page.getByRole('button', { name: /Submissions Tracker/i })).toBeVisible();
  69  |     await expect(page.getByRole('button', { name: /Reviewer Rebuttal/i })).toBeVisible();
  70  | 
  71  |     // Verify metric cards
  72  |     await expect(page.getByText('Total Submissions')).toBeVisible();
  73  |     await expect(page.getByText('Under Peer Review')).toBeVisible();
  74  |     await expect(page.getByText('Revisions Requested')).toBeVisible();
  75  |     await expect(page.getByText('Failed / Errors')).toBeVisible();
  76  | 
  77  |     // Verify search and new submission button
  78  |     const searchInput = page.getByPlaceholder(/Search title, journal, ID/i);
  79  |     await expect(searchInput).toBeVisible();
  80  | 
  81  |     const newSubmissionBtn = page.getByRole('button', { name: /Submit New Manuscript/i });
  82  |     await expect(newSubmissionBtn).toBeVisible();
  83  | 
  84  |     // Verify paper entries are visible in the list
  85  |     await expect(page.getByText(/CRISPR Guide RNA Design|Genomic Variant Interpretation/i).first()).toBeVisible();
  86  |   });
  87  | 
  88  |   test('should filter submissions using search query', async ({ page }) => {
  89  |     await page.goto('/en/submissions');
  90  | 
  91  |     const searchInput = page.getByPlaceholder(/Search title, journal, ID/i);
  92  |     await expect(searchInput).toBeVisible();
  93  | 
  94  |     // Type a specific search term
  95  |     await searchInput.fill('CRISPR');
  96  |     await expect(page.getByText('Automated Neural Architecture Search for CRISPR Guide RNA Design')).toBeVisible();
  97  | 
  98  |     // Clear search
  99  |     await searchInput.fill('');
  100 |     await expect(page.getByText(/Genomic Variant Interpretation/i)).toBeVisible();
  101 |   });
  102 | 
  103 |   test('should filter submissions by status tabs', async ({ page }) => {
  104 |     await page.goto('/en/submissions');
  105 | 
  106 |     // Click 'Under Review' filter tab
  107 |     const underReviewFilter = page.getByRole('button', { name: 'Under Review' });
> 108 |     await expect(underReviewFilter).toBeVisible();
      |                                     ^ Error: expect(locator).toBeVisible() failed
  109 |     await underReviewFilter.click();
  110 | 
  111 |     // Click 'All' filter tab to reset
  112 |     const allFilter = page.getByRole('button', { name: 'All' });
  113 |     await expect(allFilter).toBeVisible();
  114 |     await allFilter.click();
  115 |   });
  116 | 
  117 |   test('should navigate between Submissions Tracker and Reviewer Rebuttal tabs', async ({ page }) => {
  118 |     await page.goto('/en/submissions');
  119 | 
  120 |     // Switch to Reviewer Rebuttal tab
  121 |     const rebuttalTabBtn = page.getByRole('button', { name: /Reviewer Rebuttal/i });
  122 |     await rebuttalTabBtn.click();
  123 | 
  124 |     // Verify ReviewResponseInterface elements
  125 |     await expect(page.getByText(/Reviewer Rebuttal & Response Matrix/i).first()).toBeVisible();
  126 |     await expect(page.getByRole('button', { name: /Back to Submissions/i })).toBeVisible();
  127 | 
  128 |     // Switch back using 'Back to Submissions' button
  129 |     const backBtn = page.getByRole('button', { name: /Back to Submissions/i });
  130 |     await backBtn.click();
  131 | 
  132 |     // Verify we are back on the Submissions Tracker
  133 |     await expect(page.getByPlaceholder(/Search title, journal, ID/i)).toBeVisible();
  134 |     await expect(page.getByText('Total Submissions')).toBeVisible();
  135 |   });
  136 | 
  137 |   test('should interact with reviewer comments in rebuttal interface', async ({ page }) => {
  138 |     await page.goto('/en/submissions');
  139 | 
  140 |     // Navigate to Rebuttal tab
  141 |     const rebuttalTabBtn = page.getByRole('button', { name: /Reviewer Rebuttal/i });
  142 |     await rebuttalTabBtn.click();
  143 | 
  144 |     // Verify comment cards or action buttons exist
  145 |     // Removed as per user request to not show mock data when empty
  146 | 
  147 |     // Check presence of action buttons such as AI draft / export
  148 |     const exportButton = page.getByRole('button', { name: /Export|Download/i }).first();
  149 |     if (await exportButton.isVisible()) {
  150 |       await expect(exportButton).toBeEnabled();
  151 |     }
  152 |   });
  153 | });
  154 | 
```