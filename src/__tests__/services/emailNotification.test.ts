import nodemailer from "nodemailer";
import {
  getTransporter,
  resetTransporter,
  setTransporter,
  getSenderAddress,
  sendAwaitingApprovalEmail,
} from "../../services/email/notification-service";
import {
  sendSubmissionSuccessEmail,
  sendSubmissionFailedEmail,
} from "../../services/email/submission-email";
import {
  escapeHtml,
  renderAwaitingApprovalTemplate,
  renderSubmissionSuccessTemplate,
  renderSubmissionFailedTemplate,
  renderWeeklyDigestTemplate,
} from "../../services/email/templates";

describe("Email Templates", () => {
  describe("escapeHtml", () => {
    it("escapes dangerous HTML characters", () => {
      const dangerous = '<script>alert("xss & \'injection\'")</script>';
      const escaped = escapeHtml(dangerous);
      expect(escaped).toBe(
        "&lt;script&gt;alert(&quot;xss &amp; &#039;injection&#039;&quot;)&lt;/script&gt;"
      );
    });

    it("handles empty string", () => {
      expect(escapeHtml("")).toBe("");
    });
  });

  describe("renderAwaitingApprovalTemplate", () => {
    it("renders default template properly", () => {
      const output = renderAwaitingApprovalTemplate({
        recipientEmail: "author@example.com",
        paperTitle: "Quantum Teleportation",
        paperId: "paper-123",
      });

      expect(output.subject).toContain("Quantum Teleportation");
      expect(output.html).toContain("Quantum Teleportation");
      expect(output.html).toContain("Hello,");
      expect(output.html).toContain("/papers/paper-123");
      expect(output.text).toContain("Quantum Teleportation");
      expect(output.text).toContain("/papers/paper-123");
    });

    it("renders customized dynamic template parameters", () => {
      const output = renderAwaitingApprovalTemplate({
        recipientEmail: "author@example.com",
        recipientName: "Dr. Jane Doe",
        paperTitle: "AI Alignment in 2026",
        paperId: "paper-456",
        customMessage: "All 12 reviewer concerns were addressed.",
        stagesSummary: "Completed all 9 pipeline stages.",
        dashboardUrl: "https://custom.app/papers/paper-456",
        appName: "NextGen Publisher",
        supportEmail: "help@nextgen.org",
      });

      expect(output.html).toContain("Hello Dr. Jane Doe,");
      expect(output.html).toContain("All 12 reviewer concerns were addressed.");
      expect(output.html).toContain("Completed all 9 pipeline stages.");
      expect(output.html).toContain("https://custom.app/papers/paper-456");
      expect(output.html).toContain("NextGen Publisher");
      expect(output.html).toContain("help@nextgen.org");
      expect(output.text).toContain("Dr. Jane Doe");
      expect(output.text).toContain("https://custom.app/papers/paper-456");
    });
  });

  describe("renderSubmissionSuccessTemplate", () => {
    it("renders dynamic success details with journal and confirmation", () => {
      const output = renderSubmissionSuccessTemplate({
        recipientEmail: "author@example.com",
        recipientName: "Prof. Einstein",
        paperTitle: "General Relativity",
        postUrl: "https://nature.com/submissions/gr-101",
        journalName: "Nature Physics",
        confirmationId: "CONF-9988",
      });

      expect(output.subject).toBe('Your paper "General Relativity" was successfully submitted to Nature Physics');
      expect(output.html).toContain("Prof. Einstein");
      expect(output.html).toContain("Nature Physics");
      expect(output.html).toContain("CONF-9988");
      expect(output.html).toContain("https://nature.com/submissions/gr-101");
      expect(output.text).toContain("General Relativity");
      expect(output.text).toContain("CONF-9988");
    });
  });

  describe("renderSubmissionFailedTemplate", () => {
    it("renders dynamic error message, retry, and settings link", () => {
      const output = renderSubmissionFailedTemplate({
        recipientEmail: "author@example.com",
        recipientName: "Dr. Turing",
        paperTitle: "Computing Machinery",
        errorMessage: "API token expired: 401 Unauthorized",
        journalName: "Mind Journal",
        retryUrl: "https://publish-ai.com/retry/123",
        settingsUrl: "https://publish-ai.com/settings/journals",
      });

      expect(output.subject).toContain('Action Required: Submission failed for "Computing Machinery"');
      expect(output.html).toContain("API token expired: 401 Unauthorized");
      expect(output.html).toContain("https://publish-ai.com/retry/123");
      expect(output.html).toContain("https://publish-ai.com/settings/journals");
      expect(output.text).toContain("API token expired: 401 Unauthorized");
    });
  });

  describe("renderWeeklyDigestTemplate", () => {
    it("renders digest summary with counts and highlights", () => {
      const output = renderWeeklyDigestTemplate({
        recipientEmail: "researcher@lab.edu",
        recipientName: "Marie",
        papersCount: 4,
        submissionsCount: 2,
        highlights: ["Paper A accepted", "Paper B revised"],
      });

      expect(output.html).toContain("Active Papers");
      expect(output.html).toContain("4");
      expect(output.html).toContain("2");
      expect(output.html).toContain("Paper A accepted");
      expect(output.text).toContain("Active Papers: 4");
    });
  });
});

describe("Email Sending Services & Error Handling", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    resetTransporter();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    resetTransporter();
    jest.restoreAllMocks();
  });

  describe("Sender Resolution", () => {
    it("respects customFrom, SMTP_FROM, EMAIL_FROM, and default", () => {
      expect(getSenderAddress("custom@example.com")).toBe("custom@example.com");

      process.env.SMTP_FROM = "smtp@example.com";
      expect(getSenderAddress()).toBe("smtp@example.com");

      delete process.env.SMTP_FROM;
      process.env.EMAIL_FROM = "email@example.com";
      expect(getSenderAddress()).toBe("email@example.com");

      delete process.env.EMAIL_FROM;
      expect(getSenderAddress()).toBe('"Publish AI" <noreply@publish-ai.com>');
    });
  });

  describe("getTransporter fallback behavior", () => {
    it("falls back to jsonTransport if createTestAccount throws", async () => {
      jest.spyOn(nodemailer, "createTestAccount").mockRejectedValue(new Error("Network offline"));

      const transporter = await getTransporter();
      expect(transporter).toBeDefined();
    });
  });

  describe("sendAwaitingApprovalEmail", () => {
    it("successfully sends an awaiting approval email with mock transporter", async () => {
      const mockSendMail = jest.fn().mockResolvedValue({
        messageId: "msg-approval-123",
      });

      setTransporter({
        sendMail: mockSendMail,
        transporter: { name: "smtp.ethereal.email" },
        options: { host: "smtp.ethereal.email" },
      } as any);

      const result = await sendAwaitingApprovalEmail(
        "author@example.com",
        "Deep Learning Foundations",
        "paper-123",
        { recipientName: "Ada" }
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("msg-approval-123");
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "author@example.com",
          subject: expect.stringContaining("Deep Learning Foundations"),
          text: expect.stringContaining("Ada"),
          html: expect.stringContaining("Ada"),
        })
      );
    });

    it("catches errors gracefully and returns success: false instead of crashing", async () => {
      const mockSendMail = jest.fn().mockRejectedValue(new Error("SMTP Connection refused"));

      setTransporter({
        sendMail: mockSendMail,
      } as any);

      const result = await sendAwaitingApprovalEmail(
        "author@example.com",
        "Deep Learning Foundations",
        "paper-123"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("SMTP Connection refused");
    });

    it("rethrows error when throwOnError is true", async () => {
      const mockSendMail = jest.fn().mockRejectedValue(new Error("SMTP Connection refused"));

      setTransporter({
        sendMail: mockSendMail,
      } as any);

      await expect(
        sendAwaitingApprovalEmail("author@example.com", "Deep Learning Foundations", "paper-123", {
          throwOnError: true,
        })
      ).rejects.toThrow("SMTP Connection refused");
    });
  });

  describe("sendSubmissionSuccessEmail", () => {
    it("successfully sends submission success email", async () => {
      const mockSendMail = jest.fn().mockResolvedValue({
        messageId: "msg-success-789",
      });

      setTransporter({
        sendMail: mockSendMail,
      } as any);

      const result = await sendSubmissionSuccessEmail(
        "author@example.com",
        "Quantum Computing",
        "https://journal.org/post/1",
        {
          journalName: "Nature Quantum",
          confirmationId: "NQ-100",
        }
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("msg-success-789");
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "author@example.com",
          subject: expect.stringContaining("Nature Quantum"),
          text: expect.stringContaining("NQ-100"),
          html: expect.stringContaining("NQ-100"),
        })
      );
    });

    it("catches errors gracefully in sendSubmissionSuccessEmail", async () => {
      const mockSendMail = jest.fn().mockRejectedValue(new Error("Rate limit exceeded"));

      setTransporter({
        sendMail: mockSendMail,
      } as any);

      const result = await sendSubmissionSuccessEmail(
        "author@example.com",
        "Quantum Computing",
        "https://journal.org/post/1"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Rate limit exceeded");
    });

    it("rethrows error in sendSubmissionSuccessEmail when throwOnError is true", async () => {
      const mockSendMail = jest.fn().mockRejectedValue(new Error("Auth failure"));

      setTransporter({
        sendMail: mockSendMail,
      } as any);

      await expect(
        sendSubmissionSuccessEmail("author@example.com", "Paper", "http://post.url", {
          throwOnError: true,
        })
      ).rejects.toThrow("Auth failure");
    });
  });

  describe("sendSubmissionFailedEmail", () => {
    it("successfully sends submission failure email with diagnostics and retry link", async () => {
      const mockSendMail = jest.fn().mockResolvedValue({
        messageId: "msg-fail-456",
      });

      setTransporter({
        sendMail: mockSendMail,
      } as any);

      const result = await sendSubmissionFailedEmail(
        "author@example.com",
        "Neural Networks",
        "Manuscript PDF upload rejected: file corrupted",
        {
          journalName: "IEEE",
          retryUrl: "https://publish-ai.com/retry/nn-1",
        }
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("msg-fail-456");
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "author@example.com",
          subject: expect.stringContaining('Action Required: Submission failed for "Neural Networks"'),
          text: expect.stringContaining("file corrupted"),
          html: expect.stringContaining("https://publish-ai.com/retry/nn-1"),
        })
      );
    });

    it("catches errors gracefully in sendSubmissionFailedEmail", async () => {
      const mockSendMail = jest.fn().mockRejectedValue(new Error("Network drop"));

      setTransporter({
        sendMail: mockSendMail,
      } as any);

      const result = await sendSubmissionFailedEmail(
        "author@example.com",
        "Neural Networks",
        "Some error"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Network drop");
    });

    it("rethrows error in sendSubmissionFailedEmail when throwOnError is true", async () => {
      const mockSendMail = jest.fn().mockRejectedValue(new Error("Fatal SMTP error"));

      setTransporter({
        sendMail: mockSendMail,
      } as any);

      await expect(
        sendSubmissionFailedEmail("author@example.com", "Paper", "Error", {
          throwOnError: true,
        })
      ).rejects.toThrow("Fatal SMTP error");
    });
  });
});
