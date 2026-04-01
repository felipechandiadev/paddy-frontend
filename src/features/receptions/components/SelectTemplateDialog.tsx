'use client';

import React, { useState, useEffect } from 'react';
import Dialog from '@/shared/components/ui/Dialog/Dialog';
import { Button } from '@/shared/components/ui/Button/Button';
import Alert from '@/shared/components/ui/Alert/Alert';
import { fetchTemplates } from '../actions/fetchTemplates.action';

interface Template {
  id: number;
  name: string;
  description?: string;
}

interface SelectTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (templateId: number) => void | Promise<void>;
}

export default function SelectTemplateDialog({ open, onClose, onSelect }: SelectTemplateDialogProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectLoading, setSelectLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchTemplates();
      setTemplates(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar plantillas');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async () => {
    if (selectedId) {
      setSelectLoading(true);
      try {
        await Promise.resolve(onSelect(selectedId));
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al seleccionar plantilla');
      } finally {
        setSelectLoading(false);
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Seleccionar Plantilla" maxWidth="sm">
      <div className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        {loading ? (
          <div className="py-6 text-center text-gray-500">Cargando plantillas...</div>
        ) : templates.length === 0 ? (
          <div className="py-6 text-center text-gray-500">No hay plantillas disponibles</div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {templates.map((template) => (
              <div
                key={template.id}
                onClick={() => setSelectedId(template.id)}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedId === template.id
                    ? 'bg-blue-50 border-blue-500 border-2'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">{template.name}</div>
                {template.description && (
                  <div className="text-sm text-gray-600 mt-1">{template.description}</div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="secondary" onClick={onClose} disabled={loading || selectLoading} className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={handleSelect}
            disabled={!selectedId || loading || selectLoading}
            loading={selectLoading}
            className="flex-1"
          >
            Seleccionar
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
