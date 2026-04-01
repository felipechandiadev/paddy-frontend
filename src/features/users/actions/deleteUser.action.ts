'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { revalidatePath } from 'next/cache';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export async function deleteUser(userId: string) {
  try {
    // Obtener sesión con authOptions
    const session = await getServerSession(authOptions);

    if (!session?.user?.accessToken) {
      return {
        success: false,
        error: 'No está autenticado',
      };
    }

    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.user.accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al eliminar usuario');
    }

    // Revalidar la página para que se reflejen los cambios
    revalidatePath('/paddy/users');
    
    return {
      success: true,
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
