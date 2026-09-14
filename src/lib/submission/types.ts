export interface ConnectionTestResult {
  success: boolean;
  message: string;
  userDisplayName?: string;
  userRole?: string;
  requires2FA?: boolean;
  serverInfo?: {
    platform: string;
    siteName: string;
  };
}

export interface SubmissionPayload {
  title: string;
  content: string;
  abstract: string;
  keywords: string[];
  authors: { name: string; email: string; affiliation: string }[];
  articleType: string;
  coverLetter?: string;
  publishMode: "draft" | "publish";
  attachments: {
    filename: string;
    mimeType: string;
    buffer: Buffer;
  }[];
}

export interface SubmissionResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  confirmationId?: string;
  rawResponse?: unknown;
  error?: string;
}
