'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/shared/components/ui/Button/Button';
import Alert from '@/shared/components/ui/Alert/Alert';
import { Season } from '../types/seasons.types';

interface DeleteSeasonDialogProps {
  open: boolean;
  season: Season | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function DeleteSeasonDialog({ open, season, onClose, onSuccess }: DeleteSeasonDialogProps) {
  const { data: session } = useSession();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`http://localhost:3000/api/v1/configuration/seasons/${season?.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.user?.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar temporada');
      }

      setError('');
      setIsLoading(false);
      onClose();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-foreground">Eliminar Temporada</h2>
        </div>

        <div className="px-6 py-4 space-y-4">
          <p className="text-text-secondary">
            ¿Está seguro de que desea eliminar la temporada <strong>{season?.name}</strong>?
          </p>

          {error && <Alert variant="error">{error}</Alert>}

          <div className="flex gap-3 pt-4 justify-between">
            <Button variant="outlined" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
