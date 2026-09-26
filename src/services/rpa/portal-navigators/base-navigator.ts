import { Page } from 'playwright';
import { ScreenshotManager } from '../screenshot-manager';
import { WorkflowResult, NavigatorConfig } from '../types';

export abstract class BaseNavigator {
  protected page: Page;
  protected config: NavigatorConfig;
  protected screenshots: ScreenshotManager;
  protected stepsCompleted: string[] = [];

  protected stateData: Record<string, unknown> = {};

  constructor(page: Page, config: NavigatorConfig) {
    this.page = page;
    this.config = config;
    this.screenshots = new ScreenshotManager();
    if (config.resumedSteps && Array.isArray(config.resumedSteps)) {
      this.stepsCompleted = [...config.resumedSteps];
    }
    if (config.initialStateData) {
      this.stateData = { ...config.initialStateData };
    } else if (config.stateData) {
      this.stateData = { ...config.stateData };
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
    this.setState('currentStep', step);
    this.setState('lastCompletedStep', step);
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

  public setState(key: string, value: unknown): void {
    this.stateData[key] = value;
  }

  public getState<T = unknown>(key: string): T | undefined {
    return this.stateData[key] as T | undefined;
  }

  public getAllState(): Record<string, unknown> {
    return { ...this.stateData };
  }

  /**
   * Detects presence of CAPTCHA challenges with type identification and URL extraction.
   */
  public async detectCaptchaDetails(): Promise<{ detected: boolean; type?: string; url?: string }> {
    if (!this.page || (typeof this.page.isClosed === 'function' && this.page.isClosed())) {
      return { detected: false };
    }

    const captchaDefinitions: Array<{ selector: string; type: string; isIframe?: boolean; isImg?: boolean }> = [
      { selector: 'iframe[src*="recaptcha"]', type: 'recaptcha', isIframe: true },
      { selector: 'iframe[src*="hcaptcha"]', type: 'hcaptcha', isIframe: true },
      { selector: 'iframe[src*="challenges.cloudflare.com"]', type: 'turnstile', isIframe: true },
      { selector: 'iframe[src*="arkoselabs"]', type: 'arkose', isIframe: true },
      { selector: 'iframe[src*="funcaptcha"]', type: 'funcaptcha', isIframe: true },
      { selector: '.cf-turnstile', type: 'turnstile' },
      { selector: '[name*="cf-turnstile"]', type: 'turnstile' },
      { selector: '#captcha', type: 'generic_captcha' },
      { selector: '[data-captcha]', type: 'generic_captcha' },
      { selector: '.g-recaptcha', type: 'recaptcha' },
      { selector: '.h-captcha', type: 'hcaptcha' },
      { selector: '#challenge-stage', type: 'turnstile' },
      { selector: '#cf-wrapper', type: 'turnstile' },
      { selector: 'img[src*="captcha" i]', type: 'image_captcha', isImg: true },
      { selector: 'img[id*="captcha" i]', type: 'image_captcha', isImg: true },
    ];

    for (const item of captchaDefinitions) {
      try {
        const locator = this.page.locator(item.selector).first();
        const count = await locator.count();
        if (count > 0) {
          const isVis = await locator.isVisible().catch(() => true);
          if (isVis) {
            let url: string | undefined;
            if (item.isIframe || item.isImg) {
              url = (await locator.getAttribute('src').catch(() => null)) || undefined;
            }
            return { detected: true, type: item.type, url };
          }
        }
      } catch {
        // Page may be navigating or closed, ignore safely
      }
    }
    return { detected: false };
  }

  public async detectCaptcha(): Promise<boolean> {
    const details = await this.detectCaptchaDetails();
    return details.detected;
  }

  public async detect2FA(): Promise<boolean> {
    if (!this.page || (typeof this.page.isClosed === 'function' && this.page.isClosed())) {
      return false;
    }

    const twoFASelectors = [
      'input[name*="otp" i]',
      'input[name*="2fa" i]',
      'input[name*="verification" i]',
      'input[name*="securityCode" i]',
      'input[name*="totp" i]',
      'input[placeholder*="code" i]',
      'input[placeholder*="verification" i]',
      'input[placeholder*="2fa" i]',
      'input[autocomplete="one-time-code"]',
      '#otp',
      '#twoFactorCode',
      '#verificationCode',
      'input[id*="otp" i]',
      'input[id*="2fa" i]',
    ];
    for (const sel of twoFASelectors) {
      try {
        const locator = this.page.locator(sel).first();
        const count = await locator.count();
        if (count > 0) {
          const isVis = await locator.isVisible().catch(() => true);
          if (isVis) return true;
        }
      } catch {
        // Page may be navigating or closed, ignore safely
      }
    }
    return false;
  }

  /**
   * Scrapes visible error banners or alerts on the page.
   */
  public async detectPageErrors(): Promise<string | null> {
    if (!this.page || (typeof this.page.isClosed === 'function' && this.page.isClosed())) {
      return null;
    }

    const errorSelectors = [
      '.alert-danger',
      '.alert-error',
      '.error-message',
      '.notification-error',
      '[role="alert"]',
      '.ui-messages-error',
    ];

    for (const sel of errorSelectors) {
      try {
        const locator = this.page.locator(sel).first();
        if ((await locator.count()) > 0 && (await locator.isVisible().catch(() => false))) {
          const text = await locator.innerText({ timeout: 2000 }).catch(() => null);
          if (text && text.trim().length > 0) {
            return text.trim();
          }
        }
      } catch {
        // Ignore errors checking alerts
      }
    }
    return null;
  }

  /**
   * Checks if the portal currently requires human intervention (CAPTCHA or 2FA).
   * Dynamically captures the current viewport screenshot and attaches active workflow state.
   */
  public async checkIntervention(): Promise<WorkflowResult | null> {
    try {
      if (!this.page || (typeof this.page.isClosed === 'function' && this.page.isClosed())) {
        return null;
      }

      const captchaDetails = await this.detectCaptchaDetails();
      if (captchaDetails.detected) {
        // Capture fresh screenshot of the captcha challenge
        await this.screenshots.capture(this.page, 'captcha-detected');
        const screenshot = this.screenshots.getLast();
        const screenshotUrl = screenshot && screenshot.buffer.length > 0
          ? `data:image/png;base64,${screenshot.buffer.toString('base64')}`
          : undefined;

        this.setState('interventionType', 'captcha');
        this.setState('captchaType', captchaDetails.type);
        this.setState('captchaUrl', captchaDetails.url);
        this.setState('urlAtIntervention', this.page.url());
        this.setState('timestamp', new Date().toISOString());

        return {
          status: 'requires_captcha',
          captchaUrl: captchaDetails.url,
          screenshotUrl,
          stepsCompleted: this.getStepsCompleted(),
          stateData: this.getAllState(),
          message: `CAPTCHA challenge (${captchaDetails.type || 'standard'}) detected — awaiting user intervention`,
        };
      }

      if (await this.detect2FA()) {
        // Capture fresh screenshot of the 2FA prompt
        await this.screenshots.capture(this.page, '2fa-detected');
        const screenshot = this.screenshots.getLast();
        const screenshotUrl = screenshot && screenshot.buffer.length > 0
          ? `data:image/png;base64,${screenshot.buffer.toString('base64')}`
          : undefined;

        this.setState('interventionType', '2fa');
        this.setState('urlAtIntervention', this.page.url());
        this.setState('timestamp', new Date().toISOString());

        return {
          status: 'requires_2fa',
          screenshotUrl,
          stepsCompleted: this.getStepsCompleted(),
          stateData: this.getAllState(),
          message: '2FA authentication prompt detected — awaiting user code',
        };
      }
    } catch (error) {
      console.warn('[RPA] Error during intervention check:', error instanceof Error ? error.message : error);
    }
    return null;
  }

  /**
   * Cleans up navigator resources such as in-memory screenshots and state.
   */
  public dispose(): void {
    this.screenshots.dispose();
    this.stateData = {};
  }
}

