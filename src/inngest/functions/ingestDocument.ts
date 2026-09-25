import { inngest } from "../client";
import { db } from "../../services/db";
import { documents, documentChunks } from "../../services/db/schema";
import { eq } from "drizzle-orm";
import { openai } from "@ai-sdk/openai";
import { embedMany } from "ai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export const ingestDocument = inngest.createFunction(
  { 
    id: "ingest-document",
    triggers: [{ event: "document/uploaded" }] 
  },
  async ({ event, step }) => {
    const { documentId } = event.data;

    // 1. Fetch document from DB
    const doc = await step.run("fetch-document", async () => {
      const results = await db.select().from(documents).where(eq(documents.id, documentId)).limit(1);
      return results[0];
    });

    if (!doc || !doc.content) {
      throw new Error(`Document ${documentId} not found or has no content`);
    }

    // 2. Chunk the document (handling full paper length)
    const chunks = await step.run("chunk-document", async () => {
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      return await splitter.createDocuments([doc.content!]);
    });

    // 3. Generate embeddings
    const embeddings = await step.run("generate-embeddings", async () => {
      const chunkTexts = chunks.map((c: any) => c.pageContent);
      const { embeddings } = await embedMany({
        model: openai.embedding("text-embedding-3-small"),
        values: chunkTexts,
      });
      return embeddings;
    });

    // 4. Store vectors in DB
    await step.run("store-vectors", async () => {
      const values = chunks.map((chunk: any, i: number) => ({
        documentId: doc.id,
        content: chunk.pageContent,
        embedding: embeddings[i],
        metadata: chunk.metadata,
      }));
      
      // Batch insert chunks
      await db.insert(documentChunks).values(values);
    });

    return { success: true, chunksProcessed: chunks.length };
  }
);
