'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { revalidatePath } from 'next/cache';

export async function createSeason(data: {
  name: string;
  year: number;
  startDate: string;
  endDate: string;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.accessToken) {
    throw new Error('No autorizado');
  }

  const response = await fetch('http://localhost:3000/api/v1/configuration/seasons', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.user.accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al crear temporada');
  }

  revalidatePath('/paddy/seasons');
  return response.json();
}
