'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TextField } from '@/shared/components/ui/TextField/TextField';
import Select from '@/shared/components/ui/Select/Select';
import { Button } from '@/shared/components/ui/Button/Button';

const severityOptions = [
  { id: 'CRITICAL', label: 'Crítico' },
  { id: 'HIGH', label: 'Alto' },
  { id: 'WARN', label: 'Advertencia' },
  { id: 'INFO', label: 'Información' },
];

const statusOptions = [
  { id: 'SUCCESS', label: 'Éxito' },
  { id: 'FAIL', label: 'Fallo' },
  { id: 'DENIED', label: 'Acceso Denegado' },
];

const categoryOptions = [
  { id: 'AUTH', label: 'Autenticación' },
  { id: 'USERS', label: 'Usuarios' },
  { id: 'PRODUCERS', label: 'Productores' },
  { id: 'CONFIG', label: 'Configuración' },
  { id: 'OPERATIONS', label: 'Operaciones' },
  { id: 'FINANCE', label: 'Finanzas' },
  { id: 'ANALYTICS', label: 'Analytics' },
  { id: 'SECURITY', label: 'Seguridad' },
  { id: 'SYSTEM', label: 'Sistema' },
];

interface AuditFiltersProps {
  onFiltersChange?: (filters: Record<string, string>) => void;
}

export default function AuditFilters({ onFiltersChange }: AuditFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
  const [severity, setSeverity] = useState(searchParams.get('severity') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [eventCode, setEventCode] = useState(searchParams.get('eventCode') || '');
  const [actorEmail, setActorEmail] = useState(searchParams.get('actorEmail') || '');
  const [correlationId, setCorrelationId] = useState(searchParams.get('correlationId') || '');

  const handleApplyFilters = () => {
    const params = new URLSearchParams();

    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (severity) params.append('severity', severity);
    if (status) params.append('status', status);
    if (category) params.append('category', category);
    if (eventCode) params.append('eventCode', eventCode);
    if (actorEmail) params.append('actorEmail', actorEmail);
    if (correlationId) params.append('correlationId', correlationId);

    const queryString = params.toString();
    router.push(`/paddy/audit${queryString ? `?${queryString}` : ''}`);

    onFiltersChange?.({
      startDate,
      endDate,
      severity,
      status,
      category,
      eventCode,
      actorEmail,
      correlationId,
    });
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSeverity('');
    setStatus('');
    setCategory('');
    setEventCode('');
    setActorEmail('');
    setCorrelationId('');

    router.push('/paddy/audit');
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Filtros</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Rango de fechas */}
        <TextField
          label="Desde"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />

        <TextField
          label="Hasta"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />

        {/* Severidad */}
        <Select
          label="Severidad"
          options={severityOptions}
          value={severity}
          onChange={(value) => setSeverity(value ? String(value) : '')}
          allowClear
        />

        {/* Estado */}
        <Select
          label="Estado"
          options={statusOptions}
          value={status}
          onChange={(value) => setStatus(value ? String(value) : '')}
          allowClear
        />

        {/* Categoría */}
        <Select
          label="Categoría"
          options={categoryOptions}
          value={category}
          onChange={(value) => setCategory(value ? String(value) : '')}
          allowClear
        />

        {/* Email del actor */}
        <TextField
          label="Usuario (Email)"
          type="email"
          placeholder="admin@ayg.cl"
          value={actorEmail}
          onChange={(e) => setActorEmail(e.target.value)}
        />

        {/* Event Code */}
        <TextField
          label="Código de evento"
          placeholder="ej: AUTH.LOGIN"
          value={eventCode}
          onChange={(e) => setEventCode(e.target.value)}
        />

        {/* Correlation ID */}
        <TextField
          label="Correlation ID"
          placeholder="ej: 12345..."
          value={correlationId}
          onChange={(e) => setCorrelationId(e.target.value)}
        />
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3 justify-end">
        <Button
          variant="outlined"
          onClick={handleClearFilters}
          disabled={!startDate && !endDate && !severity && !status && !category && !eventCode && !actorEmail && !correlationId}
        >
          Limpiar filtros
        </Button>
        <Button variant="primary" onClick={handleApplyFilters}>
          Aplicar filtros
        </Button>
      </div>
    </div>
  );
}
