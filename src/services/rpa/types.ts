import { SubmissionPayload } from "@/services/submission/connection-types";

export interface WorkflowResult {
  status: 'success' | 'requires_captcha' | 'requires_2fa' | 'error';
  captchaUrl?: string;
  screenshotUrl?: string;
  trackingId?: string;
  message?: string;
  stepsCompleted?: string[];
  storageState?: string; // Serialized JSON string of cookies and local storage
  stateData?: Record<string, unknown>; // Additional metadata/state for pausing/resuming
  errorLog?: string;
}

export interface NavigatorConfig {
  siteUrl: string;
  username: string;
  password: string;
  paperId: string;
  submissionPayload: SubmissionPayload;
  captchaStrategy?: 'manual' | 'auto';
  captchaSolution?: string;
  twoFACode?: string;
  storageState?: string;
  resumedSteps?: string[];
  navigationTimeout?: number;
  initialStateData?: Record<string, unknown>;
  stateData?: Record<string, unknown>;
}

