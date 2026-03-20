import { test as base } from '@playwright/test';
import { loginAs, logout } from './helpers/login.helper';
import { testData } from '../config/testData';

/**
 * Fixture autenticado como Admin
 */
export const test = base
  .extend({
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

    /**
     * API Client con token automático
     */
    apiClient: async ({ page }, use) => {
      class APIClient {
        constructor(private page: any) {}

        async getToken(): Promise<string> {
          const token = await this.page.evaluate(() => {
            return localStorage.getItem('paddy_token') ||
              localStorage.getItem('next-auth.session-token') ||
              sessionStorage.getItem('paddy_token') ||
              '';
          });
          return token;
        }

        async get(path: string) {
          const token = await this.getToken();
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          return this.page.request.get(`${testData.api.baseUrl}${path}`, { headers });
        }

        async post(path: string, data: any) {
          const token = await this.getToken();
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          return this.page.request.post(`${testData.api.baseUrl}${path}`, { headers, data });
        }

        async put(path: string, data: any) {
          const token = await this.getToken();
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          return this.page.request.put(`${testData.api.baseUrl}${path}`, { headers, data });
        }

        async patch(path: string, data: any) {
          const token = await this.getToken();
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          return this.page.request.patch(`${testData.api.baseUrl}${path}`, { headers, data });
        }

        async delete(path: string) {
          const token = await this.getToken();
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          return this.page.request.delete(`${testData.api.baseUrl}${path}`, { headers });
        }
      }

      const client = new APIClient(page);
      await use(client);
    },

    /**
     * Seed data helper
     */
    seedData: async ({}, use) => {
      const helpers = {
        getAdminEmail: () => testData.auth.admin.email,
        getAdminPassword: () => testData.auth.admin.password,
        getConsultantEmail: () => testData.auth.consultant.email,
        getConsultantPassword: () => testData.auth.consultant.password,

        getProducerByIndex: (index: number) => testData.producers[index % 5],
        getProducerById: (id: number) => testData.producers.find((p) => p.id === id),
        getAllProducers: () => testData.producers,
        getTotalProducers: () => 5,

        getRiceTypeByIndex: (index: number) => testData.riceTypes[index % 4],
        getRiceTypeById: (id: number) => testData.riceTypes.find((r) => r.id === id),
        getAllRiceTypes: () => testData.riceTypes,
        getTotalRiceTypes: () => 4,

        getActiveSeason: () => testData.seasons.active,
        getInactiveSeasons: () => [testData.seasons.inactive2024, testData.seasons.inactive2025],

        // Exposición directa de datos del seed
        receptions: testData.receptions,
        advances: testData.advances,
        settlements: testData.settlements,
        template: testData.template,

        getExpectedReceptions2026Count: () => 10,
        getExpectedAdvances2026Count: () => 10,
        getExpectedSettlements2024Count: () => 5,
        getExpectedSettlements2025Count: () => 4,
        getExpectedSettlements2026Count: () => 0,

        getTotalReceptions: () => 30,
        getTotalAdvances: () => 30,
        getTotalSettlements: () => 9,

        getDefaultTemplate: () => testData.template,
      };

      await use(helpers);
    },
  });

export { expect } from '@playwright/test';
