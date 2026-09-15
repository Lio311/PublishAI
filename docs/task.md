
## Phase 2: Inngest & Agent Orchestration
- [x] Install Inngest SDK and configure Next.js API route
- [x] Create Inngest client and orchestrator function
- [x] Implement Anthropic Claude API client
- [x] Build Agent 1: Clarification & Rules Extractor
- [x] Update `UploadZone` to trigger Inngest workflow after upload

## Phase 2 (Cont.): Full Agent Pipeline Implementation
- [x] Create `src/lib/agents/base-agent.ts`
- [x] Create `src/lib/agents/claude-client.ts`
- [x] Create `src/lib/agents/orchestrator.ts` (State machine)
- [x] Implement `Clarification Agent`
- [x] Implement `Planning Agent`
- [x] Implement `Knowledge Agent`
- [x] Implement `Scientific Review Agent`
- [x] Implement `Academic Writing Agent`
- [x] Implement `Execution Agent`
- [x] Implement `QA Agent`
- [x] Implement `Verification Agent`
- [x] Implement `Compilation Agent`

## Phase 2 (Cont.): Literature Search Integration
- [x] Create `src/lib/search/pubmed-client.ts`
- [x] Create `src/lib/search/semantic-scholar-client.ts`
- [x] Create `src/lib/search/arxiv-client.ts`
- [x] Create `src/lib/search/search-orchestrator.ts`

## Phase 3: Advanced Features & Artifact Dashboard
- [x] Create `src/lib/journals/seed-data.ts` (Journal rules database)
- [x] Build `src/app/(dashboard)/journals/page.tsx`
- [x] Build `src/app/api/journals/route.ts` & rules scraper
- [x] Create `DiffEditor.tsx` (Advanced Track Changes UI)
- [x] Create `ReviewPanel.tsx`
- [x] Create `ArtifactDashboard.tsx` (Revised Manuscript, Walkthrough, Peer Review)
- [x] Implement Cover Letter Generation (`cover-letter-agent.ts`)
- [x] Implement Docx & PDF Generators

## Phase 4: Journal Connectivity & Auto-Submission (v1)
- [x] Step 1.1: Database Schema (Connections, Submissions, Logs)
- [x] Step 1.2: Encryption Module (AES-256-GCM)
- [x] Step 2.1: WordPress API Adapter
- [x] Step 2.2: OJS API Adapter
- [x] Step 2.3: Connection Tester Service
- [x] Step 2.4: Connection API Routes
- [x] Step 3.1: SecurityBriefing UI Component
- [x] Step 3.2: ConnectionForm UI Component
- [x] Step 3.3: TwoFactorDialog UI Component
- [x] Step 4.1: Metadata Extractor Service
- [x] Step 4.2: Submission Service
- [x] Step 4.3: Inngest Workflow for Submission
- [x] Step 4.4: Submissions API Routes
- [x] Step 5.1: SubmissionPanel UI Component
- [x] Step 5.2: SubmissionConfirmDialog UI Component
- [x] Step 5.3: SubmissionProgress UI Component
- [x] Step 6.1: Submission Email Templates
- [x] Step 6.2: i18n Translations (he + en)

## Phase 4: Alerts, Quality Control & Security (Final Polish)
- [x] Create `src/lib/email/notification-service.ts` using Nodemailer + Ethereal (test SMTP)
- [x] Integrate email trigger in `orchestrator.ts` when paper is `awaiting_approval`
- [x] Create `src/lib/security/integrity-scanner.ts` (Mock/Claude-based Plagiarism & AI detector)
- [x] Integrate integrity scanner in the Inngest pipeline
- [x] Create `src/scripts/qa-runner.ts` (End-to-End simulation script)
- [x] Create `src/scripts/load-test.ts` (Load testing script)

## Phase 5: Automated Resubmission & Reviewer Loop
- [x] Database Schema: Add reviewer comments/rebuttal fields to DB or use existing `paperVersions`
- [x] Agent: Create `src/lib/agents/rebuttal-agent.ts`
- [x] Inngest: Create `processResubmission` workflow in `src/inngest/functions.ts`
- [x] Frontend: Add `ReviewerCommentsModal.tsx` UI
