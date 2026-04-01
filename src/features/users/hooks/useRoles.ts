'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { fetchRoles, RoleOption } from '../services/roles.api';

export function useRoles(enabled = true) {
  const { data: session } = useSession();
  const [roles, setRoles] = useState<RoleOption[]>([
    { id: 'ADMIN', label: 'Administrador' },
    { id: 'CONSULTANT', label: 'Consultor' },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (!session?.user?.accessToken) {
      setIsLoading(false);
      return;
    }

    const getRoles = async () => {
      try {
        setIsLoading(true);
        const fetchedRoles = await fetchRoles(session.user.accessToken);
        setRoles(fetchedRoles);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al obtener roles');
        // Mantener roles por defecto en caso de error
      } finally {
        setIsLoading(false);
      }
    };

    getRoles();
  }, [session?.user?.accessToken, enabled]);

  return { roles, isLoading, error };
}
