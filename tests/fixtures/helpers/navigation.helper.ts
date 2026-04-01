import { Page } from '@playwright/test';

const routes = {
  dashboard: '/paddy',
  receptions: '/paddy/operations',
  finances: '/paddy/finances',
  advances: '/paddy/finances/advances',
  transactions: '/paddy/finances/transactions',
  settlements: '/paddy/finances/settlements',
  producers: '/paddy/management/producers',
  users: '/paddy/management/users',
  audit: '/paddy/audit',
  reports: '/paddy/reports',
  settings: '/paddy/settings',
};

export async function gotoFeature(
  page: Page,
  feature: keyof typeof routes
) {
  const route = routes[feature];
  console.log(`🔗 Navigating to ${feature} (${route})`);

  await page.goto(route);
  await page.waitForLoadState('networkidle');

  console.log(`✅ Navigated to ${feature}`);
}

export async function gotoURL(page: Page, url: string) {
  console.log(`🔗 Navigating to ${url}`);
  await page.goto(url);
  await page.waitForLoadState('networkidle');
}
