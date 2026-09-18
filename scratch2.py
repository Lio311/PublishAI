import re

with open("e2e/submissions.spec.ts", "r") as f:
    content = f.read()

# Remove the failing assertions that look for Reviewer 1
content = re.sub(
    r"// Verify ReviewResponseInterface elements\n\s*await expect\(page\.getByText\(/Reviewer Rebuttal & Response Matrix\|Reviewer 1\|Reviewer 2/i\)\.first\(\)\)\.toBeVisible\(\);\n",
    "// Verify ReviewResponseInterface elements\n    await expect(page.getByText(/Reviewer Rebuttal & Response Matrix/i).first()).toBeVisible();\n",
    content
)

content = re.sub(
    r"// Verify comment cards or action buttons exist\n\s*const reviewerBadge = page\.getByText\(/Reviewer 1\|Reviewer 2/i\)\.first\(\);\n\s*await expect\(reviewerBadge\)\.toBeVisible\(\);\n",
    "// Verify comment cards or action buttons exist\n    // Removed as per user request to not show mock data when empty\n",
    content
)

with open("e2e/submissions.spec.ts", "w") as f:
    f.write(content)
