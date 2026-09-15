# Phase 4: Alerts, Quality Control & Security (Final Polish)

This phase finalizes the application by adding crucial notifications, academic integrity checks, and ensuring system stability under load.

## User Review Required

> [!IMPORTANT]
> The final sentence in your prompt ("האם תרצה שנתחיל מהמשימה המרכזית הבאה - חיבור Inngest...") appears to be a copy-paste from an older stage of our project. We have **already completed** the Inngest/Agent orchestration and the UI components (Track Changes editor, etc.) in Phases 2 and 3! We are indeed ready to move strictly into **Phase 4**.

> [!NOTE]
> For Plagiarism and AI Detection, real-world systems use paid APIs (like Turnitin or Copyleaks). For this MVP, I plan to create a robust mock service/interface (`plagiarism-scanner.ts`) that can be swapped out later for a real provider, or use Claude with a specific prompt to act as an initial "AI-like text" screener.

## Open Questions

1. **Email Configuration**: Do you have a specific SMTP provider in mind for Nodemailer (e.g., SendGrid, AWS SES, or just standard Gmail for now)?
2. **Load Testing**: Do you want me to set up `k6` for load testing, or write an internal script that blasts the Inngest pipeline with concurrent mock jobs to see how the Orchestrator handles it?

## Proposed Changes

### 1. Email Notifications (Nodemailer)
- **[MODIFY]** `src/inngest/functions.ts` to trigger an email notification when the Orchestrator finishes all agents and the paper state changes to `awaiting_approval`.
- **[NEW]** `src/lib/email/notification-service.ts` to wrap Nodemailer and render a beautiful HTML email template informing the user their paper is ready for review.

### 2. Plagiarism & AI Language Detection
- **[NEW]** `src/lib/security/integrity-scanner.ts`: A service to analyze text for AI-generated patterns and potential plagiarism.
- **[MODIFY]** `src/inngest/functions.ts` / `orchestrator.ts`: Integrate the scanner as a mandatory check either before or during the QA Agent phase. The results will be saved to the database.

### 3. QA & Load Testing
- **[NEW]** `src/scripts/load-test.ts`: A Node script to simulate heavy concurrent uploads and trigger multiple Inngest pipeline runs simultaneously.
- **[NEW]** `src/scripts/qa-runner.ts`: End-to-End tests simulating large 50+ page documents to ensure the pipeline doesn't break due to context window limits or timeouts.

## Verification Plan
### Automated Tests
- Run `qa-runner.ts` with a massive lorem ipsum / mock academic document to verify no chunking/timeout errors occur in the execution agent.
- Run `load-test.ts` to trigger 20 simultaneous Inngest events and verify the Neon DB doesn't lock up and Inngest queues handle the load gracefully.

### Manual Verification
- Upload a standard test document.
- Verify the Inngest workflow runs the new Integrity Scanner.
- Check the console logs (or ethereal email / local SMTP) to ensure the Nodemailer "awaiting approval" email is successfully dispatched at the end.
