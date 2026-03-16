'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchProducerPendingBalance } from '../../actions/producers.action';
import { Producer, ProducerPendingBalance } from '../../types/producers.types';
import ProducerInfoSection from './ProducerInfoSection';
import BankAccountsSection from './BankAccountsSection';
import ReceptionsSection from './ReceptionsSection';
import AdvancesSection from './AdvancesSection';
import SettlementsSection from './SettlementsSection';

type TabType = 'info' | 'bank' | 'receptions' | 'advances' | 'settlements';

interface ProducerDetailContentProps {
  producer: Producer;
  onProducerUpdate?: (producer: Producer) => void;
}

export default function ProducerDetailContent({
  producer: initialProducer,
  onProducerUpdate,
}: ProducerDetailContentProps) {
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [producer, setProducer] = useState<Producer>(initialProducer);
  const [pendingBalanceData, setPendingBalanceData] = useState<ProducerPendingBalance | null>(null);
  const [isLoadingPendingBalance, setIsLoadingPendingBalance] = useState(false);
  const [pendingBalanceError, setPendingBalanceError] = useState<string | null>(null);

  useEffect(() => {
    setProducer(initialProducer);
  }, [initialProducer]);

  useEffect(() => {
    let isMounted = true;

    const loadPendingBalance = async () => {
      setIsLoadingPendingBalance(true);
      setPendingBalanceError(null);

      const result = await fetchProducerPendingBalance(initialProducer.id);

      if (!isMounted) {
        return;
      }

      if (!result.success || !result.data) {
        setPendingBalanceData(null);
        setPendingBalanceError(
          result.error || 'No fue posible calcular el saldo del productor.',
        );
        setIsLoadingPendingBalance(false);
        return;
      }

      setPendingBalanceData(result.data);
      setIsLoadingPendingBalance(false);
    };

    void loadPendingBalance();

    return () => {
      isMounted = false;
    };
  }, [initialProducer.id]);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    [],
  );

  const formattedPendingBalance = useMemo(() => {
    if (!pendingBalanceData) {
      return '$0';
    }

    return currencyFormatter.format(pendingBalanceData.summary.pendingBalance);
  }, [currencyFormatter, pendingBalanceData]);

  const pendingBalanceLabel = isLoadingPendingBalance
    ? 'Calculando...'
    : pendingBalanceError
      ? 'No disponible'
      : formattedPendingBalance;

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'info', label: 'Información', icon: 'person' },
    { id: 'bank', label: 'Cuentas Bancarias', icon: 'account_balance' },
    { id: 'receptions', label: 'Recepciones', icon: 'inventory_2' },
    { id: 'advances', label: 'Anticipos', icon: 'payments' },
    { id: 'settlements', label: 'Liquidaciones', icon: 'receipt_long' },
  ];

  const handleProducerUpdate = (updatedProducer: Producer) => {
    setProducer(updatedProducer);
    onProducerUpdate?.(updatedProducer);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'info':
        return (
          <ProducerInfoSection
            producer={producer}
            onProducerUpdate={handleProducerUpdate}
          />
        );
      case 'bank':
        return (
          <BankAccountsSection 
            producer={producer}
            onProducerUpdate={handleProducerUpdate}
          />
        );
      case 'receptions':
        return (
          <ReceptionsSection
            producerId={producer.id}
            producerName={producer.name}
            producerRut={producer.rut}
          />
        );
      case 'advances':
        return (
          <AdvancesSection
            producerId={producer.id}
            producerName={producer.name}
            producerRut={producer.rut}
          />
        );
      case 'settlements':
        return (
          <SettlementsSection
            producerId={producer.id}
            producerName={producer.name}
            producerRut={producer.rut}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-6 border-b border-gray-200 bg-white px-5 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-neutral-900">{producer.name}</h2>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  producer.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {producer.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 text-[11px] text-neutral-600">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-neutral-50 px-2.5 py-1">
                <span className="material-symbols-outlined text-[13px] text-neutral-500" aria-hidden>
                  badge
                </span>
                {producer.rut}
              </span>

              {producer.email && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-neutral-50 px-2.5 py-1">
                  <span className="material-symbols-outlined text-[13px] text-neutral-500" aria-hidden>
                    mail
                  </span>
                  {producer.email}
                </span>
              )}
            </div>
          </div>

          <div className="min-w-[240px] rounded-xl border border-gray-200 bg-neutral-50 px-4 py-4">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
              Saldo pendiente
            </div>
            <div
              className={`mt-2 text-2xl font-bold ${
                pendingBalanceError ? 'text-red-700' : 'text-neutral-900'
              }`}
            >
              {pendingBalanceLabel}
            </div>

            {!isLoadingPendingBalance && !pendingBalanceError && pendingBalanceData && (
              <div className="mt-2 text-[11px] text-neutral-500">
                {pendingBalanceData.summary.receptionsCount} recepciones ·{' '}
                {pendingBalanceData.summary.advancesCount} anticipos
              </div>
            )}

            {pendingBalanceError && (
              <div className="mt-2 text-[11px] text-red-600">{pendingBalanceError}</div>
            )}
          </div>
        </div>

        {!isLoadingPendingBalance && !pendingBalanceError && pendingBalanceData && (
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-neutral-50 px-3 py-1.5 text-[10px] leading-none text-neutral-600">
              <span className="font-medium uppercase tracking-wide text-neutral-500">
                Recepciones netas
              </span>
              <span className="font-semibold text-neutral-900">
                {currencyFormatter.format(pendingBalanceData.summary.totalReceptionNet)}
              </span>
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-neutral-50 px-3 py-1.5 text-[10px] leading-none text-neutral-600">
              <span className="font-medium uppercase tracking-wide text-neutral-500">
                IVA paddy
              </span>
              <span className="font-semibold text-neutral-900">
                {currencyFormatter.format(pendingBalanceData.summary.totalReceptionVat)}
              </span>
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-neutral-50 px-3 py-1.5 text-[10px] leading-none text-neutral-600">
              <span className="font-medium uppercase tracking-wide text-neutral-500">
                Total recepciones
              </span>
              <span className="font-semibold text-neutral-900">
                {currencyFormatter.format(pendingBalanceData.summary.totalReceptionWithVat)}
              </span>
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-neutral-50 px-3 py-1.5 text-[10px] leading-none text-neutral-600">
              <span className="font-medium uppercase tracking-wide text-neutral-500">
                Anticipos
              </span>
              <span className="font-semibold text-neutral-900">
                {currencyFormatter.format(pendingBalanceData.summary.totalAdvanceCapital)}
              </span>
            </span>

            {pendingBalanceData.summary.totalAdvanceInterest > 0 && (
              <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-neutral-50 px-3 py-1.5 text-[10px] leading-none text-neutral-600">
                <span className="font-medium uppercase tracking-wide text-neutral-500">
                  Intereses ref. no incluidos
                </span>
                <span className="font-semibold text-neutral-900">
                  {currencyFormatter.format(pendingBalanceData.summary.totalAdvanceInterest)}
                </span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Sidebar */}
        <div className="w-48 border-r border-gray-200 overflow-y-auto">
          <nav className="space-y-1 p-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-secondary text-foreground'
                    : 'text-gray-700 hover:bg-secondary-20 hover:text-foreground'
                }`}
              >
                <span className="material-symbols-outlined text-[18px] leading-none" aria-hidden>
                  {tab.icon}
                </span>
                <span className="line-clamp-2">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
