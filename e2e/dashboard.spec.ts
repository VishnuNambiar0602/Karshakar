import { expect, test } from '@playwright/test';

test('loads dashboard and shows compute action', async ({ page }) => {
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#latitude')).toBeVisible();
  await expect(page.locator('#longitude')).toBeVisible();
});

test('loads predict workflow inputs', async ({ page }) => {
  await page.goto('/predict', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#location-desc')).toBeVisible();
  await expect(page.locator('#latitude')).toBeVisible();
  await expect(page.locator('#longitude')).toBeVisible();
});
