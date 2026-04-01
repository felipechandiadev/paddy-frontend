'use client';

import { useState, useEffect } from 'react';
import { addBankAccount, fetchBankOptions, BankOption, BankOptionsResponse } from '../../actions/producers.action';
import { BankAccount, Producer } from '../../types/producers.types';
import { TextField } from '@/shared/components/ui/TextField/TextField';
import Select from '@/shared/components/ui/Select/Select';

interface CreateBankAccountDialogProps {
  open: boolean;
  producerId: number;
  onClose: () => void;
  onSuccess?: (producer: Producer) => void;
}

export default function CreateBankAccountDialog({
  open,
  producerId,
  onClose,
  onSuccess,
}: CreateBankAccountDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [accountTypes, setAccountTypes] = useState<BankOption[]>([]);
  const [isFetchingOptions, setIsFetchingOptions] = useState(false);
  
  const [formData, setFormData] = useState<{
    bankName: string;
    accountType: string;
    accountNumber: string;
    holderName: string;
    holderRut: string;
    isDefault: boolean;
  }>({
    bankName: '',
    accountType: 'corriente',
    accountNumber: '',
    holderName: '',
    holderRut: '',
    isDefault: false,
  });

  // Fetch bank options when dialog opens
  useEffect(() => {
    if (open && banks.length === 0) {
      loadBankOptions();
    }
    
    // Reset form when dialog opens
    if (open) {
      setError('');
    }
  }, [open]);

  const loadBankOptions = async () => {
    setIsFetchingOptions(true);
    try {
      const options = await fetchBankOptions();
      console.log('Loaded bank options:', options);
      
      // Validate response structure
      if (!options || typeof options !== 'object') {
        console.error('Invalid response structure:', options);
        setError('Error al cargar los bancos');
        return;
      }

      const banksData = options.banks || [];
      const accountTypesData = options.accountTypes || [];
      
      console.log('Banks count:', banksData.length, 'Account types count:', accountTypesData.length);
      setBanks(banksData);
      setAccountTypes(accountTypesData);
      
      // Set default values after loading banks
      if (banksData.length > 0) {
        const firstBank = banksData[0].id;
        console.log('Setting default bank to:', firstBank);
        setFormData(prev => ({
          ...prev,
          bankName: String(firstBank),
        }));
      }
    } catch (err) {
      console.error('Error loading bank options:', err);
      setError('Error al cargar los bancos');
    } finally {
      setIsFetchingOptions(false);
    }
  };

  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setFormData({
        bankName: '',
        accountType: 'corriente',
        accountNumber: '',
        holderName: '',
        holderRut: '',
        isDefault: false,
      });
      setError('');
      // Don't clear banks - they're cached
    }
  }, [open]);

  const handleBankChange = (bankId: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      bankName: String(bankId),
    }));
  };

  const handleAccountTypeChange = (accountTypeId: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      accountType: accountTypeId as string,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validar campos requeridos
    if (!formData.bankName?.trim()) {
      setError('Selecciona un banco por favor');
      setIsLoading(false);
      return;
    }

    if (!formData.accountType?.trim()) {
      setError('Selecciona un tipo de cuenta por favor');
      setIsLoading(false);
      return;
    }

    if (!formData.accountNumber?.trim()) {
      setError('Número de cuenta es requerido');
      setIsLoading(false);
      return;
    }

    if (!formData.holderName?.trim()) {
      setError('Nombre del titular es requerido');
      setIsLoading(false);
      return;
    }

    if (!formData.holderRut?.trim()) {
      setError('RUT del titular es requerido');
      setIsLoading(false);
      return;
    }

    try {
      const result = await addBankAccount(producerId, {
        bankName: formData.bankName,
        accountType: formData.accountType,
        accountNumber: formData.accountNumber,
        holderName: formData.holderName,
        holderRut: formData.holderRut,
        isDefault: formData.isDefault,
      });

      if (result.success && result.data) {
        onSuccess?.(result.data);
        onClose();
      } else {
        setError(result.error || 'Error al crear cuenta bancaria');
      }
    } catch (err) {
      console.error('Error during submission:', err);
      setError('Error inesperado al crear la cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-foreground">Crear Cuenta Bancaria</h2>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {isFetchingOptions ? (
            <div className="text-center text-gray-500 py-4">Cargando bancos...</div>
          ) : (
            <>
              <Select
                label="Banco *"
                value={formData.bankName}
                onChange={handleBankChange}
                options={banks}
                required
              />

              <Select
                label="Tipo de Cuenta *"
                value={formData.accountType || 'corriente'}
                onChange={handleAccountTypeChange}
                options={accountTypes}
                required
              />

              <TextField
                label="Número de Cuenta *"
                type="text"
                value={formData.accountNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                placeholder="1234567890"
                required
              />

              <TextField
                label="Nombre del Titular *"
                type="text"
                value={formData.holderName}
                onChange={(e) => setFormData(prev => ({ ...prev, holderName: e.target.value }))}
                placeholder="Nombre completo"
                required
              />

              <TextField
                label="RUT del Titular *"
                type="dni"
                value={formData.holderRut}
                onChange={(e) => setFormData(prev => ({ ...prev, holderRut: e.target.value }))}
                placeholder="12.345.678-9"
                required
              />

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
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
