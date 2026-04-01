import { test as base } from '@playwright/test';
import { testData } from '../config/testData';

class APIClient {
  constructor(private page: any) {}

  async getToken(): Promise<string> {
    // Obtener token de localStorage después del login
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

    return this.page.request.get(`${testData.api.baseUrl}${path}`, {
      headers,
    });
  }

  async post(path: string, data: any) {
    const token = await this.getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    return this.page.request.post(`${testData.api.baseUrl}${path}`, {
      data,
      headers,
    });
  }

  async put(path: string, data: any) {
    const token = await this.getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    return this.page.request.put(`${testData.api.baseUrl}${path}`, {
      data,
      headers,
    });
  }

  async patch(path: string, data: any) {
    const token = await this.getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    return this.page.request.patch(`${testData.api.baseUrl}${path}`, {
      data,
      headers,
    });
  }

  async delete(path: string) {
    const token = await this.getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    return this.page.request.delete(`${testData.api.baseUrl}${path}`, {
      headers,
    });
  }
}

export const apiFixtures = base.extend({
  apiClient: async ({ authenticatedPageAsAdmin }, use) => {
    const client = new APIClient(authenticatedPageAsAdmin);
    await use(client);
  },

  apiClientAsConsultant: async ({ authenticatedPageAsConsultant }, use) => {
    const client = new APIClient(authenticatedPageAsConsultant);
    await use(client);
  },
});
