# Phase 5: Peer Review Rebuttal Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a robust mechanism to handle reviewer critiques, generate a rebuttal letter, and execute targeted revisions on the manuscript without rewriting the entire paper from scratch.

**Architecture:** 
- A new LangGraph node (`rebuttalNode`) analyzes reviewer comments and produces a revision strategy + response letter.
- LangGraph conditional routing: A new flow triggered by `action: 'rebuttal'`.
- UI component to paste reviewer comments, approve the strategy, and track the targeted revision progress.

**Tech Stack:** Next.js 16, LangGraph, Drizzle ORM, @langchain/openai.

## Global Constraints
- Use existing `PublishAIState` schema in LangGraph, expanding it where necessary.
- UI must support RTL/LTR (next-intl).

---

### Task 1: Extend State and DB for Rebuttal

**Files:**
- Modify: `src/services/agents/graph/state.ts`
- Modify: `src/services/db/schema.ts`

**Interfaces:**
- Produces: `reviewerComments`, `rebuttalStrategy`, and `rebuttalLetter` fields in `PublishAIStateAnnotation` and Drizzle schema (e.g. `papers` or `paperVersions`).

- [ ] **Step 1: Update Drizzle Schema**
Add JSON or text fields for the 3 rebuttal items to `schema.ts`.
- [ ] **Step 2: Update LangGraph State**
Add the 3 fields to `PublishAIStateAnnotation`.
- [ ] **Step 3: Commit**
```bash
git add src/services/db/schema.ts src/services/agents/graph/state.ts
git commit -m "feat(db): add rebuttal fields to schema and state"
```

### Task 2: Create Rebuttal Agent Node

**Files:**
- Create: `src/services/agents/graph/nodes/rebuttalNode.ts`

**Interfaces:**
- Consumes: `state.documentContent`, `state.reviewerComments`
- Produces: `state.rebuttalStrategy` (the plan for `executionNode`) and `state.rebuttalLetter` (the formal response to reviewers).

- [ ] **Step 1: Implement the node**
Use `ChatOpenAI` (gpt-4o). Prompt it to act as a senior academic facing harsh peer review. It must read the manuscript and the comments, then output a JSON object containing `strategy` (bullet points of exact textual changes needed) and `letter` (the formal letter).
- [ ] **Step 2: Commit**
```bash
git add src/services/agents/graph/nodes/rebuttalNode.ts
git commit -m "feat(agents): create rebuttal agent node"
```

### Task 3: LangGraph Conditional Routing for Rebuttal

**Files:**
- Modify: `src/services/agents/graph/workflow.ts`
- Modify: `src/app/api/agents/run/route.ts`

**Interfaces:**
- Consumes: `rebuttalNode`

- [ ] **Step 1: Wire the Node**
Add `rebuttalNode` to the `StateGraph`. Create a conditional edge from `START`: if `state.reviewerComments` is present, go to `rebuttalNode`, then to `executionNode`. Otherwise, go to `retrieveMemoryNode` (the normal flow).
- [ ] **Step 2: Update API**
Ensure the API handles an action like `start_rebuttal` that injects the comments into the initial state.
- [ ] **Step 3: Commit**
```bash
git add src/services/agents/graph/workflow.ts src/app/api/agents/run/route.ts
git commit -m "feat(agents): route LangGraph for rebuttal flow"
```

### Task 4: Rebuttal UI Component

**Files:**
- Create: `src/components/papers/RebuttalPanel.tsx`

**Interfaces:**
- Produces: A client component that allows pasting reviewer comments and triggering the pipeline.

- [ ] **Step 1: Build the UI**
A panel with a `<textarea>` for "Paste Reviewer Comments". A "Generate Strategy" button that calls the API. Displays the `rebuttalStrategy` and `rebuttalLetter` when the graph pauses (interrupt before `executionNode`).
- [ ] **Step 2: Commit**
```bash
git add src/components/papers/RebuttalPanel.tsx
git commit -m "feat(ui): build rebuttal panel component"
```

