'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { riceTypesApi } from '../services/rice-types.api';
import { RiceType } from '../types/rice-types.types';

export async function updateRiceType(id: number, data: Partial<RiceType>): Promise<{ success: boolean; data?: RiceType; error?: string }> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.accessToken) {
      return { success: false, error: 'No authentication token' };
    }

    const response = await riceTypesApi.update(session.user.accessToken, id, data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error updating rice type:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update rice type' };
  }
}