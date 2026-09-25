# RPA Navigation and GraphRAG Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement autonomous RPA Captcha fallback logic and build a GraphRAG knowledge system to analyze journal trends.

**Architecture:** We will add UI toggles for Captcha handling, hook Inngest's `waitForEvent` to a frontend modal, define `entities` and `relationships` tables in Drizzle, and create a GraphRAG retrieval service that feeds the `planningNode`.

**Tech Stack:** Next.js 16, Inngest, Drizzle ORM, Neon Postgres, Playwright, Vercel AI SDK.

## Global Constraints

- No external Graph databases; use existing Drizzle + Neon setup.
- All UI must be bilingual (en/he) via `next-intl`.
- All backend routes must be App Router compatible.

---

### Task 1: Drizzle Schema for GraphRAG

**Files:**
- Modify: `src/services/db/schema.ts`
- Create: `src/services/db/migrations/0001_graphrag.ts` (or rely on Drizzle push)

**Interfaces:**
- Produces: `entities` and `relationships` tables in Drizzle schema.

- [ ] **Step 1: Write the schema definition**
Modify `schema.ts` to add `entities` (id, name, type, embedding vector) and `relationships` (id, source_id, target_id, relation_type).

- [ ] **Step 2: Commit**
```bash
git add src/services/db/schema.ts
git commit -m "feat(db): add GraphRAG entities and relationships schema"
```

### Task 2: GraphRAG Ingestion and Query Service

**Files:**
- Create: `src/services/ai/graphrag.ts`

**Interfaces:**
- Consumes: `schema.ts` tables.
- Produces: `extractAndStoreEntities(text: string, journalId: number)` and `queryJournalTrends(journalId: number, topic: string)`.

- [ ] **Step 1: Write extraction logic**
Use `ChatOpenAI` with structured output (Zod) to extract entities from text.
- [ ] **Step 2: Write query logic**
Create a function to search entities and return trend context.
- [ ] **Step 3: Commit**
```bash
git add src/services/ai/graphrag.ts
git commit -m "feat(ai): build GraphRAG ingestion and query service"
```

### Task 3: Planning Node GraphRAG Integration

**Files:**
- Modify: `src/services/agents/graph/nodes/planningNode.ts`

**Interfaces:**
- Consumes: `queryJournalTrends` from `graphrag.ts`.
- Produces: Augmented context injected into the planning prompt.

- [ ] **Step 1: Modify planning node**
Import and call `queryJournalTrends` based on the target journal, append insights to the prompt.
- [ ] **Step 2: Commit**
```bash
git add src/services/agents/graph/nodes/planningNode.ts
git commit -m "feat(agents): inject GraphRAG insights into planning node"
```

### Task 4: RPA Captcha UI Config

**Files:**
- Modify: `src/components/dashboard/connections/ConnectionForm.tsx` (or similar)
- Modify: `src/services/db/schema.ts` (Add captchaStrategy to journalConnections)

**Interfaces:**
- Produces: User preference stored in DB for 'Auto' vs 'Manual' captcha.

- [ ] **Step 1: Add DB field**
Add `captchaStrategy` enum ('auto', 'manual') to journalConnections table.
- [ ] **Step 2: Update UI Form**
Add a radio toggle for the strategy.
- [ ] **Step 3: Commit**
```bash
git add src/services/db/schema.ts
git commit -m "feat(rpa): add captcha strategy config"
```

### Task 5: Human-in-the-Loop Captcha Modal

**Files:**
- Modify: `src/components/papers/PaperProcessingUI.tsx`

**Interfaces:**
- Consumes: Inngest API to send `submission.captcha.solved` event.

- [ ] **Step 1: Add Captcha Modal**
Listen for paper status = 'requires_captcha', display modal with screenshot and input.
- [ ] **Step 2: Add API trigger**
Send input to an API route to resume Inngest.
- [ ] **Step 3: Commit**
```bash
git add src/components/papers/PaperProcessingUI.tsx
git commit -m "feat(ui): build Captcha resolution modal"
```

