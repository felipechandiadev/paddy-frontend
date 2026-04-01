'use client';

import { usePermissions } from '@/providers/PermissionsProvider';

/**
 * Hook para verificar permisos del usuario autenticado en sesión.
 * Alias de usePermissions() para compatibilidad con código existente.
 *
 * Uso:
 *   const { can, permissions, isAdmin } = useCan();
 *   if (can('settlements.complete')) { ... }
 */
export function useCan() {
  return usePermissions();
}
