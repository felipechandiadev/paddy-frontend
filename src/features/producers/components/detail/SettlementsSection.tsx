'use client';

import { useEffect, useMemo, useState } from 'react';
import Select from '@/shared/components/ui/Select/Select';
import IconButton from '@/shared/components/ui/IconButton/IconButton';
import { PrintDialog } from '@/shared/components/PrintDialog';
import { fetchSettlements } from '@/features/finances/actions/finances.action';
import type { Settlement } from '@/features/finances/types/finances.types';
import ProducerSettlementsToPrint from './ProducerSettlementsToPrint';

interface SettlementsSectionProps {
  producerId: number;
  producerName: string;
  producerRut?: string;
}

const ALL_FILTER_VALUE = 'all';
type StatusFilterValue = 'all' | Settlement['status'];

function toSafeNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getSettlementSummary(settlement: Settlement): Record<string, unknown> {
  if (!settlement.calculationDetails || typeof settlement.calculationDetails !== 'object') {
    return {};
  }

  const summary = (settlement.calculationDetails as Record<string, unknown>).summary;
  return summary && typeof summary === 'object'
    ? (summary as Record<string, unknown>)
    : {};
}

function getDisplayStatus(settlement: Settlement): Settlement['status'] | 'annulled' {
  return settlement.deletedAt ? 'annulled' : settlement.status;
}

function getStatusLabel(displayStatus: Settlement['status'] | 'annulled'): string {
  if (displayStatus === 'draft') return 'Pre-liquidacion';
  if (displayStatus === 'completed') return 'Liquidada';
  if (displayStatus === 'annulled') return 'Anulada';
  return 'Cancelada';
}

function getStatusBadgeClasses(displayStatus: Settlement['status'] | 'annulled'): string {
  if (displayStatus === 'draft') return 'bg-yellow-100 text-yellow-800';
  if (displayStatus === 'completed') return 'bg-green-100 text-green-800';
  return 'bg-red-100 text-red-700';
}

function getSettlementDate(settlement: Settlement): string {
  const value = settlement.issuedAt || settlement.createdAt || settlement.updatedAt;
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('es-CL');
}

function getSettlementReceptionsCount(settlement: Settlement): number {
  if (Array.isArray(settlement.receptionIds)) {
    return settlement.receptionIds.length;
  }

  return Math.max(0, Math.round(toSafeNumber(getSettlementSummary(settlement).totalReceptions)));
}

function getSettlementAdvancesCount(settlement: Settlement): number {
  if (Array.isArray(settlement.advanceIds)) {
    return settlement.advanceIds.length;
  }

  return Math.max(
    0,
    Math.round(toSafeNumber(getSettlementSummary(settlement).totalAdvancesCount)),
  );
}

function getSettlementAmountDue(settlement: Settlement): number {
  const entityAmount = toSafeNumber(settlement.amountDue);
  if (entityAmount !== 0) {
    return entityAmount;
  }

  return toSafeNumber(getSettlementSummary(settlement).finalBalance);
}

export default function SettlementsSection({
  producerId,
  producerName,
  producerRut,
}: SettlementsSectionProps) {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seasonFilter, setSeasonFilter] = useState<string>(ALL_FILTER_VALUE);
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>(ALL_FILTER_VALUE);
  const [printOpen, setPrintOpen] = useState(false);

  const clp = useMemo(
    () =>
      new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    [],
  );

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetchSettlements({ producerId })
      .then((result) => {
        if (!isMounted) return;
        setSettlements(result.data);
      })
      .catch(() => {
        if (!isMounted) return;
        setError('No se pudieron cargar las liquidaciones');
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
      { id: 'draft', label: 'Pre-liquidacion' },
      { id: 'completed', label: 'Liquidada' },
      { id: 'cancelled', label: 'Cancelada' },
    ],
    [],
  );

  const seasonOptions = useMemo(() => {
    const seen = new Map<string, string>();
    settlements.forEach((settlement) => {
      if (settlement.season) {
        const key = String(settlement.season.id);
        if (!seen.has(key)) seen.set(key, settlement.season.name);
      }
    });

    return [
      { id: ALL_FILTER_VALUE, label: 'Todas las temporadas' },
      ...Array.from(seen.entries())
        .sort((a, b) => a[1].localeCompare(b[1], 'es', { sensitivity: 'base' }))
        .map(([id, label]) => ({ id, label })),
    ];
  }, [settlements]);

  const filteredSettlements = useMemo(() => {
    return settlements.filter((settlement) => {
      const matchesSeason =
        seasonFilter === ALL_FILTER_VALUE ||
        (settlement.season && String(settlement.season.id) === seasonFilter);
      const matchesStatus =
        statusFilter === ALL_FILTER_VALUE || settlement.status === statusFilter;

      return matchesSeason && matchesStatus;
    });
  }, [settlements, seasonFilter, statusFilter]);

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

    return `Liquidaciones-${normalizedName || producerId}-${datePart}`;
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
            ariaLabel="Imprimir listado de liquidaciones"
            onClick={() => setPrintOpen(true)}
            disabled={isLoading || filteredSettlements.length === 0}
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
              <th className="px-4 py-2 text-right font-semibold text-gray-900">Recepciones</th>
              <th className="px-4 py-2 text-right font-semibold text-gray-900">Anticipos</th>
              <th className="px-4 py-2 text-right font-semibold text-gray-900">Monto final</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-900">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredSettlements.map((settlement) => {
              const displayStatus = getDisplayStatus(settlement);
              const receptionsCount = getSettlementReceptionsCount(settlement);
              const advancesCount = getSettlementAdvancesCount(settlement);
              const amountDue = getSettlementAmountDue(settlement);

              return (
                <tr key={settlement.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-700">{settlement.id}</td>
                  <td className="px-4 py-2 text-gray-700">{getSettlementDate(settlement)}</td>
                  <td className="px-4 py-2 text-gray-700">{settlement.season?.name || '-'}</td>
                  <td className="px-4 py-2 text-right font-medium text-gray-900">{receptionsCount}</td>
                  <td className="px-4 py-2 text-right font-medium text-gray-900">{advancesCount}</td>
                  <td className="px-4 py-2 text-right font-medium text-gray-900">{clp.format(amountDue)}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClasses(displayStatus)}`}
                    >
                      {getStatusLabel(displayStatus)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!isLoading && filteredSettlements.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">
            {settlements.length === 0
              ? 'No hay liquidaciones registradas para este productor'
              : 'No hay liquidaciones para los filtros seleccionados'}
          </p>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">Cargando liquidaciones...</p>
        </div>
      )}

      <PrintDialog
        open={printOpen}
        onClose={handleClosePrint}
        title="Listado de liquidaciones del productor"
        fileName={printFileName}
        disablePrint={filteredSettlements.length === 0}
        size="custom"
        maxWidth="96vw"
        fullWidth
        scroll="body"
        zIndex={90}
        contentStyle={{ maxHeight: '95vh' }}
      >
        <ProducerSettlementsToPrint
          producerId={producerId}
          producerName={producerName}
          producerRut={producerRut}
          settlements={filteredSettlements}
          filters={{
            seasonLabel: selectedSeasonLabel,
            statusLabel: selectedStatusLabel,
          }}
        />
      </PrintDialog>
    </div>
  );
}
