'use client';

import IconButton from '@/shared/components/ui/IconButton/IconButton';
import { BankAccount } from '../../types/producers.types';

interface BankAccountCardProps {
  account: BankAccount;
  index: number;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function BankAccountCard({
  account,
  index,
  onEdit,
  onDelete,
}: BankAccountCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden p-2 flex flex-col justify-between">
      {/* Content */}
      <div className="px-4 py-3 flex-grow">
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Cuenta {index + 1}
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-600 font-medium uppercase mb-1">Banco</p>
            <p className="text-sm font-semibold text-foreground">{account.bankName}</p>
          </div>

          <div>
            <p className="text-xs text-gray-600 font-medium uppercase mb-1">Número de Cuenta</p>
            <p className="text-sm font-semibold text-foreground">{account.accountNumber}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-600 font-medium uppercase mb-1">Tipo</p>
              <p className="text-sm font-semibold text-foreground">{account.accountTypeName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium uppercase mb-1">Titular</p>
              <p className="text-sm font-semibold text-foreground">{account.holderName || '-'}</p>
            </div>
          </div>

          {account.holderRut && (
            <div>
              <p className="text-xs text-gray-600 font-medium uppercase mb-1">RUT del Titular</p>
              <p className="text-sm font-semibold text-foreground">{account.holderRut}</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer with actions */}
      <div className="flex gap-2 justify-end pt-3 border-t border-gray-200">
        <IconButton
          icon="delete"
          variant="basicSecondary"
          size="sm"
          onClick={onDelete}
          title="Eliminar"
        />
      </div>
    </div>
  );
}
