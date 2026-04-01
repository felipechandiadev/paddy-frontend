'use client';

import { useState } from 'react';
import IconButton from '@/shared/components/ui/IconButton/IconButton';
import { Producer, BankAccount } from '../../types/producers.types';
import BankAccountCard from './BankAccountCard';
import CreateBankAccountDialog from './CreateBankAccountDialog';
import DeleteBankAccountDialog from './DeleteBankAccountDialog';

interface BankAccountsSectionProps {
  producer: Producer;
  onProducerUpdate?: (producer: Producer) => void;
}

export default function BankAccountsSection({ 
  producer, 
  onProducerUpdate 
}: BankAccountsSectionProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAccountIndex, setSelectedAccountIndex] = useState<number | null>(null);
  const [localProducer, setLocalProducer] = useState<Producer>(producer);

  const bankAccounts = localProducer.bankAccounts || [];
  const selectedAccount = selectedAccountIndex !== null ? bankAccounts[selectedAccountIndex] : null;

  const handleAddSuccess = (updatedProducer: Producer) => {
    setLocalProducer(updatedProducer);
    onProducerUpdate?.(updatedProducer);
  };

  const handleDeleteSuccess = (updatedProducer: Producer) => {
    setLocalProducer(updatedProducer);
    setSelectedAccountIndex(null);
    onProducerUpdate?.(updatedProducer);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground">Cuentas Bancarias</h3>
        <IconButton
          icon="add"
          variant="ghost"
          onClick={() => setCreateDialogOpen(true)}
          title="Crear cuenta bancaria"
        />
      </div>

      {/* Bank Accounts Grid */}
      {bankAccounts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-500">No hay cuentas bancarias registradas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bankAccounts.map((account, index) => (
            <BankAccountCard
              key={index}
              account={account}
              index={index}
              onDelete={() => {
                setSelectedAccountIndex(index);
                setDeleteDialogOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateBankAccountDialog
        open={createDialogOpen}
        producerId={producer.id}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={handleAddSuccess}
      />

      <DeleteBankAccountDialog
        open={deleteDialogOpen}
        producerId={producer.id}
        account={selectedAccount}
        accountIndex={selectedAccountIndex || 0}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedAccountIndex(null);
        }}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
