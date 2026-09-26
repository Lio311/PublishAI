import { chromium, Browser, BrowserContext, Page, BrowserContextOptions } from 'playwright';
import { GenericNavigator } from './portal-navigators/generic-navigator';
import { WorkflowResult, NavigatorConfig } from './types';
import { SubmissionPayload } from '@/services/submission/connection-types';

export type { WorkflowResult };

export interface ConnectionDetails {
  siteUrl: string;
  username: string;
  password: string;
  captchaSolution?: string;
  twoFACode?: string;
  storageState?: string;
  captchaStrategy?: 'manual' | 'auto';
  resumedSteps?: string[];
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
  let browser: Browser | null = null;
  let context: BrowserContext | null = null;
  let page: Page | null = null;
  let navigator: GenericNavigator | null = null;

  try {
    if (!connectionDetails) {
      return { status: 'error', message: 'No connection details provided', stepsCompleted: [] };
    }

    // Launch Chromium with flags that prevent shared memory leaks and container OOM crashes
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-extensions',
        '--disable-sync',
        '--mute-audio',
      ],
    });

    const contextOptions: BrowserContextOptions = {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
    };

    const effectiveStorageState = savedStorageState || connectionDetails.storageState;
    if (effectiveStorageState) {
      try {
        contextOptions.storageState = typeof effectiveStorageState === 'string'
          ? JSON.parse(effectiveStorageState)
          : effectiveStorageState;
        console.log(`[RPA] Restored browser storage state for resume.`);
      } catch (e) {
        console.warn(`[RPA] Failed to parse saved storage state, starting fresh.`);
      }
    }

    context = await browser.newContext(contextOptions);
    page = await context.newPage();
    console.log(`[RPA] Starting submission workflow for paper: ${paperId}`);

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
      captchaStrategy: connectionDetails.captchaStrategy,
      captchaSolution: connectionDetails.captchaSolution,
      twoFACode: connectionDetails.twoFACode,
      storageState: effectiveStorageState,
      resumedSteps: connectionDetails.resumedSteps,
    };

    navigator = new GenericNavigator(page, config);

    // Step 1: Login
    await navigator.login();
    let intervention = await navigator.checkIntervention();
    if (intervention) {
      const state = await context.storageState().catch(() => undefined);
      if (state) intervention.storageState = JSON.stringify(state);
      return intervention;
    }

    // Step 2: Navigate to submission
    await navigator.navigateToNewSubmission();
    intervention = await navigator.checkIntervention();
    if (intervention) {
      const state = await context.storageState().catch(() => undefined);
      if (state) intervention.storageState = JSON.stringify(state);
      return intervention;
    }

    // Step 3: Fill form
    await navigator.fillForm();
    intervention = await navigator.checkIntervention();
    if (intervention) {
      const state = await context.storageState().catch(() => undefined);
      if (state) intervention.storageState = JSON.stringify(state);
      return intervention;
    }

    // Step 4: Upload files
    await navigator.uploadFiles();
    intervention = await navigator.checkIntervention();
    if (intervention) {
      const state = await context.storageState().catch(() => undefined);
      if (state) intervention.storageState = JSON.stringify(state);
      return intervention;
    }

    // Step 5: Submit
    const result = await navigator.submit();

    // Preserve storageState on intervention or success for state continuity
    if (result.status === 'requires_2fa' || result.status === 'requires_captcha' || result.status === 'success') {
      try {
        const state = await context.storageState();
        result.storageState = JSON.stringify(state);
      } catch (stateErr) {
        console.warn(`[RPA] Failed to serialize final storageState:`, stateErr);
      }
    }

    return result;

  } catch (error) {
    let capturedState: string | undefined;
    if (context) {
      try {
        const state = await context.storageState();
        capturedState = JSON.stringify(state);
      } catch {
        // Ignore errors during emergency state capture
      }
    }

    const stepsCompleted = navigator ? navigator.getStepsCompleted() : [];
    console.error(`[RPA] Workflow error for paper ${paperId}:`, error);

    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown RPA error',
      errorLog: error instanceof Error ? error.stack || error.message : String(error),
      stepsCompleted,
      storageState: capturedState,
    };
  } finally {
    // Clean up navigator memory (screenshot buffers)
    if (navigator) {
      navigator.dispose();
    }
    // Clean up page, context, and browser to avoid zombie Chromium processes
    if (page) {
      await page.close().catch(() => {});
    }
    if (context) {
      await context.close().catch(() => {});
    }
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

