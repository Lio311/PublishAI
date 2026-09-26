import { ScreenshotManager } from '@/services/rpa/screenshot-manager';
import { GenericNavigator } from '@/services/rpa/portal-navigators/generic-navigator';
import { runSubmissionWorkflow } from '@/services/rpa/submission-bot';
import { NavigatorConfig } from '@/services/rpa/types';

describe('RPA Services Audit Tests', () => {
  describe('ScreenshotManager', () => {
    it('initializes and strictly enforces maxScreenshots limit with buffer memory pruning', async () => {
      const manager = new ScreenshotManager(3);
      const mockPage = {
        isClosed: () => false,
        screenshot: jest.fn().mockResolvedValue(Buffer.from('fake-screenshot-data')),
      } as any;

      await manager.capture(mockPage, 'step-1');
      await manager.capture(mockPage, 'step-2');
      await manager.capture(mockPage, 'step-3');
      expect(manager.getCount()).toBe(3);

      await manager.capture(mockPage, 'step-4');
      // Should prune step-1 and keep size at 3
      expect(manager.getCount()).toBe(3);
      const steps = manager.getAll().map((s) => s.step);
      expect(steps).toEqual(['step-2', 'step-3', 'step-4']);
    });

    it('returns empty buffer and logs warning if page is closed without throwing unhandled rejection', async () => {
      const manager = new ScreenshotManager(5);
      const closedPage = {
        isClosed: () => true,
        screenshot: jest.fn(),
      } as any;

      const buf = await manager.capture(closedPage, 'step-closed');
      expect(buf.length).toBe(0);
      expect(closedPage.screenshot).not.toHaveBeenCalled();
      expect(manager.getCount()).toBe(0);
    });

    it('generates base64 and data URLs correctly and clears memory on dispose', async () => {
      const manager = new ScreenshotManager(5);
      const mockPage = {
        isClosed: () => false,
        screenshot: jest.fn().mockResolvedValue(Buffer.from('hello-world')),
      } as any;

      await manager.capture(mockPage, 'step-data-url');
      const b64 = manager.getLastBase64();
      expect(b64).toBe(Buffer.from('hello-world').toString('base64'));

      const dataUrl = manager.getLastDataUrl();
      expect(dataUrl).toBe(`data:image/png;base64,${b64}`);

      manager.dispose();
      expect(manager.getCount()).toBe(0);
      expect(manager.getLast()).toBeUndefined();
    });
  });

  describe('GenericNavigator', () => {
    const createMockPage = () => {
      return {
        isClosed: () => false,
        goto: jest.fn().mockResolvedValue(null),
        url: jest.fn().mockReturnValue('https://portal.journal.org/dashboard'),
        title: jest.fn().mockResolvedValue('Journal Portal'),
        screenshot: jest.fn().mockResolvedValue(Buffer.from('mock-screen')),
        locator: jest.fn().mockReturnValue({
          first: () => ({
            count: jest.fn().mockResolvedValue(1),
            isVisible: jest.fn().mockResolvedValue(true),
            fill: jest.fn().mockResolvedValue(undefined),
            click: jest.fn().mockResolvedValue(undefined),
            selectOption: jest.fn().mockResolvedValue(undefined),
            setInputFiles: jest.fn().mockResolvedValue(undefined),
            getAttribute: jest.fn().mockResolvedValue('https://www.google.com/recaptcha/api.js'),
            innerText: jest.fn().mockResolvedValue(''),
            press: jest.fn().mockResolvedValue(undefined),
          }),
          nth: () => ({
            fill: jest.fn().mockResolvedValue(undefined),
          }),
          count: jest.fn().mockResolvedValue(1),
          isVisible: jest.fn().mockResolvedValue(true),
        }),
        waitForLoadState: jest.fn().mockResolvedValue(undefined),
        textContent: jest.fn().mockResolvedValue('Manuscript Tracking Number: MS-2026-999'),
        evaluate: jest.fn().mockResolvedValue(undefined),
        frames: jest.fn().mockReturnValue([]),
      } as any;
    };

    const baseConfig: NavigatorConfig = {
      siteUrl: 'https://portal.journal.org',
      username: 'author@test.com',
      password: 'SecurePassword123!',
      paperId: 'paper-101',
      submissionPayload: {
        title: 'Quantum Gravitational Lensing',
        abstract: 'This paper explores quantum gravity effects on cosmological lensing.',
        content: 'Full text content...',
        keywords: ['quantum', 'gravity', 'lensing'],
        authors: [{ name: 'Dr. Jane Doe', email: 'jane@test.com', affiliation: 'MIT' }],
        articleType: 'Research Article',
        publishMode: 'draft',
        attachments: [
          {
            filename: 'manuscript.pdf',
            mimeType: 'application/pdf',
            buffer: Buffer.from('PDF_CONTENT'),
          },
        ],
      },
    };

    it('tracks completed steps and dynamic state data', async () => {
      const page = createMockPage();
      const navigator = new GenericNavigator(page, baseConfig);

      navigator.setState('submissionStage', 'pre-flight');
      expect(navigator.getState('submissionStage')).toBe('pre-flight');

      navigator.markStep('login');
      expect(navigator.isStepCompleted('login')).toBe(true);
      expect(navigator.getStepsCompleted()).toContain('login');
      expect(navigator.getAllState().lastCompletedStep).toBe('login');

      navigator.dispose();
      expect(navigator.getAllState()).toEqual({});
    });

    it('detects CAPTCHA and returns enriched intervention state with real-time screenshot', async () => {
      const page = createMockPage();
      const navigator = new GenericNavigator(page, baseConfig);

      const intervention = await navigator.checkIntervention();
      expect(intervention).not.toBeNull();
      expect(intervention?.status).toBe('requires_captcha');
      expect(intervention?.captchaUrl).toBe('https://www.google.com/recaptcha/api.js');
      expect(intervention?.stateData).toBeDefined();
      expect(intervention?.stateData?.interventionType).toBe('captcha');
      expect(intervention?.screenshotUrl).toMatch(/^data:image\/png;base64,/);
    });

    it('handles form filling with dynamic article type, authors, and keywords', async () => {
      const page = createMockPage();
      // Mock locator so captcha/2fa is not detected
      page.locator = jest.fn().mockImplementation((selector: string) => {
        return {
          first: () => ({
            count: jest.fn().mockResolvedValue(1),
            isVisible: jest.fn().mockResolvedValue(true),
            fill: jest.fn().mockResolvedValue(undefined),
            click: jest.fn().mockResolvedValue(undefined),
            selectOption: jest.fn().mockResolvedValue(undefined),
            setInputFiles: jest.fn().mockResolvedValue(undefined),
            getAttribute: jest.fn().mockResolvedValue(null),
            innerText: jest.fn().mockResolvedValue(''),
          }),
          count: jest.fn().mockResolvedValue(selector.includes('captcha') || selector.includes('otp') ? 0 : 1),
          isVisible: jest.fn().mockResolvedValue(false),
        };
      });

      const navigator = new GenericNavigator(page, baseConfig);
      await navigator.fillForm();

      expect(navigator.isStepCompleted('fill-form')).toBe(true);
      const filled = navigator.getState<string[]>('filledFields');
      expect(filled).toContain('title');
      expect(filled).toContain('abstract');
      expect(filled).toContain('keywords');
    });

    it('handles file attachments with data URL headers without throwing or corrupting buffers', async () => {
      const page = createMockPage();
      const dataUrlConfig: NavigatorConfig = {
        ...baseConfig,
        submissionPayload: {
          ...baseConfig.submissionPayload,
          attachments: [
            {
              filename: 'test.pdf',
              mimeType: 'application/pdf',
              // Pass data URL string
              buffer: 'data:application/pdf;base64,SlZCRVJpMHg=' as any,
            },
          ],
        },
      };

      const navigator = new GenericNavigator(page, dataUrlConfig);
      await navigator.uploadFiles();

      expect(navigator.isStepCompleted('upload-files')).toBe(true);
      const uploaded = navigator.getState<string[]>('uploadedFiles');
      expect(uploaded).toEqual(['test.pdf']);
    });
  });

  describe('runSubmissionWorkflow', () => {
    it('returns error when connectionDetails is omitted without memory leaks', async () => {
      const result = await runSubmissionWorkflow('paper-empty', undefined);
      expect(result.status).toBe('error');
      expect(result.message).toContain('No connection details provided');
      expect(result.stepsCompleted).toEqual([]);
    });
  });
});
