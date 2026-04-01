'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { throwIfBackendUnavailable } from '@/lib/api/backend-connection-error';
import { riceTypesApi } from '../services/rice-types.api';
import { RiceType } from '../types/rice-types.types';

export async function fetchRiceTypes(): Promise<RiceType[]> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.accessToken) {
      console.error('No access token in session');
      return [];
    }

    const response = await riceTypesApi.list(session.user.accessToken);
    return response.data;
  } catch (error) {
    throwIfBackendUnavailable(error);
    console.error('Error fetching rice types:', error);
    return [];
  }
}
