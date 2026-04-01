'use client';

import React from 'react';
import Dialog from '@/shared/components/ui/Dialog/Dialog';
import Select, { Option } from '@/shared/components/ui/Select/Select';
import { TextField } from '@/shared/components/ui/TextField/TextField';
import Alert from '@/shared/components/ui/Alert/Alert';
import { Button } from '@/shared/components/ui/Button/Button';
import { createAnalysisParam } from '../actions';
import {
  AnalysisParam,
  CreateAnalysisParamPayload,
} from '../types/analysis-params.types';

interface CreateAnalysisParamDialogProps {
  open: boolean;
  parameters: AnalysisParam[];
  onClose: () => void;
  onSuccess: (createdParam: AnalysisParam) => void;
}

interface CreateAnalysisParamFormState {
  paramCode: number | null;
  start: string;
  end: string;
  percent: string;
}

const INITIAL_FORM_STATE: CreateAnalysisParamFormState = {
  paramCode: null,
  start: '',
  end: '',
  percent: '',
};

function parseNumericInput(raw: string): number {
  const normalized = raw.replace(',', '.').trim();
  const value = Number(normalized);
  return Number.isFinite(value) ? value : Number.NaN;
}

export default function CreateAnalysisParamDialog({
  open,
  parameters,
  onClose,
  onSuccess,
}: CreateAnalysisParamDialogProps) {
  const formId = 'create-analysis-param-form';
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [formData, setFormData] =
    React.useState<CreateAnalysisParamFormState>(INITIAL_FORM_STATE);

  const parameterOptions: Option[] = React.useMemo(() => {
    const byCode = new Map<number, string>();

    for (const item of parameters) {
      if (!byCode.has(item.discountCode)) {
        byCode.set(item.discountCode, item.discountName);
      }
    }

    return Array.from(byCode.entries())
      .sort((a, b) => a[1].localeCompare(b[1], 'es-CL'))
      .map(([code, name]) => ({
        id: code,
        label: `${name} (Código ${code})`,
      }));
  }, [parameters]);

  React.useEffect(() => {
    if (!open) {
      setLoading(false);
      setError(null);
      setFormData(INITIAL_FORM_STATE);
    }
  }, [open]);

  const handleNumericChange =
    (field: 'start' | 'end' | 'percent') =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const nextValue = event.target.value;
      setFormData((prev) => ({ ...prev, [field]: nextValue }));
    };

  const handleParameterChange = (value: string | number | null) => {
    setFormData((prev) => ({
      ...prev,
      paramCode: typeof value === 'number' ? value : value ? Number(value) : null,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (formData.paramCode === null) {
      setError('Debes seleccionar un parámetro de análisis');
      return;
    }

    const start = parseNumericInput(formData.start);
    const end = parseNumericInput(formData.end);
    const percent = parseNumericInput(formData.percent);

    if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(percent)) {
      setError('Debes ingresar valores numéricos válidos');
      return;
    }

    const payload: CreateAnalysisParamPayload = {
      paramCode: formData.paramCode,
      start,
      end,
      percent,
    };

    setLoading(true);
    try {
      const result = await createAnalysisParam(payload);

      if (!result.success || !result.data) {
        setError(result.error || 'No fue posible crear el rango');
        return;
      }

      onSuccess(result.data);
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'No fue posible crear el rango',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Crear Rango de Parámetro"
      size="sm"
      headerClassName="border-b border-gray-200 px-6 py-4 mb-0"
      titleClassName="p-0 text-lg font-bold text-foreground"
      bodyClassName="px-6 py-4"
      actions={
        <div className="flex gap-3 pt-4 justify-between">
          <Button
            type="button"
            variant="outlined"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" form={formId} variant="primary" loading={loading} disabled={loading}>
            Crear
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <Select
          label="Parámetro de Análisis"
          placeholder="Selecciona un parámetro"
          options={parameterOptions}
          value={formData.paramCode}
          onChange={handleParameterChange}
          disabled={loading}
          required
        />

        <TextField
          label="Inicio de Rango"
          labelAlwaysVisible
          name="start"
          type="number"
          step="0.01"
          value={formData.start}
          onChange={handleNumericChange('start')}
          disabled={loading}
          required
          placeholder="Ej: 2.34"
        />

        <TextField
          label="Fin de Rango"
          labelAlwaysVisible
          name="end"
          type="number"
          step="0.01"
          value={formData.end}
          onChange={handleNumericChange('end')}
          disabled={loading}
          required
          placeholder="Ej: 3.00"
        />

        <TextField
          label="Porcentaje de Descuento"
          labelAlwaysVisible
          name="percent"
          type="number"
          step="0.01"
          value={formData.percent}
          onChange={handleNumericChange('percent')}
          disabled={loading}
          required
          placeholder="Ej: 1.5"
        />
      </form>
    </Dialog>
  );
}
