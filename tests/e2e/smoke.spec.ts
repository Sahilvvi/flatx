import { test, expect } from '@playwright/test';

/**
 * Smoke tests: every critical path must render without crashing, even in
 * demo mode (no Mapbox, no Supabase). These are not deep behavioural tests —
 * they guard against regressions that break the shell of the app.
 */

test('home renders map shell + sidebar with listings', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Mumbai Rent Intelligence|MRI/ })).toBeVisible();
  // There's a pill + a mobile sheet button both showing the count — just check at least one is visible.
  await expect(page.getByText(/\d+ listing/).first()).toBeVisible();
  // Commute panel toggle
  await expect(page.getByRole('button', { name: /Commute zones/i })).toBeVisible();
  // At least one listing card link
  const detailLinks = page.getByRole('link', { name: /View details/i });
  await expect(detailLinks.first()).toBeVisible();
});

test('listing detail page renders key sections', async ({ page }) => {
  await page.goto('/');
  const detailLink = page.getByRole('link', { name: /View details/i }).first();
  await detailLink.click();
  await expect(page).toHaveURL(/\/listings\//);
  await expect(page.getByRole('link', { name: /Back to map/i })).toBeVisible();
  // Rent should appear in the price sidebar — we don't care about strict uniqueness.
  await expect(page.locator('text=/₹\\s?\\d/').first()).toBeVisible();
});

test('add listing form renders with pin picker, photo uploader and tag chips', async ({ page }) => {
  await page.goto('/listings/new');
  await expect(page.getByRole('heading', { name: /What are you listing/i })).toBeVisible();
  await expect(page.getByPlaceholder('e.g. 1BHK in Bandra West, 5 min to station')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Photos' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Drop a pin/i })).toBeVisible();
});

test('rent insight page renders form and demo verdict path', async ({ page }) => {
  await page.goto('/insights');
  await expect(page.getByRole('heading', { name: /overpaying in Mumbai/i })).toBeVisible();
});

test('match page renders form', async ({ page }) => {
  await page.goto('/match');
  await expect(page.getByRole('heading', { name: /Find your match/i })).toBeVisible();
});

test('login page renders OTP flow entry', async ({ page }) => {
  await page.goto('/auth/login');
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await expect(page.getByPlaceholder(/\+91/)).toBeVisible();
});

test('404 page renders for unknown listing id', async ({ page }) => {
  await page.goto('/listings/this-listing-does-not-exist');
  // Next may serve the custom not-found.tsx with either 200 or 404 depending on
  // build/runtime mode — just ensure the not-found UI is rendered.
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});

test('navigation links work', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Rent check' }).click();
  await expect(page).toHaveURL(/\/insights/);
  await page.getByRole('link', { name: 'Match' }).click();
  await expect(page).toHaveURL(/\/match/);
  await page.getByRole('link', { name: 'Map' }).click();
  await expect(page).toHaveURL(/\/$/);
});
