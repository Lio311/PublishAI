import { generateText, embed } from 'ai';
import { openai } from '@ai-sdk/openai';
import { db } from "@/services/db";
import { sql } from 'drizzle-orm';

export interface DebateState {
  findings: string;
  papers: { id: string; title: string; abstract: string; conclusions: string }[];
  turns: { speaker: string; message: string }[];
  maxTurns: number;
  synthesis?: string;
}

export class MultiAgentDebateService {
  /**
   * Orchestrates a debate between multiple "Paper Agents" concurrently,
   * followed by a Synthesis Agent.
   */
  async runDebate(initialState: DebateState): Promise<DebateState> {
    const state = { ...initialState };
    
    // 1. Generate embedding for the new findings to use in RAG
    const { embedding } = await embed({
      model: openai.embedding('text-embedding-3-small'),
      value: state.findings,
    });

    // 2. Concurrently prompt all Benchmark Paper Agents with their specific retrieved chunks
    const paperAgentPromises = state.papers.map(async (paper) => {
      // Query pgvector for the most relevant chunks for this specific paper
      const result = await db.execute(sql`
        SELECT content 
        FROM document_embeddings 
        WHERE paper_id = ${paper.id} 
        ORDER BY embedding <=> ${JSON.stringify(embedding)}::vector 
        LIMIT 5
      `);
      
      const rows = 'rows' in result ? (result.rows as any[]) : (result as unknown as any[]);
      const chunks = rows.map(r => r.content as string);
      
      const context = chunks.length > 0 
        ? chunks.join('\n\n') 
        : 'No specific context retrieved from the paper text.';

      const prompt = `You are representing the benchmark paper "${paper.title}".
Your conclusions are: ${paper.conclusions}.
The user's new findings are: ${state.findings}.

Relevant context retrieved from your paper's full text:
${context}

Based on this context and your conclusions, provide a 2-paragraph critique or agreement with the new findings from your paper's perspective. Include citations to the context provided.`;

      const { text } = await generateText({
        model: openai('gpt-4o'),
        prompt,
      });

      return { speaker: paper.title, message: text };
    });

    // Await all paper agents simultaneously
    state.turns = await Promise.all(paperAgentPromises);

    // 3. Pipe the collected responses into a final Synthesis Agent prompt
    const synthesisHistory = state.turns.map(t => `${t.speaker}:\n${t.message}`).join('\n\n');
    
    const synthesisPrompt = `Synthesize the following debate into a cohesive "Discussion" section for a new academic paper.

User Findings: ${state.findings}

Agent Perspectives (Debate):
${synthesisHistory}

Draft a 500-word Discussion section integrating these perspectives. Highlight areas of consensus, divergences, and the broader implications of the findings.`;

    const { text: synthesisText } = await generateText({
      model: openai('gpt-4o'),
      prompt: synthesisPrompt,
    });

    state.synthesis = synthesisText;
    
    return state;
  }
}

export const debateService = new MultiAgentDebateService();
