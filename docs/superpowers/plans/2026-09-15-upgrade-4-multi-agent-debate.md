# תוכנית יישום: דיון רב-סוכנים (Multi-Agent Debate - Swarm)

## 1. סכמת מסד נתונים (Drizzle ORM)
יש להוסיף את ההגדרות הבאות לקובץ `src/db/schema.ts`. הוספנו טבלאות לניהול הדיון, הסוכנים המשתתפים בו (הפרסונות) וההודעות המרכיבות את התמליל.

```typescript
import { pgTable, text, timestamp, uuid, jsonb, boolean, integer, pgEnum } from "drizzle-orm/pg-core";
import { submissions } from "./schema"; // בהנחה שקיים

export const debateStatusEnum = pgEnum("debate_status", ["pending", "in_progress", "consensus_reached", "failed"]);

export const debates = pgTable("debates", {
  id: uuid("id").primaryKey().defaultRandom(),
  submissionId: uuid("submission_id").references(() => submissions.id).notNull(),
  status: debateStatusEnum("status").default("pending").notNull(),
  topic: text("topic").notNull(),
  consensusSummary: text("consensus_summary"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const debateAgents = pgTable("debate_agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  debateId: uuid("debate_id").references(() => debates.id).notNull(),
  name: text("name").notNull(),
  persona: text("persona").notNull(), // למשל: 'harsh_reviewer', 'methodology_expert'
  systemPrompt: text("system_prompt").notNull(),
});

export const debateMessages = pgTable("debate_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  debateId: uuid("debate_id").references(() => debates.id).notNull(),
  agentId: uuid("agent_id").references(() => debateAgents.id), // יהיה null אם זו הודעת מערכת
  content: text("content").notNull(),
  round: integer("round").notNull(),
  isConsensusProposal: boolean("is_consensus_proposal").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

## 2. שכבת השירותים (Service Layer)
יש ליצור את הקובץ `src/services/debateService.ts` לניהול הלוגיקה העסקית:

```typescript
/**
 * מאתחל דיון חדש עבור הגשה מסוימת ומקים את סוכני הדיון עם הפרסונות השונות.
 * @param submissionId - מזהה ההגשה לסקירה
 * @returns מזהה הדיון שנוצר
 */
export async function initializeDebate(submissionId: string): Promise<string> { ... }

/**
 * מוסיף הודעה לתמליל הדיון.
 * @param debateId - מזהה הדיון
 * @param agentId - מזהה הסוכן (או null להודעת מערכת)
 * @param content - תוכן ההודעה
 * @param round - מספר סבב הדיון הנוכחי
 * @returns מזהה ההודעה שנוצרה
 */
export async function addDebateMessage(debateId: string, agentId: string | null, content: string, round: number): Promise<string> { ... }

/**
 * בודק האם הושגה הסכמה (Consensus) בין הסוכנים על סמך ההודעות האחרונות.
 * @param debateId - מזהה הדיון
 * @returns אובייקט המציין אם הושגה הסכמה ואת תקציר ההסכמה במידה וכן
 */
export async function checkConsensus(debateId: string): Promise<{ reached: boolean, summary?: string }> { ... }
```

## 3. אינטגרציה עם Inngest
בקובץ `src/inngest/functions.ts`, יש להחליף את הצעד הליניארי של `ScientificReviewAgent` בפונקציה הבאה שתנהל את הדיון:

```typescript
import { inngest } from "./client";
import { initializeDebate, addDebateMessage, checkConsensus } from "../services/debateService";

export const scientificReviewDebate = inngest.createFunction(
  { id: "scientific-review-debate" },
  { event: "submission.review.started" },
  async ({ event, step }) => {
    const { submissionId } = event.data;

    // שלב 1: אתחול הדיון והסוכנים
    const debateId = await step.run("initialize-debate", () => initializeDebate(submissionId));
    
    let reachedConsensus = false;
    let round = 1;
    const maxRounds = 5;

    // שלב 2: לולאת הדיון
    while (!reachedConsensus && round <= maxRounds) {
      // הפעלת הסוכנים במקביל באמצעות קריאות LLM
      const agentResponses = await step.run(`debate-round-${round}`, async () => {
         // Orchestrate LLM calls for each persona in parallel
         // ...
         return responses;
      });

      // שמירת ההודעות במסד הנתונים ושידורן ל-Frontend (SSE)
      await step.run(`save-messages-round-${round}`, async () => {
         // Save to DB and trigger server-sent events
         // ...
      });

      // בדיקת קונצנזוס
      const consensusCheck = await step.run(`check-consensus-round-${round}`, () => checkConsensus(debateId));
      reachedConsensus = consensusCheck.reached;
      
      round++;
    }

    // שלב 3: סיכום וסיום
    await step.run("finalize-debate", async () => {
       // עדכון סטטוס ההגשה ושמירת תמצית הקונצנזוס במסד הנתונים
    });
    
    return { success: true, debateId };
  }
);
```

## 4. נתיבי API (API Routes - App Router)
- `src/app/api/debates/[debateId]/stream/route.ts`: נקודת קצה (Endpoint) מסוג GET המחזירה Server-Sent Events (SSE) כדי לשדר ללקוח את התקדמות הדיון בזמן אמת.
- `src/app/api/debates/[debateId]/route.ts`: נקודת קצה מסוג GET לשליפת היסטוריית הדיון המלאה (תמליל) עבור דיונים שהסתיימו או לטעינה ראשונית.

## 5. רכיבי Frontend (React Components)
יש ליצור את הרכיבים הבאים (למשל תחת `src/components/debates/`):
- `DebateRoom.tsx`: הרכיב הראשי המכיל את תצוגת הדיון, מנהל את החיבור ל-SSE, ושומר את מצב הדיון.
- `AgentAvatar.tsx`: רכיב ויזואלי המייצג את הפרסונה של הסוכן (למשל, אייקונים שונים למבקר קשוח לעומת מומחה סטטיסטיקה).
- `DebateTranscript.tsx`: רשימת ההודעות שזורמת בזמן אמת. כולל גלילה אוטומטית למטה והדגשה ויזואלית של הצעות קונצנזוס.
- `ConsensusSummary.tsx`: מוצג בסיום הדיון, ומכיל את התוצאה המזוקקת והמוסכמת שתוצג לחוקר.

## 6. תלויות (Dependencies)
חבילות NPM שיש להתקין (במידה ואינן מותקנות):
```bash
npm install ai @ai-sdk/openai
npm install eventsource-parser
npm install @langchain/langgraph # אופציונלי - אם נדרש ניהול State מורכב מעבר למה ש-Inngest מספק
```
