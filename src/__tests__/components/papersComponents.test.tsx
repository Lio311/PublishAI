import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PaperProcessingUI } from "@/components/papers/PaperProcessingUI";
import { RebuttalPanel } from "@/components/papers/RebuttalPanel";
import * as papersModule from "@/components/papers";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

// Mock sonner toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock SubmissionPanel child component to avoid nested DB calls
jest.mock("@/components/submission/SubmissionPanel", () => ({
  SubmissionPanel: ({ paperId }: { paperId: number }) => (
    <div data-testid="mock-submission-panel">Submission Panel for paper {paperId}</div>
  ),
}));

describe("Papers Components Audit Tests", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    // Mock scrollIntoView for jsdom
    Element.prototype.scrollIntoView = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe("Barrel export verification", () => {
    it("exports all components correctly from @/components/papers", () => {
      expect(papersModule.PaperProcessingUI).toBeDefined();
      expect(papersModule.RebuttalPanel).toBeDefined();
    });
  });

  describe("PaperProcessingUI", () => {
    it("renders workflow steps with accessible list semantics and aria-current", () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ status: "preparing" }),
      });

      render(<PaperProcessingUI paperId={42} initialStatus="preparing" />);
      
      const stepList = screen.getByRole("list");
      expect(stepList).toBeInTheDocument();

      const items = screen.getAllByRole("listitem");
      expect(items.length).toBeGreaterThan(0);

      // Active step should have aria-current="step"
      const activeStep = items.find((item) => item.getAttribute("aria-current") === "step");
      expect(activeStep).toBeDefined();
    });

    it("renders accessible captcha dialog with proper role and linked input label", () => {
      render(<PaperProcessingUI paperId={42} initialStatus="requires_captcha" />);

      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAttribute("aria-labelledby", "captcha-dialog-title");

      const input = screen.getByLabelText(/Captcha Solution/i);
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("id", "captcha-solution-input");
    });

    it("submits captcha with real submissionId and not hardcoded mock", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<PaperProcessingUI paperId={789} initialStatus="requires_captcha" />);

      const input = screen.getByLabelText(/Captcha Solution/i);
      fireEvent.change(input, { target: { value: "solution123" } });

      const submitBtn = screen.getByRole("button", { name: /Submit Captcha/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/submissions/captcha",
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({ submissionId: "789", solution: "solution123" }),
          })
        );
      });
    });

    it("renders finished state and approve button with loading state when initiated", async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/submit")) {
          return new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ success: true }),
                }),
              50
            )
          );
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: "completed" }),
        });
      });

      render(<PaperProcessingUI paperId={99} initialStatus="completed" />);

      const approveBtn = screen.getByRole("button", { name: /Approve & Submit/i });
      expect(approveBtn).toBeInTheDocument();

      fireEvent.click(approveBtn);

      // Should show loading state and aria-busy
      expect(approveBtn).toHaveAttribute("aria-busy", "true");

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/submissions/99/submit",
          expect.objectContaining({ method: "POST" })
        );
      });
    });
  });

  describe("RebuttalPanel", () => {
    it("renders form with properly linked label and textarea id", () => {
      render(<RebuttalPanel paperId="paper-101" />);

      const label = screen.getByText(/^Paste Reviewer Comments$/i);
      expect(label).toHaveAttribute("for", "reviewer-comments-paper-101");

      const textarea = screen.getByLabelText(/^Paste Reviewer Comments$/i);
      expect(textarea).toHaveAttribute("id", "reviewer-comments-paper-101");
      expect(textarea).toHaveAttribute("name", "reviewerComments");
    });

    it("prefills initial comments and displays previous rebuttal strategy and letter if passed", () => {
      render(
        <RebuttalPanel
          paperId="paper-101"
          initialComments="Initial reviewer remarks"
          initialStrategy={["Point 1: Add experiment", "Point 2: Rephrase"]}
          initialLetter="Dear Reviewer, thank you for the feedback."
        />
      );

      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
      expect(textarea.value).toBe("Initial reviewer remarks");

      expect(screen.getByText("Point 1: Add experiment")).toBeInTheDocument();
      expect(screen.getByText("Dear Reviewer, thank you for the feedback.")).toBeInTheDocument();
    });

    it("displays error alert with role='alert' when generation fails", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: "Model timeout error" }),
      });

      render(<RebuttalPanel paperId="paper-101" initialComments="Methodology questions" />);

      const generateBtn = screen.getByRole("button", { name: /Generate Strategy/i });
      fireEvent.click(generateBtn);

      await waitFor(() => {
        const errorAlert = screen.getByRole("alert");
        expect(errorAlert).toBeInTheDocument();
        expect(errorAlert).toHaveTextContent("Model timeout error");
      });
    });

    it("handles clipboard copying with accessible buttons", async () => {
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn().mockResolvedValue(undefined),
        },
      });

      render(
        <RebuttalPanel
          paperId="paper-101"
          initialStrategy={["Point 1"]}
          initialLetter="Formal letter text"
        />
      );

      const copyLetterBtn = screen.getByRole("button", { name: /Copy formal rebuttal letter to clipboard/i });
      fireEvent.click(copyLetterBtn);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith("Formal letter text");
      });
    });
  });
});
