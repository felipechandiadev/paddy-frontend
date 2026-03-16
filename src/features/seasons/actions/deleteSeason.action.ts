'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { revalidatePath } from 'next/cache';

export async function deleteSeason(id: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.accessToken) {
    throw new Error('No autorizado');
  }

  const response = await fetch(`http://localhost:3000/api/v1/configuration/seasons/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${session.user.accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al eliminar temporada');
  }

  revalidatePath('/paddy/seasons');
  return response.json();
}
