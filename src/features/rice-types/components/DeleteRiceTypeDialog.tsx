'use client';

import React from 'react';
import Dialog from '@/shared/components/ui/Dialog/Dialog';
import { Button } from '@/shared/components/ui/Button/Button';
import Alert from '@/shared/components/ui/Alert/Alert';
import { deleteRiceType } from '../actions';
import { RiceType } from '../types/rice-types.types';

interface DeleteRiceTypeDialogProps {
  open: boolean;
  riceType: RiceType | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteRiceTypeDialog({
  open,
  riceType,
  onClose,
  onSuccess,
}: DeleteRiceTypeDialogProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleDelete = async () => {
    if (!riceType) return;

    setError(null);
    setLoading(true);

    try {
      const result = await deleteRiceType(riceType.id);
      if (result.success) {
        onClose();
        onSuccess();
      } else {
        setError(result.error || 'Error al eliminar tipo de arroz');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar tipo de arroz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Eliminar Tipo de Arroz"
      maxWidth="sm"
    >
      <div className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <p className="text-gray-700">
          ¿Estás seguro que deseas eliminar el tipo de arroz{' '}
          <strong>{riceType?.name}</strong>? Esta acción no se puede deshacer.
        </p>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="danger" loading={loading} onClick={handleDelete}>
            Eliminar
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
