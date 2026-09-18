import re

with open("e2e/submissions.spec.ts", "r") as f:
    content = f.read()

mock_submission_2 = """            {
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
            },"""

content = content.replace("confirmationId: 'BCB-2026-0912',\n            },", "confirmationId: 'BCB-2026-0912',\n            },\n" + mock_submission_2)

with open("e2e/submissions.spec.ts", "w") as f:
    f.write(content)
