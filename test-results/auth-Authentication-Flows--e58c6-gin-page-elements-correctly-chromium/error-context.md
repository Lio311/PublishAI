# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication Flows >> should display login page elements correctly
- Location: e2e/auth.spec.ts:11:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('h2')
Expected substring: "Sign in to your account"
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toContainText" locator('h2') with timeout 10000ms
  - waiting for locator('h2')

```

```yaml
- img "PublishAI Logo"
- paragraph: התחברות לחשבון
- button "Sign in with Google":
  - img
  - text: Sign in with Google
- region "Notifications alt+T"
- alert
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Authentication Flows', () => {
  4   |   test.beforeEach(async ({ context }) => {
  5   |     // Pre-populate localStorage with valid site PIN authorization
  6   |     await context.addInitScript(() => {
  7   |       window.localStorage.setItem('publishai_global_auth_time_v2', Date.now().toString());
  8   |     });
  9   |   });
  10  | 
  11  |   test('should display login page elements correctly', async ({ page }) => {
  12  |     await page.goto('/en/login');
  13  | 
  14  |     // Verify main card heading
> 15  |     await expect(page.locator('h2')).toContainText('Sign in to your account');
      |                                      ^ Error: expect(locator).toContainText(expected) failed
  16  | 
  17  |     // Verify email and password input fields
  18  |     const emailInput = page.locator('input[type="email"], input[name="email"], #email-address');
  19  |     const passwordInput = page.locator('input[type="password"], input[name="password"], #password');
  20  |     const submitButton = page.locator('button[type="submit"]');
  21  | 
  22  |     await expect(emailInput).toBeVisible();
  23  |     await expect(passwordInput).toBeVisible();
  24  |     await expect(submitButton).toBeVisible();
  25  |     await expect(submitButton).toContainText('Sign in');
  26  | 
  27  |     // Verify link to registration
  28  |     const registerLink = page.locator('a[href*="register"]');
  29  |     await expect(registerLink).toBeVisible();
  30  |     await expect(registerLink).toContainText("Don't have an account? Sign up");
  31  |   });
  32  | 
  33  |   test('should allow entering credentials into login form', async ({ page }) => {
  34  |     await page.goto('/en/login');
  35  | 
  36  |     const emailInput = page.locator('input[type="email"], input[name="email"], #email-address');
  37  |     const passwordInput = page.locator('input[type="password"], input[name="password"], #password');
  38  |     const submitButton = page.locator('button[type="submit"]');
  39  | 
  40  |     await emailInput.fill('researcher@example.edu');
  41  |     await expect(emailInput).toHaveValue('researcher@example.edu');
  42  | 
  43  |     await passwordInput.fill('SecurePassword123!');
  44  |     await expect(passwordInput).toHaveValue('SecurePassword123!');
  45  | 
  46  |     await submitButton.click();
  47  |   });
  48  | 
  49  |   test('should navigate to registration page from login', async ({ page }) => {
  50  |     await page.goto('/en/login');
  51  | 
  52  |     const registerLink = page.locator('a[href*="register"]');
  53  |     await registerLink.click();
  54  | 
  55  |     await expect(page).toHaveURL(/register/);
  56  |     await expect(page.locator('h2')).toContainText('Create an account');
  57  |   });
  58  | 
  59  |   test('should display registration form elements and accept input', async ({ page }) => {
  60  |     await page.goto('/en/register');
  61  | 
  62  |     await expect(page.locator('h2')).toContainText('Create an account');
  63  | 
  64  |     const nameInput = page.locator('input[name="name"], #name');
  65  |     const emailInput = page.locator('input[type="email"], input[name="email"], #email-address');
  66  |     const passwordInput = page.locator('input[type="password"], input[name="password"], #password');
  67  |     const submitButton = page.locator('button[type="submit"]');
  68  |     const loginLink = page.locator('a[href*="login"]');
  69  | 
  70  |     await expect(nameInput).toBeVisible();
  71  |     await expect(emailInput).toBeVisible();
  72  |     await expect(passwordInput).toBeVisible();
  73  |     await expect(submitButton).toBeVisible();
  74  |     await expect(submitButton).toContainText('Sign up');
  75  |     await expect(loginLink).toBeVisible();
  76  |     await expect(loginLink).toContainText('Already have an account? Sign in');
  77  | 
  78  |     // Fill form
  79  |     await nameInput.fill('Dr. Jane Doe');
  80  |     await emailInput.fill('jane.doe@lab.org');
  81  |     await passwordInput.fill('SuperSecret789!');
  82  | 
  83  |     await expect(nameInput).toHaveValue('Dr. Jane Doe');
  84  |     await expect(emailInput).toHaveValue('jane.doe@lab.org');
  85  |     await expect(passwordInput).toHaveValue('SuperSecret789!');
  86  | 
  87  |     await submitButton.click();
  88  |   });
  89  | 
  90  |   test('should navigate back to login from registration page', async ({ page }) => {
  91  |     await page.goto('/en/register');
  92  | 
  93  |     const loginLink = page.locator('a[href*="login"]');
  94  |     await loginLink.click();
  95  | 
  96  |     await expect(page).toHaveURL(/login/);
  97  |     await expect(page.locator('h2')).toContainText('Sign in to your account');
  98  |   });
  99  | });
  100 | 
```