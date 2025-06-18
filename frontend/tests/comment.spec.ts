import { test, expect } from '@playwright/test';

test.describe('Comments System', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('/api/memes/1', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          id: 1,
          tag: 'test-meme',
          imagePath: 'test.jpg',
          upvotes: 10,
          downvotes: 2,
          createdAt: '2024-01-15T10:30:00Z',
          createdBy: 'testuser',
        }),
      });
    });

    await page.route('/api/memes/1/comments', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            comments: [
              {
                id: 1,
                memeId: 1,
                content: 'Primo commento',
                createdBy: 'user1',
                createdAt: '2024-01-15T10:30:00Z',
              },
            ],
          }),
        });
      }
    });
  });

  test('should show login prompt when not authenticated', async ({ page }) => {
    await page.goto('/meme/1');

    await expect(page.locator('.meme-title')).toContainText('test-meme');
    await expect(page.locator('.comment-section')).toBeVisible();
    await expect(page.locator('.login-prompt')).toBeVisible();
    await expect(
      page.locator('.login-prompt a[routerLink="/login"]')
    ).toContainText('accedi');
    await expect(
      page.locator('.login-prompt a[routerLink="/register"]')
    ).toContainText('registrati');
  });

  test('should display existing comments', async ({ page }) => {
    await page.goto('/meme/1');

    await expect(page.locator('.meme-title')).toContainText('test-meme');

    await expect(page.locator('.comment-item')).toBeVisible();
    await expect(page.locator('.comment-item .username')).toContainText(
      'user1'
    );
    await expect(page.locator('.comment-item .comment-content')).toContainText(
      'Primo commento'
    );
  });
});
