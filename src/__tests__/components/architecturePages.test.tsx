import React from "react";
import { render, screen } from "@testing-library/react";
import FlowchartClient from "@/app/[locale]/flowchart/FlowchartClient";
import ArchitectureClient from "@/app/[locale]/architecture/ArchitectureClient";

let mockLocale = "en";
jest.mock("next-intl", () => ({ useLocale: () => mockLocale }));
jest.mock("@/components/layout/DashboardLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const RETIRED = /Claude 3|OpenAI o1|o1-preview|Gemini 1\.5|Puppeteer|2Captcha|WebSocket|Mendeley|Environment Validator/;

describe("system documentation pages", () => {
  it.each(["en", "he"])("flowchart renders current models and features (%s)", (locale) => {
    mockLocale = locale;
    const { container } = render(<FlowchartClient isAdmin={false} />);
    expect(screen.getAllByText("Claude Opus 5.5").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Gemini Pro").length).toBeGreaterThan(0);
    expect(screen.getAllByText("OpenAlex").length).toBeGreaterThan(0);
    expect(container.textContent).not.toMatch(RETIRED);
  });

  it.each(["en", "he"])("architecture page renders without retired tools (%s)", (locale) => {
    mockLocale = locale;
    const { container } = render(<ArchitectureClient isAdmin={false} />);
    expect(container.textContent).not.toMatch(RETIRED);
  });
});
