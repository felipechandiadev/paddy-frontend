'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';

export interface AnalysisParam {
  id: number;
  code: string;
  name: string;
  description?: string;
  ranges: {
    id: number;
    rangeStart: number;
    rangeEnd: number;
    percent: number;
  }[];
}

/**
 * Obtiene los parámetros de análisis desde la API
 * Incluye los rangos de descuento para cada parámetro
 */
export async function fetchAnalysisParams(): Promise<AnalysisParam[]> {
  try {
    console.log('[fetchAnalysisParams] Starting...');
    
    const session = await getServerSession(authOptions);
    console.log('[fetchAnalysisParams] Session obtained:', !!session);
    
    if (!session) {
      console.error('[fetchAnalysisParams] No session found');
      return [];
    }

    const token = (session?.user as any)?.accessToken;
    console.log('[fetchAnalysisParams] Token available:', !!token, 'Token:', token?.substring(0, 20) + '...');

    if (!token) {
      console.error('[fetchAnalysisParams] No token in session');
      return [];
    }

    const url = `${process.env.NEXT_PUBLIC_API_URL}/configuration/analysis-params`;
    console.log('[fetchAnalysisParams] Fetching from URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    console.log('[fetchAnalysisParams] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[fetchAnalysisParams] Error response body:', errorBody);
      throw new Error(`Error fetching analysis params: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[fetchAnalysisParams] Response data:', data);
    
    const result = data.data || [];
    console.log('[fetchAnalysisParams] Returning', result.length, 'analysis params');
    
    return result;
  } catch (error) {
    console.error('[fetchAnalysisParams] Error:', error);
    return [];
  }
}

/**
 * Obtiene los rangos de un parámetro específico por código
 */
export async function getDiscountPercentsByCode(code: string): Promise<AnalysisParam | null> {
  try {
    const params = await fetchAnalysisParams();
    return params.find((p) => p.code === code) || null;
  } catch (error) {
    console.error('Error getting discount percents:', error);
    return null;
  }
}
