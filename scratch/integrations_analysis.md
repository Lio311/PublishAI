# Publish AI: Integrations & Background Architecture Analysis

This document provides a detailed visual analysis of the background job processing, event-driven architecture, Model Context Protocol (MCP) servers, sandboxing, and Python microservices within the Publish AI project.

## 1. Event-Driven Architecture & Background Jobs (Inngest)

Publish AI heavily utilizes **Inngest** for orchestrating complex, long-running AI workflows without blocking the main Next.js web application.

### Events & Workflows
The domain events are strictly typed and drive the core architecture. Key workflows include:
- **Paper Processing Pipeline:** Triggered when a paper is uploaded. The paper undergoes multiple sequential stages.
- **Resubmission & Rebuttal:** Triggered when reviewer comments are received.
- **Cascading Workflows:** Manages rejections and multi-agent debates securely.
- **Preflight Checks:** Runs AI-generated code snippets in a sandbox before final execution.
- **External Webhooks:** Handles incoming signals from Stripe and external email servers.

### AI Routing
Tasks are dynamically routed to specific LLMs based on complexity:
- **Claude-3-opus:** Heavy reasoning tasks.
- **Claude-3.7-sonnet:** Interactive and moderately complex tasks.
- **GPT-4o:** Serves as the default fallback model.

```mermaid
flowchart TD
    classDef trigger fill:#D1D5DB,stroke:#374151
    classDef inngest fill:#F3F4F6,stroke:#D1D5DB
    classDef ai fill:#FEF3C7,stroke:#F59E0B

    subgraph "Inngest Event Workflows"
        Upload[Paper Uploaded Event]:::trigger
        ReviewComments[Reviewer Comments Event]:::trigger
        Schedule[Weekly Cron Schedule]:::trigger

        Upload --> UploadWorkflow[processPaperUploaded\nExtraction -> Review -> QA -> Compiling]:::inngest
        ReviewComments --> ResubWorkflow[processResubmission\nRebuttal Agent Strategy]:::inngest
        Schedule --> DigestWorkflow[sendWeeklyDigest\nEmail Users]:::inngest

        UploadWorkflow --> Router[AI Router\nModel Selection]:::inngest
        ResubWorkflow --> Router

        Router --> Opus[Claude 3 Opus\nHeavy Reasoning]:::ai
        Router --> Sonnet[Claude 3.7 Sonnet\nInteractive Tasks]:::ai
        Router --> GPT[GPT-4o\nFallback]:::ai
    end
```

## 2. MCP (Model Context Protocol) Servers

The platform exposes several MCP servers via Server-Sent Events (SSE) to allow AI agents to safely interact with external publication platforms and literature databases.

### Infrastructure & Security
- **SSE Transport:** Next.js App Router endpoints establish SSE connections.
- **Authentication:** Requires authorization via NextAuth user sessions, Bearer tokens, or API keys.
- **SSRF Defense:** A Connection Resolver rigorously validates target URLs to protect against Server-Side Request Forgery.

### Supported Servers
- **WordPress MCP Server:** Exposes tools to test connections and create WordPress drafts.
- **Literature MCP Server:** Provides tools to search literature databases.
- **OJS MCP Server:** Interfaces natively with Open Journal Systems.

```mermaid
sequenceDiagram
    participant Agent as AI Agent (Client)
    participant NextJS as Next.js SSE Endpoint
    participant Registry as Session & Auth
    participant Resolver as SSRF Connection Resolver
    participant Tool as MCP Tool (WP/OJS/Lit)
    participant External as External API

    Agent->>NextJS: Initiate SSE Connection
    NextJS->>Registry: Validate Token / Session
    Registry-->>NextJS: Authorized
    Agent->>NextJS: Execute Tool (e.g., create_wp_draft)
    NextJS->>Resolver: Validate Target URL (SSRF Check)
    
    alt URL is Safe
        Resolver-->>NextJS: Validation Passed
        NextJS->>Tool: Execute Logic (Payload Formatting)
        Tool->>External: API Request (e.g., WordPress API)
        External-->>Tool: Success (Confirmation ID / URL)
        Tool-->>Agent: MCP Success Response
    else URL is Unsafe
        Resolver-->>NextJS: Validation Failed
        NextJS-->>Agent: MCP Error (Blocked Target)
    end
```

## 3. Data Science Sandbox (E2B)

For secure execution of untrusted AI-generated code, the platform uses **E2B**.
The data science sandbox uses an Ubuntu base image heavily loaded with numerical, scientific, and data analysis dependencies like Pandas, SciPy, NumPy, Statsmodels, Matplotlib, Seaborn, and Scikit-learn.

## 4. Guardrails Microservice (Python)

To ensure AI outputs are safe, professional, and do not execute malicious code, a standalone FastAPI microservice (`guardrails-service`) is utilized.

### Validation Strategies
1. **Code Execution Guard:** Statically analyzes Python code payloads via an Abstract Syntax Tree (AST) before allowing them to run.
2. **Academic Text Guard:** Filters LLM-generated prose to ensure high academic standards.

```mermaid
flowchart TD
    classDef request fill:#E5E7EB,stroke:#9CA3AF
    classDef check fill:#BFDBFE,stroke:#3B82F6
    classDef pass fill:#BBF7D0,stroke:#22C55E
    classDef fail fill:#FECACA,stroke:#EF4444

    Payload[Validation Request\nCode or Text]:::request --> Branch{Action Type?}

    Branch -->|code_execution| AST[AST Static Analysis]:::check
    AST --> CheckLoop(Infinite Loops?)
    AST --> CheckImports(System Imports?)
    AST --> CheckFunc(Eval/Exec/Open?)

    Branch -->|academic_text| Regex[Text Pattern Matching]:::check
    Regex --> CheckAIApology(AI Apologies?)
    Regex --> CheckPlaceholders(Unresolved Placeholders?)

    CheckLoop & CheckImports & CheckFunc --> |Violated| FailNode[Return Error/Fail]:::fail
    CheckAIApology & CheckPlaceholders --> |Violated| FailNode

    CheckLoop & CheckImports & CheckFunc --> |Safe| PassNode[Return Success]:::pass
    CheckAIApology & CheckPlaceholders --> |Safe| PassNode
```

### Preflight Code Execution Sequence

```mermaid
sequenceDiagram
    participant NextJS as Web App
    participant Inngest as Inngest (Event Hub)
    participant E2B as E2B Sandbox
    participant Guardrails as Guardrails FastAPI
    
    NextJS->>Inngest: Send paper/preflight event (Code Payload)
    Inngest->>Guardrails: POST /validate (action: code_execution)
    
    alt Guardrails Validation Fails
        Guardrails-->>Inngest: Fail (e.g., destructive imports)
        Inngest->>NextJS: Fire paper.preflight.failed
    else Guardrails Validation Succeeds
        Guardrails-->>Inngest: Pass
        Inngest->>E2B: Spin up publish-ai-data-science template
        E2B->>E2B: Execute Code
        E2B-->>Inngest: Return results/stdout
        Inngest->>NextJS: Fire paper.preflight.success
    end
```
