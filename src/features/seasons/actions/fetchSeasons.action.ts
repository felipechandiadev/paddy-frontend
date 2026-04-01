'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { throwIfBackendUnavailable } from '@/lib/api/backend-connection-error';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export async function fetchSeasons(search?: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.accessToken) {
      return {
        success: false,
        error: 'No está autenticado',
      };
    }

    const url = new URL(`${API_BASE_URL}/configuration/seasons`);
    if (search) {
      url.searchParams.append('search', search);
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${session.user.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener temporadas');
    }

    const data = await response.json();
    
    return {
      success: true,
      data: Array.isArray(data) ? data : data.data || data,
    };
  } catch (error) {
    throwIfBackendUnavailable(error);
    console.error('Error fetching seasons:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
