# GraphRAG & Analytics Dashboard

## Overview
A data analysis layer and Knowledge Graph implementation that extracts entities/relationships from both the user's historical papers and newly published external open-access papers, enabling the AI to optimize drafts based on target journal trends.

## Components

1. **Database Schema (Neon Postgres + pgvector)**:
   - `entities` table: id, name, type (Method, Concept, Journal), embedding.
   - `relationships` table: id, source_id, target_id, relation_type (USES, ACCEPTS, REJECTS_DUE_TO).

2. **Ingestion Engine**:
   - Internal trigger: Upon manuscript acceptance/rejection, extract reasons and methods via LLM.
   - External trigger: Query arXiv/PubMed for recent papers in the target journal -> extract entities -> save to graph.

3. **GraphRAG Injection**:
   - `planningNode.ts` calls `queryGraphRAG(targetJournal, topic)` to pull nearest entities and their edges.
   - Results guide the structural plan of the manuscript.

4. **Analytics Dashboard UI**:
   - Charts indicating success rate, average time to publish.
   - A visual network map or list of "Trending Topics" for selected journals based on GraphRAG insights.
