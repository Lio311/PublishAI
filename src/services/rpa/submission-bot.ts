import { chromium, BrowserContextOptions } from 'playwright';
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
  payload?: Partial<SubmissionPayload>,
  savedStorageState?: string
): Promise<WorkflowResult> {
  const browser = await chromium.launch({ headless: true });
  
  const contextOptions: BrowserContextOptions = {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  };

  if (savedStorageState) {
    try {
      contextOptions.storageState = JSON.parse(savedStorageState);
      console.log(`[RPA] Restored browser storage state for resume.`);
    } catch (e) {
      console.warn(`[RPA] Failed to parse saved storage state, starting fresh.`);
    }
  }

  const context = await browser.newContext(contextOptions);

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

    // If resuming from state, maybe skip login if cookies exist.
    // However, we rely on steps completed to know where to jump.
    // For now, run sequentially, and navigator steps should check if already on the right page.
    await navigator.login();
    await navigator.navigateToNewSubmission();
    await navigator.fillForm();
    await navigator.uploadFiles();

    const result = await navigator.submit();

    // If intervention is required, capture the session state before the browser closes
    if (result.status === 'requires_2fa' || result.status === 'requires_captcha') {
      const state = await context.storageState();
      result.storageState = JSON.stringify(state);
    }

    return result;

  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown RPA error',
      stepsCompleted: [],
    };
  } finally {
    // Browser closes cleanly, but session is preserved in storageState if needed
    await browser.close();
  }
}
