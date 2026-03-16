'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { throwIfBackendUnavailable } from '@/lib/api/backend-connection-error';
import { usersApi } from '../services/users.api';
import { User } from '../types/users.types';

export async function fetchUsers(search?: string): Promise<User[]> {
  try {
    // Obtener la sesión con authOptions
    const session = await getServerSession(authOptions);

    if (!session?.user?.accessToken) {
      console.error('No access token in session');
      return [];
    }

    // Pasar el token al API
    const response = await usersApi.list(search, session.user.accessToken);
    return response.data;
  } catch (error) {
    throwIfBackendUnavailable(error);
    console.error('Error fetching users:', error);
    return [];
  }
}
