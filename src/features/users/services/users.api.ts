import { User } from '../types/users.types';
import { UserPermissionsData } from '../types/users.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const usersApi = {
  async list(search?: string, accessToken?: string): Promise<{ data: User[] }> {
    const params = new URLSearchParams();
    if (search) {
      params.append('search', search);
    }

    const url = `${API_BASE_URL}/users${params.toString() ? `?${params.toString()}` : ''}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Agregar token al header si está disponible
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }

    const data = await response.json();
    
    // El backend devuelve directamente un array, lo normalizamos
    // Si es array, lo wrapeamos en { data: array }
    // Si ya tiene estructura { data }, lo dejamos así
    if (Array.isArray(data)) {
      return { data };
    }
    
    return data;
  },

  async getPermissions(userId: string, accessToken: string): Promise<UserPermissionsData> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/permissions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch permissions: ${response.statusText}`);
    }

    const payload = await response.json();
    // Backend responde envuelto en TransformInterceptor: { data: { effective, overrides } }
    return payload?.data ?? payload;
  },

  async setPermissions(
    userId: string,
    grants: string[],
    revokes: string[],
    accessToken: string,
  ): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/permissions`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ grants, revokes }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update permissions: ${response.statusText}`);
    }
  },
};
