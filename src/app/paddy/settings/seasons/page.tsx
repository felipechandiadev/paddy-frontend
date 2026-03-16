import type { Metadata } from 'next';
import { fetchSeasons, SeasonsPage } from '@/features/seasons';

// Prevenir caché para que siempre refetch cuando cambien los searchParams
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Temporadas - Paddy',
  description: 'Gestión de temporadas del sistema',
};

interface SeasonsRouteProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function SeasonsRoute({ searchParams }: SeasonsRouteProps) {
  const params = await searchParams;
  const search = params.search || '';

  // Llamada al backend para obtener temporadas
  const result = await fetchSeasons(search);
  const seasons = result.success ? result.data : [];

  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Temporadas</h1>
        <p className="text-neutral-600">Gestión de temporadas del sistema Paddy</p>
      </div>

      <SeasonsPage initialSeasons={seasons} />
    </div>
  );
}
