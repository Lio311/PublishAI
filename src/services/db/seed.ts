import { db } from "./index";
import { journals, journalCitationRules, journalArticleTypes, journalAbstractRules, journalCoverLetterRules } from "./schema";
import { INITIAL_JOURNALS, INITIAL_CITATION_RULES, INITIAL_ARTICLE_TYPES, INITIAL_ABSTRACT_RULES, INITIAL_COVER_LETTER_RULES } from "../journals/seed-data";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Starting seed process for enriched journal data...");

  for (const journalData of INITIAL_JOURNALS) {
    console.log(`Processing journal: ${journalData.name}`);
    
    // Check if journal exists
    let existingJournal = await db.query.journals.findFirst({
      where: eq(journals.name, journalData.name)
    });

    let journalId: number;

    if (existingJournal) {
      console.log(`- Updating existing journal ${journalData.name}`);
      const [updated] = await db.update(journals).set(journalData).where(eq(journals.id, existingJournal.id)).returning();
      journalId = updated.id;
    } else {
      console.log(`- Inserting new journal ${journalData.name}`);
      const [inserted] = await db.insert(journals).values(journalData).returning();
      journalId = inserted.id;
    }

    // 1. Citation Rules
    const citationRule = INITIAL_CITATION_RULES.find(r => r.journalName === journalData.name);
    if (citationRule) {
      const { journalName, style, ...ruleData } = citationRule;
      const mappedData = { ...ruleData, styleName: style, journalId };
      const existingRule = await db.query.journalCitationRules.findFirst({
        where: eq(journalCitationRules.journalId, journalId)
      });
      if (existingRule) {
        await db.update(journalCitationRules).set(mappedData).where(eq(journalCitationRules.id, existingRule.id));
      } else {
        await db.insert(journalCitationRules).values(mappedData);
      }
    }

    // 2. Article Types
    const articleTypes = INITIAL_ARTICLE_TYPES.filter(t => t.journalName === journalData.name);
    if (articleTypes.length > 0) {
      // Clear existing to avoid duplicates if re-running
      await db.delete(journalArticleTypes).where(eq(journalArticleTypes.journalId, journalId));
      for (const articleType of articleTypes) {
        const { journalName, name, displayItems, refs, notes, ...typeData } = articleType as any;
        const mappedData = {
          ...typeData,
          typeName: name,
          displayItemsLimit: displayItems || null,
          referencesLimit: refs || null,
          wordLimitNotes: notes || null,
          journalId
        };
        // Remove extraneous properties that don't match the schema
        delete mappedData.abstractWordLimit;
        delete mappedData.methods;
        await db.insert(journalArticleTypes).values(mappedData);
      }
    }

    // 3. Abstract Rules
    const abstractRule = INITIAL_ABSTRACT_RULES.find(r => r.journalName === journalData.name);
    if (abstractRule) {
      const { journalName, type, limit, headings, notes, ...ruleData } = abstractRule as any;
      const mappedData = {
        ...ruleData,
        abstractType: type,
        defaultWordLimit: limit || null,
        structuredHeadings: headings || null,
        journalId
      };
      const existingRule = await db.query.journalAbstractRules.findFirst({
        where: eq(journalAbstractRules.journalId, journalId)
      });
      if (existingRule) {
        await db.update(journalAbstractRules).set(mappedData).where(eq(journalAbstractRules.id, existingRule.id));
      } else {
        await db.insert(journalAbstractRules).values(mappedData);
      }
    }

    // 4. Cover Letter Rules
    const coverLetterRule = INITIAL_COVER_LETTER_RULES.find(r => r.journalName === journalData.name);
    if (coverLetterRule) {
      const { journalName, ...ruleData } = coverLetterRule;
      const existingRule = await db.query.journalCoverLetterRules.findFirst({
        where: eq(journalCoverLetterRules.journalId, journalId)
      });
      if (existingRule) {
        await db.update(journalCoverLetterRules).set(ruleData).where(eq(journalCoverLetterRules.id, existingRule.id));
      } else {
        await db.insert(journalCoverLetterRules).values({ ...ruleData, journalId });
      }
    }
    console.log(`- Successfully seeded all related data for ${journalData.name}`);
  }

  console.log("Seed process completed successfully.");
}

seed().catch((err) => {
  console.error("Failed to seed database:", err);
  process.exit(1);
});
