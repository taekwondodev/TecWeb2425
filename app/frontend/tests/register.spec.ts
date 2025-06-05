import { test, expect } from '@playwright/test';

test.describe('Register', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should display register form', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Registrati a Meme Museum' })
    ).toBeVisible();
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button.btn.btn-primary')).toContainText(
      'Registrati'
    );
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await expect(page.locator('form')).toBeVisible();

    await page.click('button.btn.btn-primary');

    await expect(page.locator('#username + .invalid-feedback')).toContainText(
      'Username richiesto'
    );
    await expect(page.locator('#email + .invalid-feedback')).toContainText(
      'Email richiesta'
    );
    await expect(page.locator('#password + .invalid-feedback')).toContainText(
      'Password richiesta'
    );
  });

  test('should register successfully with valid data', async ({ page }) => {
    await page.route('**/api/auth/register', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'User registered successfully' }),
      });
    });

    const timestamp = Date.now();
    const username = `testuser${timestamp}`;
    const email = `test${timestamp}@example.com`;

    await expect(page.locator('form')).toBeVisible();

    await page.fill('#username', username);
    await page.fill('#email', email);
    await page.fill('#password', 'password123');
    await page.click('button.btn.btn-primary');

    await expect(page).toHaveURL('/login');

    await expect(page.locator('#username')).toHaveValue(username);
    await expect(page.locator('#password')).toHaveValue('password123');
  });
});
