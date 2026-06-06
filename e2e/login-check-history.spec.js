import { test, expect } from '@playwright/test';

const E2E_ESSAY =
  'E2E practice essay with enough words for Stratum analysis and archive history verification today.';

test.describe('login → check → history', () => {
  test.beforeEach(() => {
    test.skip(
      !process.env.E2E_TEST_EMAIL || !process.env.E2E_TEST_PASSWORD,
      'Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD'
    );
  });

  test('credentials login, analyze Task 2, see result in archive', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const signInButton = page.getByRole('button', { name: 'Sign in', exact: true }).first();
    await expect(signInButton).toBeVisible({ timeout: 30_000 });
    await signInButton.click();
    await expect(page.getByTestId('auth-email')).toBeVisible({ timeout: 30_000 });
    await page.getByTestId('auth-email').fill(process.env.E2E_TEST_EMAIL);
    await page.getByTestId('auth-password').fill(process.env.E2E_TEST_PASSWORD);
    await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes('/api/auth/callback/credentials') &&
          res.request().method() === 'POST' &&
          res.ok(),
        { timeout: 30_000 }
      ),
      page.getByTestId('auth-submit').click(),
    ]);

    await expect(page.getByTestId('auth-email')).toBeHidden({ timeout: 30_000 });
    await expect(page.getByRole('navigation').getByRole('link', { name: 'Archive' })).toBeVisible({
      timeout: 30_000,
    });

    const sessionRes = await page.request.get('/api/auth/session');
    const session = await sessionRes.json();
    expect(session?.user?.email).toBe(process.env.E2E_TEST_EMAIL);

    const task2Tab = page.getByRole('navigation').getByRole('button', { name: 'Task 2', exact: true });
    await expect(task2Tab).toBeVisible({ timeout: 20_000 });
    await task2Tab.click();
    await page.locator('[data-stratum-essay-input]').fill(E2E_ESSAY);

    const [checkRes] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/check') && res.request().method() === 'POST',
        { timeout: 60_000 }
      ),
      page.getByTestId('analyze-button').click(),
    ]);
    expect(checkRes.ok(), `analyze failed: ${await checkRes.text()}`).toBeTruthy();

    await expect(page.getByTestId('results-overall-band')).toHaveText('6.5', {
      timeout: 15_000,
    });

    await page.getByRole('navigation').getByRole('link', { name: 'Archive' }).click();
    await expect(page.getByTestId('history-heading')).toBeVisible();
    await expect(page.getByText(/E2E practice essay/i)).toBeVisible({ timeout: 15_000 });
  });
});
