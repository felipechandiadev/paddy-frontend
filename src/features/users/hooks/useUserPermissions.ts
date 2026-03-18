'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { usersApi } from '../services/users.api';
import { UserPermissionsData } from '../types/users.types';

/**
 * Hook para cargar y actualizar los permisos de un usuario específico.
 * Usado por el diálogo de administración de permisos.
 */
export function useUserPermissions(userId: string) {
  const { data: session } = useSession();
  const [data, setData] = useState<UserPermissionsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.user?.accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const result = await usersApi.getPermissions(userId, session.user.accessToken);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar permisos');
    } finally {
      setLoading(false);
    }
  }, [userId, session?.user?.accessToken]);

  const save = useCallback(
    async (grants: string[], revokes: string[]) => {
      if (!session?.user?.accessToken) return;
      setSaving(true);
      setError(null);
      try {
        await usersApi.setPermissions(userId, grants, revokes, session.user.accessToken);
        // Recargar para reflejar el estado guardado
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar permisos');
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [userId, session?.user?.accessToken, load],
  );

  return { data, loading, saving, error, load, save };
}
