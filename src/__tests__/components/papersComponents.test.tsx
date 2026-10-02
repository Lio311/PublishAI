import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PaperProcessingUI } from "@/components/papers/PaperProcessingUI";

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

      const input = screen.getByLabelText('captchaLabel');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("id", "captcha-solution-input");
    });

    it("submits captcha with real submissionId and not hardcoded mock", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<PaperProcessingUI paperId={789} initialStatus="requires_captcha" />);

      const input = screen.getByLabelText('captchaLabel');
      fireEvent.change(input, { target: { value: "solution123" } });

      const submitBtn = screen.getByRole("button", { name: 'submitCaptcha' });
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

      const approveBtn = screen.getByRole("button", { name: 'approveSubmit' });
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

});
