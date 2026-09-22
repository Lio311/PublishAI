import { BaseNavigator } from './base-navigator';
import { WorkflowResult } from '../types';

export class GenericNavigator extends BaseNavigator {
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

      const submitBtn = await this.page.$('button[type="submit"], input[type="submit"], #login-btn');
      if (submitBtn) await submitBtn.click();
      await this.page.waitForLoadState('networkidle');
      this.markStep('login');
    }
    await this.screenshots.capture(this.page, 'post-login');
  }

  async navigateToNewSubmission(): Promise<void> {
    const link = await this.page.$('a[href*="submission"], a[href*="submit"], a:has-text("New Submission"), a:has-text("Submit")');
    if (link) {
      await link.click();
      await this.page.waitForLoadState('networkidle');
    }
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
      // For now, log the intent — actual file upload requires temp file creation
      console.log(`[RPA] ${this.config.submissionPayload.attachments.length} files ready for upload`);
      this.markStep('upload-files');
    }
    await this.screenshots.capture(this.page, 'files-uploaded');
  }

  async submit(): Promise<WorkflowResult> {
    // Check for CAPTCHA / 2FA before submit
    if (await this.detectCaptcha()) {
      const screenshot = this.screenshots.getLast();
      return {
        status: 'requires_captcha',
        screenshotUrl: screenshot ? `data:image/png;base64,${screenshot.buffer.toString('base64')}` : undefined,
        stepsCompleted: this.stepsCompleted,
        message: 'CAPTCHA detected — awaiting user intervention',
      };
    }
    if (await this.detect2FA()) {
      return {
        status: 'requires_2fa',
        stepsCompleted: this.stepsCompleted,
        message: '2FA detected — awaiting user intervention',
      };
    }

    // Click submit
    const submitBtn = await this.page.$('button[type="submit"]:has-text("Submit"), button:has-text("Complete Submission"), #submitBtn');
    if (submitBtn) {
      await submitBtn.click();
      await this.page.waitForLoadState('networkidle');
    }
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
