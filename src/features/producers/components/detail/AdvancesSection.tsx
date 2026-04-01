'use client';

import { useEffect, useMemo, useState } from 'react';
import Select from '@/shared/components/ui/Select/Select';
import IconButton from '@/shared/components/ui/IconButton/IconButton';
import { PrintDialog } from '@/shared/components/PrintDialog';
import { fetchAdvances } from '@/features/finances/actions/finances.action';
import { calculateAdvanceInterest } from '@/features/finances/services/advanceInterest';
import type { Advance } from '@/features/finances/types/finances.types';
import ProducerAdvancesToPrint from './ProducerAdvancesToPrint';

interface AdvancesSectionProps {
  producerId: number;
  producerName: string;
  producerRut?: string;
}

const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' });

const ALL_FILTER_VALUE = 'all';
type StatusFilterValue = 'all' | 'paid' | 'settled' | 'cancelled';

function getStatusBadgeClasses(status: Advance['status']): string {
  if (status === 'paid') return 'bg-yellow-100 text-yellow-800';
  if (status === 'settled') return 'bg-green-100 text-green-800';
  return 'bg-red-100 text-red-700';
}

function getStatusLabel(status: Advance['status']): string {
  if (status === 'paid') return 'Pagado';
  if (status === 'settled') return 'Liquidado';
  return 'Anulado';
}

export default function AdvancesSection({
  producerId,
  producerName,
  producerRut,
}: AdvancesSectionProps) {
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seasonFilter, setSeasonFilter] = useState<string>(ALL_FILTER_VALUE);
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>(ALL_FILTER_VALUE);
  const [printOpen, setPrintOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetchAdvances({ producerId })
      .then((result) => {
        if (!isMounted) return;
        setAdvances(result.data);
      })
      .catch(() => {
        if (!isMounted) return;
        setError('No se pudieron cargar los anticipos');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [producerId]);

  const statusOptions = useMemo(
    () => [
      { id: ALL_FILTER_VALUE, label: 'Todos los estados' },
      { id: 'paid', label: 'Pagado' },
      { id: 'settled', label: 'Liquidado' },
      { id: 'cancelled', label: 'Anulado' },
    ],
    [],
  );

  const seasonOptions = useMemo(() => {
    const seen = new Map<string, string>();
    advances.forEach((adv) => {
      if (adv.season) {
        const key = String(adv.season.id);
        if (!seen.has(key)) seen.set(key, adv.season.name);
      }
    });
    return [
      { id: ALL_FILTER_VALUE, label: 'Todas las temporadas' },
      ...Array.from(seen.entries())
        .sort((a, b) => a[1].localeCompare(b[1], 'es', { sensitivity: 'base' }))
        .map(([id, label]) => ({ id, label })),
    ];
  }, [advances]);

  const filteredAdvances = useMemo(() => {
    return advances.filter((adv) => {
      const matchesSeason =
        seasonFilter === ALL_FILTER_VALUE ||
        (adv.season && String(adv.season.id) === seasonFilter);
      const matchesStatus =
        statusFilter === ALL_FILTER_VALUE || adv.status === statusFilter;
      return matchesSeason && matchesStatus;
    });
  }, [advances, seasonFilter, statusFilter]);

  const selectedSeasonLabel =
    seasonOptions.find((option) => String(option.id) === seasonFilter)?.label ||
    'Todas las temporadas';

  const selectedStatusLabel =
    statusOptions.find((option) => String(option.id) === statusFilter)?.label ||
    'Todos los estados';

  const printFileName = useMemo(() => {
    const normalizedName = producerName
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9-_]/g, '');
    const datePart = new Date().toISOString().slice(0, 10);

    return `Anticipos-${normalizedName || producerId}-${datePart}`;
  }, [producerId, producerName]);

  const handleSeasonChange = (value: string | number | null) => {
    setSeasonFilter(String(value || ALL_FILTER_VALUE));
  };

  const handleStatusChange = (value: string | number | null) => {
    setStatusFilter(String(value || ALL_FILTER_VALUE) as StatusFilterValue);
  };

  const handleClosePrint = () => {
    setPrintOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
          <Select
            label="Temporada"
            options={seasonOptions}
            value={seasonFilter}
            onChange={handleSeasonChange}
            disabled={isLoading}
          />
          <Select
            label="Estado"
            options={statusOptions}
            value={statusFilter}
            onChange={handleStatusChange}
            disabled={isLoading}
          />
        </div>
        <div className="flex justify-end">
          <IconButton
            icon="print"
            variant="basicSecondary"
            ariaLabel="Imprimir listado de anticipos"
            onClick={() => setPrintOpen(true)}
            disabled={isLoading || filteredAdvances.length === 0}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-gray-900">Folio</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-900">Fecha</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-900">Temporada</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-900">Descripción</th>
              <th className="px-4 py-2 text-right font-semibold text-gray-900">Monto</th>
              <th className="px-4 py-2 text-right font-semibold text-gray-900">Interés</th>
              <th className="px-4 py-2 text-right font-semibold text-gray-900">Total</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-900">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredAdvances.map((advance) => {
              const interest = calculateAdvanceInterest(advance);
              const showInterest = advance.status === 'paid' && advance.isInterestCalculationEnabled;
              return (
                <tr key={advance.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-700">{advance.id}</td>
                  <td className="px-4 py-2 text-gray-700">
                    {new Date(advance.issueDate).toLocaleDateString('es-CL')}
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    {advance.season?.name || '-'}
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    {advance.description || '-'}
                  </td>
                  <td className="px-4 py-2 text-right font-medium text-gray-900">
                    {clp.format(advance.amount)}
                  </td>
                  <td className="px-4 py-2 text-right text-amber-700">
                    {showInterest && interest > 0 ? clp.format(interest) : '-'}
                  </td>
                  <td className="px-4 py-2 text-right font-medium text-gray-900">
                    {showInterest && interest > 0
                      ? clp.format(advance.amount + interest)
                      : clp.format(advance.amount)}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClasses(advance.status)}`}
                    >
                      {getStatusLabel(advance.status)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!isLoading && filteredAdvances.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">
            {advances.length === 0
              ? 'No hay anticipos registrados para este productor'
              : 'No hay anticipos para los filtros seleccionados'}
          </p>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">Cargando anticipos...</p>
        </div>
      )}

      <PrintDialog
        open={printOpen}
        onClose={handleClosePrint}
        title="Listado de anticipos del productor"
        fileName={printFileName}
        disablePrint={filteredAdvances.length === 0}
        size="custom"
        maxWidth="96vw"
        fullWidth
        scroll="body"
        zIndex={90}
        contentStyle={{ maxHeight: '95vh' }}
      >
        <ProducerAdvancesToPrint
          producerId={producerId}
          producerName={producerName}
          producerRut={producerRut}
          advances={filteredAdvances}
          filters={{
            seasonLabel: selectedSeasonLabel,
            statusLabel: selectedStatusLabel,
          }}
        />
      </PrintDialog>
    </div>
  );
}
