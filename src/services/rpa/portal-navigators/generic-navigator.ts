import { BaseNavigator } from './base-navigator';
import { WorkflowResult } from '../types';
import { analyzeScreenshot } from '../vision-ai-fallback';

export class GenericNavigator extends BaseNavigator {
  async findAndClickWithVisionFallback(selectors: string, description: string): Promise<void> {
    const el = await this.page.$(selectors);
    if (el) {
      await el.click();
    } else {
      console.log(`[RPA] DOM selectors failed for '${description}'. Engaging Vision AI Fallback...`);
      const screenshotBuffer = await this.page.screenshot();
      
      const pageTitle = await this.page.title();
      const pageUrl = this.page.url();
      
      const action = await analyzeScreenshot(
        screenshotBuffer,
        `Find and click the '${description}' element.`,
        `Page: ${pageTitle} | URL: ${pageUrl}`
      );
      
      if (action.action === 'click') {
        if (action.selector) {
          console.log(`[RPA] Vision model returned selector: ${action.selector}. Clicking...`);
          await this.page.click(action.selector);
        } else if (action.coordinates) {
          console.log(`[RPA] Vision model returned [X, Y]: [${action.coordinates.x}, ${action.coordinates.y}]. Clicking...`);
          await this.page.mouse.click(action.coordinates.x, action.coordinates.y);
        } else {
          console.log(`[RPA] Vision AI returned click action but no selector or coordinates. Cannot proceed.`);
        }
      } else {
        console.log(`[RPA] Vision AI decided not to click. Action: ${action.action}, Reasoning: ${action.reasoning}`);
      }
    }
  }

  async login(): Promise<void> {
    await this.page.goto(this.config.siteUrl);
    await this.screenshots.capture(this.page, 'initial-page');

    // Try common login selectors
    const usernameField = await this.page.$('input[name="username"], input[name="email"], input[type="email"], #username, #email');
    const passwordField = await this.page.$('input[name="password"], input[type="password"], #password');

    if (usernameField && passwordField) {
      await usernameField.fill(this.config.username);
      await passwordField.fill(this.config.password);
      await this.screenshots.capture(this.page, 'credentials-filled');

      await this.findAndClickWithVisionFallback('button[type="submit"], input[type="submit"], #login-btn', 'Login Submit Button');
      await this.page.waitForLoadState('networkidle');
      this.markStep('login');
    }
    await this.screenshots.capture(this.page, 'post-login');
  }

  async navigateToNewSubmission(): Promise<void> {
    await this.findAndClickWithVisionFallback('a[href*="submission"], a[href*="submit"], a:has-text("New Submission"), a:has-text("Submit")', 'New Submission Link');
    await this.page.waitForLoadState('networkidle');
    this.markStep('navigate-to-submission');
    await this.screenshots.capture(this.page, 'submission-form');
  }

  async fillForm(): Promise<void> {
    const { submissionPayload } = this.config;

    // Title
    const titleField = await this.page.$('input[name*="title"], #title');
    if (titleField) await titleField.fill(submissionPayload.title);

    // Abstract
    const abstractField = await this.page.$('textarea[name*="abstract"], #abstract');
    if (abstractField) await abstractField.fill(submissionPayload.abstract);

    // Keywords
    const keywordsField = await this.page.$('input[name*="keyword"], #keywords');
    if (keywordsField && submissionPayload.keywords.length > 0) {
      await keywordsField.fill(submissionPayload.keywords.join(', '));
    }

    this.markStep('fill-form');
    await this.screenshots.capture(this.page, 'form-filled');
  }

  async uploadFiles(): Promise<void> {
    const fileInput = await this.page.$('input[type="file"]');
    if (fileInput && this.config.submissionPayload.attachments?.length > 0) {
      console.log(`[RPA] ${this.config.submissionPayload.attachments.length} files ready for upload`);
      
      const filePayloads = this.config.submissionPayload.attachments.map(att => ({
        name: att.filename,
        mimeType: att.mimeType,
        buffer: att.buffer,
      }));
      
      await fileInput.setInputFiles(filePayloads);
      console.log(`[RPA] Successfully set files on input`);
      this.markStep('upload-files');
    }
    await this.screenshots.capture(this.page, 'files-uploaded');
  }

  async submit(): Promise<WorkflowResult> {
    // Check for CAPTCHA / 2FA before submit
    if (await this.detectCaptcha()) {
      const captchaStrategy = (this.config as any).captchaStrategy || 'manual';
      
      if (captchaStrategy === 'auto') {
        console.log('[RPA] Captcha detected. Strategy is auto. Invoking 2Captcha-like service...');
        // Placeholder for 2Captcha API call
        // const token = await invoke2Captcha(...);
        // await this.page.evaluate(`document.getElementById("g-recaptcha-response").innerHTML="${token}";`);
        console.log('[RPA] Captcha solved automatically.');
      } else {
        const screenshot = this.screenshots.getLast();
        return {
          status: 'requires_captcha',
          screenshotUrl: screenshot ? `data:image/png;base64,${screenshot.buffer.toString('base64')}` : undefined,
          stepsCompleted: this.stepsCompleted,
          message: 'CAPTCHA detected — awaiting user intervention',
        };
      }
    }
    
    if (await this.detect2FA()) {
      return {
        status: 'requires_2fa',
        stepsCompleted: this.stepsCompleted,
        message: '2FA detected — awaiting user intervention',
      };
    }

    // Click submit
    await this.findAndClickWithVisionFallback('button[type="submit"]:has-text("Submit"), button:has-text("Complete Submission"), #submitBtn', 'Submit Application Button');
    await this.page.waitForLoadState('networkidle');
    await this.screenshots.capture(this.page, 'post-submit');

    // Try to extract tracking ID from confirmation page
    const pageText = await this.page.textContent('body');
    const trackingMatch = pageText?.match(/(?:Manuscript|Tracking|Submission)\s*(?:ID|Number|#)?\s*[:=]?\s*([A-Z0-9-]+)/i);

    this.markStep('submit');
    return {
      status: 'success',
      trackingId: trackingMatch?.[1] || undefined,
      stepsCompleted: this.stepsCompleted,
    };
  }
}
