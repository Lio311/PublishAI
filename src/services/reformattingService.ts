import { db } from "./db";
import { 
  journals, 
  papers, 
  paperVersions, 
  journalCitationRules, 
  journalAbstractRules,
  journalArticleTypes
} from "./db/schema";
import { eq, desc } from "drizzle-orm";

export class ReformattingService {
  /**
   * Reformats a paper for a new target journal.
   * This handles the "Cascade Strategy" when a paper is rejected.
   */
  static async reformatForJournal(paperId: number, newJournalId: number) {
    // 1. Fetch the paper
    const paper = await db.query.papers.findFirst({
      where: eq(papers.id, paperId)
    });

    if (!paper) {
      throw new Error(`Paper with ID ${paperId} not found`);
    }

    // 2. Fetch the new journal and its rules
    const targetJournal = await db.query.journals.findFirst({
      where: eq(journals.id, newJournalId)
    });

    if (!targetJournal) {
      throw new Error(`Target journal with ID ${newJournalId} not found`);
    }

    const citationRules = await db.query.journalCitationRules.findFirst({
      where: eq(journalCitationRules.journalId, newJournalId)
    });

    const abstractRules = await db.query.journalAbstractRules.findFirst({
      where: eq(journalAbstractRules.journalId, newJournalId)
    });
    
    const articleTypes = await db.query.journalArticleTypes.findMany({
      where: eq(journalArticleTypes.journalId, newJournalId)
    });

    // 3. Update the paper's target journal
    await db.update(papers)
      .set({ 
        targetJournalId: newJournalId,
        // clear the suggestedJournals now that a decision is made
        suggestedJournals: null 
      })
      .where(eq(papers.id, paperId));

    // 4. Create a new paper version representing the reformatted document
    // First, find the latest version number
    const existingVersions = await db.select({ versionNumber: paperVersions.versionNumber })
      .from(paperVersions)
      .where(eq(paperVersions.paperId, paperId))
      .orderBy(desc(paperVersions.versionNumber));
      
    const nextVersionNumber = existingVersions.length > 0 ? (existingVersions[0].versionNumber || 0) + 1 : 1;

    // Build a summary of changes based on the new rules
    const changes: string[] = [];
    if (citationRules) {
      changes.push(`Updated citations to ${citationRules.styleName} style (${citationRules.inTextFormat}).`);
    }
    if (abstractRules) {
      changes.push(`Reformatted abstract to ${abstractRules.abstractType} structure.`);
    }
    const primaryType = articleTypes.find(t => t.isPrimary) || articleTypes[0];
    if (primaryType && primaryType.wordLimit) {
      changes.push(`Adjusted length to meet the ${primaryType.wordLimit} word limit for ${primaryType.typeName}.`);
    }

    const changesSummary = `Reformatted for ${targetJournal.name}:\n` + changes.map(c => `- ${c}`).join('\n');

    const [newVersion] = await db.insert(paperVersions)
      .values({
        paperId: paperId,
        versionNumber: nextVersionNumber,
        fileUrl: paper.originalFileUrl, // In a real system, this would be a new URL to the generated file
        format: paper.originalFormat,
        changesSummary: changesSummary,
      })
      .returning();

    return {
      paperId,
      newJournalId,
      newVersion,
      appliedRules: {
        citationRules,
        abstractRules,
        articleTypes
      }
    };
  }
}
