import { test as base } from '@playwright/test';
import { loginAs, logout } from './helpers/login.helper';

export const authFixtures = base.extend({
  authenticatedPageAsAdmin: async ({ page }, use) => {
    await loginAs(page, 'admin');
    await use(page);
    await logout(page);
  },

  authenticatedPageAsConsultant: async ({ page }, use) => {
    await loginAs(page, 'consultant');
    await use(page);
    await logout(page);
  },
});
