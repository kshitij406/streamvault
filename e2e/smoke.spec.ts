import { test, expect } from '@playwright/test';

test.describe('Smoke tests', () => {
  test('homepage loads without crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // App should not show the crash screen
    await expect(page.getByText('Application error')).not.toBeVisible();
    // Navbar should be visible
    await expect(page.locator('nav').first()).toBeVisible();
    // No JS exceptions that crash the page
    expect(errors.filter(e => e.includes('Cannot destructure'))).toHaveLength(0);
  });

  test('search page loads without crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Application error')).not.toBeVisible();
    expect(errors.filter(e => e.includes('Cannot destructure'))).toHaveLength(0);
  });

  test('movies page loads without crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/movies');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Application error')).not.toBeVisible();
    expect(errors.filter(e => e.includes('Cannot destructure'))).toHaveLength(0);
  });

  test('tv-shows page loads without crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/tv-shows');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Application error')).not.toBeVisible();
    expect(errors.filter(e => e.includes('Cannot destructure'))).toHaveLength(0);
  });

  test('navbar shows Sign In when unauthenticated', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // When not logged in, Sign In link should appear
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible();
  });

  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Application error')).not.toBeVisible();
  });
});
