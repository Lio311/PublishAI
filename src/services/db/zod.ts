import { z } from "zod";
import {
  statusEnumValues,
  stageEnumValues,
  journalPlatformEnumValues,
  connectionStatusEnumValues,
  submissionStatusEnumValues,
  captchaStrategyEnumValues,
  sandboxStatusEnumValues,
  entityTypeEnumValues,
  relationshipTypeEnumValues,
  feedbackOutcomeEnumValues,
  debateStatusEnumValues,
  rpaJobStatusEnumValues,
} from "./schema";

// ═══════════════════════════════════════════════════════
// ENUM ZOD SCHEMAS
// ═══════════════════════════════════════════════════════

export const statusEnumSchema = z.enum(statusEnumValues);
export const stageEnumSchema = z.enum(stageEnumValues);
export const journalPlatformEnumSchema = z.enum(journalPlatformEnumValues);
export const connectionStatusEnumSchema = z.enum(connectionStatusEnumValues);
export const submissionStatusEnumSchema = z.enum(submissionStatusEnumValues);
export const captchaStrategyEnumSchema = z.enum(captchaStrategyEnumValues);
export const sandboxStatusEnumSchema = z.enum(sandboxStatusEnumValues);
export const entityTypeEnumSchema = z.enum(entityTypeEnumValues);
export const relationshipTypeEnumSchema = z.enum(relationshipTypeEnumValues);
export const feedbackOutcomeEnumSchema = z.enum(feedbackOutcomeEnumValues);
export const debateStatusEnumSchema = z.enum(debateStatusEnumValues);
export const rpaJobStatusEnumSchema = z.enum(rpaJobStatusEnumValues);

// ═══════════════════════════════════════════════════════
// ENTITY ZOD SCHEMAS
// ═══════════════════════════════════════════════════════

// User
export const insertUserSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().nullable().optional(),
  email: z.string().email(),
  emailVerified: z.date().nullable().optional(),
  image: z.string().url().nullable().optional(),
  stripeCustomerId: z.string().nullable().optional(),
  stripeSubscriptionId: z.string().nullable().optional(),
  stripePriceId: z.string().nullable().optional(),
  stripeCurrentPeriodEnd: z.date().nullable().optional(),
  credits: z.number().int().default(3).optional(),
});

export const selectUserSchema = insertUserSchema.extend({
  id: z.string(),
});

// Paper
export const insertPaperSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(500, "Title is too long"),
  status: statusEnumSchema.default("pending").optional(),
  targetJournalId: z.number().int().positive().nullable().optional(),
  currentJournalId: z.number().int().positive().nullable().optional(),
  cascadeQueue: z.array(z.string().trim()).nullable().optional(),
  originalFileUrl: z.string().url().max(1000).nullable().optional(),
  originalFormat: z.string().trim().max(50).nullable().optional(),
  doi: z.string().trim().max(100).nullable().optional(),
  suggestedJournals: z.any().nullable().optional(),
  rejections: z.any().nullable().optional(),
});

export const updatePaperSchema = insertPaperSchema.partial();

export const selectPaperSchema = insertPaperSchema.extend({
  id: z.number().int(),
  userId: z.string(),
  citationsCount: z.number().int().default(0),
  lastCitationCheck: z.date().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Journal
export const insertJournalSchema = z.object({
  name: z.string().trim().min(1, "Journal name is required"),
  field: z.string().trim().nullable().optional(),
  instructionsUrl: z.string().url().nullable().optional(),
  rules: z.any().nullable().optional(),
  citationStyle: z.string().nullable().optional(),
  wordLimit: z.number().int().positive().nullable().optional(),
  abstractLimit: z.number().int().positive().nullable().optional(),
  requiredSections: z.any().nullable().optional(),
  dataSource: z.string().default("ai-generated").optional(),
  lastVerifiedAt: z.date().nullable().optional(),
});

export const selectJournalSchema = insertJournalSchema.extend({
  id: z.number().int(),
});

// Journal Connection
export const insertJournalConnectionSchema = z.object({
  userId: z.string(),
  journalId: z.number().int().positive().nullable().optional(),
  platform: journalPlatformEnumSchema,
  siteUrl: z.string().url("Must be a valid URL"),
  displayName: z.string().trim().nullable().optional(),
  encryptedUsername: z.string().min(1, "Encrypted username required"),
  encryptedPassword: z.string().min(1, "Encrypted password required"),
  connectionStatus: connectionStatusEnumSchema.default("untested").optional(),
  captchaStrategy: captchaStrategyEnumSchema.default("auto").optional(),
});

export const selectJournalConnectionSchema = insertJournalConnectionSchema.extend({
  id: z.number().int(),
  lastTestedAt: z.date().nullable().optional(),
  lastError: z.string().nullable().optional(),
  remoteUserDisplayName: z.string().nullable().optional(),
  remoteUserRole: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Submission
export const insertSubmissionSchema = z.object({
  paperId: z.number().int().positive("Paper ID must be a positive integer"),
  connectionId: z.number().int().positive("Connection ID must be a positive integer"),
  userId: z.string(),
  status: submissionStatusEnumSchema.default("preparing").optional(),
  publishMode: z.string().default("draft").optional(),
  submittedTitle: z.string().trim().nullable().optional(),
  submittedAbstract: z.string().trim().nullable().optional(),
  submittedKeywords: z.any().nullable().optional(),
  submittedAuthors: z.any().nullable().optional(),
  submittedArticleType: z.string().nullable().optional(),
  fundingDeclaration: z.boolean().default(false).optional(),
  aiUsageDeclaration: z.boolean().default(false).optional(),
  depositInArchive: z.boolean().default(false).optional(),
  keyFindings: z.string().nullable().optional(),
  meshTerms: z.any().nullable().optional(),
  dataAvailableStatement: z.string().nullable().optional(),
  conflictOfInterestStatement: z.string().nullable().optional(),
  duplicateMaterialStatement: z.string().nullable().optional(),
  acknowledgements: z.string().nullable().optional(),
  coverLetterIncluded: z.boolean().default(false).optional(),
});

export const updateSubmissionStatusSchema = z.object({
  status: submissionStatusEnumSchema,
  notes: z.string().optional(),
  stage: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  force: z.boolean().optional(),
});

export const selectSubmissionSchema = insertSubmissionSchema.extend({
  id: z.number().int(),
  remotePostId: z.string().nullable().optional(),
  remotePostUrl: z.string().nullable().optional(),
  remoteLastUpdatedAt: z.date().nullable().optional(),
  autoReplyRevisions: z.boolean().default(false),
  confirmationId: z.string().nullable().optional(),
  responseData: z.any().nullable().optional(),
  attemptCount: z.number().int().default(0),
  maxAttempts: z.number().int().default(3),
  lastAttemptAt: z.date().nullable().optional(),
  nextRetryAt: z.date().nullable().optional(),
  errorLog: z.string().nullable().optional(),
  submittedAt: z.date().nullable().optional(),
  createdAt: z.date(),
});

// Submission Event
export const insertSubmissionEventSchema = z.object({
  submissionId: z.number().int().positive().nullable().optional(),
  paperId: z.number().int().positive().nullable().optional(),
  fromStatus: z.string().nullable().optional(),
  toStatus: z.string().nullable().optional(),
  eventType: z.string().min(1, "Event type is required"),
  actor: z.string().default("system").optional(),
  description: z.string().nullable().optional(),
  details: z.any().nullable().optional(),
  metadata: z.any().nullable().optional(),
});

export const selectSubmissionEventSchema = insertSubmissionEventSchema.extend({
  id: z.number().int(),
  createdAt: z.date(),
});

// Submission Log
export const insertSubmissionLogSchema = z.object({
  submissionId: z.number().int().positive(),
  level: z.string().min(1),
  message: z.string().min(1),
  details: z.any().nullable().optional(),
});

export const selectSubmissionLogSchema = insertSubmissionLogSchema.extend({
  id: z.number().int(),
  timestamp: z.date(),
});

// Document
export const insertDocumentSchema = z.object({
  userId: z.string(),
  paperId: z.number().int().positive().nullable().optional(),
  title: z.string().trim().min(1, "Title is required"),
  abstract: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  status: z.string().default("draft").optional(),
  fileUrl: z.string().url().nullable().optional(),
  fileType: z.string().nullable().optional(),
  wordCount: z.number().int().default(0).optional(),
  targetJournalId: z.number().int().positive().nullable().optional(),
  metadata: z.any().nullable().optional(),
});

export const selectDocumentSchema = insertDocumentSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Citation
export const insertCitationSchema = z.object({
  documentId: z.string().uuid().nullable().optional(),
  paperId: z.number().int().positive().nullable().optional(),
  citationKey: z.string().nullable().optional(),
  title: z.string().trim().min(1, "Title is required"),
  authors: z.string().nullable().optional(),
  journal: z.string().nullable().optional(),
  year: z.number().int().nullable().optional(),
  volume: z.string().nullable().optional(),
  issue: z.string().nullable().optional(),
  pages: z.string().nullable().optional(),
  doi: z.string().nullable().optional(),
  pmid: z.string().nullable().optional(),
  pmcid: z.string().nullable().optional(),
  arxivId: z.string().nullable().optional(),
  url: z.string().url().nullable().optional(),
  source: z.string().nullable().optional(),
  bibtex: z.string().nullable().optional(),
  abstract: z.string().nullable().optional(),
  rawMetadata: z.any().nullable().optional(),
});

export const selectCitationSchema = insertCitationSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Review Thread & Comment
export const insertReviewThreadSchema = z.object({
  submissionId: z.number().int().positive(),
  title: z.string().nullable().optional(),
  reviewerId: z.string().nullable().optional(),
  status: z.string().default("pending").optional(),
  roundNumber: z.number().int().default(1).optional(),
  rawReport: z.string().nullable().optional(),
  emailThreadId: z.string().nullable().optional(),
  emailMessageId: z.string().nullable().optional(),
  attachments: z.any().nullable().optional(),
  metadata: z.any().nullable().optional(),
});

export const selectReviewThreadSchema = insertReviewThreadSchema.extend({
  id: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertReviewCommentSchema = z.object({
  threadId: z.number().int().positive(),
  commentNumber: z.number().int().nullable().optional(),
  reviewerText: z.string().min(1, "Reviewer text is required"),
  aiDraftedResponse: z.string().nullable().optional(),
  authorFinalResponse: z.string().nullable().optional(),
  status: z.string().default("pending").optional(),
  category: z.string().nullable().optional(),
  severity: z.string().nullable().optional(),
  suggestedAction: z.string().nullable().optional(),
  metadata: z.any().nullable().optional(),
});

export const selectReviewCommentSchema = insertReviewCommentSchema.extend({
  id: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// User Settings
export const insertUserSettingsSchema = z.object({
  userId: z.string(),
  academicRole: z.string().nullable().optional(),
  language: z.string().default("he").optional(),
  emailNotifications: z.boolean().default(true).optional(),
  browserNotifications: z.boolean().default(false).optional(),
  weeklyDigest: z.boolean().default(true).optional(),
  publicProfile: z.boolean().default(true).optional(),
  dataCollectionForAi: z.boolean().default(false).optional(),
  openaiApiKey: z.string().nullable().optional(),
  anthropicApiKey: z.string().nullable().optional(),
});

export const selectUserSettingsSchema = insertUserSettingsSchema.extend({
  id: z.number().int(),
});
