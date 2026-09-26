import { BaseNavigator } from './base-navigator';
import { WorkflowResult } from '../types';
import { analyzeScreenshot } from '../vision-ai-fallback';

export class GenericNavigator extends BaseNavigator {
  async findAndClickWithVisionFallback(selectors: string, description: string): Promise<void> {
    let clicked = false;

    // Use Locator instead of ElementHandle to prevent Chromium heap memory leaks
    try {
      const loc = this.page.locator(selectors).first();
      if ((await loc.count()) > 0 && (await loc.isVisible().catch(() => true))) {
        await loc.click({ timeout: 5000 });
        clicked = true;
      }
    } catch (err) {
      console.warn(`[RPA] DOM selector click failed for '${description}':`, err instanceof Error ? err.message : err);
    }

    if (!clicked) {
      console.log(`[RPA] DOM selectors failed for '${description}'. Engaging Vision AI Fallback...`);
      try {
        const screenshotBuffer = await this.page.screenshot({ fullPage: false, timeout: 5000 });
        const pageTitle = await this.page.title().catch(() => '');
        const pageUrl = this.page.url();

        const action = await analyzeScreenshot(
          screenshotBuffer,
          `Find and click the '${description}' element.`,
          `Page: ${pageTitle} | URL: ${pageUrl}`
        );

        if (action.action === 'click') {
          if (action.selector) {
            console.log(`[RPA] Vision model returned selector: ${action.selector}. Clicking...`);
            try {
              await this.page.click(action.selector, { timeout: 5000 });
              clicked = true;
            } catch (selErr) {
              console.warn(`[RPA] Vision selector '${action.selector}' failed, trying coordinates if present.`);
              if (action.coordinates) {
                await this.page.mouse.click(action.coordinates.x, action.coordinates.y);
                clicked = true;
              }
            }
          } else if (action.coordinates) {
            console.log(`[RPA] Vision model returned [X, Y]: [${action.coordinates.x}, ${action.coordinates.y}]. Clicking...`);
            await this.page.mouse.click(action.coordinates.x, action.coordinates.y);
            clicked = true;
          } else {
            console.warn(`[RPA] Vision AI returned click action but no selector or coordinates. Cannot proceed.`);
          }
        } else {
          console.log(`[RPA] Vision AI decided not to click. Action: ${action.action}, Reasoning: ${action.reasoning}`);
        }
      } catch (visionErr) {
        console.warn(`[RPA] Vision AI fallback failed for '${description}':`, visionErr instanceof Error ? visionErr.message : visionErr);
      }
    }
  }

  async applyCaptchaSolution(solution: string): Promise<boolean> {
    try {
      await this.page.evaluate((sol) => {
        const elements = [
          document.getElementById('g-recaptcha-response'),
          document.querySelector('[name="g-recaptcha-response"]'),
          document.getElementById('h-captcha-response'),
          document.querySelector('[name="h-captcha-response"]'),
          document.querySelector('[name="cf-turnstile-response"]'),
        ];
        elements.forEach((el) => {
          if (el) {
            (el as HTMLTextAreaElement).value = sol;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      }, solution);
      console.log('[RPA] Successfully applied CAPTCHA solution to DOM.');
      return true;
    } catch (err) {
      console.warn('[RPA] Failed to apply CAPTCHA solution:', err);
      return false;
    }
  }

  async enter2FACode(code: string): Promise<boolean> {
    try {
      const twoFALoc = this.page.locator('input[name*="otp"], input[name*="2fa"], input[name*="verification"], input[placeholder*="code" i]').first();
      if ((await twoFALoc.count()) > 0) {
        await twoFALoc.fill(code);
        const submitLoc = this.page.locator('button[type="submit"], button:has-text("Verify"), button:has-text("Submit")').first();
        if ((await submitLoc.count()) > 0) {
          await submitLoc.click({ timeout: 5000 });
          await this.page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
        }
        return true;
      }
    } catch (err) {
      console.warn('[RPA] Failed to enter 2FA code:', err);
    }
    return false;
  }

  async login(): Promise<void> {
    if (this.isStepCompleted('login')) {
      console.log('[RPA] Step "login" already completed. Skipping.');
      return;
    }

    try {
      await this.page.goto(this.config.siteUrl, {
        waitUntil: 'domcontentloaded',
        timeout: this.config.navigationTimeout || 30000,
      });
    } catch (navError) {
      console.warn(`[RPA] Direct navigation had issues, continuing:`, navError instanceof Error ? navError.message : navError);
    }

    await this.screenshots.capture(this.page, 'initial-page');

    // Check if session was already restored via savedStorageState
    const usernameLoc = this.page.locator('input[name="username"], input[name="email"], input[type="email"], #username, #email').first();
    const passwordLoc = this.page.locator('input[name="password"], input[type="password"], #password').first();

    const hasUsername = (await usernameLoc.count().catch(() => 0)) > 0;
    const hasPassword = (await passwordLoc.count().catch(() => 0)) > 0;

    if (!hasUsername && !hasPassword && this.config.storageState) {
      console.log('[RPA] Session restored from storageState. Login fields not present — assumed logged in.');
      this.markStep('login');
      await this.screenshots.capture(this.page, 'post-login-restored');
      return;
    }

    if (hasUsername && hasPassword) {
      await usernameLoc.fill(this.config.username);
      await passwordLoc.fill(this.config.password);
      await this.screenshots.capture(this.page, 'credentials-filled');

      await this.findAndClickWithVisionFallback('button[type="submit"], input[type="submit"], #login-btn', 'Login Submit Button');
      await this.page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
      this.markStep('login');
    } else {
      // Login fields not found; might already be logged in
      this.markStep('login');
    }

    await this.screenshots.capture(this.page, 'post-login');
  }

  async navigateToNewSubmission(): Promise<void> {
    if (this.isStepCompleted('navigate-to-submission')) {
      console.log('[RPA] Step "navigate-to-submission" already completed. Skipping.');
      return;
    }

    await this.findAndClickWithVisionFallback(
      'a[href*="submission"], a[href*="submit"], a:has-text("New Submission"), a:has-text("Submit"), button:has-text("New Submission")',
      'New Submission Link'
    );
    await this.page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    this.markStep('navigate-to-submission');
    await this.screenshots.capture(this.page, 'submission-form');
  }

  async fillForm(): Promise<void> {
    if (this.isStepCompleted('fill-form')) {
      console.log('[RPA] Step "fill-form" already completed. Skipping.');
      return;
    }

    const { submissionPayload } = this.config;

    // Title
    const titleLoc = this.page.locator('input[name*="title"], #title').first();
    if ((await titleLoc.count().catch(() => 0)) > 0) {
      await titleLoc.fill(submissionPayload.title);
    }

    // Abstract
    const abstractLoc = this.page.locator('textarea[name*="abstract"], #abstract').first();
    if ((await abstractLoc.count().catch(() => 0)) > 0) {
      await abstractLoc.fill(submissionPayload.abstract);
    }

    // Keywords
    const keywordsLoc = this.page.locator('input[name*="keyword"], #keywords').first();
    if ((await keywordsLoc.count().catch(() => 0)) > 0 && submissionPayload.keywords?.length > 0) {
      await keywordsLoc.fill(submissionPayload.keywords.join(', '));
    }

    this.markStep('fill-form');
    await this.screenshots.capture(this.page, 'form-filled');
  }

  async uploadFiles(): Promise<void> {
    if (this.isStepCompleted('upload-files')) {
      console.log('[RPA] Step "upload-files" already completed. Skipping.');
      return;
    }

    const fileLoc = this.page.locator('input[type="file"]').first();
    const hasFileInput = (await fileLoc.count().catch(() => 0)) > 0;

    if (hasFileInput && this.config.submissionPayload.attachments?.length > 0) {
      console.log(`[RPA] ${this.config.submissionPayload.attachments.length} files ready for upload`);

      const filePayloads = this.config.submissionPayload.attachments.map((att) => {
        let buf: Buffer;
        if (Buffer.isBuffer(att.buffer)) {
          buf = att.buffer;
        } else if (typeof att.buffer === 'string') {
          buf = Buffer.from(att.buffer, (att.buffer as string).startsWith('data:') ? 'base64' : 'utf-8');
        } else if (att.buffer && (att.buffer as any).type === 'Buffer' && Array.isArray((att.buffer as any).data)) {
          buf = Buffer.from((att.buffer as any).data);
        } else {
          buf = Buffer.from(att.buffer || '');
        }
        return {
          name: att.filename,
          mimeType: att.mimeType,
          buffer: buf,
        };
      });

      await fileLoc.setInputFiles(filePayloads);
      console.log(`[RPA] Successfully set files on input`);
      this.markStep('upload-files');
    }
    await this.screenshots.capture(this.page, 'files-uploaded');
  }

  async submit(): Promise<WorkflowResult> {
    // Check if CAPTCHA solution was provided to inject
    if (this.config.captchaSolution) {
      await this.applyCaptchaSolution(this.config.captchaSolution);
    }

    // Check if 2FA code was provided to inject
    if (this.config.twoFACode) {
      await this.enter2FACode(this.config.twoFACode);
    }

    // Check for CAPTCHA / 2FA before submit
    const preIntervention = await this.checkIntervention();
    if (preIntervention) {
      if (preIntervention.status === 'requires_captcha' && this.config.captchaStrategy === 'auto') {
        console.log('[RPA] Captcha detected with auto strategy. Proceeding...');
      } else {
        return preIntervention;
      }
    }

    // Click submit
    await this.findAndClickWithVisionFallback(
      'button[type="submit"]:has-text("Submit"), button:has-text("Complete Submission"), #submitBtn, input[type="submit"][value*="Submit" i]',
      'Submit Application Button'
    );
    await this.page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    await this.screenshots.capture(this.page, 'post-submit');

    // Post-submit intervention check (e.g. CAPTCHA or 2FA triggered on submit)
    const postIntervention = await this.checkIntervention();
    if (postIntervention) {
      return postIntervention;
    }

    // Try to extract tracking ID from confirmation page
    let trackingId: string | undefined;
    try {
      const pageText = await this.page.textContent('body');
      const trackingMatch = pageText?.match(/(?:Manuscript|Tracking|Submission)\s*(?:ID|Number|#)?\s*[:=]?\s*([A-Z0-9-]+)/i);
      trackingId = trackingMatch?.[1];
    } catch (textErr) {
      console.warn('[RPA] Failed to extract confirmation text:', textErr);
    }

    this.markStep('submit');
    return {
      status: 'success',
      trackingId,
      stepsCompleted: this.getStepsCompleted(),
    };
  }
}

