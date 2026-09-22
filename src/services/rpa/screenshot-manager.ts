import { Page } from 'playwright';

export class ScreenshotManager {
  private screenshots: { step: string; buffer: Buffer; timestamp: Date }[] = [];

  async capture(page: Page, stepName: string): Promise<Buffer> {
    const buffer = await page.screenshot({ fullPage: false });
    this.screenshots.push({ step: stepName, buffer, timestamp: new Date() });
    console.log(`[Screenshot] Captured: ${stepName}`);
    return buffer;
  }

  getAll() { return this.screenshots; }
  getLast() { return this.screenshots[this.screenshots.length - 1]; }
}
