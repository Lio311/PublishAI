import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CaptchaSolver } from "@/components/submission/CaptchaSolver";
import SubmissionProgressBar from "@/components/submission/SubmissionProgressBar";
import { TwoFactorDialog } from "@/components/submission/TwoFactorDialog";
import { SecurityBriefing } from "@/components/submission/SecurityBriefing";
import * as submissionModule from "@/components/submission";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

describe("Submission Components Audit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Barrel export verification", () => {
    it("exports all submission components correctly from @/components/submission", () => {
      expect(submissionModule.CaptchaSolver).toBeDefined();
      expect(submissionModule.ConnectionForm).toBeDefined();
      expect(submissionModule.ConnectionsManager).toBeDefined();
      expect(submissionModule.SecurityBriefing).toBeDefined();
      expect(submissionModule.SubmissionPanel).toBeDefined();
      expect(submissionModule.SubmissionProgressBar).toBeDefined();
      expect(submissionModule.TwoFactorDialog).toBeDefined();
      expect(submissionModule.SubmissionWizard).toBeDefined();
    });
  });

  describe("CaptchaSolver", () => {
    it("renders accessible input with proper label association and aria attributes", () => {
      render(<CaptchaSolver submissionId="123" />);
      const input = screen.getByLabelText(/Captcha Solution/i);
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("id", "captcha-input");
      expect(input).toHaveAttribute("aria-required", "true");
    });

    it("handles submission success gracefully", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<CaptchaSolver submissionId={456} />);
      const input = screen.getByLabelText(/Captcha Solution/i);
      fireEvent.change(input, { target: { value: "test-solution" } });

      const submitBtn = screen.getByRole("button", { name: /Submit Captcha/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByRole("status")).toHaveTextContent("Captcha submitted successfully!");
      });
    });

    it("displays error with role alert when API returns error", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: "Invalid captcha solution" }),
      });

      render(<CaptchaSolver submissionId="123" />);
      const input = screen.getByLabelText(/Captcha Solution/i);
      fireEvent.change(input, { target: { value: "wrong" } });

      const submitBtn = screen.getByRole("button", { name: /Submit Captcha/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        const alert = screen.getByRole("alert");
        expect(alert).toHaveTextContent("Invalid captcha solution");
      });
    });
  });

  describe("SubmissionProgressBar", () => {
    it("renders progressbar with accessible progressbar role and step landmarks", () => {
      render(<SubmissionProgressBar currentStatus="with_editor" />);
      const progressbar = screen.getByRole("progressbar");
      expect(progressbar).toBeInTheDocument();
      expect(progressbar).toHaveAttribute("aria-valuenow", "3");
      expect(progressbar).toHaveAttribute("aria-valuemin", "1");
    });

    it("renders fallback message on failed or rejected status", () => {
      render(<SubmissionProgressBar currentStatus="failed" />);
      const statusBox = screen.getByRole("status");
      expect(statusBox).toHaveTextContent("FAILED");
    });
  });

  describe("SecurityBriefing", () => {
    it("enables continue button only when checkbox is accepted", () => {
      const onAccept = jest.fn();
      const onCancel = jest.fn();

      render(<SecurityBriefing onAccept={onAccept} onCancel={onCancel} />);
      const continueBtn = screen.getByRole("button", { name: /continue/i });
      expect(continueBtn).toBeDisabled();

      const checkbox = screen.getByRole("checkbox");
      fireEvent.click(checkbox);
      expect(continueBtn).toBeEnabled();

      fireEvent.click(continueBtn);
      expect(onAccept).toHaveBeenCalledTimes(1);
    });
  });

  describe("TwoFactorDialog", () => {
    it("closes on Escape key press", () => {
      const onClose = jest.fn();
      const onSubmit = jest.fn();

      render(<TwoFactorDialog isOpen={true} onClose={onClose} onSubmit={onSubmit} />);
      fireEvent.keyDown(window, { key: "Escape" });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("renders dialog with proper role and aria-modal", () => {
      render(<TwoFactorDialog isOpen={true} onClose={jest.fn()} onSubmit={jest.fn()} />);
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute("aria-modal", "true");
    });
  });
});
