import { 
  pgTable, 
  serial, 
  text, 
  timestamp, 
  jsonb,
  pgEnum,
  integer,
  boolean
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
  wordLimit: integer("word_limit"),
  abstractLimit: integer("abstract_limit"),
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
  reviewerComments: text("reviewer_comments"),
  rebuttalStrategy: text("rebuttal_strategy"),
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

export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).unique().notNull(),
  academicRole: text("academic_role"),
  language: text("language").default("he"),
  emailNotifications: boolean("email_notifications").default(true),
  browserNotifications: boolean("browser_notifications").default(false),
  weeklyDigest: boolean("weekly_digest").default(true),
  publicProfile: boolean("public_profile").default(true),
  dataCollectionForAi: boolean("data_collection_for_ai").default(false),
  openaiApiKey: text("openai_api_key"),
  anthropicApiKey: text("anthropic_api_key"),
});

// ═══════════════════════════════════════════════════════
// ENUMS FOR SUBMISSION MODULE
// ═══════════════════════════════════════════════════════

export const journalPlatformEnum = pgEnum("journal_platform", [
  "wordpress",   // REST API — /wp-json/wp/v2/
  "ojs",         // REST API — /api/v1/
]);

export const connectionStatusEnum = pgEnum("connection_status", [
  "untested",
  "connected",
  "failed",
  "expired",
]);

export const submissionStatusEnum = pgEnum("submission_status", [
  "preparing",
  "submitting",
  "submitted",
  "failed",
  "draft",
]);

// ═══════════════════════════════════════════════════════
// TABLE: journal_connections
// ═══════════════════════════════════════════════════════

export const journalConnections = pgTable("journal_connections", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  journalId: integer("journal_id")
    .references(() => journals.id),
  
  platform: journalPlatformEnum("platform").notNull(),
  siteUrl: text("site_url").notNull(),
  displayName: text("display_name"),
  
  encryptedUsername: text("encrypted_username").notNull(),
  encryptedPassword: text("encrypted_password").notNull(),
  
  connectionStatus: connectionStatusEnum("connection_status").default("untested"),
  lastTestedAt: timestamp("last_tested_at"),
  lastError: text("last_error"),
  remoteUserDisplayName: text("remote_user_display_name"),
  remoteUserRole: text("remote_user_role"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ═══════════════════════════════════════════════════════
// TABLE: submissions
// ═══════════════════════════════════════════════════════

export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  paperId: integer("paper_id")
    .references(() => papers.id)
    .notNull(),
  connectionId: integer("connection_id")
    .references(() => journalConnections.id)
    .notNull(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull(),
  
  status: submissionStatusEnum("submission_status").default("preparing"),
  publishMode: text("publish_mode").default("draft"),
  
  remotePostId: text("remote_post_id"),
  remotePostUrl: text("remote_post_url"),
  confirmationId: text("confirmation_id"),
  responseData: jsonb("response_data"),
  
  attemptCount: integer("attempt_count").default(0),
  maxAttempts: integer("max_attempts").default(3),
  lastAttemptAt: timestamp("last_attempt_at"),
  nextRetryAt: timestamp("next_retry_at"),
  
  errorLog: text("error_log"),
  
  submittedTitle: text("submitted_title"),
  submittedAbstract: text("submitted_abstract"),
  submittedKeywords: jsonb("submitted_keywords"),
  submittedAuthors: jsonb("submitted_authors"),
  submittedArticleType: text("submitted_article_type"),
  coverLetterIncluded: boolean("cover_letter_included").default(false),
  
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ═══════════════════════════════════════════════════════
// TABLE: submission_logs
// ═══════════════════════════════════════════════════════

export const submissionLogs = pgTable("submission_logs", {
  id: serial("id").primaryKey(),
  submissionId: integer("submission_id")
    .references(() => submissions.id, { onDelete: "cascade" })
    .notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  level: text("level").notNull(),
  message: text("message").notNull(),
  details: jsonb("details"),
});
