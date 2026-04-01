'use client';

import { useEffect, useMemo, useState } from 'react';
import Select from '@/shared/components/ui/Select/Select';
import IconButton from '@/shared/components/ui/IconButton/IconButton';
import { PrintDialog } from '@/shared/components/PrintDialog';
import { fetchProducerReceptions } from '../../actions/producers.action';
import { ProducerReceptionItem } from '../../types/producers.types';
import ProducerReceptionsToPrint from './ProducerReceptionsToPrint';

interface ReceptionsSectionProps {
  producerId: number;
  producerName: string;
  producerRut?: string;
}

const ALL_FILTER_VALUE = 'all';
type StatusFilterValue = 'all' | 'cancelled' | 'analyzed' | 'settled';

function getSeasonFilterValue(reception: ProducerReceptionItem): string {
  if (reception.seasonId && Number.isFinite(reception.seasonId)) {
    return `id:${reception.seasonId}`;
  }

  return `name:${reception.seasonName}`;
}

function getRiceTypeFilterValue(reception: ProducerReceptionItem): string {
  if (reception.riceTypeId && Number.isFinite(reception.riceTypeId)) {
    return `id:${reception.riceTypeId}`;
  }

  return `name:${reception.riceTypeName}`;
}

function getStatusBadgeClasses(status: ProducerReceptionItem['status']): string {
  if (status === 'cancelled') {
    return 'bg-red-100 text-red-700';
  }

  if (status === 'analyzed') {
    return 'bg-blue-100 text-blue-800';
  }

  if (status === 'settled') {
    return 'bg-green-100 text-green-800';
  }

  return 'bg-red-100 text-red-700';
}

function getStatusLabel(status: ProducerReceptionItem['status']): string {
  if (status === 'cancelled') {
    return 'Cancelada';
  }

  if (status === 'analyzed') {
    return 'Analizada';
  }

  if (status === 'settled') {
    return 'Liquidada';
  }

  return 'Cancelada';
}

export default function ReceptionsSection({
  producerId,
  producerName,
  producerRut,
}: ReceptionsSectionProps) {
  const [receptions, setReceptions] = useState<ProducerReceptionItem[]>([]);
  const [seasonFilter, setSeasonFilter] = useState<string>(ALL_FILTER_VALUE);
  const [riceTypeFilter, setRiceTypeFilter] = useState<string>(ALL_FILTER_VALUE);
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>(ALL_FILTER_VALUE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printOpen, setPrintOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadReceptions = async () => {
      setIsLoading(true);
      setError(null);

      const result = await fetchProducerReceptions(
        producerId,
        statusFilter === ALL_FILTER_VALUE ? undefined : statusFilter,
      );

      if (!isMounted) {
        return;
      }

      if (!result.success) {
        setReceptions([]);
        setError(result.error || 'No se pudieron cargar las recepciones del productor');
        setIsLoading(false);
        return;
      }

      setReceptions(result.data);
      setIsLoading(false);
    };

    void loadReceptions();

    return () => {
      isMounted = false;
    };
  }, [producerId, statusFilter]);

  const statusOptions = useMemo(
    () => [
      { id: ALL_FILTER_VALUE, label: 'Todos los estados' },
      { id: 'cancelled', label: 'Cancelada' },
      { id: 'analyzed', label: 'Analizada' },
      { id: 'settled', label: 'Liquidada' },
    ],
    [],
  );

  const seasonOptions = useMemo(() => {
    const seen = new Map<string, string>();

    receptions.forEach((reception) => {
      const key = getSeasonFilterValue(reception);
      if (!seen.has(key)) {
        seen.set(key, reception.seasonName || 'Sin temporada');
      }
    });

    return [
      { id: ALL_FILTER_VALUE, label: 'Todas las temporadas' },
      ...Array.from(seen.entries())
        .sort((a, b) => a[1].localeCompare(b[1], 'es', { sensitivity: 'base' }))
        .map(([id, label]) => ({ id, label })),
    ];
  }, [receptions]);

  const riceTypeOptions = useMemo(() => {
    const seen = new Map<string, string>();

    receptions.forEach((reception) => {
      const key = getRiceTypeFilterValue(reception);
      if (!seen.has(key)) {
        seen.set(key, reception.riceTypeName || 'Sin tipo');
      }
    });

    return [
      { id: ALL_FILTER_VALUE, label: 'Todos los tipos de arroz' },
      ...Array.from(seen.entries())
        .sort((a, b) => a[1].localeCompare(b[1], 'es', { sensitivity: 'base' }))
        .map(([id, label]) => ({ id, label })),
    ];
  }, [receptions]);

  const filteredReceptions = useMemo(() => {
    return receptions.filter((reception) => {
      const matchesSeason =
        seasonFilter === ALL_FILTER_VALUE ||
        getSeasonFilterValue(reception) === seasonFilter;

      const matchesRiceType =
        riceTypeFilter === ALL_FILTER_VALUE ||
        getRiceTypeFilterValue(reception) === riceTypeFilter;

      const matchesStatus =
        statusFilter === ALL_FILTER_VALUE || reception.status === statusFilter;

      return matchesSeason && matchesRiceType && matchesStatus;
    });
  }, [receptions, seasonFilter, riceTypeFilter, statusFilter]);

  const selectedSeasonLabel =
    seasonOptions.find((option) => String(option.id) === seasonFilter)?.label ||
    'Todas las temporadas';

  const selectedRiceTypeLabel =
    riceTypeOptions.find((option) => String(option.id) === riceTypeFilter)?.label ||
    'Todos los tipos de arroz';

  const selectedStatusLabel =
    statusOptions.find((option) => String(option.id) === statusFilter)?.label ||
    'Todos los estados';

  const printFileName = useMemo(() => {
    const normalizedName = producerName
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9-_]/g, '');
    const datePart = new Date().toISOString().slice(0, 10);

    return `Recepciones-${normalizedName || producerId}-${datePart}`;
  }, [producerId, producerName]);

  const handleSeasonChange = (value: string | number | null) => {
    setSeasonFilter(String(value || ALL_FILTER_VALUE));
  };

  const handleRiceTypeChange = (value: string | number | null) => {
    setRiceTypeFilter(String(value || ALL_FILTER_VALUE));
  };

  const handleStatusChange = (value: string | number | null) => {
    const normalized = String(value || ALL_FILTER_VALUE) as StatusFilterValue;
    setStatusFilter(normalized);
  };

  const handleClosePrint = () => {
    setPrintOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
          <Select
            label="Temporada"
            options={seasonOptions}
            value={seasonFilter}
            onChange={handleSeasonChange}
            disabled={isLoading}
          />
          <Select
            label="Tipo de Arroz"
            options={riceTypeOptions}
            value={riceTypeFilter}
            onChange={handleRiceTypeChange}
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
            ariaLabel="Imprimir listado"
            onClick={() => setPrintOpen(true)}
            disabled={isLoading || filteredReceptions.length === 0}
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
              <th className="px-4 py-2 text-left font-semibold text-gray-900">Tipo Arroz</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-900">Patente</th>
              <th className="px-4 py-2 text-right font-semibold text-gray-900">Peso Neto</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-900">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredReceptions.map((reception) => (
              <tr key={reception.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-700">{reception.guide || '-'}</td>
                <td className="px-4 py-2 text-gray-700">
                  {reception.createdAt
                    ? new Date(reception.createdAt).toLocaleDateString('es-CL')
                    : '-'}
                </td>
                <td className="px-4 py-2 text-gray-700">{reception.seasonName || '-'}</td>
                <td className="px-4 py-2 text-gray-700">{reception.riceTypeName || '-'}</td>
                <td className="px-4 py-2 text-gray-700 uppercase">{reception.licensePlate || '-'}</td>
                <td className="px-4 py-2 text-right font-medium text-gray-900">
                  {Math.round(reception.netWeight).toLocaleString('es-CL')} kg
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClasses(
                      reception.status,
                    )}`}
                  >
                    {getStatusLabel(reception.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!isLoading && filteredReceptions.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">
            {receptions.length === 0
              ? 'No hay recepciones registradas para este productor'
              : 'No hay recepciones para los filtros seleccionados'}
          </p>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">Cargando recepciones...</p>
        </div>
      )}

      <PrintDialog
        open={printOpen}
        onClose={handleClosePrint}
        title="Listado de recepciones del productor"
        fileName={printFileName}
        disablePrint={filteredReceptions.length === 0}
        size="custom"
        maxWidth="96vw"
        fullWidth
        scroll="body"
        zIndex={90}
        contentStyle={{ maxHeight: '95vh' }}
      >
        <ProducerReceptionsToPrint
          producerId={producerId}
          producerName={producerName}
          producerRut={producerRut}
          receptions={filteredReceptions}
          filters={{
            seasonLabel: selectedSeasonLabel,
            riceTypeLabel: selectedRiceTypeLabel,
            statusLabel: selectedStatusLabel,
          }}
        />
      </PrintDialog>
    </div>
  );
}
