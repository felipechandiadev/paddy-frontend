'use client';

import { useState } from 'react';
import { removeBankAccount } from '../../actions/producers.action';
import { BankAccount, Producer } from '../../types/producers.types';

interface DeleteBankAccountDialogProps {
  open: boolean;
  producerId: number;
  account: BankAccount | null;
  accountIndex: number;
  onClose: () => void;
  onSuccess?: (producer: Producer) => void;
}

export default function DeleteBankAccountDialog({
  open,
  producerId,
  account,
  accountIndex,
  onClose,
  onSuccess,
}: DeleteBankAccountDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setError('');
    setIsLoading(true);

    const result = await removeBankAccount(producerId, accountIndex);

    if (result.success && result.data) {
      onSuccess?.(result.data);
      onClose();
    } else {
      setError(result.error || 'Error al eliminar la cuenta bancaria');
    }

    setIsLoading(false);
  };

  if (!open || !account) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-foreground">Eliminar Cuenta Bancaria</h2>
        </div>

        <div className="px-6 py-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              ¿Estás seguro de que deseas eliminar esta cuenta bancaria?
            </p>

            <div className="bg-neutral/5 p-4 rounded-lg space-y-2 border border-gray-200">
              <div className="flex justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase">Banco:</span>
                <span className="text-sm font-medium text-foreground">{account.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase">Cuenta:</span>
                <span className="text-sm font-medium text-foreground">{account.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase">Tipo:</span>
                <span className="text-sm font-medium text-foreground">{account.accountTypeName}</span>
              </div>
            </div>

            <p className="text-xs text-gray-500">Esta acción no se puede deshacer.</p>
          </div>

          <div className="flex gap-3 pt-4 justify-between border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
              className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
