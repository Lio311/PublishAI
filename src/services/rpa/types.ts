import { SubmissionPayload } from "@/services/submission/connection-types";

export interface WorkflowResult {
  status: 'success' | 'requires_captcha' | 'requires_2fa' | 'error';
  captchaUrl?: string;
  screenshotUrl?: string;
  trackingId?: string;
  message?: string;
  stepsCompleted?: string[];
}

export interface NavigatorConfig {
  siteUrl: string;
  username: string;
  password: string;
  paperId: string;
  submissionPayload: SubmissionPayload;
}
