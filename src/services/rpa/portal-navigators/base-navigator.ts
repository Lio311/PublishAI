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
    if (config.resumedSteps && Array.isArray(config.resumedSteps)) {
      this.stepsCompleted = [...config.resumedSteps];
    }
  }

  abstract login(): Promise<void>;
  abstract navigateToNewSubmission(): Promise<void>;
  abstract fillForm(): Promise<void>;
  abstract uploadFiles(): Promise<void>;
  abstract submit(): Promise<WorkflowResult>;

  public markStep(step: string): void {
    if (!this.stepsCompleted.includes(step)) {
      this.stepsCompleted.push(step);
    }
  }

  public getStepsCompleted(): string[] {
    return [...this.stepsCompleted];
  }

  public isStepCompleted(step: string): boolean {
    return this.stepsCompleted.includes(step);
  }

  public getScreenshots(): ScreenshotManager {
    return this.screenshots;
  }

  public async detectCaptcha(): Promise<boolean> {
    const captchaSelectors = [
      'iframe[src*="recaptcha"]',
      'iframe[src*="hcaptcha"]',
      '.cf-turnstile',
      '#captcha',
      '[data-captcha]',
      '.g-recaptcha',
      '.h-captcha',
    ];
    for (const sel of captchaSelectors) {
      try {
        const count = await this.page.locator(sel).count();
        if (count > 0) {
          const isVis = await this.page.locator(sel).first().isVisible().catch(() => true);
          if (isVis) return true;
        }
      } catch {
        // Page may be navigating or closed, ignore safely
      }
    }
    return false;
  }

  public async detect2FA(): Promise<boolean> {
    const twoFASelectors = [
      'input[name*="otp"]',
      'input[name*="2fa"]',
      'input[name*="verification"]',
      'input[placeholder*="code" i]',
      'input[name*="securityCode" i]',
      '#otp',
      '#twoFactorCode',
    ];
    for (const sel of twoFASelectors) {
      try {
        const count = await this.page.locator(sel).count();
        if (count > 0) {
          const isVis = await this.page.locator(sel).first().isVisible().catch(() => true);
          if (isVis) return true;
        }
      } catch {
        // Page may be navigating or closed, ignore safely
      }
    }
    return false;
  }

  /**
   * Checks if the portal currently requires human intervention (CAPTCHA or 2FA).
   * Returns a WorkflowResult if intervention is needed, or null if execution can proceed.
   */
  public async checkIntervention(): Promise<WorkflowResult | null> {
    try {
      if (await this.detectCaptcha()) {
        const screenshot = this.screenshots.getLast();
        return {
          status: 'requires_captcha',
          screenshotUrl: screenshot && screenshot.buffer.length > 0
            ? `data:image/png;base64,${screenshot.buffer.toString('base64')}`
            : undefined,
          stepsCompleted: this.getStepsCompleted(),
          message: 'CAPTCHA detected — awaiting user intervention',
        };
      }

      if (await this.detect2FA()) {
        const screenshot = this.screenshots.getLast();
        return {
          status: 'requires_2fa',
          screenshotUrl: screenshot && screenshot.buffer.length > 0
            ? `data:image/png;base64,${screenshot.buffer.toString('base64')}`
            : undefined,
          stepsCompleted: this.getStepsCompleted(),
          message: '2FA detected — awaiting user intervention',
        };
      }
    } catch (error) {
      console.warn('[RPA] Error during intervention check:', error instanceof Error ? error.message : error);
    }
    return null;
  }

  /**
   * Cleans up navigator resources such as in-memory screenshots.
   */
  public dispose(): void {
    this.screenshots.dispose();
  }
}

