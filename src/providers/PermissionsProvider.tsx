'use client';

import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface PermissionsContextValue {
  permissions: string[];
  can: (permission: string) => boolean;
  canAll: (...perms: string[]) => boolean;
  canAny: (...perms: string[]) => boolean;
  isAdmin: boolean;
}

const PermissionsContext = createContext<PermissionsContextValue>({
  permissions: [],
  can: () => false,
  canAll: () => false,
  canAny: () => false,
  isAdmin: false,
});

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();

  const permissions = useMemo<string[]>(
    () => session?.user?.permissions ?? [],
    [session?.user?.permissions],
  );

  const permissionsSet = useMemo(() => new Set(permissions), [permissions]);

  const value = useMemo<PermissionsContextValue>(
    () => ({
      permissions,
      can: (permission: string) => permissionsSet.has(permission),
      canAll: (...perms: string[]) => perms.every((p) => permissionsSet.has(p)),
      canAny: (...perms: string[]) => perms.some((p) => permissionsSet.has(p)),
      isAdmin: session?.user?.role === 'ADMIN',
    }),
    [permissions, permissionsSet, session?.user?.role],
  );

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions(): PermissionsContextValue {
  return useContext(PermissionsContext);
}
