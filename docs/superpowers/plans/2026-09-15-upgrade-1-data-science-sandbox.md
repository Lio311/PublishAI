# תוכנית יישום: Data Science Sandbox

פיצ'ר זה יאפשר לחוקרים להעלות קובצי נתונים גולמיים (CSV/Excel) בנוסף למאמר. סוכן AI (Data Analyst) יריץ סקריפטים בפייתון בסביבת Sandbox (E2B) כדי לאמת ערכי P, סטטיסטיקות וטענות המופיעות במאמר מול הנתונים בפועל. במידה ומתגלות סתירות, המערכת תייצר גרפים מתוקנים ותשלב אותם במסמך.

## 1. סכמת מסד נתונים (Drizzle ORM)

יש להוסיף את הטבלאות הבאות לקובץ `src/db/schema.ts`:

```typescript
import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { papers } from "./schema"; // בהנחה שזה קיים

export const dataFiles = pgTable("dataFiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  paperId: uuid("paperId").notNull().references(() => papers.id),
  filename: text("filename").notNull(),
  fileUrl: text("fileUrl").notNull(),
  mimeType: text("mimeType").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const sandboxRuns = pgTable("sandboxRuns", {
  id: uuid("id").primaryKey().defaultRandom(),
  paperId: uuid("paperId").notNull().references(() => papers.id),
  status: text("status").notNull(), // 'pending', 'running', 'completed', 'failed'
  pythonScript: text("pythonScript"),
  executionLogs: text("executionLogs"),
  analysisResults: jsonb("analysisResults"), // תוצאות בדיקת הסטטיסטיקות
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export const generatedCharts = pgTable("generatedCharts", {
  id: uuid("id").primaryKey().defaultRandom(),
  sandboxRunId: uuid("sandboxRunId").notNull().references(() => sandboxRuns.id),
  paperId: uuid("paperId").notNull().references(() => papers.id),
  chartUrl: text("chartUrl").notNull(),
  description: text("description"), // תיאור הגרף והסתירה שהוא מתקן
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
```

## 2. שכבת שירותים (Service Layer)

יש ליצור את הקבצים הבאים תחת `src/services/`:

**`src/services/e2bService.ts`**
```typescript
/**
 * @description Creates an E2B Sandbox, uploads data files, executes Python code, and retrieves output files (like charts).
 */
export async function runPythonInSandbox(
  code: string, 
  dataFiles: Array<{ filename: string; url: string }>
): Promise<{ logs: string; results: any; chartUrls: string[] }> {
  // 1. Initialize E2B Sandbox
  // 2. Download files from URLs and write to Sandbox
  // 3. Execute `code`
  // 4. Collect standard output, errors, and any generated .png files
  // 5. Upload generated charts to storage (e.g. S3/Vercel Blob) and return their URLs
  // 6. Close Sandbox
}
```

**`src/services/dataAnalysisService.ts`**
```typescript
/**
 * @description Analyzes the paper text and generates a Python script to verify the statistical claims against the data.
 */
export async function generateAnalysisScript(
  paperContent: string,
  dataSchemas: string[] // Columns and types for the data
): Promise<string> {
  // Prompt LLM to write Python code that reads the data, calculates P-values/stats,
  // and saves visualizations using matplotlib if there's a discrepancy.
}
```

## 3. אינטגרציה עם Inngest

בקובץ `src/inngest/functions.ts`, נרחיב את הפונקציה הקיימת `processPaper` או נוסיף שלב חדש בפייפליין של הסוכנים.

```typescript
import { inngest } from "./client";
import { runPythonInSandbox } from "../services/e2bService";
import { generateAnalysisScript } from "../services/dataAnalysisService";
import { db } from "../db/drizzle";
import { dataFiles, sandboxRuns, generatedCharts } from "../db/schema";
import { eq } from "drizzle-orm";

export const processPaperAnalysis = inngest.createFunction(
  { id: "process-paper-analysis" },
  { event: "paper.uploaded" },
  async ({ event, step }) => {
    const paperId = event.data.paperId;

    // 1. Fetch uploaded data files
    const files = await step.run("fetch-data-files", async () => {
      return await db.select().from(dataFiles).where(eq(dataFiles.paperId, paperId));
    });

    if (files.length === 0) return; // No data files to process

    // 2. Generate Python Script
    const script = await step.run("generate-python-script", async () => {
      // Get paper content and column headers from files
      return await generateAnalysisScript(paperContent, fileHeaders);
    });

    // 3. Create Sandbox Run record
    const runId = await step.run("create-sandbox-run", async () => {
      const [run] = await db.insert(sandboxRuns).values({
        paperId,
        status: "running",
        pythonScript: script
      }).returning();
      return run.id;
    });

    // 4. Run Sandbox Execution
    const executionResult = await step.run("execute-sandbox", async () => {
      return await runPythonInSandbox(script, files);
    });

    // 5. Save Results & Charts
    await step.run("save-results", async () => {
      await db.update(sandboxRuns)
        .set({ 
          status: "completed", 
          executionLogs: executionResult.logs, 
          analysisResults: executionResult.results,
          completedAt: new Date()
        })
        .where(eq(sandboxRuns.id, runId));

      for (const chartUrl of executionResult.chartUrls) {
        await db.insert(generatedCharts).values({
          sandboxRunId: runId,
          paperId,
          chartUrl,
          description: "Auto-generated corrected chart"
        });
      }
    });
  }
);
```

## 4. נתיבי API (API Routes - App Router)

- `app/api/upload-data/route.ts` - קבלת קובצי נתונים, העלאתם לאחסון ענן (למשל Vercel Blob / AWS S3) ושמירת רשומות בטבלת `dataFiles`.
- `app/api/papers/[id]/sandbox/route.ts` - נתיב GET המחזיר את סטטוס ריצת ה-Sandbox (`sandboxRuns`) והגרפים שנוצרו.

## 5. רכיבי צד-לקוח (Frontend Components)

- **`DataUploadSection.tsx`**: רכיב המאפשר גרירת קבצים (Drag & Drop) של קובצי CSV/Excel, מציג את התקדמות ההעלאה ומקשר אותם למאמר.
- **`AnalysisStatus.tsx`**: רכיב המאזין לסטטוס ה-Sandbox (דרך polling או WebSockets) ומציג למשתמש חיווי (כגון: "מייצר סקריפט...", "מריץ בדיקות...", "מפיק גרפים...").
- **`GeneratedChartsViewer.tsx`**: רכיב המציג את הגרפים המתוקנים שנוצרו ומאפשר למשתמש לבחור האם לשלב אותם בגוף המסמך הסופי.

## 6. תלויות (Dependencies)

יש להתקין את החבילות הבאות:
```bash
npm install @e2b/sdk
npm install papaparse # לחילוץ מבנה נתונים מה-CSV בצד שרת/לקוח
```
בשירות הענן או בסביבת הפיתוח, יש לוודא שיש מפתח API מוגדר ב- `.env`:
```
E2B_API_KEY=your_e2b_api_key
```
