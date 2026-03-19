import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import getSession from 'next-auth/next';
import { authOptions } from '@/lib/auth.config';
import { fetchAuditEvents, AuditPage } from '@/features/audit';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Auditoría - Paddy',
  description: 'Log de eventos y auditoría del sistema',
};

interface AuditRouteProps {
  searchParams: Promise<{
    startDate?: string;
    endDate?: string;
    actorUserId?: string;
    actorEmail?: string;
    severity?: string;
    status?: string;
    category?: string;
    eventCode?: string;
    correlationId?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function AuditRoute({ searchParams }: AuditRouteProps) {
  const session = await getSession(authOptions);

  // Verificar que el usuario esté autenticado
  if (!session) {
    redirect('/');
  }

  const params = await searchParams;
  const page = parseInt(params.page || '1');

  // Always load all events - DataGrid handles client-side pagination
  const filters = {
    page,
    limit: 1000,
  };

  try {
    const response = await fetchAuditEvents(filters);

    return (
      <AuditPage
        initialEvents={response.data?.events || []}
        totalEvents={response.data?.total || 0}
        totalPages={response.data?.totalPages || 1}
        currentPage={response.data?.page || 1}
      />
    );
  } catch (error) {
    console.error('Error loading audit events:', error);

    return (
      <div className="px-6 py-8">
        <div className="text-center text-red-600">
          <h1 className="text-3xl font-bold mb-2">Error</h1>
          <p>No se pudieron cargar los eventos de auditoría</p>
          <p className="text-sm text-neutral-600 mt-2">{String(error)}</p>
        </div>
      </div>
    );
  }
}
