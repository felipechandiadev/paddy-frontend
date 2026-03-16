import {
  AnalysisParam,
  CreateAnalysisParamPayload,
} from '../types/analysis-params.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

function extractErrorMessage(errorPayload: any, fallback: string): string {
  if (Array.isArray(errorPayload?.message)) {
    const joined = errorPayload.message.filter(Boolean).join(', ');
    return joined || fallback;
  }

  if (typeof errorPayload?.message === 'string' && errorPayload.message.trim().length > 0) {
    return errorPayload.message;
  }

  if (typeof errorPayload?.error === 'string' && errorPayload.error.trim().length > 0) {
    return errorPayload.error;
  }

  return fallback;
}

export const analysisParamsApi = {
  list: async (
    token: string,
    includeInactive = false,
  ): Promise<{ data: AnalysisParam[] }> => {
    const baseUrl = `${API_URL}/configuration/analysis-params`;
    const url = includeInactive ? `${baseUrl}?includeInactive=true` : baseUrl;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch analysis params: ${response.status}`);
    }

    return response.json();
  },

  create: async (
    token: string,
    payload: CreateAnalysisParamPayload,
  ): Promise<{ data: AnalysisParam }> => {
    const response = await fetch(`${API_URL}/configuration/analysis-params`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new Error(
        extractErrorMessage(
          errorPayload,
          `No fue posible crear el rango (${response.status})`,
        ),
      );
    }

    return response.json();
  },

  update: async (
    token: string,
    id: number,
    payload: object,
  ): Promise<{ data: AnalysisParam } | AnalysisParam> => {
    const response = await fetch(`${API_URL}/configuration/analysis-params/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new Error(
        extractErrorMessage(
          errorPayload,
          `No fue posible actualizar el rango (${response.status})`,
        ),
      );
    }

    return response.json();
  },
};
