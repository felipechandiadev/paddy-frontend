'use client';

import React, { useState } from 'react';
import Dialog from '@/shared/components/ui/Dialog/Dialog';
import { AuditEvent } from '../types/audit.types';
import { getEventDescription } from '../constants/event-descriptions';

interface AuditEventDetailsDialogProps {
  event: AuditEvent | null;
  open: boolean;
  onClose: () => void;
}

export default function AuditEventDetailsDialog({
  event,
  open,
  onClose,
}: AuditEventDetailsDialogProps) {
  if (!event) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const renderDataSection = (
    title: string,
    data: any,
    color: 'red' | 'green'
  ) => {
    if (!data) return null;

    const parsedData =
      typeof data === 'string' ? JSON.parse(data) : data;

    if (typeof parsedData !== 'object' || parsedData === null) {
      return null;
    }

    const colorClass = color === 'red' ? 'text-red-700' : 'text-green-700';
    const bgColor =
      color === 'red'
        ? 'bg-red-50 border-l-4 border-red-300'
        : 'bg-green-50 border-l-4 border-green-300';

    return (
      <div className={`${bgColor} p-3 rounded mb-4`}>
        <h4 className={`font-bold ${colorClass} mb-3 text-sm`}>
          {title}
        </h4>
        <div className="space-y-2">
          {Object.entries(parsedData).map(([key, value]) => (
            <div key={key} className="text-sm">
              <span
                className={`font-medium ${colorClass}`}
              >
                {key}:
              </span>
              <span className="text-neutral-700 ml-2 break-words">
                {formatValue(value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const statusColors: Record<string, string> = {
    SUCCESS: 'bg-green-100 text-green-800',
    FAIL: 'bg-red-100 text-red-800',
    DENIED: 'bg-yellow-100 text-yellow-800',
  };

  const severityColors: Record<string, string> = {
    CRITICAL: 'bg-red-100 text-red-800',
    HIGH: 'bg-orange-100 text-orange-800',
    WARN: 'bg-yellow-100 text-yellow-800',
    INFO: 'bg-blue-100 text-blue-800',
  };

  const methodColors: Record<string, string> = {
    GET: 'bg-blue-100 text-blue-800',
    POST: 'bg-green-100 text-green-800',
    PUT: 'bg-amber-100 text-amber-800',
    PATCH: 'bg-amber-100 text-amber-800',
    DELETE: 'bg-red-100 text-red-800',
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Detalles del Evento #${event.id}`}
      size="xl"
      scroll="paper"
      maxHeight="90vh"
      showCloseButton
    >
      <div className="space-y-4">
        {/* Información General */}
        <div className="border-b border-neutral-200 pb-4">
          <h3 className="font-bold text-neutral-900 mb-3">
            Información General
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-medium text-neutral-500">
                Descripción
              </span>
              <p className="text-sm font-semibold text-neutral-900 mt-1">
                {event.description ||
                  getEventDescription(event.eventCode)}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-neutral-500">
                Código de Evento
              </span>
              <p className="text-sm font-mono text-neutral-900 mt-1">
                {event.eventCode}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-neutral-500">
                Fecha/Hora
              </span>
              <p className="text-sm text-neutral-900 mt-1">
                {formatDate(event.createdAt)}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-neutral-500">
                ID del Evento
              </span>
              <p className="text-sm font-mono text-neutral-900 mt-1">
                {event.id}
              </p>
            </div>
          </div>
        </div>

        {/* Estados y Métodos */}
        <div className="border-b border-neutral-200 pb-4">
          <h3 className="font-bold text-neutral-900 mb-3">
            Detalles Técnicos
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <span className="text-xs font-medium text-neutral-500">
                Método
              </span>
              <div className="mt-1">
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                    methodColors[event.method] ||
                    'bg-neutral-100 text-neutral-800'
                  }`}
                >
                  {event.method}
                </span>
              </div>
            </div>
            <div>
              <span className="text-xs font-medium text-neutral-500">
                Estado
              </span>
              <div className="mt-1">
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                    statusColors[event.status] ||
                    'bg-neutral-100 text-neutral-800'
                  }`}
                >
                  {event.status}
                </span>
              </div>
            </div>
            <div>
              <span className="text-xs font-medium text-neutral-500">
                Severidad
              </span>
              <div className="mt-1">
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                    severityColors[event.severity] ||
                    'bg-neutral-100 text-neutral-800'
                  }`}
                >
                  {event.severity}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Información del Actor */}
        <div className="border-b border-neutral-200 pb-4">
          <h3 className="font-bold text-neutral-900 mb-3">
            Información del Actor
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs font-medium text-neutral-500">
                Usuario
              </span>
              <p className="text-neutral-900 mt-1">
                {event.actorEmail || 'Sistema'}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-neutral-500">
                ID del Usuario
              </span>
              <p className="text-neutral-900 mt-1">
                {event.actorUserId || '-'}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-neutral-500">
                Rol
              </span>
              <p className="text-neutral-900 mt-1">
                {event.actorRole || '-'}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-neutral-500">
                IP
              </span>
              <p className="text-neutral-900 font-mono mt-1">
                {event.ip || '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Información de Entidad */}
        {(event.entityType || event.entityId) && (
          <div className="border-b border-neutral-200 pb-4">
            <h3 className="font-bold text-neutral-900 mb-3">
              Información de Entidad
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {event.entityType && (
                <div>
                  <span className="text-xs font-medium text-neutral-500">
                    Tipo
                  </span>
                  <p className="text-neutral-900 mt-1">
                    {event.entityType}
                  </p>
                </div>
              )}
              {event.entityId && (
                <div>
                  <span className="text-xs font-medium text-neutral-500">
                    ID
                  </span>
                  <p className="text-neutral-900 font-mono mt-1">
                    {event.entityId}
                  </p>
                </div>
              )}
              {event.route && (
                <div className="col-span-2">
                  <span className="text-xs font-medium text-neutral-500">
                    Ruta
                  </span>
                  <p className="text-neutral-900 font-mono mt-1 text-xs">
                    {event.route}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Datos Anteriores y Nuevos */}
        {(event.beforeData || event.afterData) && (
          <div className="border-b border-neutral-200 pb-4">
            <h3 className="font-bold text-neutral-900 mb-3">
              Cambios Registrados
            </h3>
            {renderDataSection(
              'Valores Anteriores',
              event.beforeData,
              'red'
            )}
            {renderDataSection(
              'Valores Nuevos',
              event.afterData,
              'green'
            )}
          </div>
        )}

        {/* Error (si existe) */}
        {event.errorMessage && (
          <div className="border-l-4 border-red-300 bg-red-50 p-3 rounded">
            <h4 className="font-bold text-red-700 mb-2 text-sm">
              Mensaje de Error
            </h4>
            <p className="text-red-900 text-sm break-words">
              {event.errorMessage}
            </p>
          </div>
        )}

        {/* Metadata */}
        {event.metadata && typeof event.metadata === 'object' && (
          <div className="border-l-4 border-blue-300 bg-blue-50 p-3 rounded">
            <h4 className="font-bold text-blue-700 mb-2 text-sm">
              Metadatos
            </h4>
            <div className="space-y-1 text-sm">
              {Object.entries(event.metadata).map(([key, value]) => (
                <div key={key}>
                  <span className="font-medium text-blue-700">
                    {key}:
                  </span>
                  <span className="text-blue-900 ml-2">
                    {formatValue(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* IDs de Correlación */}
        {(event.requestId || event.correlationId) && (
          <div className="border-t border-neutral-200 pt-4 text-xs">
            <div className="space-y-1 text-neutral-600 font-mono">
              {event.requestId && (
                <div>
                  <span className="font-medium">Request ID:</span>
                  <span className="ml-2">{event.requestId}</span>
                </div>
              )}
              {event.correlationId && (
                <div>
                  <span className="font-medium">Correlation ID:</span>
                  <span className="ml-2">{event.correlationId}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
