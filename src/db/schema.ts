import { 
  pgTable, 
  serial, 
  text, 
  timestamp, 
  jsonb,
  pgEnum,
  integer 
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
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  }
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  }
);

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
  userId: text("user_id").references(() => users.id),
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
