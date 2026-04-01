const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export interface RoleOption {
  id: string;
  label: string;
  description?: string;
}

/**
 * Obtiene los roles disponibles desde el backend
 */
export async function fetchRoles(accessToken: string): Promise<RoleOption[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/configuration/roles`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch roles');
    }

    const data = await response.json();
    
    // Normalizar respuesta (puede ser array o { data: array })
    if (Array.isArray(data)) {
      return data;
    }
    return data.data || data;
  } catch (error) {
    console.error('Error fetching roles:', error);
    // Fallback a roles por defecto
    return [
      { id: 'ADMIN', label: 'Administrador', description: 'Acceso total al sistema' },
      { id: 'CONSULTANT', label: 'Consultor', description: 'Acceso de solo lectura' },
    ];
  }
}
