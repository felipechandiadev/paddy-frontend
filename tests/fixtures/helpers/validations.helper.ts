import { Page, expect } from '@playwright/test';

export async function assertIsLoggedIn(page: Page) {
  const url = page.url();
  expect(url).toContain('/paddy');
  await expect(page.locator('text=Dashboard')).toBeVisible();
}

export async function assertLoginFailed(page: Page, message = 'inválidas') {
  await expect(page.locator(`text=${message}`)).toBeVisible();
}

export async function assertElementVisible(page: Page, text: string) {
  await expect(page.locator(`text=${text}`)).toBeVisible();
}

export async function assertElementNotVisible(page: Page, text: string) {
  await expect(page.locator(`text=${text}`)).not.toBeVisible();
}
