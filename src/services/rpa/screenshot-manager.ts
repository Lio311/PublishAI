import { Page } from 'playwright';

export interface ScreenshotEntry {
  step: string;
  buffer: Buffer;
  timestamp: Date;
}

export class ScreenshotManager {
  private screenshots: ScreenshotEntry[] = [];
  private readonly maxScreenshots: number;

  constructor(maxScreenshots = 10) {
    this.maxScreenshots = Math.max(1, maxScreenshots);
  }

  async capture(page: Page, stepName: string): Promise<Buffer> {
    try {
      if (!page || (typeof page.isClosed === 'function' && page.isClosed())) {
        console.warn(`[Screenshot] Cannot capture screenshot for '${stepName}': Page is closed.`);
        return Buffer.alloc(0);
      }

      const buffer = await page.screenshot({ fullPage: false, timeout: 5000 });
      
      // Prune oldest screenshots to prevent heap memory exhaustion
      if (this.screenshots.length >= this.maxScreenshots) {
        this.screenshots.shift();
      }

      this.screenshots.push({ step: stepName, buffer, timestamp: new Date() });
      console.log(`[Screenshot] Captured: ${stepName}`);
      return buffer;
    } catch (error) {
      console.warn(`[Screenshot] Failed to capture screenshot for step '${stepName}':`, error instanceof Error ? error.message : error);
      return Buffer.alloc(0);
    }
  }

  getAll(): ScreenshotEntry[] {
    return this.screenshots;
  }

  getLast(): ScreenshotEntry | undefined {
    return this.screenshots[this.screenshots.length - 1];
  }

  getLastBase64(): string | undefined {
    const last = this.getLast();
    if (!last || last.buffer.length === 0) return undefined;
    return last.buffer.toString('base64');
  }

  getLastDataUrl(): string | undefined {
    const b64 = this.getLastBase64();
    return b64 ? `data:image/png;base64,${b64}` : undefined;
  }

  /**
   * Clears in-memory screenshot buffers to prevent memory leaks after workflow completion.
   */
  clear(): void {
    this.screenshots = [];
  }

  dispose(): void {
    this.clear();
  }
}

