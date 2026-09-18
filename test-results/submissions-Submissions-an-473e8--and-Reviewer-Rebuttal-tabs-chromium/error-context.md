# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: submissions.spec.ts >> Submissions and Review Rebuttal Flows >> should navigate between Submissions Tracker and Reviewer Rebuttal tabs
- Location: e2e/submissions.spec.ts:116:7

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /Reviewer Rebuttal/i })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]:
    - generic [ref=e10]:
      - text: Rendering
      - generic [ref=e11]:
        - generic [ref=e12]: .
        - generic [ref=e13]: .
        - generic [ref=e14]: .
  - alert [ref=e15]
```

# Test source

```ts
  21  |           expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  22  |         }),
  23  |       });
  24  |     });
  25  | 
  26  |     // Mock submissions API endpoint with sample dataset
  27  |     await page.route('**/api/submissions', async (route) => {
  28  |       await route.fulfill({
  29  |         status: 200,
  30  |         contentType: 'application/json',
  31  |         body: JSON.stringify({
  32  |           submissions: [
  33  |             {
  34  |               id: 'sub-api-1',
  35  |               paperId: 101,
  36  |               title: 'Automated Neural Architecture Search for CRISPR Guide RNA Design',
  37  |               journalName: 'Bioinformatics & Computational Biology',
  38  |               platform: 'Direct Submission',
  39  |               status: 'under_review',
  40  |               publishMode: 'publish',
  41  |               createdAt: '2026-09-01T12:00:00Z',
  42  |               updatedAt: '2026-09-15T08:30:00Z',
  43  |               confirmationId: 'BCB-2026-0912',
  44  |             },
  45  |             {
  46  |               id: 'sub-api-2',
  47  |               paperId: 102,
  48  |               title: 'Genomic Variant Interpretation',
  49  |               journalName: 'Nature Genetics',
  50  |               platform: 'Direct Submission',
  51  |               status: 'revision_required',
  52  |               publishMode: 'publish',
  53  |               createdAt: '2026-09-02T12:00:00Z',
  54  |               updatedAt: '2026-09-16T08:30:00Z',
  55  |               confirmationId: 'NG-2026-0913',
  56  |             },
  57  |           ],
  58  |         }),
  59  |       });
  60  |     });
  61  |   });
  62  | 
  63  |   test('should display the submissions tracker dashboard with metrics and listings', async ({ page }) => {
  64  |     await page.goto('/en/submissions');
  65  | 
  66  |     // Wait for page to render submissions dashboard
  67  |     await expect(page.getByRole('button', { name: /Submissions Tracker/i })).toBeVisible();
  68  |     await expect(page.getByRole('button', { name: /Reviewer Rebuttal/i })).toBeVisible();
  69  | 
  70  |     // Verify metric cards
  71  |     await expect(page.getByText('Total Submissions')).toBeVisible();
  72  |     await expect(page.getByText('Under Peer Review')).toBeVisible();
  73  |     await expect(page.getByText('Revisions Requested')).toBeVisible();
  74  |     await expect(page.getByText('Failed / Errors')).toBeVisible();
  75  | 
  76  |     // Verify search and new submission button
  77  |     const searchInput = page.getByPlaceholder(/Search title, journal, ID/i);
  78  |     await expect(searchInput).toBeVisible();
  79  | 
  80  |     const newSubmissionBtn = page.getByRole('button', { name: /Submit New Manuscript/i });
  81  |     await expect(newSubmissionBtn).toBeVisible();
  82  | 
  83  |     // Verify paper entries are visible in the list
  84  |     await expect(page.getByText(/CRISPR Guide RNA Design|Genomic Variant Interpretation/i).first()).toBeVisible();
  85  |   });
  86  | 
  87  |   test('should filter submissions using search query', async ({ page }) => {
  88  |     await page.goto('/en/submissions');
  89  | 
  90  |     const searchInput = page.getByPlaceholder(/Search title, journal, ID/i);
  91  |     await expect(searchInput).toBeVisible();
  92  | 
  93  |     // Type a specific search term
  94  |     await searchInput.fill('CRISPR');
  95  |     await expect(page.getByText('Automated Neural Architecture Search for CRISPR Guide RNA Design')).toBeVisible();
  96  | 
  97  |     // Clear search
  98  |     await searchInput.fill('');
  99  |     await expect(page.getByText(/Genomic Variant Interpretation/i)).toBeVisible();
  100 |   });
  101 | 
  102 |   test('should filter submissions by status tabs', async ({ page }) => {
  103 |     await page.goto('/en/submissions');
  104 | 
  105 |     // Click 'Under Review' filter tab
  106 |     const underReviewFilter = page.getByRole('button', { name: 'Under Review' });
  107 |     await expect(underReviewFilter).toBeVisible();
  108 |     await underReviewFilter.click();
  109 | 
  110 |     // Click 'All' filter tab to reset
  111 |     const allFilter = page.getByRole('button', { name: 'All' });
  112 |     await expect(allFilter).toBeVisible();
  113 |     await allFilter.click();
  114 |   });
  115 | 
  116 |   test('should navigate between Submissions Tracker and Reviewer Rebuttal tabs', async ({ page }) => {
  117 |     await page.goto('/en/submissions');
  118 | 
  119 |     // Switch to Reviewer Rebuttal tab
  120 |     const rebuttalTabBtn = page.getByRole('button', { name: /Reviewer Rebuttal/i });
> 121 |     await rebuttalTabBtn.click();
      |                          ^ Error: locator.click: Test timeout of 60000ms exceeded.
  122 | 
  123 |     // Verify ReviewResponseInterface elements
  124 |     await expect(page.getByText(/Reviewer Rebuttal & Response Matrix/i).first()).toBeVisible();
  125 |     await expect(page.getByRole('button', { name: /Back to Submissions/i })).toBeVisible();
  126 | 
  127 |     // Switch back using 'Back to Submissions' button
  128 |     const backBtn = page.getByRole('button', { name: /Back to Submissions/i });
  129 |     await backBtn.click();
  130 | 
  131 |     // Verify we are back on the Submissions Tracker
  132 |     await expect(page.getByPlaceholder(/Search title, journal, ID/i)).toBeVisible();
  133 |     await expect(page.getByText('Total Submissions')).toBeVisible();
  134 |   });
  135 | 
  136 |   test('should interact with reviewer comments in rebuttal interface', async ({ page }) => {
  137 |     await page.goto('/en/submissions');
  138 | 
  139 |     // Navigate to Rebuttal tab
  140 |     const rebuttalTabBtn = page.getByRole('button', { name: /Reviewer Rebuttal/i });
  141 |     await rebuttalTabBtn.click();
  142 | 
  143 |     // Verify comment cards or action buttons exist
  144 |     // Removed as per user request to not show mock data when empty
  145 | 
  146 |     // Check presence of action buttons such as AI draft / export
  147 |     const exportButton = page.getByRole('button', { name: /Export|Download/i }).first();
  148 |     if (await exportButton.isVisible()) {
  149 |       await expect(exportButton).toBeEnabled();
  150 |     }
  151 |   });
  152 | });
  153 | 
```