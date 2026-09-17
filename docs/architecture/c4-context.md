# PublishAI - C4 Architecture Diagrams

This document specifies the C4 Model architecture for **PublishAI**, an AI-driven academic manuscript revision and journal submission platform.

---

## 1. C4 Level 1: System Context Diagram

The System Context diagram provides a high-level view of how academic authors interact with PublishAI and how the platform connects to external services and infrastructure.

```mermaid
flowchart TD
    User["Academic Author / Researcher<br>[Person]<br>Uploads manuscript, approves revisions, configures journal targets"]

    subgraph Boundary["PublishAI System Boundary"]
        PublishAI["PublishAI Platform<br>[Software System]<br>Next.js App Router, Auth.js, Inngest Pipeline, Agent Orchestrator"]
    end

    subgraph StorageServices["Data & Storage Infrastructure"]
        NeonDB[("Neon Postgres<br>[External System / DB]<br>Serverless relational database managed via Drizzle ORM")]
        VercelBlob["Vercel Blob Storage<br>[External System]<br>Stores raw and processed manuscripts (DOCX, PDF)"]
        UpstashRedis[("Upstash Redis<br>[External System / Cache]<br>Rate limiting, session cache, and fast state")]
    end

    subgraph AIServices["AI & Execution Services"]
        ClaudeAPI["Anthropic Claude API<br>[External System]<br>Claude 3.5 Sonnet (fast analysis, QA) & Opus (reasoning, writing)"]
        E2BSandbox["E2B Code Interpreter<br>[External System]<br>Secure sandbox for statistical analysis and figure reproduction"]
    end

    subgraph LiteratureServices["Academic Literature APIs"]
        PubMed["PubMed API<br>[External System]<br>Biomedical and life sciences bibliographic queries"]
        SemanticScholar["Semantic Scholar API<br>[External System]<br>Citation graph and scientific paper metadata"]
        Arxiv["arXiv API<br>[External System]<br>Preprint search for physics, CS, math"]
    end

    subgraph CommunicationServices["Notification & External Systems"]
        EmailService["SMTP / Nodemailer<br>[External System]<br>Transactional emails, review notifications, status alerts"]
        JournalPortals["Target Journal Submission Portals<br>[External System - Future Phase]<br>Editorial Manager, ScholarOne, Submissions API"]
    end

    User -->|"Uploads papers, reviews diffs, confirms approval gates [HTTPS]"| PublishAI
    PublishAI -->|"Reads/writes users, papers, diffs, revisions, citations"| NeonDB
    PublishAI -->|"Uploads/downloads manuscript binaries"| VercelBlob
    PublishAI -->|"Enforces rate limiting per IP / User"| UpstashRedis
    PublishAI -->|"Invokes multi-agent prompt chains and debates"| ClaudeAPI
    PublishAI -->|"Runs data validation and chart generation"| E2BSandbox
    PublishAI -->|"Queries citations and verifies reference metadata"| PubMed
    PublishAI -->|"Extracts citation influence and paper embeddings"| SemanticScholar
    PublishAI -->|"Searches preprints and relevant prior art"| Arxiv
    PublishAI -->|"Dispatches workflow emails to authors"| EmailService
    PublishAI -.->|"Automated package delivery (Post-Launch)"| JournalPortals
```

---

## 2. C4 Level 2: Container Diagram

The Container diagram zooms into the PublishAI platform boundary to show high-level technical building blocks and their protocols.

```mermaid
flowchart TD
    User["Academic Author<br>[Person]"]

    subgraph PublishAIApp["PublishAI Application Architecture"]
        WebFrontend["Next.js Web Application<br>[Container: React 19, Next.js App Router, Tailwind CSS]<br>Provides Drag & Drop upload, Track-Changes Diff Editor, Interactive Knowledge Graph, Settings"]
        APILayer["Next.js API Routes & Server Actions<br>[Container: TypeScript, Next.js]<br>Handles authentication, CRUD endpoints, upload dispatch, streaming LLM responses"]
        InngestEngine["Inngest Workflow Engine<br>[Container: Inngest SDK, TypeScript Functions]<br>Durable, multi-step agent pipeline orchestration, human-in-the-loop approval gates, retries"]
        AgentServices["Agent Orchestration Library<br>[Container: TypeScript, Vercel AI SDK]<br>Modular AI agents (Clarification, Planning, Writing, Review, QA, Verification)"]
    end

    subgraph Persistence["Persistence & State Layer"]
        Drizzle["Drizzle ORM<br>[Component]<br>Type-safe schema definitions and query builder"]
        Neon[("Neon Postgres Serverless<br>[Container: PostgreSQL]<br>Users, accounts, manuscripts, sections, revisions, citations, feedback")]
        VBlob["Vercel Blob<br>[Container: Object Storage]<br>Raw DOCX/PDF files, exported revisions, rendered figures"]
        Redis[("Upstash Redis<br>[Container: Key-Value]<br>Sliding window rate limit counters and agent lockouts")]
    end

    subgraph External["External Integrations"]
        Anthropic["Anthropic Claude API<br>[Claude 3.5 Sonnet / Opus]"]
        AcademicAPIs["Academic APIs<br>[PubMed, Semantic Scholar, arXiv]"]
        E2B["E2B Sandbox<br>[Python Execution Environment]"]
        SMTP["SMTP / Email Transport<br>[Nodemailer]"]
    end

    User -->|"HTTPS / WSS"| WebFrontend
    WebFrontend -->|"Server Actions & REST"| APILayer
    APILayer -->|"Triggers background workflows via events"| InngestEngine
    APILayer -->|"Uses Drizzle queries"| Drizzle
    APILayer -->|"Stores documents"| VBlob
    APILayer -->|"Rate limit check"| Redis
    InngestEngine -->|"Coordinates step execution"| AgentServices
    InngestEngine -->|"Updates workflow state via Drizzle"| Drizzle
    AgentServices -->|"Generates completions & evaluations"| Anthropic
    AgentServices -->|"Queries citations & abstracts"| AcademicAPIs
    AgentServices -->|"Executes analysis scripts"| E2B
    Drizzle -->|"pgwire / serverless HTTP"| Neon
    InngestEngine -->|"Sends status notifications"| SMTP
```

---

## 3. Multi-Agent Orchestration Pipeline

PublishAI organizes paper revision through a structured, multi-step pipeline with explicit **User Approval Gates** to maintain human control and academic integrity.

```mermaid
flowchart LR
    A["1. Clarification Agent<br>(Sonnet)<br>Target journal criteria & constraints"] --> B["2. Planning Agent<br>(Opus)<br>Manuscript triage & revision plan"]
    B --> Gate1{"User Approval<br>Gate: Plan"}
    Gate1 -->|"Approved"| C["3. Knowledge Agent<br>(Sonnet)<br>Literature enrichment & references"]
    C --> D["4. Scientific Review Agent<br>(Opus Debate)<br>Methodological & logical scrutiny"]
    D --> E["5. Academic Writing Agent<br>(Opus)<br>Section-by-section rewrite"]
    E --> F["6. Execution Agent<br>(Opus)<br>Unified diff & track changes"]
    F --> Gate2{"User Approval<br>Gate: Diffs"}
    Gate2 -->|"Approved"| G["7. QA Agent<br>(Sonnet)<br>Formatting, references, consistency"]
    G --> H["8. Verification Agent<br>(Sonnet)<br>Peer review score & Cover letter"]
    H --> I["9. Compilation Agent<br>(Sonnet)<br>Final DOCX/PDF generation"]
```

---

## 4. Key Architectural Characteristics

1. **Human-in-the-Loop Governance**: AI never mutates a manuscript without author confirmation at the Plan gate and Diff gate.
2. **Durable Asynchronous Execution**: Inngest decouples lengthy LLM calls (which may take several minutes) from web request lifecycles, ensuring resilience against timeouts.
3. **Type-Safe Data Contract**: Drizzle ORM provides strict TypeScript types directly derived from the PostgreSQL database schema.
4. **Separation of Concerns**: Fast lightweight tasks (parsing, metadata search, QA) leverage Claude 3.5 Sonnet, while heavy analytical synthesis (scientific critique, revision drafting) uses Claude 3.5 Opus.
