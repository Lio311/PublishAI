import { validateDatabaseUrl, runScript } from "./env";
import { db } from "../services/db";
import {
  journals,
  journalCitationRules,
  journalArticleTypes,
  journalAbstractRules,
  journalCoverLetterRules,
} from "../services/db/schema";
import {
  INITIAL_JOURNALS,
  INITIAL_CITATION_RULES,
  INITIAL_ARTICLE_TYPES,
  INITIAL_ABSTRACT_RULES,
  INITIAL_COVER_LETTER_RULES,
} from "../services/journals/seed-data";
import { eq } from "drizzle-orm";

export async function seedDatabase(): Promise<void> {
  // Validate that a real DATABASE_URL is available
  validateDatabaseUrl();

  console.log("🌱 Starting idempotent database seed for enriched journal data...\n");

  for (const journalData of INITIAL_JOURNALS) {
    console.log(`📖 Processing journal: ${journalData.name}`);

    // Idempotent journal lookup: find all entries with this name to deduplicate if prior runs left dupes
    const existingJournals = await db
      .select()
      .from(journals)
      .where(eq(journals.name, journalData.name));

    let journalId: number;

    if (existingJournals.length > 0) {
      const [primaryJournal, ...duplicateJournals] = existingJournals;
      journalId = primaryJournal.id;

      console.log(`  ↻ Updating existing journal "${journalData.name}" (ID: ${journalId})`);
      await db
        .update(journals)
        .set(journalData)
        .where(eq(journals.id, journalId));

      // Clean up duplicates if any exist from legacy non-idempotent scripts
      if (duplicateJournals.length > 0) {
        console.log(`  ⚠ Removing ${duplicateJournals.length} duplicate entries for "${journalData.name}"`);
        for (const dup of duplicateJournals) {
          await db.delete(journals).where(eq(journals.id, dup.id));
        }
      }
    } else {
      console.log(`  + Inserting new journal "${journalData.name}"`);
      const [inserted] = await db
        .insert(journals)
        .values(journalData)
        .returning();
      journalId = inserted.id;
    }

    // 1. Citation Rules (1:1 per journal)
    const citationRule = INITIAL_CITATION_RULES.find(
      (r) => r.journalName === journalData.name
    );
    if (citationRule) {
      const mappedData = {
        styleName: citationRule.style,
        inTextFormat: citationRule.inTextFormat,
        referenceListOrder: citationRule.referenceListOrder,
        etAlThreshold: citationRule.etAlThreshold ?? null,
        etAlDisplayCount: citationRule.etAlDisplayCount ?? null,
        volumeFormat: citationRule.volumeFormat ?? null,
        yearFormat: citationRule.yearFormat ?? null,
        journalTitleFormat: citationRule.journalTitleFormat ?? null,
        authorFormat: citationRule.authorFormat ?? null,
        lastAuthorSeparator: citationRule.lastAuthorSeparator ?? null,
        articleTitleFormat: citationRule.articleTitleFormat ?? null,
        personalCommsInRefList: citationRule.personalCommsInRefList ?? false,
        exampleReference:
          citationRule.exampleReference ||
          citationRule.exampleRef ||
          null,
        notes: citationRule.notes ?? null,
        journalId,
      };

      const existingRule = await db.query.journalCitationRules.findFirst({
        where: eq(journalCitationRules.journalId, journalId),
      });

      if (existingRule) {
        await db
          .update(journalCitationRules)
          .set(mappedData)
          .where(eq(journalCitationRules.id, existingRule.id));
      } else {
        await db.insert(journalCitationRules).values(mappedData);
      }
      console.log(`  ✓ Citation rules synced`);
    }

    // 2. Article Types (1:N per journal - Idempotently delete then re-insert)
    const articleTypes = INITIAL_ARTICLE_TYPES.filter(
      (t) => t.journalName === journalData.name
    );
    if (articleTypes.length > 0) {
      // Clear existing article types for this journal to prevent duplicates on repeated runs
      await db
        .delete(journalArticleTypes)
        .where(eq(journalArticleTypes.journalId, journalId));

      for (const articleType of articleTypes) {
        const mappedData = {
          typeName: articleType.name,
          isPrimary: articleType.isPrimary ?? false,
          wordLimit: articleType.wordLimit ?? null,
          wordLimitNotes: articleType.notes ?? null,
          displayItemsLimit: articleType.displayItems ?? null,
          referencesLimit: articleType.refs ?? null,
          methodsWordLimit: articleType.methods ?? null,
          abstractWordLimit: articleType.abstractWordLimit ?? null,
          supplementaryNotes: articleType.supplementaryNotes ?? null,
          journalId,
        };

        await db.insert(journalArticleTypes).values(mappedData);
      }
      console.log(`  ✓ Article types synced (${articleTypes.length} types)`);
    }

    // 3. Abstract Rules (1:1 per journal)
    const abstractRule = INITIAL_ABSTRACT_RULES.find(
      (r) => r.journalName === journalData.name
    );
    if (abstractRule) {
      const mappedData = {
        abstractType: abstractRule.type,
        defaultWordLimit: abstractRule.limit ?? null,
        label: abstractRule.label ?? "Abstract",
        allowCitations: abstractRule.allowCitations ?? false,
        structuredHeadings:
          abstractRule.structuredHeadings ||
          abstractRule.headings ||
          null,
        additionalRequirements:
          abstractRule.additionalRequirements ?? null,
        notes: abstractRule.notes ?? null,
        journalId,
      };

      const existingRule = await db.query.journalAbstractRules.findFirst({
        where: eq(journalAbstractRules.journalId, journalId),
      });

      if (existingRule) {
        await db
          .update(journalAbstractRules)
          .set(mappedData)
          .where(eq(journalAbstractRules.id, existingRule.id));
      } else {
        await db.insert(journalAbstractRules).values(mappedData);
      }
      console.log(`  ✓ Abstract rules synced`);
    }

    // 4. Cover Letter Rules (1:1 per journal)
    const coverLetterRule = INITIAL_COVER_LETTER_RULES.find(
      (r) => r.journalName === journalData.name
    );
    if (coverLetterRule) {
      const mappedData = {
        required: coverLetterRule.required ?? true,
        maxPages: coverLetterRule.maxPages ?? 1,
        shownToReviewers: coverLetterRule.shownToReviewers ?? false,
        requiredContent: coverLetterRule.requiredContent ?? null,
        uniqueRequirements: coverLetterRule.uniqueRequirements ?? null,
        toneGuidance: coverLetterRule.toneGuidance ?? null,
        templatePrompt: coverLetterRule.templatePrompt ?? null,
        notes: coverLetterRule.notes ?? null,
        journalId,
      };

      const existingRule = await db.query.journalCoverLetterRules.findFirst({
        where: eq(journalCoverLetterRules.journalId, journalId),
      });

      if (existingRule) {
        await db
          .update(journalCoverLetterRules)
          .set(mappedData)
          .where(eq(journalCoverLetterRules.id, existingRule.id));
      } else {
        await db.insert(journalCoverLetterRules).values(mappedData);
      }
      console.log(`  ✓ Cover letter rules synced`);
    }

    console.log(`  ✨ Fully synced: ${journalData.name}\n`);
  }
}

// Execute when invoked directly from CLI
if (require.main === module || process.argv[1]?.endsWith("seed.ts")) {
  runScript("seed", seedDatabase);
}
