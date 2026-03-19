import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from 'next-auth/react';
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
  const session = await getSession();

  // Verificar que el usuario sea admin
  if (!session || session.user?.role !== 'ADMIN') {
    redirect('/paddy');
  }

  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const limit = parseInt(params.limit || '20');

  // Construir filtros
  const filters = {
    startDate: params.startDate,
    endDate: params.endDate,
    actorUserId: params.actorUserId ? parseInt(params.actorUserId) : undefined,
    actorEmail: params.actorEmail,
    severity: params.severity as any,
    status: params.status as any,
    category: params.category,
    eventCode: params.eventCode,
    correlationId: params.correlationId,
    page,
    limit,
  };

  try {
    const response = await fetchAuditEvents(filters);

    return (
      <div className="px-6 py-8">
        <AuditPage
          initialEvents={response.data.events}
          totalEvents={response.data.total}
          totalPages={response.data.totalPages}
          currentPage={response.data.page}
        />
      </div>
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
