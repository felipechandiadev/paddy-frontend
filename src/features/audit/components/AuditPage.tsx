'use client';

import React, { useState } from 'react';
import AuditEventsDataGrid from './AuditEventsDataGrid';
import AuditFilters from './AuditFilters';
import { AuditEvent } from '../types/audit.types';
import Dialog from '@/shared/components/ui/Dialog/Dialog';
import Alert from '@/shared/components/ui/Alert/Alert';

interface AuditPageProps {
  initialEvents: AuditEvent[];
  totalEvents: number;
  totalPages: number;
  currentPage: number;
}

export default function AuditPage({
  initialEvents,
  totalEvents,
  totalPages,
  currentPage,
}: AuditPageProps) {
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const handleEventDetail = (event: AuditEvent) => {
    setSelectedEvent(event);
    setDetailDialogOpen(true);
  };

  const handleCorrelationClick = (correlationId: string) => {
    // This could navigate to a filtered view or open a dialog
    // For now, we'll just copy to clipboard
    navigator.clipboard.writeText(correlationId);
    alert(`Correlation ID copied: ${correlationId}`);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Auditoría del Sistema</h1>
        <p className="text-neutral-600">
          Log de eventos y acciones del sistema. Total de eventos: {totalEvents}
        </p>
      </div>

      {/* Filtros */}
      <AuditFilters />

      {/* DataGrid o mensaje vacío */}
      {initialEvents.length === 0 ? (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <p className="text-neutral-600 mb-4">No se encontraron eventos que coincidan con los filtros aplicados.</p>
          <p className="text-sm text-neutral-500">
            Intenta ajustar los filtros o <a href="/paddy/audit" className="text-blue-600 hover:underline">borrar los filtros</a> para ver todos los eventos.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <AuditEventsDataGrid
            events={initialEvents}
            onDetailClick={handleEventDetail}
            onCorrelationClick={handleCorrelationClick}
          />
        </div>
      )}

      {/* Información de paginación */}
      {totalPages > 1 && (
        <div className="mt-4 text-center text-sm text-neutral-600">
          Página {currentPage} de {totalPages}
        </div>
      )}

      {/* Detail Dialog */}
      {selectedEvent && (
        <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} title="Detalle del Evento">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-neutral-600">ID</label>
                <p className="text-neutral-900">{selectedEvent.id}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-600">Evento</label>
                <p className="text-neutral-900">{selectedEvent.eventCode}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-600">Categoría</label>
                <p className="text-neutral-900">{selectedEvent.category}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-600">Acción</label>
                <p className="text-neutral-900">{selectedEvent.action}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-600">Estado</label>
                <p className="text-neutral-900">{selectedEvent.status}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-600">Severidad</label>
                <p className="text-neutral-900">{selectedEvent.severity}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-600">Usuario</label>
                <p className="text-neutral-900">{selectedEvent.actorEmail || 'Sistema'}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-600">Rol</label>
                <p className="text-neutral-900">{selectedEvent.actorRole || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-600">IP</label>
                <p className="text-neutral-900">{selectedEvent.ip || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-600">Método</label>
                <p className="text-neutral-900">{selectedEvent.method}</p>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-neutral-600">Ruta</label>
                <p className="text-neutral-900 break-all">{selectedEvent.route}</p>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-neutral-600">Fecha/Hora</label>
                <p className="text-neutral-900">{new Date(selectedEvent.createdAt).toLocaleString('es-CL')}</p>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-neutral-600">Request ID</label>
                <p className="text-neutral-900 break-all font-mono text-xs">{selectedEvent.requestId}</p>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-neutral-600">Correlation ID</label>
                <p className="text-neutral-900 break-all font-mono text-xs">{selectedEvent.correlationId}</p>
              </div>
            </div>

            {selectedEvent.errorMessage && (
              <Alert variant="error">
                {selectedEvent.errorMessage}
              </Alert>
            )}
          </div>
        </Dialog>
      )}
    </div>
  );
}
