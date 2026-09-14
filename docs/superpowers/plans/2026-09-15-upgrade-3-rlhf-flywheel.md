# תוכנית יישום: RLHF Data Flywheel

מסמך זה מתאר את התוכנית הטכנית המלאה ליישום מנגנון לולאת משוב (RLHF Data Flywheel) במערכת Publish-AI. המערכת תאסוף נתוני קבלה/דחייה של מאמרים ותיצור בסיס נתונים ייחודי המשמש לשיפור ואימון מודלים מותאמים אישית לאורך זמן.

## 1. סכמת מסד נתונים (Drizzle ORM)

יש להוסיף את ההגדרות הבאות לקובץ `src/db/schema.ts`:

```typescript
import { pgTable, text, timestamp, uuid, jsonb, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { journals, paperVersions, submissions } from './schema';

// הגדרת סוגי תוצאות אפשריות למשוב
export const feedbackOutcomeEnum = pgEnum('feedback_outcome', ['accepted', 'rejected', 'revision_required']);

// טבלת תיעוד התוצאות והתיקונים - לב לולאת המשוב
export const rlhfFeedbackLogs = pgTable('rlhf_feedback_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  submissionId: uuid('submission_id').references(() => submissions.id).notNull(),
  paperVersionId: uuid('paper_version_id').references(() => paperVersions.id).notNull(),
  journalId: uuid('journal_id').references(() => journals.id).notNull(),
  outcome: feedbackOutcomeEnum('outcome').notNull(),
  reviewerComments: text('reviewer_comments'),
  
  // מערך אובייקטים המתארים את השינויים הספציפיים שהמודל ביצע במאמר לפני ההגשה
  correctionData: jsonb('correction_data').notNull(), 
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ניהול אסטרטגיות עבור A/B Testing
export const promptStrategies = pgTable('prompt_strategies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  promptTemplate: text('prompt_template').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// הקצאת אסטרטגיה לכל הגשה כדי שנוכל למדוד אחוזי הצלחה
export const abTestAllocations = pgTable('ab_test_allocations', {
  id: uuid('id').primaryKey().defaultRandom(),
  submissionId: uuid('submission_id').references(() => submissions.id).notNull(),
  promptStrategyId: uuid('prompt_strategy_id').references(() => promptStrategies.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

## 2. שכבת שירות (Service Layer)

יש ליצור קובץ חדש `src/services/rlhfService.ts`:

```typescript
/**
 * מתעד תוצאת משוב (קבלה/דחייה/תיקונים) עבור הגשה, ושומר את פרטי התיקונים שהובילו לתוצאה זו.
 */
export async function logFeedbackOutcome(
  submissionId: string, 
  outcome: 'accepted' | 'rejected' | 'revision_required', 
  reviewerComments?: string
): Promise<void>

/**
 * אוסף את כל הנתונים הרלוונטיים (מאמר מקורי לעומת גרסה סופית ותוצאה) ומייצא אותם בפורמט JSONL לאימון מודלים (Fine-tuning).
 */
export async function exportDatasetForFineTuning(
  journalId?: string, 
  outcomeFilter?: 'accepted'
): Promise<string> // מחזיר נתיב או URL לקובץ שהופק

/**
 * מקצה אסטרטגיית פרומפט (מתוך האסטרטגיות הפעילות) להגשה חדשה כחלק ממערך A/B testing.
 */
export async function assignPromptStrategy(submissionId: string): Promise<string>

/**
 * מחזיר סטטיסטיקות ודפוסי הצלחה מנותחים עבור ז'ורנל ספציפי (אחוזי קבלה, אסטרטגיות מובילות).
 */
export async function getJournalAnalytics(journalId: string): Promise<any>
```

## 3. אינטגרציה עם Inngest

יש להוסיף לקובץ `src/inngest/functions.ts` את הפונקציות הבאות:

```typescript
import { inngest } from './client';
import { logFeedbackOutcome, exportDatasetForFineTuning } from '../services/rlhfService';

// מאזין לעדכוני סטטוס של הגשות ומתעד את התוצאה למערכת ה-RLHF
export const processSubmissionOutcome = inngest.createFunction(
  { id: 'process-submission-outcome' },
  { event: 'submission.status.updated' },
  async ({ event, step }) => {
    const { submissionId, status, comments } = event.data;
    
    // מיפוי סטטוסי הגשה לתוצאות RLHF
    let outcome: 'accepted' | 'rejected' | 'revision_required' | null = null;
    if (status === 'accepted') outcome = 'accepted';
    else if (status === 'rejected') outcome = 'rejected';
    else if (status === 'needs_revision') outcome = 'revision_required';
    
    if (outcome) {
      await step.run('log-feedback-outcome', async () => {
        await logFeedbackOutcome(submissionId, outcome, comments);
      });
    }
  }
);

// משימה תקופתית (Cron) ליצירת קובץ נתונים שבועי לאימון מודלים
export const generateWeeklyFineTuningDataset = inngest.createFunction(
  { id: 'generate-weekly-finetuning-dataset' },
  { cron: '0 0 * * 0' }, // כל יום ראשון בחצות
  async ({ step }) => {
    await step.run('export-dataset', async () => {
      // מייצא רק מאמרים שהתקבלו כדי ליצור Dataset איכותי לחיקוי
      await exportDatasetForFineTuning(undefined, 'accepted');
    });
  }
);
```

## 4. נתיבי API (API Routes)

יש ליצור את הנתיבים הבאים תחת תיקיית ה-App Router (`src/app/api/rlhf/`):

*   **`GET /api/rlhf/analytics`**: שליפת נתונים מרוכזים לדשבורד ביצועים (אחוזי קבלה כלליים, השוואת ביצועי מודלים ואסטרטגיות).
*   **`GET /api/rlhf/analytics/journal/:id`**: שליפת סטטיסטיקות ממוקדות וזיהוי דפוסים מוצלחים עבור ז'ורנל ספציפי (למשל Nature לעומת Science).
*   **`POST /api/rlhf/export`**: הפעלת ייצוא נתונים ידני. מקבל פרמטרים של סינון (טווח תאריכים, ז'ורנלים, סטטוס) ומחזיר קישור הורדה לקובץ ה-JSONL.
*   **`GET & POST /api/rlhf/prompt-strategies`**: ניהול אסטרטגיות ה-A/B Testing (שליפה, הוספה, עדכון סטטוס פעילות).

## 5. רכיבי Frontend (React Components)

*   **`AnalyticsDashboard`**: דשבורד מנהלים ראשי. יציג גרפים המסכמים את אחוזי ההצלחה של המערכת, תפוקת ה-RLHF לאורך זמן, והשוואה בין טכניקות עריכה שונות.
*   **`JournalPerformanceChart`**: רכיב המציג גרף (באמצעות ספריה כמו Recharts) של שיעור הקבלה לפי ז'ורנל לאורך זמן, מה שיאפשר לזהות מגמות בהתאמה לדרישות של כתבי עת ספציפיים.
*   **`PromptStrategyManager`**: טבלת ניהול המאפשרת לצוות המפתחים או העורכים ליצור אסטרטגיות פרומפט חדשות, להגדיר אותן כפעילות ל-A/B Test, ולצפות בביצועים של כל אסטרטגיה.
*   **`ExportDatasetModal`**: מודל צף (Dialog) המאפשר למשתמש טכני לבחור חיתוכים שונים (לדוגמה: "רק מאמרים מ-Nature שהתקבלו בחצי שנה האחרונה") ולהוריד קובץ מוכן ל-Fine-tuning.

## 6. חבילות תלות (Dependencies)

נדרשת התקנה של חבילות בודדות מעבר למחסנית הטכנולוגית הקיימת:

```bash
# ספריה ליצירת גרפים עבור דשבורד האנליטיקה
npm install recharts

# עזרים פשוטים לעבודה עם קבצים / סטרימינג עשויים להיות נחוצים במידה וה-Dataset גדול מאוד
npm install JSONStream
```
