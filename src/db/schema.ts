import type { AdapterAccountType } from "next-auth/adapters";
import { 
  pgTable, 
  serial, 
  text, 
  timestamp, 
  jsonb,
  pgEnum,
  integer,
  boolean,
  uuid,
  real,
  index,
  primaryKey
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
  "compilation",
  "rebuttal"
]);

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripePriceId: text("stripe_price_id"),
  stripeCurrentPeriodEnd: timestamp("stripe_current_period_end", { mode: "date" }),
  credits: integer("credits").default(3),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    userIdIdx: index("account_userId_idx").on(account.userId),
  })
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
}, (table) => ({
  userIdIdx: index("session_userId_idx").on(table.userId),
}));

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  })
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
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  status: statusEnum("status").default("pending"),
  targetJournalId: integer("target_journal_id").references(() => journals.id),
  originalFileUrl: text("original_file_url"),
  originalFormat: text("original_format"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("papers_user_id_idx").on(table.userId),
  statusIdx: index("papers_status_idx").on(table.status),
}));

export const paperVersions = pgTable("paper_versions", {
  id: serial("id").primaryKey(),
  paperId: integer("paper_id").references(() => papers.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number"),
  fileUrl: text("file_url"),
  format: text("format"),
  changesSummary: text("changes_summary"),
  reviewerComments: text("reviewer_comments"),
  rebuttalStrategy: text("rebuttal_strategy"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  paperIdIdx: index("paper_versions_paper_id_idx").on(table.paperId),
}));

export const paperStages = pgTable("paper_stages", {
  id: serial("id").primaryKey(),
  paperId: integer("paper_id").references(() => papers.id, { onDelete: "cascade" }),
  stage: stageEnum("stage"),
  status: statusEnum("status").default("pending"),
  agentOutput: text("agent_output"), // Storing markdown output
  userFeedback: text("user_feedback"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  paperIdIdx: index("paper_stages_paper_id_idx").on(table.paperId),
  stageIdx: index("paper_stages_stage_idx").on(table.stage),
}));

export const references = pgTable("references", {
  id: serial("id").primaryKey(),
  paperId: integer("paper_id").references(() => papers.id, { onDelete: "cascade" }),
  citationKey: text("citation_key"),
  title: text("title"),
  authors: text("authors"),
  year: text("year"),
  doi: text("doi"),
  source: text("source"),
  bibtexEntry: text("bibtex_entry"),
}, (table) => ({
  paperIdIdx: index("references_paper_id_idx").on(table.paperId),
}));

// ═══════════════════════════════════════════════════════
// CORE MVP ENTITIES: DOCUMENTS & CITATIONS
// ═══════════════════════════════════════════════════════

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  paperId: integer("paper_id").references(() => papers.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  abstract: text("abstract"),
  content: text("content"),
  status: text("status").default("draft"),
  fileUrl: text("file_url"),
  fileType: text("file_type"),
  wordCount: integer("word_count").default(0),
  targetJournalId: integer("target_journal_id").references(() => journals.id, { onDelete: "set null" }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("documents_user_id_idx").on(table.userId),
  paperIdIdx: index("documents_paper_id_idx").on(table.paperId),
  statusIdx: index("documents_status_idx").on(table.status),
}));

export const citations = pgTable("citations", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id").references(() => documents.id, { onDelete: "cascade" }),
  paperId: integer("paper_id").references(() => papers.id, { onDelete: "cascade" }),
  citationKey: text("citation_key"),
  title: text("title").notNull(),
  authors: text("authors"),
  journal: text("journal"),
  year: integer("year"),
  volume: text("volume"),
  issue: text("issue"),
  pages: text("pages"),
  doi: text("doi"),
  pmid: text("pmid"),
  pmcid: text("pmcid"),
  arxivId: text("arxiv_id"),
  url: text("url"),
  source: text("source"),
  bibtex: text("bibtex"),
  abstract: text("abstract"),
  rawMetadata: jsonb("raw_metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  documentIdIdx: index("citations_document_id_idx").on(table.documentId),
  paperIdIdx: index("citations_paper_id_idx").on(table.paperId),
  doiIdx: index("citations_doi_idx").on(table.doi),
  citationKeyIdx: index("citations_key_idx").on(table.citationKey),
}));

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
}, (table) => ({
  userIdIdx: index("journal_connections_user_id_idx").on(table.userId),
}));

// ═══════════════════════════════════════════════════════
// TABLE: submissions
// ═══════════════════════════════════════════════════════

export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  paperId: integer("paper_id")
    .references(() => papers.id, { onDelete: "cascade" })
    .notNull(),
  connectionId: integer("connection_id")
    .references(() => journalConnections.id)
    .notNull(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
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
}, (table) => ({
  paperIdIdx: index("submissions_paper_id_idx").on(table.paperId),
  userIdIdx: index("submissions_user_id_idx").on(table.userId),
  statusIdx: index("submissions_status_idx").on(table.status),
}));

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

// ═══════════════════════════════════════════════════════
// UPGRADE 1: DATA SCIENCE SANDBOX
// ═══════════════════════════════════════════════════════

export const sandboxStatusEnum = pgEnum("sandbox_status", [
  "pending", "running", "completed", "failed"
]);

export const dataFiles = pgTable("data_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  paperId: integer("paper_id").references(() => papers.id, { onDelete: "cascade" }).notNull(),
  filename: text("filename").notNull(),
  fileUrl: text("file_url").notNull(),
  mimeType: text("mime_type").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  paperIdIdx: index("data_files_paper_id_idx").on(table.paperId),
}));

export const sandboxRuns = pgTable("sandbox_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  paperId: integer("paper_id").references(() => papers.id, { onDelete: "cascade" }).notNull(),
  status: sandboxStatusEnum("status").default("pending"),
  pythonScript: text("python_script"),
  executionLogs: text("execution_logs"),
  analysisResults: jsonb("analysis_results"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const generatedCharts = pgTable("generated_charts", {
  id: uuid("id").primaryKey().defaultRandom(),
  sandboxRunId: uuid("sandbox_run_id").references(() => sandboxRuns.id).notNull(),
  paperId: integer("paper_id").references(() => papers.id, { onDelete: "cascade" }).notNull(),
  chartUrl: text("chart_url").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ═══════════════════════════════════════════════════════
// UPGRADE 2: KNOWLEDGE GRAPH & GraphRAG
// ═══════════════════════════════════════════════════════

export const entityTypeEnum = pgEnum("entity_type", [
  "drug", "protein", "gene", "disease", "concept", "study", "method"
]);

export const relationshipTypeEnum = pgEnum("relationship_type", [
  "affects", "contradicts", "supports", "causes", "treats", "correlates"
]);

export const scientificEntities = pgTable("scientific_entities", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  type: entityTypeEnum("type").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const scientificRelationships = pgTable("scientific_relationships", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceEntityId: uuid("source_entity_id").references(() => scientificEntities.id, { onDelete: "cascade" }).notNull(),
  targetEntityId: uuid("target_entity_id").references(() => scientificEntities.id, { onDelete: "cascade" }).notNull(),
  relationshipType: relationshipTypeEnum("relationship_type").notNull(),
  evidenceText: text("evidence_text").notNull(),
  paperId: integer("paper_id").references(() => papers.id, { onDelete: "set null" }),
  confidenceScore: real("confidence_score").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ═══════════════════════════════════════════════════════
// UPGRADE 3: RLHF DATA FLYWHEEL
// ═══════════════════════════════════════════════════════

export const feedbackOutcomeEnum = pgEnum("feedback_outcome", [
  "accepted", "rejected", "revision_required"
]);

export const rlhfFeedbackLogs = pgTable("rlhf_feedback_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  submissionId: integer("submission_id").references(() => submissions.id).notNull(),
  paperVersionId: integer("paper_version_id").references(() => paperVersions.id).notNull(),
  journalId: integer("journal_id").references(() => journals.id).notNull(),
  outcome: feedbackOutcomeEnum("outcome").notNull(),
  reviewerComments: text("reviewer_comments"),
  correctionData: jsonb("correction_data").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const promptStrategies = pgTable("prompt_strategies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  promptTemplate: text("prompt_template").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const abTestAllocations = pgTable("ab_test_allocations", {
  id: uuid("id").primaryKey().defaultRandom(),
  submissionId: integer("submission_id").references(() => submissions.id).notNull(),
  promptStrategyId: uuid("prompt_strategy_id").references(() => promptStrategies.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ═══════════════════════════════════════════════════════
// UPGRADE 4: MULTI-AGENT DEBATE (SWARM)
// ═══════════════════════════════════════════════════════

export const debateStatusEnum = pgEnum("debate_status", [
  "pending", "in_progress", "consensus_reached", "failed"
]);

export const debates = pgTable("debates", {
  id: uuid("id").primaryKey().defaultRandom(),
  paperId: integer("paper_id").references(() => papers.id, { onDelete: "cascade" }).notNull(),
  status: debateStatusEnum("status").default("pending"),
  topic: text("topic").notNull(),
  consensusSummary: text("consensus_summary"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const debateAgents = pgTable("debate_agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  debateId: uuid("debate_id").references(() => debates.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  persona: text("persona").notNull(),
  systemPrompt: text("system_prompt").notNull(),
});

export const debateMessages = pgTable("debate_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  debateId: uuid("debate_id").references(() => debates.id, { onDelete: "cascade" }).notNull(),
  agentId: uuid("agent_id").references(() => debateAgents.id),
  content: text("content").notNull(),
  round: integer("round").notNull(),
  isConsensusProposal: boolean("is_consensus_proposal").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ═══════════════════════════════════════════════════════
// UPGRADE 5: MULTIMODAL VISION AI
// ═══════════════════════════════════════════════════════

export const figures = pgTable("figures", {
  id: uuid("id").primaryKey().defaultRandom(),
  paperId: integer("paper_id").references(() => papers.id, { onDelete: "cascade" }).notNull(),
  paperVersionId: integer("paper_version_id").references(() => paperVersions.id).notNull(),
  figureNumber: integer("figure_number").notNull(),
  imageUrl: text("image_url").notNull(),
  originalLegend: text("original_legend"),
  extractedText: text("extracted_text"),
  resolution: integer("resolution"),
  qualityScore: integer("quality_score"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const figureAnalyses = pgTable("figure_analyses", {
  id: uuid("id").primaryKey().defaultRandom(),
  figureId: uuid("figure_id").references(() => figures.id, { onDelete: "cascade" }).notNull(),
  modelUsed: text("model_used").notNull(),
  legendAccuracyScore: integer("legend_accuracy_score"),
  claimVerificationStatus: text("claim_verification_status"),
  suggestedLegend: text("suggested_legend"),
  issuesFound: jsonb("issues_found"),
  rawAnalysis: jsonb("raw_analysis"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ═══════════════════════════════════════════════════════
// INFERRED TYPES
// ═══════════════════════════════════════════════════════

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

export type Citation = typeof citations.$inferSelect;
export type NewCitation = typeof citations.$inferInsert;

export type Paper = typeof papers.$inferSelect;
export type NewPaper = typeof papers.$inferInsert;

export type Reference = typeof references.$inferSelect;
export type NewReference = typeof references.$inferInsert;

export type Journal = typeof journals.$inferSelect;
export type NewJournal = typeof journals.$inferInsert;

export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;
