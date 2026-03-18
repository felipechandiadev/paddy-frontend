'use client';

import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

/**
 * Hook para verificar permisos del usuario autenticado en sesión.
 *
 * Uso:
 *   const { can, permissions, isAdmin } = useCan();
 *   if (can('settlements.complete')) { ... }
 */
export function useCan() {
  const { data: session } = useSession();

  const permissions = useMemo<string[]>(
    () => session?.user?.permissions ?? [],
    [session?.user?.permissions],
  );

  const permissionsSet = useMemo(() => new Set(permissions), [permissions]);

  const can = (permission: string): boolean => permissionsSet.has(permission);

  const canAll = (...perms: string[]): boolean =>
    perms.every((p) => permissionsSet.has(p));

  const canAny = (...perms: string[]): boolean =>
    perms.some((p) => permissionsSet.has(p));

  const isAdmin = session?.user?.role === 'ADMIN';

  return { can, canAll, canAny, permissions, isAdmin };
}
