'use client';

import React from 'react';
import Dialog from '@/shared/components/ui/Dialog/Dialog';
import { Button } from '@/shared/components/ui/Button/Button';
import Alert from '@/shared/components/ui/Alert/Alert';
import { deleteTemplate } from '../actions';
import { Template } from '../types/templates.types';

interface DeleteTemplateDialogProps {
  open: boolean;
  template: Template | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteTemplateDialog({
  open,
  template,
  onClose,
  onSuccess,
}: DeleteTemplateDialogProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleDelete = async () => {
    if (!template) return;

    setError(null);
    setLoading(true);

    try {
      const result = await deleteTemplate(template.id);
      if (result.success) {
        onClose();
        onSuccess();
      } else {
        setError(result.error || 'Error al eliminar plantilla');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar plantilla');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Eliminar Plantilla"
      maxWidth="sm"
    >
      <div className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <p className="text-gray-700">
          ¿Estás seguro que deseas eliminar la plantilla{' '}
          <strong>{template?.name}</strong>? Esta acción no se puede deshacer.
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
