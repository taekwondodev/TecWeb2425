import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.locator('app-login')).toBeVisible();
    await expect(page.locator('.text-center')).toContainText(
      'Accedi a Meme Museum'
    );
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Accedi');
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await expect(page.locator('form')).toBeVisible();
    await page.click('button[type="submit"]');

    await expect(page.locator('.invalid-feedback')).toContainText(
      'Username richiesto'
    );
    await expect(page.locator('.invalid-feedback')).toContainText(
      'Password richiesta'
    );
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.route('/api/auth/login', async (route) => {
      const requestBody = await route.request().postDataJSON();

      if (
        requestBody.username === 'taekwondodev' &&
        requestBody.password === 'provatecwen'
      ) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Login successful',
            accessToken: 'fake-jwt-token-for-testing',
            refreshToken: 'fake-refresh-token',
          }),
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Invalid credentials',
          }),
        });
      }
    });

    await page.fill('#username', 'taekwondodev');
    await page.fill('#password', 'provatecwen');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/');
    await expect(page.locator('.hero-content h1')).toContainText(
      'Benvenuto al Meme Museum'
    );
  });
});
