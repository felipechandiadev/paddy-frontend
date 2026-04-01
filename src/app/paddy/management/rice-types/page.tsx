import { fetchRiceTypes } from '@/features/rice-types/actions';
import RiceTypesPage from '@/features/rice-types/components/RiceTypesPage';

export const dynamic = 'force-dynamic';

export default async function RiceTypesSettingsPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const riceTypes = await fetchRiceTypes();

  return (
    <div className="space-y-8 px-6 py-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tipos de Arroz</h1>
        <p className="mt-2 text-gray-600">
          Gestiona los tipos de arroz disponibles en el sistema
        </p>
      </div>

      {/* Content */}
      <RiceTypesPage initialData={riceTypes} searchParams={searchParams} />
    </div>
  );
}
