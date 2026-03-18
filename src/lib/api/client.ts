/**
 * API Client centralizado para comunicación con el backend NestJS
 * Propaga correlation-id y request-id en todas las peticiones
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Generar correlation ID único por sesión
function getOrCreateCorrelationId(): string {
  if (typeof window === 'undefined') return '';
  
  const key = '__paddy_correlation_id__';
  let correlationId = localStorage.getItem(key);
  
  if (!correlationId) {
    // Generar UUID v4 simple sin dependencia externa
    correlationId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    localStorage.setItem(key, correlationId);
  }
  
  return correlationId;
}

interface RequestOptions extends RequestInit {
  token?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { token, ...fetchOptions } = options;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Agregar correlation ID (propagado del frontend)
    headers['x-correlation-id'] = getOrCreateCorrelationId();

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Unknown error',
      }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async get<T>(endpoint: string, token?: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', token });
  }

  async post<T>(endpoint: string, data: any, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  }

  async patch<T>(endpoint: string, data: any, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    });
  }

  async delete<T>(endpoint: string, token?: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', token });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
