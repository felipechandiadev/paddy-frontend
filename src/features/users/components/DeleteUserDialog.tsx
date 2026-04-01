'use client';

import { useState, useEffect } from 'react';
import { deleteUser } from '../actions/deleteUser.action';
import { Button } from '@/shared/components/ui/Button/Button';
import Alert from '@/shared/components/ui/Alert/Alert';
import { User } from '../types/users.types';

interface DeleteUserDialogProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
}

export default function DeleteUserDialog({ open, user, onClose }: DeleteUserDialogProps) {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setError('');
    }
  }, [open]);

  const handleDelete = async () => {
    if (!user) return;

    setIsLoading(true);
    const result = await deleteUser(user.id);

    if (!result.success) {
      setError(result.error || 'Error al eliminar usuario');
      setIsLoading(false);
      return;
    }

    // Limpiar y cerrar
    setError('');
    setIsLoading(false);
    onClose();
  };

  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-foreground">Eliminar Usuario</h2>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          <p className="text-foreground">
            ¿Estás seguro de que deseas eliminar el usuario{' '}
            <span className="font-bold">{user.email}</span>?
          </p>
          <p className="text-sm text-neutral-600">
            Esta acción no se puede deshacer.
          </p>

          {/* Error Alert */}
          {error && <Alert variant="error">{error}</Alert>}

          {/* Footer */}
          <div className="flex gap-3 pt-4 justify-between">
            <Button
              variant="outlined"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              className="bg-red-500 text-white hover:bg-red-600 rounded-full"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
