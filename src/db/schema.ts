import { 
  pgTable, 
  serial, 
  text, 
  timestamp, 
  jsonb,
  pgEnum 
} from "drizzle-orm/pg-core";

export const statusEnum = pgEnum("status", [
  "pending", 
  "in_progress", 
  "awaiting_approval", 
  "approved", 
  "completed", 
  "failed"
]);

export const stageEnum = pgEnum("stage", [
  "clarification", 
  "planning", 
  "knowledge", 
  "scientific_review", 
  "writing", 
  "execution", 
  "qa", 
  "verification", 
  "compilation"
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  image: text("image"),
  provider: text("provider"), // e.g. "google", "credentials"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const journals = pgTable("journals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  field: text("field"),
  instructionsUrl: text("instructions_url"),
  rules: jsonb("rules"), // Storing limits, styles, etc.
  citationStyle: text("citation_style"),
  wordLimit: serial("word_limit"),
  abstractLimit: serial("abstract_limit"),
});

export const papers = pgTable("papers", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
  title: text("title").notNull(),
  status: statusEnum("status").default("pending"),
  targetJournalId: serial("target_journal_id").references(() => journals.id),
  originalFileUrl: text("original_file_url"),
  originalFormat: text("original_format"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const paperVersions = pgTable("paper_versions", {
  id: serial("id").primaryKey(),
  paperId: serial("paper_id").references(() => papers.id),
  versionNumber: serial("version_number"),
  fileUrl: text("file_url"),
  format: text("format"),
  changesSummary: text("changes_summary"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const paperStages = pgTable("paper_stages", {
  id: serial("id").primaryKey(),
  paperId: serial("paper_id").references(() => papers.id),
  stage: stageEnum("stage"),
  status: statusEnum("status").default("pending"),
  agentOutput: text("agent_output"), // Storing markdown output
  userFeedback: text("user_feedback"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

export const references = pgTable("references", {
  id: serial("id").primaryKey(),
  paperId: serial("paper_id").references(() => papers.id),
  citationKey: text("citation_key"),
  title: text("title"),
  authors: text("authors"),
  year: text("year"),
  doi: text("doi"),
  source: text("source"),
  bibtexEntry: text("bibtex_entry"),
});
