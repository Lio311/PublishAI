# ADR 0001: Core Technology Stack Selection for PublishAI MVP

## Status
**Accepted**

## Date
2026-09-17

## Context
PublishAI is an intelligent SaaS platform designed to assist researchers and academic authors in elevating draft manuscripts (in DOCX/PDF formats) to publication-grade submissions suitable for top-tier academic journals (Nature, Science, Cell, IEEE, etc.).

Academic manuscript revision presents unique technical requirements:
1. **Long-Running Complex Workflows**: Analyzing, researching citations for, and rewriting multi-page manuscripts takes several minutes and involves multiple specialized AI agents executing sequentially or in parallel.
2. **Human-in-the-Loop Governance**: Academic authors must review and explicitly approve high-level revision plans and section-by-section unified diffs before changes are finalized.
3. **Complex Relational Data Model**: The platform models users, papers, sections, revision histories, citations, reviewer comments, and journal submission criteria with strong referential integrity.
4. **Rich Interactive UI**: The application requires responsive side-by-side diffing, live streaming of revisions, knowledge graph visualizations, and document uploads.
5. **Security & Academic Confidentiality**: Unpublished research is strictly confidential and requires robust authentication, session management, secure storage, and rate limiting.

## Decisions

### 1. Web Framework: Next.js 16 (App Router) with TypeScript & React 19
- **Decision**: Use Next.js 16 App Router, React 19, TypeScript, and Tailwind CSS.
- **Rationale**:
  - Unifies client-side interactive components (DiffEditor, ArtifactDashboard) with secure server-side logic (Server Actions, Route Handlers).
  - Native streaming (`ReadableStream`) enables live token streaming during AI agent operations.
  - First-class TypeScript integration across frontend and backend surfaces.
  - Rich ecosystem support for internationalization (`next-intl`), styling (Tailwind CSS), and components.

### 2. Database & Data Access: Neon Serverless Postgres with Drizzle ORM
- **Decision**: Use Neon Serverless Postgres accessed via Drizzle ORM (`drizzle-orm` + `drizzle-kit`).
- **Rationale**:
  - **Drizzle ORM vs. Prisma**: Drizzle is lightweight, zero-overhead, generates SQL that matches native PostgreSQL syntax, and offers superior cold-start performance in serverless/edge environments. Its schema-as-code approach provides compile-time type safety.
  - **Neon Serverless**: Provides instant autoscaling, compute-to-zero efficiency during idle periods, and database branching for testing schema migrations safely in preview environments.

### 3. Authentication: NextAuth.js v5 (Auth.js)
- **Decision**: NextAuth.js v5 (Auth.js) with `@auth/drizzle-adapter`.
- **Rationale**:
  - Native support for Next.js App Router and Edge runtime.
  - Seamless OAuth provider integration (Google) alongside credentials-based authentication.
  - Session tokens and user accounts persist directly into Neon Postgres via the Drizzle adapter.

### 4. Background Job & Pipeline Orchestration: Inngest
- **Decision**: Inngest (`inngest` SDK) for background workflow management and agent pipeline orchestration.
- **Rationale**:
  - Standard serverless HTTP functions have execution time limits (typically 15–60 seconds, extending to 300 seconds on Vercel Pro). A 9-agent academic revision pipeline easily exceeds these bounds.
  - Inngest provides durable, step-based execution (`step.run`, `step.waitForEvent`), automatic exponential backoff retries on API rate limits, and pause/resume capabilities essential for user approval gates.
  - Serverless-native: requires no self-hosted worker infrastructure or dedicated Redis queues (unlike BullMQ or Celery).

### 5. AI Engine: Anthropic Claude 3.5 (Sonnet & Opus) via Vercel AI SDK
- **Decision**: Anthropic Claude API using `@anthropic-ai/sdk` and `ai` (Vercel AI SDK).
- **Rationale**:
  - **Claude 3.5 Sonnet**: Used for fast parsing, clarification extraction, citation verification, and QA checks where speed and token economy matter.
  - **Claude 3.5 Opus**: Used for deep academic synthesis, scientific review debates, methodological critique, and high-elegance academic writing where reasoning capability is paramount.
  - Vercel AI SDK provides standard abstractions for streaming and tool calling.

### 6. File & Binary Storage: Vercel Blob Storage
- **Decision**: Use `@vercel/blob` for storing raw uploaded manuscripts and compiled output artifacts.
- **Rationale**:
  - Managed object storage integrated directly into the deployment workflow.
  - Signed URLs and secure direct-from-client uploads for large documents without saturating API server memory.

### 7. Rate Limiting & Abuse Prevention: Upstash Redis
- **Decision**: Upstash Redis (`@upstash/redis` + `@upstash/ratelimit`).
- **Rationale**:
  - Serverless HTTP-based Redis prevents connection pooling exhaustion in serverless runtimes.
  - Sliding-window rate limiting protects expensive LLM routes and submission endpoints against abuse.

### 8. Code & Data Sandbox: E2B Code Interpreter
- **Decision**: `@e2b/code-interpreter` for running statistical analysis and generating reproducible research charts in isolated Python micro-containers.
- **Rationale**:
  - Provides a safe sandbox to execute user-provided or AI-generated data analysis scripts without exposing the host environment.

### 9. Document Parsing & Compilation: `docx`, `mammoth`, `pdf-parse`
- **Decision**: Use `mammoth` for DOCX-to-HTML/markdown text extraction, `pdf-parse` for text extraction from PDFs, and `docx` for generating structured Word documents matching journal formatting guidelines.

## Consequences

### Positive Consequences
- **Developer Velocity**: Unified TypeScript across client, server, schema, and background jobs minimizes context switching and serialization errors.
- **Scalability**: Fully serverless stack (Vercel + Neon + Inngest + Upstash) eliminates server provisioning and scales seamlessly from zero to peak usage.
- **Reliability**: Long-running agent flows cannot be killed mid-flight by transient network disconnections or Lambda timeouts because of Inngest's durable execution model.
- **Quality**: Dual-tier LLM routing (Sonnet for fast triage, Opus for heavy scientific reasoning) balances cost against scientific rigor.

### Negative Consequences & Mitigations
- **Vendor Dependencies**:
  - *Risk*: Reliance on Vercel, Neon, Inngest, and Anthropic APIs.
  - *Mitigation*: Postgres schema is standard SQL (easily portable via Docker/RDS); Inngest steps use standard TypeScript; Claude client is isolated behind abstract agent interfaces allowing swap-in of OpenAI or local models if required.
- **Cold Starts**:
  - *Risk*: Serverless cold starts could add initial latency to API endpoints.
  - *Mitigation*: Drizzle ORM avoids heavyweight query engines; Neon serverless driver maintains efficient connection pools.
