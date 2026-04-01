'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { riceTypesApi } from '../services/rice-types.api';

export async function deleteRiceType(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.accessToken) {
      return { success: false, error: 'No authentication token' };
    }

    await riceTypesApi.delete(session.user.accessToken, id);
    return { success: true };
  } catch (error) {
    console.error('Error deleting rice type:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete rice type' };
  }
}