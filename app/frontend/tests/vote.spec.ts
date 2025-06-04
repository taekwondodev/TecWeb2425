import { test, expect } from '@playwright/test';

test.describe('Voting System', () => {
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

    await page.route('/api/memes/1/vote', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Comments retrieved successfully',
          comments: [],
        }),
      });
    });

    await page.addInitScript(() => {
      localStorage.setItem('accessToken', 'fake-jwt-token-for-testing');
    });
  });

  test('should upvote meme successfully', async ({ page }) => {
    await page.route('/api/memes/1/vote', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ vote: 0 }),
        });
      } else if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Vote operation completed successfully!',
            removed: false,
          }),
        });
      }
    });

    await page.goto('/meme/1');

    await expect(page.locator('.meme-title')).toContainText('test-meme');

    await expect(page.locator('.vote-container')).toBeVisible();
    await expect(page.locator('.upvote-btn')).toBeVisible();

    await page.click('.upvote-btn');

    await expect(page.locator('.upvote-btn.active')).toBeVisible();
  });

  test('should remove vote when clicking same button', async ({ page }) => {
    await page.route('/api/memes/1/vote', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ vote: 1 }),
        });
      } else if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Vote operation completed successfully!',
            removed: true,
          }),
        });
      }
    });

    await page.goto('/meme/1');

    await expect(page.locator('.meme-title')).toContainText('test-meme');

    await expect(page.locator('.upvote-btn.active')).toBeVisible();

    await page.click('.upvote-btn');

    await expect(page.locator('.upvote-btn.active')).not.toBeVisible();
    await expect(page.locator('.downvote-btn.active')).not.toBeVisible();
  });
});
