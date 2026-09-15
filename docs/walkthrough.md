# Journal Connectivity & Auto-Submission Module Implementation

The optional journal auto-submission feature has been fully implemented based on the approved design plan. This functionality allows users to connect to academic journals (e.g., WordPress REST API or OJS) and automatically submit their edited manuscripts as draft or published posts.

## Changes Made

### 1. Database & Security
- Added new enum types: `journal_platform`, `connection_status`, and `submission_status`
- Created three new tables in `schema.ts`:
  - `journal_connections`: Stores journal endpoints and AES-encrypted user credentials.
  - `submissions`: Tracks the submission payload, retry attempts, confirmation ID, and final status.
  - `submission_logs`: Keeps detailed step-by-step logs of submission attempts for debugging.
- Built an AES-256-GCM encryption module in `src/lib/security/encryption.ts` to securely store API credentials using a `MASTER_ENCRYPTION_KEY`.

### 2. Connectivity Adapters
- Created `WordPressAdapter` to interact with WordPress REST API (`/wp-json/wp/v2/`) using Application Passwords.
- Created `OJSAdapter` to interact with Open Journal Systems 3.x REST API (`/api/v1/`).
- Built a unified `ConnectionTester` service that can validate connectivity and fetch the user's remote role prior to saving the credentials.

### 3. API Routes & Background Worker
- Added `/api/journal-connection/test` to validate credentials.
- Added `/api/journal-connection` for saving and retrieving encrypted connections.
- Added `/api/submissions` to start a background submission.
- Created an Inngest background function (`processSubmission`) to handle submitting the manuscript, including automatic retries (up to 3 times) and timeout protection.
- Created a `MetadataExtractor` to dynamically generate the payload (title, abstract, keywords, cover letter) from the finalized paper.

### 4. UI Components (Frontend)
- `SecurityBriefing.tsx`: Explains the security measures and requires explicit user consent before storing credentials.
- `ConnectionForm.tsx`: Provides the input fields for the URL, username, and password, and allows running a live test.
- `TwoFactorDialog.tsx`: Provides the UI for entering an OTP code if the journal demands 2FA.
- `SubmissionPanel.tsx`: The main user dashboard module for viewing saved connections, choosing whether to submit as a Draft or Publish, and viewing real-time submission progress and history.

### 5. Translations & Polish
- Added all associated labels, error messages, and descriptions to both `he.json` and `en.json` to maintain full i18n support.
- Configured placeholder templates for Success and Failure notification emails (`submission-email.ts`).

## Verification Plan

### Automated Tests
Run database migration commands to apply the new schema:
`npx drizzle-kit generate`
`npx drizzle-kit push`

### Manual Verification
1. Open the application.
2. In the .env.local, verify `MASTER_ENCRYPTION_KEY` is present.
3. Access a finalized paper and open the new "Submit" panel.
4. Add a dummy WordPress or OJS connection. Use the test button to observe the error or success.
5. Create a submission and observe the Inngest background job taking over.
