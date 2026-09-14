import { NextResponse } from "next/server";
import { db } from "@/db";
import { journals } from "@/db/schema";
import { askClaude } from "@/lib/agents/claude-client";

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
- field: string (the general field or discipline, e.g. "Biology", "Computer Science", "Multidisciplinary")
- wordLimit: number or null (typical word limit for standard research articles, use null if unknown or varied)
- abstractLimit: number or null (typical word limit for abstracts, use null if unknown)
- citationStyle: string (e.g. "APA", "Nature", "IEEE", "Vancouver")
- instructionsUrl: string (the URL to the author instructions or submission guidelines, e.g. "https://www.nature.com/nature/for-authors")

Return ONLY the JSON object, with no markdown formatting or other text.
Example format:
{
  "field": "Multidisciplinary",
  "wordLimit": 3000,
  "abstractLimit": 150,
  "citationStyle": "Nature",
  "instructionsUrl": "https://www.nature.com/nature/for-authors"
}`;

    let dataToInsert: any = { name };
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
        instructionsUrl: parsed.instructionsUrl || ""
      };
    } catch (e) {
      console.error("Failed to parse Claude response:", e);
      // We will just insert the name if we fail to fetch or parse
    }

    const [newJournal] = await db.insert(journals).values(dataToInsert).returning();
    return NextResponse.json(newJournal);
  } catch (error) {
    console.error("POST journal error:", error);
    return NextResponse.json({ error: "Failed to create journal" }, { status: 500 });
  }
}
