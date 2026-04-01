'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { revalidatePath } from 'next/cache';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

interface CreateUserRequest {
  email: string;
  password: string;
  role: 'ADMIN' | 'CONSULTANT';
  name: string;
}

export async function createUser(data: CreateUserRequest) {
  try {
    // Obtener sesión con authOptions
    const session = await getServerSession(authOptions);

    if (!session?.user?.accessToken) {
      return {
        success: false,
        error: 'No está autenticado',
      };
    }

    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.user.accessToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al crear usuario');
    }

    const result = await response.json();
    
    // Revalidar la página para que se reflejen los cambios
    revalidatePath('/paddy/users');
    
    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error('Error creating user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
