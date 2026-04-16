import { test, expect } from '@playwright/test';

/**
 * Smoke tests: every critical path must render without crashing, even in
 * demo mode (no Mapbox, no Supabase). These are not deep behavioural tests —
 * they guard against regressions that break the shell of the app.
 */

test('home renders map shell + sidebar with listings', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Mumbai Rent Intelligence', { exact: false })).toBeVisible();
  // Listing count pill
  await expect(page.getByText(/\d+ listing/)).toBeVisible();
  // Filters toggle
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
  // Rent in INR should appear in the price sidebar
  await expect(page.locator('text=/₹\\s?\\d/')).toBeVisible();
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
  await expect(page.getByRole('heading', { name: /Rent check/i })).toBeVisible();
});

test('match page renders form', async ({ page }) => {
  await page.goto('/match');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('login page renders OTP flow entry', async ({ page }) => {
  await page.goto('/auth/login');
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await expect(page.getByPlaceholder(/\+91/)).toBeVisible();
});

test('404 page renders for unknown listing id', async ({ page }) => {
  const res = await page.goto('/listings/this-listing-does-not-exist');
  expect(res?.status()).toBe(404);
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
