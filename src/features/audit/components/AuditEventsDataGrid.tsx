'use client';

import React, { useMemo, useState } from 'react';
import { formatDateTimeLocale } from '@/lib/date-formatter';
import DataGrid, { DataGridColumn } from '@/shared/components/ui/DataGrid';
import IconButton from '@/shared/components/ui/IconButton/IconButton';
import { AuditEvent } from '../types/audit.types';
import { getEventDescription } from '../constants/event-descriptions';
import AuditEventDetailsDialog from './AuditEventDetailsDialog';

interface AuditEventsDataGridProps {
  events: AuditEvent[];
  loading?: boolean;
  onDetailClick?: (event: AuditEvent) => void;
  onCorrelationClick?: (correlationId: string) => void;
  error?: string | null;
}

const severityColors: Record<string, string> = {
  CRITICAL: '#dc2626',
  HIGH: '#f97316',
  WARN: '#eab308',
  INFO: '#0ea5e9',
};

const statusColors: Record<string, string> = {
  SUCCESS: '#16a34a',
  FAIL: '#dc2626',
  DENIED: '#f97316',
};

const methodColors: Record<string, string> = {
  GET: '#3b82f6',
  POST: '#10b981',
  PUT: '#f59e0b',
  PATCH: '#f59e0b',
  DELETE: '#ef4444',
};

export default function AuditEventsDataGrid({
  events,
  loading = false,
  onDetailClick,
  onCorrelationClick,
  error,
}: AuditEventsDataGridProps) {
  // Ensure events is always an array
  const safeEvents = Array.isArray(events) ? events : [];
  
  // Estado para el dialog de detalles
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const openDetails = (event: AuditEvent) => {
    setSelectedEvent(event);
    setDetailsOpen(true);
  };

  const columns: DataGridColumn[] = useMemo(
    () => [
      {
        field: 'id',
        headerName: 'ID',
        flex: 0.5,
        minWidth: 70,
        type: 'number',
        sortable: true,
      },
      {
        field: 'createdAt',
        headerName: 'Fecha/Hora',
        flex: 1,
        minWidth: 120,
        sortable: true,
        valueGetter: (params: any) => {
          return formatDateTimeLocale(params.row.createdAt);
        },
      },
      {
        field: 'description',
        headerName: 'Descripción',
        flex: 2,
        minWidth: 180,
        sortable: false,
        valueGetter: (params: any) => params.row.description || getEventDescription(params.row.eventCode),
        renderCell: ({ value }: { value: any }) => (
          <span className="text-neutral-900 font-medium">
            {value || '-'}
          </span>
        ),
      },
      {
        field: 'method',
        headerName: 'Método',
        flex: 0.7,
        minWidth: 90,
        sortable: true,
        renderCell: ({ value }: { value: any }) => (
          <span
            style={{
              backgroundColor: methodColors[value] || '#6b7280',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            {value}
          </span>
        ),
      },
      {
        field: 'status',
        headerName: 'Estado',
        flex: 0.7,
        minWidth: 80,
        sortable: true,
        renderCell: ({ value }: { value: any }) => (
          <span
            style={{
              backgroundColor: statusColors[value] || '#6b7280',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            {value}
          </span>
        ),
      },
      {
        field: 'severity',
        headerName: 'Severidad',
        flex: 0.7,
        minWidth: 80,
        sortable: true,
        renderCell: ({ value }: { value: any }) => (
          <span
            style={{
              backgroundColor: severityColors[value] || '#6b7280',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            {value}
          </span>
        ),
      },
      {
        field: 'actorEmail',
        headerName: 'Usuario',
        flex: 1,
        minWidth: 120,
        sortable: true,
        valueGetter: (params: any) => params.row.actorEmail || 'Sistema',
      },
      {
        field: 'route',
        headerName: 'Ruta',
        flex: 1,
        minWidth: 120,
        sortable: true,
        hide: true,
      },
      {
        field: 'actions',
        headerName: 'Acciones',
        flex: 0.5,
        minWidth: 70,
        sortable: false,
        headerAlign: 'center',
        align: 'center',
        renderCell: ({ row }: { row: any }) => (
          <IconButton
            icon="description"
            variant="basicSecondary"
            size="sm"
            onClick={() => openDetails(row)}
            ariaLabel="Ver detalles del evento"
            title="Ver todos los detalles del evento"
          />
        ),
      },
    ],
    [onCorrelationClick],
  );

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#dc2626' }}>
        <p>Error al cargar eventos: {error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
        <p>Cargando eventos de auditoría...</p>
      </div>
    );
  }

  return (
    <>
      <DataGrid
        columns={columns}
        rows={safeEvents}
        totalRows={safeEvents.length}
        title="Eventos de Auditoría"
        height="85vh"
        showSearch={true}
        showSortButton={true}
        showBorder={false}
        showExportButton={false}
      />
      <AuditEventDetailsDialog
        event={selectedEvent}
        open={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedEvent(null);
        }}
      />
    </>
  );
}
