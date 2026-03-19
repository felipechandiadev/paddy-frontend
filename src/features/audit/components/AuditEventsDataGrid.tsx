'use client';

import React, { useMemo } from 'react';
import DataGrid, { DataGridColumn } from '@/shared/components/ui/DataGrid';
import { AuditEvent } from '../types/audit.types';
import { getEventDescription } from '../constants/event-descriptions';

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

  const columns: DataGridColumn[] = useMemo(
    () => [
      {
        field: 'id',
        headerName: 'ID',
        width: 70,
        type: 'number',
        sortable: true,
      },
      {
        field: 'createdAt',
        headerName: 'Fecha/Hora',
        width: 180,
        sortable: true,
        valueGetter: (params) => {
          const date = new Date(params.row.createdAt);
          return date.toLocaleString('es-CL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          });
        },
      },
      {
        field: 'description',
        headerName: 'Descripción',
        width: 320,
        sortable: false,
        valueGetter: (params) => params.row.description || getEventDescription(params.row.eventCode),
        renderCell: ({ value }) => (
          <span className="text-neutral-900 font-medium">
            {value || '-'}
          </span>
        ),
      },
      {
        field: 'method',
        headerName: 'Método',
        width: 90,
        sortable: true,
        renderCell: ({ value }) => (
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
        width: 100,
        sortable: true,
        renderCell: ({ value }) => (
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
        width: 120,
        sortable: true,
        renderCell: ({ value }) => (
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
        width: 200,
        sortable: true,
        valueGetter: (params) => params.row.actorEmail || 'Sistema',
      },
      {
        field: 'route',
        headerName: 'Ruta',
        width: 280,
        sortable: true,
      },
      {
        field: 'errorMessage',
        headerName: 'Error',
        width: 320,
        sortable: false,
        renderCell: ({ value }) => (
          <span style={{ fontSize: '12px', color: value ? '#dc2626' : '#9ca3af' }}>
            {value || '-'}
          </span>
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
  );
}
