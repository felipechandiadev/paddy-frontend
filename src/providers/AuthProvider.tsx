'use client';

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PermissionsProvider } from './PermissionsProvider';

interface AuthProviderProps {
  children: ReactNode;
}

// create a single client instance for the app
const queryClient = new QueryClient();

export default function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <PermissionsProvider>
          {children}
        </PermissionsProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
