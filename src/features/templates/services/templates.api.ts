import { Template } from '../types/templates.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const templatesApi = {
  list: async (token: string): Promise<{ data: Template[] }> => {
    const response = await fetch(`${API_URL}/configuration/templates`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch templates: ${response.status}`);
    }

    return response.json();
  },

  create: async (token: string, data: Partial<Template>): Promise<{ data: Template }> => {
    const response = await fetch(`${API_URL}/configuration/templates`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create template: ${response.status}`);
    }

    return response.json();
  },

  update: async (token: string, id: number, data: Partial<Template>): Promise<{ data: Template }> => {
    const response = await fetch(`${API_URL}/configuration/templates/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update template: ${response.status}`);
    }

    return response.json();
  },

  delete: async (token: string, id: number): Promise<{ success: boolean }> => {
    const response = await fetch(`${API_URL}/configuration/templates/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete template: ${response.status}`);
    }

    return response.json();
  },
};
