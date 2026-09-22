import { Page } from 'playwright';
import { ScreenshotManager } from '../screenshot-manager';
import { WorkflowResult, NavigatorConfig } from '../types';

export abstract class BaseNavigator {
  protected page: Page;
  protected config: NavigatorConfig;
  protected screenshots: ScreenshotManager;
  protected stepsCompleted: string[] = [];

  constructor(page: Page, config: NavigatorConfig) {
    this.page = page;
    this.config = config;
    this.screenshots = new ScreenshotManager();
  }

  abstract login(): Promise<void>;
  abstract navigateToNewSubmission(): Promise<void>;
  abstract fillForm(): Promise<void>;
  abstract uploadFiles(): Promise<void>;
  abstract submit(): Promise<WorkflowResult>;

  protected markStep(step: string) {
    this.stepsCompleted.push(step);
  }

  protected async detectCaptcha(): Promise<boolean> {
    const captchaSelectors = [
      'iframe[src*="recaptcha"]',
      'iframe[src*="hcaptcha"]',
      '.cf-turnstile',
      '#captcha',
      '[data-captcha]',
    ];
    for (const sel of captchaSelectors) {
      if (await this.page.$(sel)) return true;
    }
    return false;
  }

  protected async detect2FA(): Promise<boolean> {
    const twoFASelectors = [
      'input[name*="otp"]',
      'input[name*="2fa"]',
      'input[name*="verification"]',
      'input[placeholder*="code"]',
    ];
    for (const sel of twoFASelectors) {
      if (await this.page.$(sel)) return true;
    }
    return false;
  }
}
