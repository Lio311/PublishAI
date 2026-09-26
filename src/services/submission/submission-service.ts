/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { db } from "@/services/db";
import { journalConnections, submissions, submissionLogs } from "@/services/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "@/services/security/encryption";
import { WordPressAdapter } from "./adapters/wordpress-adapter";
import { OJSAdapter } from "./adapters/ojs-adapter";
import { EmailAdapter } from "./adapters/email-adapter";
import { EditorialManagerAdapter } from "./adapters/editorial-manager-adapter";
import { SubmissionPayload, SubmissionResult } from "./connection-types";

export class SubmissionService {

  /**
   * Validates the submission for technical issues before sending.
   */
  static async validateSubmission(submissionId: number): Promise<{ valid: boolean; errors: string[] }> {
    const submission = await db.query.submissions.findFirst({
      where: eq(submissions.id, submissionId),
      with: { connection: true }
    });
    if (!submission) throw new Error("Submission not found");

    const errors: string[] = [];

    // Technical validation 1: Authors mismatch/missing info
    if (!submission.submittedAuthors || !Array.isArray(submission.submittedAuthors) || submission.submittedAuthors.length === 0) {
      errors.push("No authors provided.");
    } else {
      submission.submittedAuthors.forEach((author: any, index: number) => {
        if (!author.email) errors.push(`Author ${index + 1} is missing an email address.`);
        if (!author.affiliation) errors.push(`Author ${index + 1} is missing an institutional affiliation.`);
      });
    }

    // Technical validation 2: Title and abstract
    if (!submission.submittedTitle || submission.submittedTitle.trim() === "") {
      errors.push("Missing manuscript title.");
    }
    if (!submission.submittedAbstract || submission.submittedAbstract.trim() === "") {
      errors.push("Missing abstract.");
    }

    // Technical validation 3: Required statements
    if (!submission.conflictOfInterestStatement) {
      errors.push("Missing Conflict of Interest statement.");
    }
    if (!submission.fundingDeclaration) {
      // Assuming false means no funding, but we might want a string statement. We check if it's explicitly set.
      // For boolean, it defaults to false, so maybe we skip strict boolean check here unless required.
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Executes a submission based on the database record.
 based on the database record.
   * Can be called by the background worker.
   */
  static async executeSubmission(submissionId: number): Promise<SubmissionResult> {
    const submission = await db.query.submissions.findFirst({
      where: eq(submissions.id, submissionId),
      with: {
        connection: true,
      },
    });

    if (!submission) {
      throw new Error(`Submission ${submissionId} not found`);
    }
    
    // Type casting because drizzle relations might not be fully inferred here depending on setup
    const conn = submission.connection as any;

    if (!conn) {
      throw new Error(`Connection for submission ${submissionId} not found`);
    }


    try {
      const validation = await this.validateSubmission(submissionId);
      if (!validation.valid) {
        throw new Error("Technical Validation Failed: " + validation.errors.join("; "));
      }

      await this.log(submissionId, "info", "Starting submission process", { platform: conn.platform });

      
      const payload: SubmissionPayload = {
        title: submission.submittedTitle || "Untitled",
        abstract: submission.submittedAbstract || "",
        content: "Content from paper will go here...", // Need to fetch paper content
        keywords: submission.submittedKeywords as string[] || [],
        authors: submission.submittedAuthors as any || [],
        articleType: submission.submittedArticleType || "Article",
        publishMode: (submission.publishMode as "draft" | "publish") || "draft",
        attachments: [],
      };

      let result: SubmissionResult;
      
      const username = decrypt(conn.encryptedUsername);
      const password = decrypt(conn.encryptedPassword);

      if (conn.platform === "wordpress") {
        const adapter = new WordPressAdapter(conn.siteUrl, username, password);
        result = await adapter.submit(payload);
      } else if (conn.platform === "ojs") {
        const adapter = new OJSAdapter(conn.siteUrl, username);
        result = await adapter.submit(payload);
      } else if (conn.platform === "email") {
        // For email: siteUrl = editor email, username = author name, password = author email
        const adapter = new EmailAdapter(conn.siteUrl, username, password);
        result = await adapter.submit(payload);
      } else if (conn.platform === "editorial_manager") {
        const adapter = new EditorialManagerAdapter(conn.siteUrl, username);
        result = await adapter.submit(payload);
      } else {
        throw new Error(`Unsupported platform: ${conn.platform}`);
      }

      if (result.success) {
        await this.log(submissionId, "info", "Submission successful", { confirmationId: result.confirmationId });
        await db.update(submissions).set({
          status: "submitted",
          remotePostId: result.postId,
          remotePostUrl: result.postUrl,
          confirmationId: result.confirmationId,
          responseData: result.rawResponse,
          submittedAt: new Date(),
        }).where(eq(submissions.id, submissionId));
      } else {
        await this.log(submissionId, "error", "Submission failed", { error: result.error });
        await db.update(submissions).set({
          status: "failed",
          errorLog: result.error,
          responseData: result.rawResponse,
        }).where(eq(submissions.id, submissionId));
      }

      return result;
    } catch (error: any) {
      await this.log(submissionId, "error", "Exception during submission", { message: error.message, stack: error.stack });
      await db.update(submissions).set({
        status: "failed",
        errorLog: error.message,
      }).where(eq(submissions.id, submissionId));
      
      return { success: false, error: error.message };
    }
  }

  static async log(submissionId: number, level: string, message: string, details?: any) {
    await db.insert(submissionLogs).values({
      submissionId,
      level,
      message,
      details,
    });
  }
}
