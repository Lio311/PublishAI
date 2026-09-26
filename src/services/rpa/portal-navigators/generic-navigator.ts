import { BaseNavigator } from './base-navigator';
import { WorkflowResult } from '../types';
import { analyzeScreenshot } from '../vision-ai-fallback';

export class GenericNavigator extends BaseNavigator {
  /**
   * Attempts to locate and click an element via DOM selectors.
   * If DOM selectors fail, engages Vision AI fallback.
   * Returns true if the element was successfully clicked, false otherwise.
   */
  async findAndClickWithVisionFallback(selectors: string, description: string): Promise<boolean> {
    if (!this.page || (typeof this.page.isClosed === 'function' && this.page.isClosed())) {
      console.warn(`[RPA] Cannot click '${description}': Page is closed.`);
      return false;
    }

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
        // Capture through ScreenshotManager to prevent memory leaks and respect max limit
        const screenshotBuffer = await this.screenshots.capture(this.page, `vision-${description}`);
        if (!screenshotBuffer || screenshotBuffer.length === 0) {
          console.warn(`[RPA] Failed to obtain screenshot for Vision AI fallback on '${description}'.`);
          return false;
        }

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
              console.warn(`[RPA] Vision selector '${action.selector}' failed, trying coordinates if present:`, selErr);
              if (action.coordinates) {
                try {
                  await this.page.mouse.click(action.coordinates.x, action.coordinates.y);
                  clicked = true;
                } catch (coordErr) {
                  console.warn(`[RPA] Vision coordinates click failed:`, coordErr);
                }
              }
            }
          } else if (action.coordinates) {
            console.log(`[RPA] Vision model returned [X, Y]: [${action.coordinates.x}, ${action.coordinates.y}]. Clicking...`);
            try {
              await this.page.mouse.click(action.coordinates.x, action.coordinates.y);
              clicked = true;
            } catch (coordErr) {
              console.warn(`[RPA] Vision coordinates click failed:`, coordErr);
            }
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

    return clicked;
  }

  async applyCaptchaSolution(solution: string): Promise<boolean> {
    if (!this.page || (typeof this.page.isClosed === 'function' && this.page.isClosed())) {
      return false;
    }

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

      // Also inspect frames if the response element is embedded
      const frames = this.page.frames();
      for (const frame of frames) {
        try {
          await frame.evaluate((sol) => {
            const el = document.getElementById('g-recaptcha-response') || document.querySelector('[name="g-recaptcha-response"]');
            if (el) {
              (el as HTMLTextAreaElement).value = sol;
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }, solution).catch(() => {});
        } catch {
          // Ignore cross-origin frame access errors
        }
      }

      console.log('[RPA] Successfully applied CAPTCHA solution to DOM.');
      return true;
    } catch (err) {
      console.warn('[RPA] Failed to apply CAPTCHA solution:', err);
      return false;
    }
  }

  async enter2FACode(code: string): Promise<boolean> {
    if (!this.page || (typeof this.page.isClosed === 'function' && this.page.isClosed())) {
      return false;
    }

    try {
      // 1. Single unified 2FA/OTP code input
      const twoFALoc = this.page.locator(
        'input[name*="otp" i], input[name*="2fa" i], input[name*="verification" i], input[name*="securityCode" i], input[name*="totp" i], input[placeholder*="code" i], input[autocomplete="one-time-code"]'
      ).first();

      if ((await twoFALoc.count()) > 0 && (await twoFALoc.isVisible().catch(() => true))) {
        await twoFALoc.fill(code);
        const submitLoc = this.page.locator('button[type="submit"], button:has-text("Verify"), button:has-text("Submit"), button:has-text("Confirm")').first();
        if ((await submitLoc.count()) > 0) {
          await submitLoc.click({ timeout: 5000 }).catch(() => {});
        } else {
          await twoFALoc.press('Enter').catch(() => {});
        }
        await this.page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
        return true;
      }

      // 2. Multi-digit inputs (e.g. 6 individual boxes for digits)
      const digitInputs = this.page.locator('input[maxlength="1"], input.digit-input, input.otp-digit');
      const digitCount = await digitInputs.count().catch(() => 0);
      if (digitCount >= code.length && code.length > 0) {
        for (let i = 0; i < code.length; i++) {
          await digitInputs.nth(i).fill(code[i]).catch(() => {});
        }
        const submitLoc = this.page.locator('button[type="submit"], button:has-text("Verify"), button:has-text("Submit")').first();
        if ((await submitLoc.count()) > 0) {
          await submitLoc.click({ timeout: 5000 }).catch(() => {});
        }
        await this.page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
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

    this.setState('currentStep', 'login');

    try {
      await this.page.goto(this.config.siteUrl, {
        waitUntil: 'domcontentloaded',
        timeout: this.config.navigationTimeout || 30000,
      });
    } catch (navError) {
      console.warn(`[RPA] Direct navigation had issues:`, navError instanceof Error ? navError.message : navError);
      // If page is completely unusable or closed, rethrow
      if (!this.page || (typeof this.page.isClosed === 'function' && this.page.isClosed())) {
        throw new Error(`Navigation failed: ${navError instanceof Error ? navError.message : String(navError)}`);
      }
    }

    await this.screenshots.capture(this.page, 'initial-page');

    // Check for an active session (e.g. restored via cookies / storageState)
    const loggedInLoc = this.page.locator(
      'a[href*="logout" i], a[href*="signout" i], button:has-text("Sign Out"), button:has-text("Log Out"), [data-testid*="user-menu"], .user-avatar, #user-profile'
    ).first();
    const isLoggedIn = (await loggedInLoc.count().catch(() => 0)) > 0 && (await loggedInLoc.isVisible().catch(() => false));

    if (isLoggedIn) {
      console.log('[RPA] Active session confirmed via logged-in UI indicator.');
      this.markStep('login');
      this.setState('loginStatus', 'restored_session');
      await this.screenshots.capture(this.page, 'post-login-restored');
      return;
    }

    // Check if session was already restored via savedStorageState without explicit login form
    let usernameLoc = this.page.locator('input[name="username"], input[name="email"], input[type="email"], #username, #email').first();
    let passwordLoc = this.page.locator('input[name="password"], input[type="password"], #password').first();

    let hasUsername = (await usernameLoc.count().catch(() => 0)) > 0;
    let hasPassword = (await passwordLoc.count().catch(() => 0)) > 0;

    if (!hasUsername && !hasPassword && this.config.storageState) {
      console.log('[RPA] Session restored from storageState. Login fields not present — assumed logged in.');
      this.markStep('login');
      this.setState('loginStatus', 'storage_state_assumed');
      await this.screenshots.capture(this.page, 'post-login-restored');
      return;
    }

    // If login fields are not visible on the homepage, check for a "Sign In" or "Log In" button/link
    if (!hasUsername && !hasPassword) {
      console.log('[RPA] Login inputs not on homepage. Checking for "Sign In" / "Log In" navigation links...');
      const navigatedToLogin = await this.findAndClickWithVisionFallback(
        'a:has-text("Sign In"), a:has-text("Log In"), a:has-text("Login"), button:has-text("Sign In"), button:has-text("Log In"), a[href*="login" i], a[href*="signin" i]',
        'Sign In Navigation Link'
      );

      if (navigatedToLogin) {
        await this.page.waitForLoadState('domcontentloaded', { timeout: 8000 }).catch(() => {});
        usernameLoc = this.page.locator('input[name="username"], input[name="email"], input[type="email"], #username, #email').first();
        passwordLoc = this.page.locator('input[name="password"], input[type="password"], #password').first();
        hasUsername = (await usernameLoc.count().catch(() => 0)) > 0;
        hasPassword = (await passwordLoc.count().catch(() => 0)) > 0;
      }
    }

    if (hasUsername && hasPassword) {
      try {
        await usernameLoc.fill(this.config.username);
      } catch (userErr) {
        console.warn('[RPA] Failed to fill username locator:', userErr);
      }

      try {
        await passwordLoc.fill(this.config.password);
      } catch (passErr) {
        console.warn('[RPA] Failed to fill password locator:', passErr);
      }

      await this.screenshots.capture(this.page, 'credentials-filled');

      await this.findAndClickWithVisionFallback('button[type="submit"], input[type="submit"], #login-btn, button:has-text("Sign in"), button:has-text("Log In")', 'Login Submit Button');
      await this.page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});

      // Check if credentials failed (e.g., error alert displayed)
      const pageError = await this.detectPageErrors();
      if (pageError && (pageError.toLowerCase().includes('invalid') || pageError.toLowerCase().includes('incorrect') || pageError.toLowerCase().includes('failed'))) {
        throw new Error(`Portal login failed with message: "${pageError}"`);
      }

      this.markStep('login');
      this.setState('loginStatus', 'form_submitted');
    } else {
      // Check if page showed an error
      const pageError = await this.detectPageErrors();
      if (pageError) {
        throw new Error(`Portal returned error during initial navigation: "${pageError}"`);
      }
      // If no credentials needed and no error, mark completed
      this.markStep('login');
      this.setState('loginStatus', 'bypassed_or_not_required');
    }

    await this.screenshots.capture(this.page, 'post-login');
  }

  async navigateToNewSubmission(): Promise<void> {
    if (this.isStepCompleted('navigate-to-submission')) {
      console.log('[RPA] Step "navigate-to-submission" already completed. Skipping.');
      return;
    }

    this.setState('currentStep', 'navigate-to-submission');

    // Check if we are already on the submission page
    const currentUrl = this.page.url().toLowerCase();
    const isAlreadyOnSubmissionPage = currentUrl.includes('/submission') || currentUrl.includes('/submit') || currentUrl.includes('/new');
    
    if (!isAlreadyOnSubmissionPage) {
      const clicked = await this.findAndClickWithVisionFallback(
        'a[href*="submission" i], a[href*="submit" i], a:has-text("New Submission"), a:has-text("Submit"), button:has-text("New Submission"), button:has-text("Submit Manuscript")',
        'New Submission Link'
      );
      if (!clicked) {
        console.warn('[RPA] Could not find submission link; checking if already on submission form.');
      }
      await this.page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    }

    this.markStep('navigate-to-submission');
    await this.screenshots.capture(this.page, 'submission-form');
  }

  async fillForm(): Promise<void> {
    if (this.isStepCompleted('fill-form')) {
      console.log('[RPA] Step "fill-form" already completed. Skipping.');
      return;
    }

    this.setState('currentStep', 'fill-form');
    const { submissionPayload } = this.config;
    const filledFields: string[] = [];

    // Title
    try {
      const titleLoc = this.page.locator('input[name*="title" i], #title, input[placeholder*="title" i], [aria-label*="title" i]').first();
      if ((await titleLoc.count().catch(() => 0)) > 0) {
        await titleLoc.fill(submissionPayload.title || '');
        filledFields.push('title');
      }
    } catch (err) {
      console.warn('[RPA] Failed to fill title:', err);
    }

    // Abstract
    try {
      const abstractLoc = this.page.locator('textarea[name*="abstract" i], #abstract, textarea[placeholder*="abstract" i], [aria-label*="abstract" i]').first();
      if ((await abstractLoc.count().catch(() => 0)) > 0) {
        await abstractLoc.fill(submissionPayload.abstract || '');
        filledFields.push('abstract');
      } else {
        // Fallback for contenteditable rich text editors
        const richEditorLoc = this.page.locator('div[contenteditable="true"][aria-label*="abstract" i], .note-editable, .tox-edit-area iframe').first();
        if ((await richEditorLoc.count().catch(() => 0)) > 0) {
          await richEditorLoc.fill(submissionPayload.abstract || '').catch(() => {});
          filledFields.push('abstract_rich');
        }
      }
    } catch (err) {
      console.warn('[RPA] Failed to fill abstract:', err);
    }

    // Keywords
    try {
      const keywordsLoc = this.page.locator('input[name*="keyword" i], #keywords, input[placeholder*="keyword" i]').first();
      if ((await keywordsLoc.count().catch(() => 0)) > 0 && submissionPayload.keywords && submissionPayload.keywords.length > 0) {
        await keywordsLoc.fill(submissionPayload.keywords.join(', '));
        filledFields.push('keywords');
      }
    } catch (err) {
      console.warn('[RPA] Failed to fill keywords:', err);
    }

    // Article Type / Category
    if (submissionPayload.articleType) {
      try {
        const typeLoc = this.page.locator('select[name*="type" i], select[name*="category" i], #articleType, #article_type').first();
        if ((await typeLoc.count().catch(() => 0)) > 0) {
          await typeLoc.selectOption({ label: submissionPayload.articleType }).catch(async () => {
            await typeLoc.selectOption({ value: submissionPayload.articleType }).catch(() => {});
          });
          filledFields.push('articleType');
        }
      } catch (err) {
        console.warn('[RPA] Failed to select article type:', err);
      }
    }

    // Authors
    if (submissionPayload.authors && submissionPayload.authors.length > 0) {
      try {
        const authorLoc = this.page.locator('input[name*="author" i], #authors, input[placeholder*="author" i]').first();
        if ((await authorLoc.count().catch(() => 0)) > 0) {
          const authorNames = submissionPayload.authors.map((a) => (typeof a === 'string' ? a : a.name)).join(', ');
          await authorLoc.fill(authorNames);
          filledFields.push('authors');
        }
      } catch (err) {
        console.warn('[RPA] Failed to fill authors:', err);
      }
    }

    this.setState('filledFields', filledFields);
    this.markStep('fill-form');
    await this.screenshots.capture(this.page, 'form-filled');
  }

  async uploadFiles(): Promise<void> {
    if (this.isStepCompleted('upload-files')) {
      console.log('[RPA] Step "upload-files" already completed. Skipping.');
      return;
    }

    this.setState('currentStep', 'upload-files');

    const fileLoc = this.page.locator('input[type="file"]').first();
    const hasFileInput = (await fileLoc.count().catch(() => 0)) > 0;

    if (hasFileInput && this.config.submissionPayload.attachments && this.config.submissionPayload.attachments.length > 0) {
      console.log(`[RPA] ${this.config.submissionPayload.attachments.length} files ready for upload`);

      try {
        const filePayloads = this.config.submissionPayload.attachments.map((att) => {
          let buf: Buffer;
          const rawBuf = att.buffer as unknown;
          if (Buffer.isBuffer(rawBuf)) {
            buf = rawBuf;
          } else if (typeof rawBuf === 'string') {
            const isDataUrl = rawBuf.startsWith('data:');
            const cleanStr = isDataUrl ? rawBuf.replace(/^data:[^;]+;base64,/, '') : rawBuf;
            buf = Buffer.from(cleanStr, isDataUrl ? 'base64' : 'utf-8');
          } else if (rawBuf && typeof rawBuf === 'object' && (rawBuf as any).type === 'Buffer' && Array.isArray((rawBuf as any).data)) {
            buf = Buffer.from((rawBuf as any).data);
          } else {
            buf = Buffer.from((rawBuf as any) || '');
          }
          return {
            name: att.filename,
            mimeType: att.mimeType,
            buffer: buf,
          };
        });

        await fileLoc.setInputFiles(filePayloads);
        this.setState('uploadedFiles', filePayloads.map((f) => f.name));
        console.log(`[RPA] Successfully set files on input`);
        this.markStep('upload-files');
      } catch (uploadErr) {
        console.warn('[RPA] Error setting files on input:', uploadErr);
      }
    } else {
      console.log('[RPA] No file attachments to upload or file input not present.');
      this.markStep('upload-files');
    }

    await this.screenshots.capture(this.page, 'files-uploaded');
  }

  async submit(): Promise<WorkflowResult> {
    this.setState('currentStep', 'submit');

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
    const submitted = await this.findAndClickWithVisionFallback(
      'button[type="submit"]:has-text("Submit"), button:has-text("Complete Submission"), #submitBtn, input[type="submit"][value*="Submit" i]',
      'Submit Application Button'
    );

    if (!submitted) {
      console.warn('[RPA] Could not locate or click submission button.');
      return {
        status: 'error',
        message: 'Could not locate or click submission button on the page.',
        stepsCompleted: this.getStepsCompleted(),
        stateData: this.getAllState(),
        screenshotUrl: this.screenshots.getLastDataUrl(),
      };
    }

    await this.page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    await this.screenshots.capture(this.page, 'post-submit');

    // Post-submit intervention check (e.g. CAPTCHA or 2FA triggered on submit)
    const postIntervention = await this.checkIntervention();
    if (postIntervention) {
      return postIntervention;
    }

    // Check if portal displayed a submission validation error
    const pageError = await this.detectPageErrors();
    if (pageError) {
      return {
        status: 'error',
        message: `Submission was rejected by portal: ${pageError}`,
        stepsCompleted: this.getStepsCompleted(),
        stateData: this.getAllState(),
        screenshotUrl: this.screenshots.getLastDataUrl(),
      };
    }

    // Try to extract tracking ID from confirmation page
    let trackingId: string | undefined;
    try {
      const pageText = await this.page.textContent('body', { timeout: 5000 });
      const trackingMatch = pageText?.match(/(?:Manuscript|Tracking|Submission)\s*(?:ID|Number|#)?\s*[:=]?\s*([A-Z0-9-]+)/i);
      trackingId = trackingMatch?.[1];
    } catch (textErr) {
      console.warn('[RPA] Failed to extract confirmation text:', textErr);
    }

    this.markStep('submit');
    this.setState('trackingId', trackingId);

    return {
      status: 'success',
      trackingId,
      stepsCompleted: this.getStepsCompleted(),
      stateData: this.getAllState(),
      screenshotUrl: this.screenshots.getLastDataUrl(),
    };
  }
}
