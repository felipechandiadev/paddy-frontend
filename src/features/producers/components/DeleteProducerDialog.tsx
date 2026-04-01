'use client';

import { useState } from 'react';
import { deleteProducer } from '../actions/producers.action';
import { Producer } from '../types/producers.types';

interface DeleteProducerDialogProps {
  open: boolean;
  producer: Producer | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function DeleteProducerDialog({ open, producer, onClose, onSuccess }: DeleteProducerDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (!producer) return;

    setIsLoading(true);
    setError('');

    const result = await deleteProducer(producer.id);

    if (result.success) {
      onSuccess?.();
      onClose();
    } else {
      setError(result.error || 'Error al eliminar productor');
    }

    setIsLoading(false);
  };

  if (!open || !producer) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-foreground">Eliminar Productor</h2>
        </div>

        <div className="px-6 py-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <p className="text-sm text-foreground">
            ¿Estás seguro de que deseas eliminar al productor <strong>{producer.name}</strong>?
          </p>
          <p className="text-xs text-neutral-500">
            Esta acción no se puede deshacer.
          </p>
        </div>

        <div className="flex gap-3 px-6 py-4 justify-between border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-red-500 text-white rounded-full text-sm font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}
