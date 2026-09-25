import { NextResponse } from "next/server";
import { db } from "@/services/db";
import { journals, journalCitationRules, journalArticleTypes, journalAbstractRules, journalCoverLetterRules } from "@/services/db/schema";
import { askClaude } from "@/services/agents/claude-client";

export async function GET() {
  const allJournals = await db.select().from(journals);
  return NextResponse.json(allJournals);
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const prompt = `You are a helpful academic assistant. The user wants to add the academic journal "${name}".
Please provide the following details about this journal in valid JSON format:

1. **Core Info:**
- field: string (the general field or discipline, e.g. "Biology", "Computer Science", "Multidisciplinary", "Medicine")
- wordLimit: number or null (typical word limit for standard research articles)
- abstractLimit: number or null (typical word limit for abstracts)
- citationStyle: string (e.g. "APA", "Nature", "IEEE", "Vancouver")
- instructionsUrl: string (the URL to the author instructions or submission guidelines)

2. **Citation Rules:**
- citationRules: {
    styleName: string (e.g. "Vancouver", "Harvard/Author-Date", "IEEE"),
    inTextFormat: "superscript" | "brackets" | "parentheses" | "italic-parentheses",
    referenceListOrder: "order-of-appearance" | "alphabetical",
    etAlThreshold: number (how many authors before using et al.),
    etAlDisplayCount: number (how many to list before et al.),
    authorFormat: "surname-initials" | "initials-surname",
    lastAuthorSeparator: "&" | "and" | ",",
    articleTitleFormat: "plain" | "quotes" | "italic",
    exampleReference: string (a complete formatted example reference)
  }

3. **Article Types (array):**
- articleTypes: [{ typeName: string, isPrimary: boolean, wordLimit: number|null, displayItemsLimit: number|null, referencesLimit: number|null, abstractWordLimit: number|null, wordLimitNotes: string }]

4. **Abstract Rules:**
- abstractRules: {
    abstractType: "structured" | "unstructured",
    defaultWordLimit: number,
    label: string (e.g. "Abstract" or "Summary Paragraph"),
    allowCitations: boolean,
    structuredHeadings: string[] | null (e.g. ["Background","Methods","Results","Conclusions"]),
    notes: string
  }

5. **Cover Letter:**
- coverLetterRules: {
    required: boolean,
    maxPages: number | null,
    requiredContent: string[] (e.g. ["significance-and-fit","originality-statement","co-author-approval"]),
    toneGuidance: string,
    notes: string
  }

6. **Required Sections:**
- requiredSections: string[] (ordered list of mandatory manuscript sections)

Return ONLY the JSON object, with no markdown formatting or other text.`;

    let dataToInsert: any = { name, dataSource: "ai-generated" };
    let enrichmentData: Record<string, unknown> = {};

    try {
      const response = await askClaude(prompt);
      const jsonStr = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(jsonStr);
      
      dataToInsert = {
        name,
        field: parsed.field || "",
        wordLimit: typeof parsed.wordLimit === 'number' ? parsed.wordLimit : null,
        abstractLimit: typeof parsed.abstractLimit === 'number' ? parsed.abstractLimit : null,
        citationStyle: parsed.citationStyle || "",
        instructionsUrl: parsed.instructionsUrl || "",
        requiredSections: parsed.requiredSections || null,
        dataSource: "ai-generated",
      };

      enrichmentData = {
        citationRules: parsed.citationRules || null,
        articleTypes: parsed.articleTypes || null,
        abstractRules: parsed.abstractRules || null,
        coverLetterRules: parsed.coverLetterRules || null,
      };
    } catch (e) {
      console.error("Failed to parse Claude response:", e);
    }

    const newJournal = await db.transaction(async (tx) => {
      const [insertedJournal] = await tx.insert(journals).values(dataToInsert).returning();

      // Insert enrichment data into related tables
      try {
        if (enrichmentData.citationRules) {
          const cr = enrichmentData.citationRules as Record<string, unknown>;
          await tx.insert(journalCitationRules).values({
            journalId: insertedJournal.id,
            styleName: (cr.styleName as string) || "",
            inTextFormat: (cr.inTextFormat as string) || "brackets",
            referenceListOrder: (cr.referenceListOrder as string) || "order-of-appearance",
            etAlThreshold: (cr.etAlThreshold as number) || null,
            etAlDisplayCount: (cr.etAlDisplayCount as number) || null,
            authorFormat: (cr.authorFormat as string) || null,
            lastAuthorSeparator: (cr.lastAuthorSeparator as string) || null,
            articleTitleFormat: (cr.articleTitleFormat as string) || null,
            exampleReference: (cr.exampleReference as string) || null,
          }).onConflictDoUpdate({ target: journalCitationRules.journalId, set: { styleName: (cr.styleName as string) || "" } });
        }

        if (Array.isArray(enrichmentData.articleTypes)) {
          for (const at of enrichmentData.articleTypes as Record<string, unknown>[]) {
            await tx.insert(journalArticleTypes).values({
              journalId: insertedJournal.id,
              typeName: (at.typeName as string) || "Research Article",
              isPrimary: (at.isPrimary as boolean) || false,
              wordLimit: (at.wordLimit as number) || null,
              wordLimitNotes: (at.wordLimitNotes as string) || null,
              displayItemsLimit: (at.displayItemsLimit as number) || null,
              referencesLimit: (at.referencesLimit as number) || null,
              abstractWordLimit: (at.abstractWordLimit as number) || null,
            });
          }
        }

        if (enrichmentData.abstractRules) {
          const ar = enrichmentData.abstractRules as Record<string, unknown>;
          await tx.insert(journalAbstractRules).values({
            journalId: insertedJournal.id,
            abstractType: (ar.abstractType as string) || "unstructured",
            defaultWordLimit: (ar.defaultWordLimit as number) || null,
            label: (ar.label as string) || "Abstract",
            allowCitations: (ar.allowCitations as boolean) || false,
            structuredHeadings: ar.structuredHeadings || null,
            notes: (ar.notes as string) || null,
          }).onConflictDoUpdate({ target: journalAbstractRules.journalId, set: { abstractType: (ar.abstractType as string) || "unstructured" } });
        }

        if (enrichmentData.coverLetterRules) {
          const cl = enrichmentData.coverLetterRules as Record<string, unknown>;
          await tx.insert(journalCoverLetterRules).values({
            journalId: insertedJournal.id,
            required: (cl.required as boolean) ?? true,
            maxPages: (cl.maxPages as number) || 1,
            requiredContent: cl.requiredContent || null,
            toneGuidance: (cl.toneGuidance as string) || null,
            notes: (cl.notes as string) || null,
          }).onConflictDoUpdate({ target: journalCoverLetterRules.journalId, set: { required: (cl.required as boolean) ?? true } });
        }
      } catch (enrichError) {
        console.error("Failed to insert enrichment data:", enrichError);
        // Journal was created, enrichment can be retried
      }
      
      return insertedJournal;
    });

    return NextResponse.json(newJournal);
  } catch (error) {
    console.error("POST journal error:", error);
    return NextResponse.json({ error: "Failed to create journal" }, { status: 500 });
  }
}
