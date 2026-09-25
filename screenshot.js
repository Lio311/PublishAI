const { chromium } = require('playwright');
const http = require('http');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 440, height: 956 },
    isMobile: true,
    hasTouch: true
  });
  
  await page.goto('http://localhost:3000/he', { waitUntil: 'networkidle' });
  await page.click('button:has(svg.lucide-menu)'); // Open menu
  await page.waitForTimeout(500); // wait for animation
  await page.screenshot({ path: 'mobile_menu.png' });
  
  await browser.close();
  console.log("Screenshot saved to mobile_menu.png");
})();
