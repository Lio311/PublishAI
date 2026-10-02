import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import SubmissionProgressBar from "@/components/submission/SubmissionProgressBar";
import { SecurityBriefing } from "@/components/submission/SecurityBriefing";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

describe("Submission Components Audit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

});
