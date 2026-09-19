import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ context }) => {
    // Pre-populate sessionStorage with valid site PIN authorization
    await context.addInitScript(() => {
      window.sessionStorage.setItem('publishai_global_auth', 'true');
    });
  });

  test('should display login page elements correctly', async ({ page }) => {
    await page.goto('/en/login');

    // Verify main card heading
    await expect(page.locator('h2')).toContainText('Sign in to your account');

    // Verify email and password input fields
    const emailInput = page.locator('input[type="email"], input[name="email"], #email-address');
    const passwordInput = page.locator('input[type="password"], input[name="password"], #password');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toContainText('Sign in');

    // Verify link to registration
    const registerLink = page.locator('a[href*="register"]');
    await expect(registerLink).toBeVisible();
    await expect(registerLink).toContainText("Don't have an account? Sign up");
  });

  test('should allow entering credentials into login form', async ({ page }) => {
    await page.goto('/en/login');

    const emailInput = page.locator('input[type="email"], input[name="email"], #email-address');
    const passwordInput = page.locator('input[type="password"], input[name="password"], #password');
    const submitButton = page.locator('button[type="submit"]');

    await emailInput.fill('researcher@example.edu');
    await expect(emailInput).toHaveValue('researcher@example.edu');

    await passwordInput.fill('SecurePassword123!');
    await expect(passwordInput).toHaveValue('SecurePassword123!');

    await submitButton.click();
  });

  test('should navigate to registration page from login', async ({ page }) => {
    await page.goto('/en/login');

    const registerLink = page.locator('a[href*="register"]');
    await registerLink.click();

    await expect(page).toHaveURL(/register/);
    await expect(page.locator('h2')).toContainText('Create an account');
  });

  test('should display registration form elements and accept input', async ({ page }) => {
    await page.goto('/en/register');

    await expect(page.locator('h2')).toContainText('Create an account');

    const nameInput = page.locator('input[name="name"], #name');
    const emailInput = page.locator('input[type="email"], input[name="email"], #email-address');
    const passwordInput = page.locator('input[type="password"], input[name="password"], #password');
    const submitButton = page.locator('button[type="submit"]');
    const loginLink = page.locator('a[href*="login"]');

    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toContainText('Sign up');
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toContainText('Already have an account? Sign in');

    // Fill form
    await nameInput.fill('Dr. Jane Doe');
    await emailInput.fill('jane.doe@lab.org');
    await passwordInput.fill('SuperSecret789!');

    await expect(nameInput).toHaveValue('Dr. Jane Doe');
    await expect(emailInput).toHaveValue('jane.doe@lab.org');
    await expect(passwordInput).toHaveValue('SuperSecret789!');

    await submitButton.click();
  });

  test('should navigate back to login from registration page', async ({ page }) => {
    await page.goto('/en/register');

    const loginLink = page.locator('a[href*="login"]');
    await loginLink.click();

    await expect(page).toHaveURL(/login/);
    await expect(page.locator('h2')).toContainText('Sign in to your account');
  });
});
