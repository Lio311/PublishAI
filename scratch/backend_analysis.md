# Publish AI - Backend Architecture Analysis

## 1. System Architecture Overview

The backend of **Publish AI** is built on top of a highly scalable, serverless-first stack. The primary architecture follows the **Next.js 13+ App Router** paradigm, utilizing `/src/app/api` for synchronous endpoints and **Inngest** for orchestrating complex, long-running, multi-agent background workflows.

### Architecture Diagram

```mermaid
flowchart TD
    %% Define styles
    classDef frontend fill:#3b82f6,stroke:#1e3a8a,stroke-width:2px,color:white;
    classDef api fill:#10b981,stroke:#047857,stroke-width:2px,color:white;
    classDef orchestration fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:white;
    classDef ai fill:#8b5cf6,stroke:#4c1d95,stroke-width:2px,color:white;
    classDef db fill:#ef4444,stroke:#991b1b,stroke-width:2px,color:white;
    classDef external fill:#6b7280,stroke:#374151,stroke-width:2px,color:white;

    %% Nodes
    Client((Client App)):::frontend
    API[Next.js API Routes /api]:::api
    Inngest[Inngest Background Workers]:::orchestration
    Orchestrator[Agent Orchestrator]:::orchestration
    DB[(Neon PostgreSQL\nServerless)]:::db
    Mem0[(Mem0 User Memory)]:::db
    Langfuse[Langfuse Tracing]:::external
    E2B[E2B Python Sandbox]:::external
    Stripe[Stripe / Webhooks]:::external

    %% AI Agents
    subgraph MultiAgentSystem["Multi-Agent System"]
        Clarification[Clarification Agent]:::ai
        Planning[Planning Agent]:::ai
        Knowledge[Knowledge / RAG Agent]:::ai
        ScienceReview[Scientific Review / Debate Agent]:::ai
        Writer[Academic Writing Agent]:::ai
        QA[QA & Verification Agent]:::ai
        Vision[Vision AI / Figure Analysis]:::ai
    end

    %% Flow
    Client -->|HTTP Requests| API
    API -->|Triggers Background Jobs| Inngest
    API <-->|Sync CRUD| DB
    Inngest -->|Manages Workflows| Orchestrator
    Inngest <-->|Webhook Events| Stripe
    
    Orchestrator -->|Delegates Tasks| Clarification
    Orchestrator -->|Delegates Tasks| Planning
    Orchestrator -->|Delegates Tasks| Knowledge
    Orchestrator -->|Delegates Tasks| ScienceReview
    Orchestrator -->|Delegates Tasks| Writer
    Orchestrator -->|Delegates Tasks| QA

    %% Data Flow
    MultiAgentSystem <-->|HTTP / Vercel AI SDK| OpenAI/Anthropic
    MultiAgentSystem <-->|Vector/Graph Search| DB
    MultiAgentSystem <-->|Save Stages/Versions| DB
    MultiAgentSystem -->|Store Memory| Mem0
    MultiAgentSystem -->|Telemetry| Langfuse
    QA <-->|Execute Data Analysis| E2B
    Vision <-->|Analyze Figures| E2B
```

---

## 2. Core Business Logic & Orchestration

The core logic of generating academic manuscripts revolves around a **multi-stage agentic pipeline**. The complexity of writing, reviewing, and defending scientific papers is broken down into modular steps managed by a central Agent Orchestrator.

### The Agent Orchestrator (`src/services/agents/orchestrator.ts`)

Instead of a single monolithic LLM prompt, the application defines individual agents handling distinct `stages` of the manuscript creation process. These agents are executed sequentially (and sometimes repetitively for revisions) via **Inngest Functions**.

### Orchestration Sequence Flow

```mermaid
sequenceDiagram
    participant API as Next.js API
    participant Inngest as Inngest Worker
    participant DB as Neon Postgres DB
    participant Agent as Specialized Agent (e.g. Planning)
    participant LLM as OpenAI/Anthropic API

    API->>Inngest: Trigger Workflow (e.g., generate-paper)
    activate Inngest
    Inngest->>DB: Create stage record (status: in_progress)
    DB-->>Inngest: Return stage ID
    
    Inngest->>Agent: Execute agent logic
    activate Agent
    Agent->>DB: Fetch context (RAG/memory)
    DB-->>Agent: Context data
    Agent->>LLM: Execute prompt with tools
    LLM-->>Agent: Structured output
    Agent-->>Inngest: Return agent result
    deactivate Agent
    
    alt Success
        Inngest->>DB: Update stage record (status: completed, save output)
    else Failure
        Inngest->>DB: Update stage record (status: failed)
        Inngest->>Inngest: Schedule retry (idempotent)
    end
    deactivate Inngest
```

### Multi-Agent Debate
A unique mechanism in Publish AI is the **Scientific Review Debate**, triggered by submission review events. The backend dynamically orchestrates multiple LLM personas (e.g., Methodologist, Subject Matter Expert, Skeptic) simulating peer review.

---

## 3. Data Access Layer (DAL) & ORM (`src/services/db`)

The application uses **Drizzle ORM** communicating with a **Neon PostgreSQL** serverless database. 

### Database Schema Entity-Relationship

```mermaid
erDiagram
    USERS ||--o{ PAPERS : creates
    USERS ||--o{ ACCOUNTS : links
    PAPERS ||--o{ PAPER_VERSIONS : has
    PAPERS ||--o{ PAPER_STAGES : tracks
    PAPERS ||--o{ FIGURES : contains
    PAPER_STAGES ||--|| DEBATES : initiates
    DEBATES ||--o{ DEBATE_MESSAGES : contains
    DEBATES ||--o{ DEBATE_AGENTS : involves
    DOCUMENTS ||--o{ DOCUMENT_CHUNKS : split_into
    DOCUMENT_CHUNKS {
        vector embedding
        text content
    }
    PAPERS ||--o{ SANDBOX_RUNS : spawns
    SANDBOX_RUNS ||--o{ GENERATED_CHARTS : produces

    USERS {
        uuid id PK
        string email
    }
    PAPERS {
        int id PK
        uuid userId FK
        string title
    }
    PAPER_STAGES {
        int id PK
        int paperId FK
        string stage_name
        string status
    }
```

---

## 4. API Routes Analysis (`src/app/api`)

The `src/app/api` layer acts as the synchronous interface for the frontend, delegating heavy processing to background queues while immediately responding to user interactions.

### API Data Flow

```mermaid
flowchart LR
    Client([Frontend Client]) -->|POST /api/ai/generate| API[Next.js API Route]
    Client -->|POST /api/submissions/:id/submit| API
    
    subgraph Synchronous
        API -->|Fetch Context| DB[(Neon DB)]
        API -->|Format Prompt| Schema[Zod Patch Schema]
        Schema -->|Stream Result| LLM[LLM API]
        LLM -.->|Streamed JSON| Client
    end
    
    subgraph Asynchronous
        API -->|Trigger Event| InngestQueue((Inngest Event Queue))
        InngestQueue -->|submission/process| RPAWorker[RPA Background Worker]
        RPAWorker -->|Execute long-running submission| External[External Journal Platform]
    end
```

---

## 5. Core AI Service & Modularity (`src/services/ai/aiService.ts`)

The AI capability relies on a unified fallback-aware wrapper, abstracting Anthropic and OpenAI behind a robust middleware interface. This ensures that the system is resilient to vendor downtime or strict rate limits.

### Advanced Capabilities
1. **Integrated Fallbacks**: Cascades down a predefined chain (e.g., Claude 3.7 Sonnet -> Claude 3.5 Sonnet -> GPT-4o).
2. **Prompt Sanitation**: Injects strict defenses against delimiter-based injection attacks.
3. **Memory Injection**: Dynamically connects to user memory stores.
4. **Langfuse Telemetry**: Automatically records all inputs, outputs, tokens, and latencies.

## 6. Execution Sandbox
For data-heavy papers, the application automates data analysis via E2B Python Sandbox to execute dynamically generated Python scripts safely.
