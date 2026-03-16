import type { Metadata } from 'next';
import { fetchUsers, UsersPage } from '@/features/users';

// Prevenir caché para que siempre refetch cuando cambien los searchParams
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Usuarios - Paddy',
  description: 'Gestión de usuarios del sistema',
};

interface UsersRouteProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function UsersRoute({ searchParams }: UsersRouteProps) {
  const params = await searchParams;
  const search = params.search || '';

  // Llamada al backend para obtener usuarios
  const users = await fetchUsers(search);

  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Usuarios</h1>
        <p className="text-neutral-600">Gestión de usuarios del sistema Paddy</p>
      </div>

      <UsersPage initialUsers={users} />
    </div>
  );
}
