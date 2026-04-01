'use client';

import React from 'react';
import Dialog from '@/shared/components/ui/Dialog/Dialog';
import { TextField } from '@/shared/components/ui/TextField/TextField';
import Alert from '@/shared/components/ui/Alert/Alert';
import { Button } from '@/shared/components/ui/Button/Button';
import { updateAnalysisParam } from '../actions';
import { AnalysisParam } from '../types/analysis-params.types';

interface UpdateAnalysisParamDialogProps {
  open: boolean;
  analysisParam: AnalysisParam | null;
  onClose: () => void;
  onSuccess: (updatedParam: AnalysisParam) => void;
}

interface UpdateAnalysisParamFormState {
  start: string;
  end: string;
  percent: string;
}

const INITIAL_FORM_STATE: UpdateAnalysisParamFormState = {
  start: '',
  end: '',
  percent: '',
};

function parseNumericInput(raw: string): number {
  const normalized = raw.replace(',', '.').trim();
  const value = Number(normalized);
  return Number.isFinite(value) ? value : Number.NaN;
}

export default function UpdateAnalysisParamDialog({
  open,
  analysisParam,
  onClose,
  onSuccess,
}: UpdateAnalysisParamDialogProps) {
  const formId = 'update-analysis-param-form';
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [formData, setFormData] =
    React.useState<UpdateAnalysisParamFormState>(INITIAL_FORM_STATE);

  React.useEffect(() => {
    if (!open) {
      setLoading(false);
      setError(null);
      setFormData(INITIAL_FORM_STATE);
      return;
    }

    if (analysisParam) {
      setError(null);
      setFormData({
        start: analysisParam.rangeStart.toString(),
        end: analysisParam.rangeEnd.toString(),
        percent: analysisParam.discountPercent.toString(),
      });
    }
  }, [open, analysisParam]);

  const handleNumericChange =
    (field: 'start' | 'end' | 'percent') =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const nextValue = event.target.value;
      setFormData((prev) => ({ ...prev, [field]: nextValue }));
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!analysisParam) {
      setError('No fue posible identificar el parámetro a editar');
      return;
    }

    const start = parseNumericInput(formData.start);
    const end = parseNumericInput(formData.end);
    const percent = parseNumericInput(formData.percent);

    if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(percent)) {
      setError('Debes ingresar valores numéricos válidos');
      return;
    }

    if (end <= start) {
      setError('El inicio del rango debe ser menor que el fin del rango');
      return;
    }

    setLoading(true);

    try {
      const result = await updateAnalysisParam(analysisParam.id, {
        paramCode: analysisParam.discountCode,
        start,
        end,
        percent,
      });

      if (!result.success || !result.data) {
        setError(result.error || 'No fue posible actualizar el rango');
        return;
      }

      onSuccess(result.data);
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'No fue posible actualizar el rango',
      );
    } finally {
      setLoading(false);
    }
  };

  const parameterLabel = analysisParam
    ? `${analysisParam.discountName} (Código ${analysisParam.discountCode})`
    : '';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Editar Rango de Parámetro"
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
          <Button
            type="submit"
            form={formId}
            variant="primary"
            loading={loading}
            disabled={loading || !analysisParam}
          >
            Guardar
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <TextField
          label="Parámetro de Análisis"
          labelAlwaysVisible
          name="parameterLabel"
          type="text"
          value={parameterLabel}
          onChange={() => {}}
          disabled
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