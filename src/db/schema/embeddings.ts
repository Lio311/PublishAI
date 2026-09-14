import { pgTable, text, vector } from 'drizzle-orm/pg-core';
export const embeddings = pgTable('embeddings', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: 1536 })
});
