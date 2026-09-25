# RPA Autonomous Navigation & Captcha Handling

## Overview
An advanced Playwright-based RPA pipeline that can handle dynamic DOMs using Vision AI and deal with Captcha/2FA via a dual-mode strategy (Auto/Manual).

## Components

1. **User Configuration**:
   - Journal connection settings will allow users to choose their Captcha/2FA strategy: `Auto` (3rd-party integration) or `Manual` (UI prompt).

2. **Inngest & Playwright Workflow**:
   - Uses Inngest to orchestrate long-running scraping tasks.
   - Playwright runs in headless mode.
   - If `Auto`: Invokes 2Captcha/Anti-captcha API to solve challenges.
   - If `Manual`: Pauses via Inngest `waitForEvent`, captures a screenshot of the puzzle/2FA, and sends it to the frontend via DB status update.

3. **Human-in-the-Loop UI**:
   - `PaperProcessingUI.tsx` renders a modal showing the Captcha screenshot.
   - User inputs the text/code.
   - Triggers `submission.captcha.solved` event to unblock Inngest.

4. **Vision AI Fallback**:
   - If standard CSS selectors fail, `GenericNavigator` falls back to capturing a screenshot and sending it to Claude 3.5 Sonnet to determine the exact `(x, y)` click coordinates for buttons like "Submit" or "New Manuscript".
