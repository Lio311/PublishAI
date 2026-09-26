import nodemailer from "nodemailer";
import {
  getTransporter,
  resetTransporter,
  setTransporter,
  getSenderAddress,
  sendAwaitingApprovalEmail,
  sendWeeklyDigestEmail,
  sendEmail,
  verifyTransport,
  isTransientError,
} from "../../services/email/notification-service";
import {
  sendSubmissionSuccessEmail,
  sendSubmissionFailedEmail,
} from "../../services/email/submission-email";
import {
  escapeHtml,
  htmlToPlainText,
  plainTextToHtml,
  renderBaseTextLayout,
  renderAwaitingApprovalTemplate,
  renderSubmissionSuccessTemplate,
  renderSubmissionFailedTemplate,
  renderWeeklyDigestTemplate,
  renderGenericNotificationTemplate,
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

  describe("HTML and Plain-text conversion utilities", () => {
    it("converts rich HTML to clean plain text fallback", () => {
      const html = `
        <style>body { color: red; }</style>
        <h2>Manuscript Accepted</h2>
        <p>Congratulations! Your paper was accepted.<br/>Check details below.</p>
        <ul>
          <li>Reviewer 1: Accepted &amp; endorsed</li>
          <li>Reviewer 2: Minor &quot;typos&quot; fixed</li>
        </ul>
        <p>Visit <a href="https://example.com/portal">Author Portal</a> or contact <a href="mailto:support@publish-ai.com">support@publish-ai.com</a>.</p>
      `;

      const text = htmlToPlainText(html);
      expect(text).toContain("Manuscript Accepted");
      expect(text).toContain("Congratulations! Your paper was accepted.");
      expect(text).toContain("• Reviewer 1: Accepted & endorsed");
      expect(text).toContain('• Reviewer 2: Minor "typos" fixed');
      expect(text).toContain("Author Portal (https://example.com/portal)");
      expect(text).toContain("support@publish-ai.com");
      expect(text).not.toContain("<style>");
      expect(text).not.toContain("<h2>");
    });

    it("converts plain text to HTML with autolinks and paragraphs", () => {
      const text = "Hello Author,\n\nPlease visit https://publish-ai.com/review to approve.\n\nThanks!";
      const html = plainTextToHtml(text, "Action Required");

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("Action Required");
      expect(html).toContain('<a href="https://publish-ai.com/review"');
      expect(html).toContain("Hello Author,");
    });

    it("renders branded base text layout with footer", () => {
      const textLayout = renderBaseTextLayout("Content message here", {
        title: "Test Layout",
        appName: "TestApp",
        supportEmail: "help@test.com",
        actionUrl: "https://test.com/action",
        actionText: "Click Here",
      });

      expect(textLayout).toContain("=== TestApp ===");
      expect(textLayout).toContain("Content message here");
      expect(textLayout).toContain("Click Here:\nhttps://test.com/action");
      expect(textLayout).toContain("Need help? Contact help@test.com");
    });
  });

  describe("renderGenericNotificationTemplate", () => {
    it("renders generic notification with details and CTA", () => {
      const template = renderGenericNotificationTemplate({
        recipientEmail: "user@example.com",
        recipientName: "Dr. Alice",
        title: "Citation Sync Complete",
        message: "Your paper citations have been updated.",
        details: {
          "Indexed Citations": "42",
          "h-index Impact": "+1",
        },
        actionUrl: "https://publish-ai.com/papers/123/citations",
        actionText: "View Citations",
      });

      expect(template.subject).toBe("Citation Sync Complete");
      expect(template.html).toContain("Dr. Alice");
      expect(template.html).toContain("Indexed Citations");
      expect(template.html).toContain("42");
      expect(template.html).toContain("View Citations");
      expect(template.text).toContain("Indexed Citations: 42");
      expect(template.text).toContain("View Citations: https://publish-ai.com/papers/123/citations");
    });
  });

  describe("Template fallbacks and edge-cases", () => {
    it("handles missing postUrl gracefully in submission success template", () => {
      const output = renderSubmissionSuccessTemplate({
        recipientEmail: "author@example.com",
        paperTitle: "Quantum Mechanics",
        postUrl: "",
      });

      expect(output.html).not.toContain('href=""');
      expect(output.html).toContain("PublishAI dashboard");
      expect(output.text).toContain("Track your submission status");
    });

    it("includes both retry and settings URL in submission failed text fallback", () => {
      const output = renderSubmissionFailedTemplate({
        recipientEmail: "author@example.com",
        paperTitle: "Quantum Mechanics",
        errorMessage: "Connection timeout",
        retryUrl: "https://publish-ai.com/retry/1",
        settingsUrl: "https://publish-ai.com/settings/conn",
      });

      expect(output.text).toContain("Retry Submission: https://publish-ai.com/retry/1");
      expect(output.text).toContain("Journal Settings: https://publish-ai.com/settings/conn");
    });
  });

  describe("Resend Transport and getTransporter Configuration", () => {
    it("configures Resend SMTP when RESEND_API_KEY is present", async () => {
      process.env.RESEND_API_KEY = "re_test_123456789";
      delete process.env.SMTP_HOST;

      const createTransportSpy = jest.spyOn(nodemailer, "createTransport");

      await getTransporter();

      expect(createTransportSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          host: "smtp.resend.com",
          port: 465,
          secure: true,
          auth: {
            user: "resend",
            pass: "re_test_123456789",
          },
        })
      );
    });

    it("configures secure: true when SMTP_PORT is 465", async () => {
      process.env.SMTP_HOST = "mail.myorg.org";
      process.env.SMTP_PORT = "465";
      delete process.env.SMTP_SECURE;

      const createTransportSpy = jest.spyOn(nodemailer, "createTransport");

      await getTransporter();

      expect(createTransportSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          host: "mail.myorg.org",
          port: 465,
          secure: true,
        })
      );
    });

    it("respects RESEND_FROM in getSenderAddress", () => {
      delete process.env.SMTP_FROM;
      delete process.env.EMAIL_FROM;
      process.env.RESEND_FROM = "notifications@my-verified-domain.com";

      expect(getSenderAddress()).toBe("notifications@my-verified-domain.com");
    });

    it("memoizes transporter promise across concurrent calls", async () => {
      delete process.env.SMTP_HOST;
      delete process.env.RESEND_API_KEY;

      const [t1, t2] = await Promise.all([getTransporter(), getTransporter()]);
      expect(t1).toBe(t2);
    });
  });

  describe("sendEmail with automatic fallback & retry handling", () => {
    it("automatically generates text fallback from html when text is omitted", async () => {
      const mockSendMail = jest.fn().mockResolvedValue({ messageId: "msg-auto-text" });
      setTransporter({ sendMail: mockSendMail } as any);

      await sendEmail({
        to: "author@example.com",
        subject: "Review Complete",
        html: "<h2>Review Complete</h2><p>Your paper has passed all checks.</p>",
      });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "author@example.com",
          text: expect.stringContaining("Review Complete\n\nYour paper has passed all checks."),
        })
      );
    });

    it("automatically generates html fallback from text when html is omitted", async () => {
      const mockSendMail = jest.fn().mockResolvedValue({ messageId: "msg-auto-html" });
      setTransporter({ sendMail: mockSendMail } as any);

      await sendEmail({
        to: "author@example.com",
        subject: "Notice",
        text: "Important account notice.\nPlease review.",
      });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "author@example.com",
          html: expect.stringContaining("Important account notice."),
        })
      );
    });

    it("retries transient error and succeeds on subsequent attempt", async () => {
      const mockSendMail = jest
        .fn()
        .mockRejectedValueOnce(Object.assign(new Error("Connection reset"), { code: "ECONNRESET" }))
        .mockResolvedValueOnce({ messageId: "msg-retry-success" });

      setTransporter({ sendMail: mockSendMail } as any);

      const result = await sendEmail({
        to: "user@example.com",
        subject: "Retry Test",
        text: "Testing retries",
        maxRetries: 2,
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("msg-retry-success");
      expect(mockSendMail).toHaveBeenCalledTimes(2);
    });

    it("correctly identifies transient error codes", () => {
      expect(isTransientError({ code: "ECONNRESET" })).toBe(true);
      expect(isTransientError({ code: "ETIMEDOUT" })).toBe(true);
      expect(isTransientError({ status: 429 })).toBe(true);
      expect(isTransientError({ message: "rate limit exceeded" })).toBe(true);
      expect(isTransientError(new Error("Invalid recipient address syntax"))).toBe(false);
    });
  });

  describe("sendWeeklyDigestEmail", () => {
    it("successfully dispatches weekly digest email", async () => {
      const mockSendMail = jest.fn().mockResolvedValue({ messageId: "msg-digest-101" });
      setTransporter({ sendMail: mockSendMail } as any);

      const result = await sendWeeklyDigestEmail("researcher@uni.edu", "Marie", {
        papersCount: 5,
        submissionsCount: 3,
        highlights: ["Nature Physics submission pending"],
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("msg-digest-101");
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "researcher@uni.edu",
          subject: expect.stringContaining("Weekly Digest"),
          text: expect.stringContaining("Active Papers: 5"),
          html: expect.stringContaining("Active Papers"),
        })
      );
    });
  });

  describe("verifyTransport", () => {
    it("calls transporter verify and returns success", async () => {
      const mockVerify = jest.fn().mockResolvedValue(true);
      const mailer = { verify: mockVerify } as any;

      const result = await verifyTransport(mailer);
      expect(result.success).toBe(true);
      expect(mockVerify).toHaveBeenCalled();
    });

    it("returns error message when verify fails", async () => {
      const mockVerify = jest.fn().mockRejectedValue(new Error("Authentication failed"));
      const mailer = { verify: mockVerify } as any;

      const result = await verifyTransport(mailer);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Authentication failed");
    });
  });
});
