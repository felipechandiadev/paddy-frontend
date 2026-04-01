const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const seasonsApi = {
  /**
   * Obtiene todas las temporadas
   */
  async getAll(accessToken: string, search?: string) {
    try {
      const url = new URL(`${API_BASE_URL}/configuration/seasons`);
      if (search) {
        url.searchParams.append('search', search);
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch seasons');
      }

      const data = await response.json();
      
      // Normalizar respuesta
      if (Array.isArray(data)) {
        return { data };
      }
      return data;
    } catch (error) {
      console.error('Error fetching seasons:', error);
      throw error;
    }
  },

  /**
   * Obtiene una temporada por ID
   */
  async getById(id: string, accessToken: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/configuration/seasons/${id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch season');
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching season:', error);
      throw error;
    }
  },
};
