import { RiceType } from '../types/rice-types.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const riceTypesApi = {
  list: async (token: string): Promise<{ data: RiceType[] }> => {
    const response = await fetch(`${API_URL}/configuration/rice-types`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch rice types: ${response.status}`);
    }

    return response.json();
  },

  create: async (token: string, data: Partial<RiceType>): Promise<{ data: RiceType }> => {
    const response = await fetch(`${API_URL}/configuration/rice-types`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create rice type: ${response.status}`);
    }

    return response.json();
  },

  update: async (token: string, id: number, data: Partial<RiceType>): Promise<{ data: RiceType }> => {
    const response = await fetch(`${API_URL}/configuration/rice-types/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update rice type: ${response.status}`);
    }

    return response.json();
  },

  delete: async (token: string, id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/configuration/rice-types/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete rice type: ${response.status}`);
    }
  },
};
