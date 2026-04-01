'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';

interface RangeResponse {
  percent: number;
}

/**
 * Obtiene el porcentaje correspondiente a un rango específico de un parámetro de análisis
 */
export async function getPercentByRange(
  paramCode: string,
  rangeValue: number
): Promise<number | null> {
  try {
    console.log(`[getPercentByRange] Requesting - Code: ${paramCode}, Range: ${rangeValue}`);
    
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      console.error('[getPercentByRange] No token found in session');
      return null;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${apiUrl}/configuration/analysis-params/${paramCode}/percent?range=${rangeValue}`;
    console.log(`[getPercentByRange] Calling URL: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    console.log(`[getPercentByRange] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[getPercentByRange] Error fetching percent (${response.status}):`, errorText);
      return null;
    }

    const data = await response.json();
    console.log(`[getPercentByRange] Response data:`, data);
    
    const percent = data.data?.percent ?? null;
    console.log(`[getPercentByRange] Extracted percent: ${percent}`);
    
    return percent;
  } catch (error) {
    console.error('[getPercentByRange] Error:', error);
    return null;
  }
}
