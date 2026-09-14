# תכנון פיצ׳ר: Knowledge Graph & GraphRAG - Publish-AI

מסמך זה מפרט את תוכנית היישום עבור פיצ׳ר ה-Knowledge Graph ו-GraphRAG במערכת Publish-AI, במטרה להפוך את סוכני ה-AI מ"עורכי לשון" ל"עורכי לוגיקה מדעית".

## 1. סכמת מסד נתונים (Drizzle ORM)
נוסיף את הטבלאות הבאות לקובץ `src/db/schema.ts` בכדי לנהל את הישויות והקשרים בתוך Neon Postgres:

```typescript
import { pgTable, text, uuid, timestamp, real, pgEnum } from 'drizzle-orm/pg-core';
import { papers } from './schema'; // Assuming papers is already defined

export const entityTypeEnum = pgEnum('entity_type', ['drug', 'protein', 'gene', 'disease', 'concept', 'study', 'method']);
export const relationshipTypeEnum = pgEnum('relationship_type', ['affects', 'contradicts', 'supports', 'causes', 'treats', 'correlates']);

export const scientificEntities = pgTable('scientific_entities', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  type: entityTypeEnum('type').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const scientificRelationships = pgTable('scientific_relationships', {
  id: uuid('id').defaultRandom().primaryKey(),
  sourceEntityId: uuid('source_entity_id').references(() => scientificEntities.id, { onDelete: 'cascade' }).notNull(),
  targetEntityId: uuid('target_entity_id').references(() => scientificEntities.id, { onDelete: 'cascade' }).notNull(),
  relationshipType: relationshipTypeEnum('relationship_type').notNull(),
  evidenceText: text('evidence_text').notNull(), // text snippet from the paper
  paperId: uuid('paper_id').references(() => papers.id, { onDelete: 'set null' }),
  confidenceScore: real('confidence_score').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

## 2. שכבת שירותים (Service Layer)
ניצור את הקבצים הבאים תחת התיקייה `src/services/graph/`:

### `src/services/graph/entityExtractor.ts`
```typescript
/**
 * @file src/services/graph/entityExtractor.ts
 * מנתח טקסט ממחקרים ושולף ישויות מדעיות באמצעות מודל שפה.
 */

export interface ExtractedEntity {
  name: string;
  type: 'drug' | 'protein' | 'gene' | 'disease' | 'concept' | 'study' | 'method';
  description?: string;
}

/**
 * Extracts scientific entities from a given text using LLM.
 * @param {string} text - The paper text to analyze.
 * @returns {Promise<ExtractedEntity[]>} List of extracted scientific entities.
 */
export async function extractScientificEntities(text: string): Promise<ExtractedEntity[]> {
  // Implementation using LangChain or OpenAI function calling
}
```

### `src/services/graph/graphBuilder.ts`
```typescript
/**
 * @file src/services/graph/graphBuilder.ts
 * מנהל את יצירת הקשרים בין ישויות ושמירתם למסד הנתונים.
 */

export interface RelationshipPayload {
  sourceName: string;
  targetName: string;
  relationshipType: string;
  evidenceText: string;
  paperId: string;
  confidenceScore: number;
}

/**
 * Upserts entities and inserts relationships between them into the database.
 * @param {RelationshipPayload[]} relationships - The relationships to save.
 * @returns {Promise<void>}
 */
export async function buildGraphFromRelationships(relationships: RelationshipPayload[]): Promise<void> {
  // Implementation with Drizzle ORM inserts (upserting entities first, then relationships)
}
```

### `src/services/graph/logicChecker.ts`
```typescript
/**
 * @file src/services/graph/logicChecker.ts
 * מנוע לגילוי סתירות מדעיות באמצעות GraphRAG.
 */

export interface LogicCheckResult {
  claim: string;
  isConsistent: boolean;
  contradictingEvidence?: string[];
  supportingEvidence?: string[];
}

/**
 * Validates scientific claims against the existing knowledge graph.
 * @param {string[]} claims - Extracted claims from the current paper.
 * @returns {Promise<LogicCheckResult[]>} Logical consistency report for each claim.
 */
export async function checkLogicalConsistency(claims: string[]): Promise<LogicCheckResult[]> {
  // Queries the local Postgres graph tables to find contradicting or supporting claims
}
```

## 3. אינטגרציה עם Inngest (`src/inngest/functions.ts`)
נעדכן את תהליך עיבוד המאמר הקיים ונוסיף סוכנים חדשים:

```typescript
import { inngest } from './client';
import { extractScientificEntities } from '../services/graph/entityExtractor';
import { checkLogicalConsistency } from '../services/graph/logicChecker';

// פונקציה חדשה לחילוץ נתונים למאגר ה-Knowledge Graph לאחר העלאת המאמר
export const extractPaperGraphData = inngest.createFunction(
  { id: 'extract-paper-graph-data' },
  { event: 'paper/uploaded' },
  async ({ event, step }) => {
    const text = await step.run('fetch-paper-text', () => fetchText(event.data.paperId));
    
    const entities = await step.run('extract-entities', () => extractScientificEntities(text));
    // ... extract relationships and build graph
  }
);

// הוספת שלב לסוכן הסקירה המדעית הקיים
export const scientificReviewAgent = inngest.createFunction(
  { id: 'scientific-review-agent' },
  { event: 'paper/ready-for-review' },
  async ({ event, step }) => {
    // שלבים קיימים...
    
    // שלב חדש: בדיקת עקביות לוגית (GraphRAG)
    const logicReport = await step.run('check-logic-consistency', async () => {
       const claims = await extractClaims(event.data.paperId);
       return checkLogicalConsistency(claims);
    });

    // שמירת תוצאות הסתירות כהערות על גבי המאמר
    await step.run('save-logic-feedback', () => saveLogicFeedback(event.data.paperId, logicReport));
  }
);
```

## 4. נתיבי API (App Router)

- **`app/api/graph/entities/route.ts` (GET):** 
  שליפת רשימת כל הישויות המדעיות הקיימות בגרף עם יכולות חיפוש וסינון.
- **`app/api/graph/logic-check/route.ts` (POST):** 
  נקודת קצה יזומה (Trigger) להפעלת בדיקת לוגיקה על פסקה ספציפית בעת עריכה.
- **`app/api/graph/visualize/[paperId]/route.ts` (GET):** 
  שליפת נתוני JSON מותאמים (Nodes ו-Links) המייצגים את רשת הקשרים עבור מאמר מסוים, לצורך תצוגה בממשק משתמש (Force Graph).

## 5. רכיבי Frontend (React)

- **`KnowledgeGraphViewer.tsx`:** 
  רכיב ויזואלי המציג את הגרף בצורה אינטראקטיבית (צמתים וקשתות). המשתמש יכול לרחף על קשת ולראות את טקסט ההוכחה (Evidence).
- **`LogicConsistencyReport.tsx`:** 
  חלונית צד בעורך הטקסט המציגה את דוח העקביות. מציג אזהרות באדום עבור סתירות מדעיות וירוק לתמיכות ממחקרים אחרים.
- **`EntityHighlighter.tsx`:** 
  רכיב שעוטף את העורך עצמו ומסמן (Highlight) שמות של תרופות/חלבונים המוכרים ל-Knowledge Graph.

## 6. תלויות שיש להתקין (Dependencies)
יש להוסיף את חבילות ה-NPM הבאות לפרויקט:

```bash
# חבילות קצה עליון להצגת הגרף
npm install react-force-graph-2d d3-force

# חבילות לעיבוד AI ו-RAG (אם עדיין לא קיימות)
npm install @langchain/core @langchain/openai

# Type definitions for D3
npm install -D @types/d3-force
```
