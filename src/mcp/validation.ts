import { z } from "zod";

export const LiteratureSearchSchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, "Search query cannot be empty.")
    .max(500, "Search query must not exceed 500 characters."),
  limit: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === null) return 5;
      const parsed = typeof val === "string" ? parseInt(val, 10) : Number(val);
      if (isNaN(parsed) || parsed < 1) return 5;
      return Math.min(Math.floor(parsed), 50);
    }),
  offset: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === null) return 0;
      const parsed = typeof val === "string" ? parseInt(val, 10) : Number(val);
      if (isNaN(parsed) || parsed < 0) return 0;
      return Math.min(Math.floor(parsed), 1000);
    }),
  sources: z
    .array(z.enum(["pubmed", "crossref", "semanticscholar"]))
    .optional(),
});

export const CitationByDoiSchema = z.object({
  doi: z
    .string()
    .trim()
    .min(3, "DOI cannot be empty.")
    .max(250, "DOI must not exceed 250 characters.")
    .transform((doi) => {
      return doi
        .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
        .replace(/^doi:\s*/i, "")
        .trim();
    })
    .refine((doi) => /^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/i.test(doi), {
      message: "Invalid DOI format. Must be a valid DOI like '10.1000/182'.",
    }),
});

export const AuthorItemSchema = z.union([
  z.string().min(1, "Author name cannot be empty.").trim(),
  z.object({
    name: z.string().min(1, "Author name cannot be empty.").trim(),
    email: z.string().email().optional().or(z.literal("")),
    affiliation: z.string().optional(),
  }),
]);

export const OjsSubmissionSchema = z.object({
  connectionId: z.coerce.number().int().positive().optional(),
  siteUrl: z.string().url().optional(),
  apiToken: z.string().min(1).optional(),
  title: z
    .string()
    .trim()
    .min(1, "Manuscript title cannot be empty.")
    .max(500, "Title must not exceed 500 characters."),
  abstract: z
    .string()
    .trim()
    .min(1, "Manuscript abstract cannot be empty."),
  authors: z
    .array(AuthorItemSchema)
    .min(1, "At least one author must be specified."),
  keywords: z.array(z.string().trim()).optional().default([]),
  locale: z.string().trim().default("en_US"),
  sectionId: z.coerce.number().int().positive().default(1),
  content: z.string().optional(),
});

export const OjsTestConnectionSchema = z.object({
  connectionId: z.coerce.number().int().positive().optional(),
  siteUrl: z.string().url().optional(),
  apiToken: z.string().min(1).optional(),
});

export const WordPressDraftSchema = z.object({
  connectionId: z.coerce.number().int().positive().optional(),
  siteUrl: z.string().url().optional(),
  username: z.string().min(1).optional(),
  appPassword: z.string().min(1).optional(),
  title: z
    .string()
    .trim()
    .min(1, "Post title cannot be empty.")
    .max(500, "Title must not exceed 500 characters."),
  content: z
    .string()
    .trim()
    .min(1, "Post content cannot be empty."),
  excerpt: z.string().optional(),
  status: z.enum(["draft", "publish"]).default("draft"),
  authors: z.array(AuthorItemSchema).optional(),
  keywords: z.array(z.string().trim()).optional().default([]),
  coverLetter: z.string().optional(),
});

export const WordPressTestConnectionSchema = z.object({
  connectionId: z.coerce.number().int().positive().optional(),
  siteUrl: z.string().url().optional(),
  username: z.string().min(1).optional(),
  appPassword: z.string().min(1).optional(),
});
