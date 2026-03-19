'use client';

import React, { useMemo } from 'react';
import DataGrid, { DataGridColumn } from '@/shared/components/ui/DataGrid';
import { AuditEvent } from '../types/audit.types';

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
          return date.toLocaleString('es-CL');
        },
      },
      {
        field: 'eventCode',
        headerName: 'Evento',
        flex: 1,
        minWidth: 220,
        sortable: true,
      },
      {
        field: 'category',
        headerName: 'Categoría',
        width: 140,
        sortable: true,
      },
      {
        field: 'action',
        headerName: 'Acción',
        width: 140,
        sortable: true,
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
        field: 'ip',
        headerName: 'IP',
        width: 140,
        sortable: true,
        valueGetter: (params) => params.row.ip || 'N/A',
      },
      {
        field: 'correlationId',
        headerName: 'Correlation ID',
        width: 220,
        sortable: false,
        renderCell: ({ value }) => (
          <span
            style={{
              color: '#0ea5e9',
              cursor: 'pointer',
              fontSize: '12px',
            }}
            title="Correlation ID del request"
          >
            {value ? value.substring(0, 12) + '...' : 'N/A'}
          </span>
        ),
      },
      {
        field: 'route',
        headerName: 'Ruta',
        flex: 1,
        minWidth: 240,
        sortable: true,
      },
      {
        field: 'errorMessage',
        headerName: 'Error',
        flex: 1,
        minWidth: 300,
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
      rows={events}
      totalRows={events.length}
      title="Eventos de Auditoría"
      height="85vh"
      showSearch={true}
      showSortButton={true}
      showBorder={false}
      showExportButton={false}
    />
  );
}
