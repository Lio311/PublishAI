# תוכנית יישום: יכולות ראייה ממוחשבת מולטימודאלית (Multimodal Vision AI)

## 1. מסד נתונים (Drizzle ORM)
נוסיף טבלאות חדשות לניהול התמונות, החלקים הויזואליים, ובדיקות התקינות של המודל.

```typescript
// src/db/schema.ts
import { pgTable, text, timestamp, uuid, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import { papers, paperVersions } from './schema';

export const figures = pgTable('figures', {
  id: uuid('id').primaryKey().defaultRandom(),
  paperId: uuid('paper_id').references(() => papers.id).notNull(),
  paperVersionId: uuid('paper_version_id').references(() => paperVersions.id).notNull(),
  figureNumber: integer('figure_number').notNull(),
  imageUrl: text('image_url').notNull(),
  originalLegend: text('original_legend'),
  extractedText: text('extracted_text'),
  resolution: integer('resolution'), // dpi
  qualityScore: integer('quality_score'), // 1-100
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const figureAnalyses = pgTable('figure_analyses', {
  id: uuid('id').primaryKey().defaultRandom(),
  figureId: uuid('figure_id').references(() => figures.id).notNull(),
  modelUsed: text('model_used').notNull(), // e.g., 'gpt-4o', 'claude-3.5-sonnet'
  legendAccuracyScore: integer('legend_accuracy_score'), // 1-100
  claimVerificationStatus: text('claim_verification_status'), // 'verified', 'discrepancy', 'unclear'
  suggestedLegend: text('suggested_legend'),
  issuesFound: jsonb('issues_found'), // Array of strings detailing issues
  rawAnalysis: jsonb('raw_analysis'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

## 2. שכבת שירות (Service Layer)

```typescript
// src/services/visionAi.service.ts

/**
 * Extracts images and their corresponding legends from a document (PDF/Word).
 * @param {string} documentUrl - The URL or path to the document.
 * @returns {Promise<Array<{imageUrl: string, legend: string, figureNumber: number, resolution: number}>>}
 */
export async function extractFiguresFromDocument(documentUrl: string): Promise<Array<{imageUrl: string, legend: string, figureNumber: number, resolution: number}>> {
  // Implementation details...
  return [];
}

/**
 * Analyzes a figure against its legend and associated claims using a Vision AI model.
 * @param {string} imageUrl - The URL of the extracted figure image.
 * @param {string} legend - The original legend text.
 * @param {string[]} claims - Relevant claims made in the paper text referencing this figure.
 * @returns {Promise<any>}
 */
export async function analyzeFigureWithVisionAi(imageUrl: string, legend: string, claims: string[]): Promise<any> {
  // Call to GPT-4o Vision or Claude 3.5 Sonnet
}

/**
 * Generates an improved, more accurate legend based on the visual data.
 * @param {string} imageUrl - The figure image URL.
 * @param {string} currentLegend - The current legend.
 * @param {string} context - Surrounding text context.
 * @returns {Promise<string>}
 */
export async function suggestImprovedLegend(imageUrl: string, currentLegend: string, context: string): Promise<string> {
  // Implementation details...
  return "";
}
```

## 3. אינטגרציה עם Inngest

```typescript
// src/inngest/functions.ts
import { inngest } from './client';
import { extractFiguresFromDocument, analyzeFigureWithVisionAi } from '../services/visionAi.service';
import { db } from '../db';
import { figures, figureAnalyses } from '../db/schema';

export const processPaperFigures = inngest.createFunction(
  { id: 'process-paper-figures', name: 'Process Paper Figures & Vision AI' },
  { event: 'paper.uploaded' },
  async ({ event, step }) => {
    const { paperId, paperVersionId, documentUrl } = event.data;

    // Step 1: Extract figures
    const extractedFigures = await step.run('extract-figures', async () => {
      return await extractFiguresFromDocument(documentUrl);
    });

    // Step 2: Save figures to DB
    const savedFigures = await step.run('save-figures-to-db', async () => {
      // DB insert logic using Drizzle returning IDs
      return [];
    });

    // Step 3: Analyze each figure
    for (const figure of savedFigures) {
      await step.run(`analyze-figure-${figure.id}`, async () => {
        const analysis = await analyzeFigureWithVisionAi(figure.imageUrl, figure.originalLegend, []);
        // Save analysis to figureAnalyses table
      });
    }

    // Step 4: Integrate with QA Agent
    await step.sendEvent('qa-agent.trigger', {
      name: 'qa.figures.analyzed',
      data: { paperId, paperVersionId }
    });
  }
);
```

## 4. נתיבי API (App Router)

- `POST /api/figures/extract` - נקודת קצה לטריגר ידני של חילוץ תמונות ממסמך נתון.
- `GET /api/papers/[paperId]/figures` - קבלת כל התמונות והניתוחים שלהן עבור מאמר מסוים (לשימוש בדאשבורד).
- `POST /api/figures/[figureId]/analyze` - הפעלה חוזרת או ממוקדת של ה-Vision AI על תמונה ספציפית.
- `PUT /api/figures/[figureId]/legend` - עדכון ה-legend לאחר שהמשתמש אישר את ההצעה של ה-AI.

## 5. רכיבי Frontend (React)

- `FigureGallery.tsx`: קומפוננטה המציגה גריד של כל התמונות שחולצו מהמאמר.
- `FigureAnalysisCard.tsx`: כרטיס המציג תמונה ספציפית יחד עם המידע המקורי (Legend), ציון האיכות, ורשימת בעיות שהתגלו על ידי ה-Vision AI.
- `LegendEditor.tsx`: רכיב UI המציג את ה-legend המקורי מול ה-legend המוצע, ומאפשר עריכה ואישור.
- `ClaimVerificationBadge.tsx`: תגית ויזואלית (ירוק/אדום/צהוב) המראה האם הטענות בטקסט תואמות לתוכן הויזואלי.

## 6. תלויות (npm packages)

```bash
# Vision SDKs & API Clients
npm install openai @anthropic-ai/sdk

# PDF/Image Extraction tools
npm install pdf2pic pdf-parse

# For image handling and optimization
npm install sharp
```
