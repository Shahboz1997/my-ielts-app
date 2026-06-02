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
    await page.goto('/');

    await page.getByRole('button', { name: 'STRATUM LOGIN' }).click();
    await page.getByTestId('auth-email').fill(process.env.E2E_TEST_EMAIL);
    await page.getByTestId('auth-password').fill(process.env.E2E_TEST_PASSWORD);
    await page.getByTestId('auth-submit').click();

    await expect(page.getByRole('button', { name: 'STRATUM LOGIN' })).toBeHidden({
      timeout: 20_000,
    });

    await page.getByRole('button', { name: 'Task 2', exact: true }).click();
    await page.locator('[data-stratum-essay-input]').fill(E2E_ESSAY);
    await page.getByTestId('analyze-button').click();

    await expect(page.getByTestId('results-overall-band')).toHaveText('6.5', {
      timeout: 60_000,
    });

    await page.getByRole('link', { name: 'Archive' }).click();
    await expect(page.getByTestId('history-heading')).toBeVisible();
    await expect(page.getByText(/E2E practice essay/i)).toBeVisible({ timeout: 15_000 });
  });
});
