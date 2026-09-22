import { chromium } from 'playwright';
import { GenericNavigator } from './portal-navigators/generic-navigator';
import { WorkflowResult, NavigatorConfig } from './types';
import { SubmissionPayload } from '@/services/submission/connection-types';

export type { WorkflowResult };

export interface ConnectionDetails {
  siteUrl: string;
  username: string;
  password: string;
}

/**
 * Runs the full Playwright-based RPA submission workflow.
 * Launches a headless browser, navigates the portal, fills forms, and submits.
 * Falls back to CAPTCHA/2FA detection when blocks are encountered.
 */
export async function runSubmissionWorkflow(
  paperId: string,
  connectionDetails?: ConnectionDetails,
  payload?: Partial<SubmissionPayload>
): Promise<WorkflowResult> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  });

  try {
    const page = await context.newPage();
    console.log(`[RPA] Starting submission workflow for paper: ${paperId}`);

    if (!connectionDetails) {
      return { status: 'error', message: 'No connection details provided', stepsCompleted: [] };
    }

    const submissionPayload: SubmissionPayload = {
      title: payload?.title || 'Untitled Paper',
      abstract: payload?.abstract || '',
      content: payload?.content || '',
      keywords: payload?.keywords || [],
      authors: payload?.authors || [],
      articleType: payload?.articleType || 'Research Article',
      publishMode: payload?.publishMode || 'draft',
      attachments: payload?.attachments || [],
    };

    const config: NavigatorConfig = {
      siteUrl: connectionDetails.siteUrl,
      username: connectionDetails.username,
      password: connectionDetails.password,
      paperId,
      submissionPayload,
    };

    const navigator = new GenericNavigator(page, config);

    await navigator.login();
    await navigator.navigateToNewSubmission();
    await navigator.fillForm();
    await navigator.uploadFiles();

    return await navigator.submit();

  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown RPA error',
      stepsCompleted: [],
    };
  } finally {
    await browser.close();
  }
}
