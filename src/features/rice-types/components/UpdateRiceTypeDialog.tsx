'use client';

import React, { useEffect } from 'react';
import Dialog from '@/shared/components/ui/Dialog/Dialog';
import { TextField } from '@/shared/components/ui/TextField/TextField';
import Switch from '@/shared/components/ui/Switch/Switch';
import { Button } from '@/shared/components/ui/Button/Button';
import Alert from '@/shared/components/ui/Alert/Alert';
import { updateRiceType } from '../actions';
import { RiceType } from '../types/rice-types.types';

interface UpdateRiceTypeDialogProps {
  open: boolean;
  riceType: RiceType | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UpdateRiceTypeDialog({
  open,
  riceType,
  onClose,
  onSuccess,
}: UpdateRiceTypeDialogProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState({
    name: '',
    code: '',
    description: '',
    referencePrice: 0,
    isActive: true,
  });

  useEffect(() => {
    if (riceType && open) {
      setFormData({
        name: riceType.name,
        code: riceType.code,
        description: riceType.description || '',
        referencePrice: riceType.referencePrice || 0,
        isActive: riceType.isActive,
      });
      setError(null);
    }
  }, [riceType, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'referencePrice' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleToggle = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isActive: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!riceType) return;

    setError(null);
    setLoading(true);

    try {
      const result = await updateRiceType(riceType.id, formData);
      if (result.success) {
        onClose();
        onSuccess();
      } else {
        setError(result.error || 'Error al actualizar tipo de arroz');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar tipo de arroz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Editar Tipo de Arroz"
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <TextField
          label="Código"
          name="code"
          value={formData.code}
          onChange={handleChange}
          required
          disabled
          placeholder="Ej: DIAMANTE"
        />

        <TextField
          label="Nombre"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="Ej: Arroz Diamante"
        />

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Descripción
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Descripción del tipo de arroz"
            rows={3}
            className="w-full px-3 py-2 border border-border-light rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <TextField
          label="Precio de Referencia"
          name="referencePrice"
          type="number"
          value={formData.referencePrice.toString()}
          onChange={handleChange}
          required
          step="1"
          min="0"
        />

        <Switch
          label="Activo"
          checked={formData.isActive}
          onChange={handleToggle}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button loading={loading} type="submit">
            Guardar
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
