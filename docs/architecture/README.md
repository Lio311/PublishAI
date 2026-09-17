# PublishAI Architecture Documentation

Welcome to the **PublishAI** architectural specifications. This directory contains the system design documentation, architectural models (C4), and Architecture Decision Records (ADRs).

---

## Documents

| Document | Description |
| :--- | :--- |
| [**C4 Context & Container Diagrams**](./c4-context.md) | Visual model showing System Context (Level 1), Container (Level 2), and the 9-Agent Pipeline. |
| [**ADR 0001: Core Technology Stack**](./adr/0001-technology-stack.md) | Architectural decision record detailing the selection of Next.js 16, Neon Postgres, Drizzle ORM, Inngest, and Claude 3.5. |

---

## High-Level Architecture Overview

```
                                  +-----------------------+
                                  |    Academic Author    |
                                  +-----------+-----------+
                                              |
                                              v
                                  +-----------------------+
                                  |  Next.js 16 Frontend  |
                                  | (React 19, Tailwind)  |
                                  +-----------+-----------+
                                              |
                       +----------------------+----------------------+
                       |                                             |
                       v                                             v
            +--------------------+                       +---------------------+
            | Next.js API Routes |                       |   Inngest Workflow  |
            |   & NextAuth v5    |                       |     Orchestrator    |
            +----------+---------+                       +----------+----------+
                       |                                             |
        +--------------+--------------+               +--------------+--------------+
        |                             |               |              |              |
        v                             v               v              v              v
+---------------+             +---------------+ +------------+ +------------+ +------------+
| Neon Postgres |             |  Vercel Blob  | | Anthropic  | | Academic   | |    E2B     |
| (Drizzle ORM) |             | (Manuscripts) | | Claude AI  | | Search APIs| |  Sandbox   |
+---------------+             +---------------+ +------------+ +------------+ +------------+
```

## Architectural Principles

1. **Academic Integrity & User Agency**: The platform operates with strict Human-in-the-Loop approval gates. Revisions and structural modifications are presented as unified diffs and must be approved by the author before persistence.
2. **Durable Asynchronous Execution**: All compute-heavy tasks (document parsing, literature search, AI peer review, section drafting) execute via Inngest step functions, surviving timeouts and transient network interruptions.
3. **Type Safety & Data Integrity**: End-to-end TypeScript from database schemas (Drizzle) through backend services to React components.
4. **Optimized Multi-Model Routing**: Cost and latency optimization by routing operational tasks (parsing, metadata search, QA checks) to Claude 3.5 Sonnet and high-context scientific synthesis/critique to Claude 3.5 Opus.
