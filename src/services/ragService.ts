import { db } from "@/db";
import { scientificRelationships } from "@/db/schema";
import { ilike } from "drizzle-orm";

export async function searchSimilar(query: string, limitNum: number = 5) {
    try {
        const results = await db
            .select()
            .from(scientificRelationships)
            .where(ilike(scientificRelationships.evidenceText, `%${query}%`))
            .limit(limitNum);
        
        return results;
    } catch (error) {
        console.error("RAG search failed, falling back:", error);
        return [];
    }
}
