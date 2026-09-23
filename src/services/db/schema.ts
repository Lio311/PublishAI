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
  primaryKey,
  vector
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
  rules: jsonb("rules"), // Legacy: general notes
  citationStyle: text("citation_style"), // Backward compat: short name e.g. "Nature"
  wordLimit: integer("word_limit"),      // Backward compat: default article type
  abstractLimit: integer("abstract_limit"), // Backward compat: default article type
  // ── New enriched fields ──
  requiredSections: jsonb("required_sections"), // Ordered array of mandatory sections
  dataSource: text("data_source").default("ai-generated"), // "official-website" | "ai-generated"
  lastVerifiedAt: timestamp("last_verified_at"),
});

// ═══════════════════════════════════════════════════════
// JOURNAL ENRICHMENT: CITATION RULES (1:1 per journal)
// ═══════════════════════════════════════════════════════

export const journalCitationRules = pgTable("journal_citation_rules", {
  id: serial("id").primaryKey(),
  journalId: integer("journal_id")
    .references(() => journals.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  styleName: text("style_name").notNull(),          // e.g. "Vancouver", "Harvard/Author-Date", "IEEE"
  inTextFormat: text("in_text_format").notNull(),    // "superscript" | "brackets" | "parentheses" | "italic-parentheses"
  referenceListOrder: text("reference_list_order").notNull(), // "order-of-appearance" | "alphabetical"
  etAlThreshold: integer("et_al_threshold"),         // Number of authors before using et al.
  etAlDisplayCount: integer("et_al_display_count"),  // How many authors to show before et al.
  volumeFormat: text("volume_format"),               // "bold" | "plain"
  yearFormat: text("year_format"),                   // "parentheses-end" | "inline" | "after-journal"
  journalTitleFormat: text("journal_title_format"),  // "italic-abbreviated" | "italic-full" | "plain"
  authorFormat: text("author_format"),               // "surname-initials" | "initials-surname"
  lastAuthorSeparator: text("last_author_separator"), // "&" | "and" | ","
  articleTitleFormat: text("article_title_format"),   // "plain" | "quotes" | "italic"
  personalCommsInRefList: boolean("personal_comms_in_ref_list").default(false),
  exampleReference: text("example_reference"),        // A complete formatted example
  notes: text("notes"),                               // Additional formatting notes
});

// ═══════════════════════════════════════════════════════
// JOURNAL ENRICHMENT: ARTICLE TYPES (1:N per journal)
// ═══════════════════════════════════════════════════════

export const journalArticleTypes = pgTable("journal_article_types", {
  id: serial("id").primaryKey(),
  journalId: integer("journal_id")
    .references(() => journals.id, { onDelete: "cascade" })
    .notNull(),
  typeName: text("type_name").notNull(),              // e.g. "Research Article", "Review", "Brief Communication"
  isPrimary: boolean("is_primary").default(false),    // Is this the main/default article type?
  wordLimit: integer("word_limit"),
  wordLimitNotes: text("word_limit_notes"),           // e.g. "excludes abstract, methods, references"
  displayItemsLimit: integer("display_items_limit"),  // Max figures + tables combined
  referencesLimit: integer("references_limit"),
  methodsWordLimit: integer("methods_word_limit"),
  abstractWordLimit: integer("abstract_word_limit"),
  supplementaryNotes: text("supplementary_notes"),
}, (table) => ({
  journalIdIdx: index("journal_article_types_journal_id_idx").on(table.journalId),
}));

// ═══════════════════════════════════════════════════════
// JOURNAL ENRICHMENT: ABSTRACT RULES (1:1 per journal)
// ═══════════════════════════════════════════════════════

export const journalAbstractRules = pgTable("journal_abstract_rules", {
  id: serial("id").primaryKey(),
  journalId: integer("journal_id")
    .references(() => journals.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  abstractType: text("abstract_type").notNull(),       // "structured" | "unstructured"
  defaultWordLimit: integer("default_word_limit"),
  label: text("label").default("Abstract"),            // e.g. "Summary Paragraph" for Nature
  allowCitations: boolean("allow_citations").default(false),
  structuredHeadings: jsonb("structured_headings"),     // e.g. ["Background","Methods","Results","Conclusions"]
  additionalRequirements: jsonb("additional_requirements"), // e.g. { "oneSentenceSummary": { "required": true, "maxChars": 150 } }
  notes: text("notes"),
});

// ═══════════════════════════════════════════════════════
// JOURNAL ENRICHMENT: COVER LETTER RULES (1:1 per journal)
// ═══════════════════════════════════════════════════════

export const journalCoverLetterRules = pgTable("journal_cover_letter_rules", {
  id: serial("id").primaryKey(),
  journalId: integer("journal_id")
    .references(() => journals.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  required: boolean("required").notNull().default(true),
  maxPages: integer("max_pages").default(1),
  shownToReviewers: boolean("shown_to_reviewers").default(false),
  requiredContent: jsonb("required_content"),           // Array of required elements
  // e.g. ["significance-and-fit","originality-statement","co-author-approval",
  //        "related-work-disclosure","reviewer-suggestions"]
  uniqueRequirements: text("unique_requirements"),      // Free-text for journal-specific rules
  toneGuidance: text("tone_guidance"),                  // e.g. "clinical-impact" | "broad-scientific" | "translational"
  templatePrompt: text("template_prompt"),              // AI prompt template for this journal's CL
  notes: text("notes"),
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
  "wordpress",           // REST API — /wp-json/wp/v2/
  "ojs",                 // REST API — /api/v1/
  "email",               // Direct email submission via SMTP
  "editorial_manager",   // Aries Systems Editorial Manager
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
// TABLE: submission_events (EPIC 3)
// ═══════════════════════════════════════════════════════

export const submissionEvents = pgTable("submission_events", {
  id: serial("id").primaryKey(),
  submissionId: integer("submission_id")
    .references(() => submissions.id, { onDelete: "cascade" })
    .notNull(),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  eventType: text("event_type"),
  description: text("description"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  submissionIdIdx: index("submission_events_submission_id_idx").on(table.submissionId),
}));

export const submission_events = submissionEvents;

// ═══════════════════════════════════════════════════════
// TABLES: review_threads & review_comments (EPIC 3)
// ═══════════════════════════════════════════════════════

export const reviewThreads = pgTable("review_threads", {
  id: serial("id").primaryKey(),
  submissionId: integer("submission_id")
    .references(() => submissions.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title"),
  reviewerId: text("reviewer_id"),
  status: text("status").default("pending").notNull(),
  roundNumber: integer("round_number").default(1),
  rawReport: text("raw_report"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  submissionIdIdx: index("review_threads_submission_id_idx").on(table.submissionId),
}));

export const review_threads = reviewThreads;

export const reviewComments = pgTable("review_comments", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id")
    .references(() => reviewThreads.id, { onDelete: "cascade" })
    .notNull(),
  commentNumber: integer("comment_number"),
  reviewerText: text("reviewer_text").notNull(),
  aiDraftedResponse: text("ai_drafted_response"),
  authorFinalResponse: text("author_final_response"),
  status: text("status").default("pending").notNull(),
  category: text("category"),
  severity: text("severity"),
  suggestedAction: text("suggested_action"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  threadIdIdx: index("review_comments_thread_id_idx").on(table.threadId),
  statusIdx: index("review_comments_status_idx").on(table.status),
}));

export const review_comments = reviewComments;

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

export type JournalCitationRule = typeof journalCitationRules.$inferSelect;
export type NewJournalCitationRule = typeof journalCitationRules.$inferInsert;

export type JournalArticleType = typeof journalArticleTypes.$inferSelect;
export type NewJournalArticleType = typeof journalArticleTypes.$inferInsert;

export type JournalAbstractRule = typeof journalAbstractRules.$inferSelect;
export type NewJournalAbstractRule = typeof journalAbstractRules.$inferInsert;

export type JournalCoverLetterRule = typeof journalCoverLetterRules.$inferSelect;
export type NewJournalCoverLetterRule = typeof journalCoverLetterRules.$inferInsert;

export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;

export type SubmissionEvent = typeof submissionEvents.$inferSelect;
export type NewSubmissionEvent = typeof submissionEvents.$inferInsert;

export type ReviewThread = typeof reviewThreads.$inferSelect;
export type NewReviewThread = typeof reviewThreads.$inferInsert;

export type ReviewComment = typeof reviewComments.$inferSelect;
export type NewReviewComment = typeof reviewComments.$inferInsert;

// ═══════════════════════════════════════════════════════
// UPGRADE 6: RAG & PGVECTOR
// ═══════════════════════════════════════════════════════

export const documentChunks = pgTable("document_chunks", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  documentIdIdx: index("document_chunks_document_id_idx").on(table.documentId),
}));

export type DocumentChunk = typeof documentChunks.$inferSelect;
export type NewDocumentChunk = typeof documentChunks.$inferInsert;

// ═══════════════════════════════════════════════════════
// UPGRADE: AI SYSTEM FEEDBACK (RLHF & TELEMETRY)
// ═══════════════════════════════════════════════════════

export const aiSystemFeedback = pgTable("ai_system_feedback", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  journalId: integer("journal_id").references(() => journals.id, { onDelete: "cascade" }),
  sourceType: text("source_type").notNull(), // 'user_rewrite', 'reviewer_feedback'
  sourceId: text("source_id"), // original comment id or submission id
  ruleText: text("rule_text"), // Actionable rule for future prompts
  category: text("category"), // e.g., 'tone', 'accuracy', 'hallucination', 'formatting'
  productInsight: text("product_insight"), // Internal telemetry note
  isActionable: boolean("is_actionable").default(false), // whether to inject ruleText into prompts
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
