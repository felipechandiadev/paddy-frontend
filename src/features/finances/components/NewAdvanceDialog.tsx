'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  getTodayInputFormat,
  formatDateInput,
  formatDateValue,
  parseDate,
} from '@/lib/date-formatter';
import Alert from '@/shared/components/ui/Alert/Alert';
import AutoComplete from '@/shared/components/ui/AutoComplete/AutoComplete';
import { Button } from '@/shared/components/ui/Button/Button';
import Dialog from '@/shared/components/ui/Dialog/Dialog';
import Select from '@/shared/components/ui/Select/Select';
import { TextField } from '@/shared/components/ui/TextField/TextField';
import CreateProducerDialog from '@/features/producers/components/CreateProducerDialog';
import {
  createAdvance,
  fetchAdvanceDetails,
  fetchAdvanceProducerOptions,
  fetchAdvanceSeasonOptions,
  fetchPaymentBankOptions,
  updateAdvanceWithPayment,
} from '../actions/finances.action';
import {
  Advance,
  AdvancePaymentMethod,
  AdvanceProducerBankAccount,
  AdvanceProducerOption,
  AdvanceSeasonOption,
  PaymentBankOption,
} from '../types/finances.types';
import type { Producer as ProducerRecord } from '@/features/producers/types/producers.types';

interface NewAdvanceDialogProps {
  open: boolean;
  onClose: () => void;
  mode?: 'create' | 'edit';
  advanceId?: number | null;
  onSuccess?: (advance: Advance) => void;
}

interface AdvanceFormState {
  seasonId: string;
  amount: string;
  issueDate: string;
  interestRate: string;
  description: string;
  paymentMethod: AdvancePaymentMethod;
  referenceNumber: string;
  paymentNotes: string;
  bankAccountIndex: string;
  checkBankName: string;
  checkIssueDate: string;
  checkDueDate: string;
  checkPayeeName: string;
  checkPayeeRut: string;
}

interface CreateProducerOption {
  id: '__create_new_producer__';
  query: string;
  isCreateOption: true;
}

type ProducerAutoCompleteOption = AdvanceProducerOption | CreateProducerOption;

const CREATE_PRODUCER_OPTION_ID = '__create_new_producer__' as const;

const isCreateProducerOption = (
  option: ProducerAutoCompleteOption | null,
): option is CreateProducerOption => Boolean(option && 'isCreateOption' in option && option.isCreateOption);

const PAYMENT_METHOD_OPTIONS = [
  { id: 'transfer', label: 'Transferencia bancaria' },
  { id: 'check', label: 'Cheque' },
  { id: 'cash', label: 'Efectivo' },
];

const getTodayDate = () => getTodayInputFormat();

const toDateInputValue = (value?: string | null) => {
  if (!value) {
    return '';
  }

  return formatDateInput(value);
};

const createInitialFormState = (): AdvanceFormState => ({
  seasonId: '',
  amount: '',
  issueDate: getTodayDate(),
  interestRate: '0',
  description: '',
  paymentMethod: 'transfer',
  referenceNumber: '',
  paymentNotes: '',
  bankAccountIndex: '',
  checkBankName: '',
  checkIssueDate: getTodayDate(),
  checkDueDate: '',
  checkPayeeName: '',
  checkPayeeRut: '',
});

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const formatBankAccountLabel = (
  account: AdvanceProducerBankAccount,
  index: number,
) =>
  `${account.bankName} · ${account.accountTypeName} · ${account.accountNumber}${
    account.isDefault ? ' · Predeterminada' : ` · Cuenta ${index + 1}`
  }`;

const formatDateLabel = (value?: string | null) => {
  return formatDateValue(value);
};

export default function NewAdvanceDialog({
  open,
  onClose,
  mode = 'create',
  advanceId = null,
  onSuccess,
}: NewAdvanceDialogProps) {
  const isEditMode = mode === 'edit';
  const [form, setForm] = useState<AdvanceFormState>(createInitialFormState);
  const [selectedProducer, setSelectedProducer] =
    useState<AdvanceProducerOption | null>(null);
  const [producerOptions, setProducerOptions] = useState<AdvanceProducerOption[]>([]);
  const [producerSearch, setProducerSearch] = useState('');
  const [createProducerDialogOpen, setCreateProducerDialogOpen] = useState(false);
  const [producerAutocompleteResetKey, setProducerAutocompleteResetKey] = useState(0);
  const [seasonOptions, setSeasonOptions] = useState<AdvanceSeasonOption[]>([]);
  const [paymentBankOptions, setPaymentBankOptions] = useState<PaymentBankOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentTraceWarning, setPaymentTraceWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setForm(createInitialFormState());
      setSelectedProducer(null);
      setProducerSearch('');
      setErrorMessage(null);
      setPaymentTraceWarning(null);
      return;
    }

    let isMounted = true;

    const loadOptions = async () => {
      setIsLoadingOptions(true);
      setErrorMessage(null);
      setPaymentTraceWarning(null);

      const [producersResult, seasonsResult, banksResult, advanceDetails] =
        await Promise.all([
          fetchAdvanceProducerOptions(),
          fetchAdvanceSeasonOptions(),
          fetchPaymentBankOptions(),
          isEditMode && advanceId ? fetchAdvanceDetails(advanceId) : Promise.resolve(null),
        ]);

      if (!isMounted) {
        return;
      }

      setProducerOptions(producersResult.data);
      setSeasonOptions(seasonsResult.data);
      setPaymentBankOptions(banksResult.data);

      if (isEditMode) {
        if (!advanceDetails) {
          setErrorMessage('No fue posible cargar el detalle del anticipo');
          setIsLoadingOptions(false);
          return;
        }

        const producer =
          producersResult.data.find((item) => item.id === advanceDetails.producerId) ||
          null;

        setSelectedProducer(producer);
        setPaymentTraceWarning(
          advanceDetails.transactionId
            ? null
            : 'Este anticipo no tiene una transaccion de pago registrada. Puedes completar o corregir los datos del pago y guardarlos desde esta edicion.'
        );

        setForm({
          seasonId: String(advanceDetails.seasonId ?? ''),
          amount: String(advanceDetails.amount ?? ''),
          issueDate: toDateInputValue(advanceDetails.issueDate) || getTodayDate(),
          interestRate: String(advanceDetails.interestRate ?? 0),
          description: advanceDetails.description || '',
          paymentMethod: advanceDetails.paymentMethod || 'cash',
          referenceNumber: advanceDetails.referenceNumber || '',
          paymentNotes: advanceDetails.paymentNotes || advanceDetails.description || '',
          bankAccountIndex:
            advanceDetails.bankAccountIndex === undefined
              ? ''
              : String(advanceDetails.bankAccountIndex),
          checkBankName: advanceDetails.checkBankName || '',
          checkIssueDate:
            toDateInputValue(advanceDetails.checkIssueDate) || getTodayDate(),
          checkDueDate: toDateInputValue(advanceDetails.checkDueDate),
          checkPayeeName:
            advanceDetails.checkPayeeName || producer?.name || '',
          checkPayeeRut:
            advanceDetails.checkPayeeRut || producer?.rut || '',
        });

        setIsLoadingOptions(false);
        return;
      }

      setForm((prev) => {
        const next = { ...prev };

        if (!next.seasonId) {
          const activeSeason = seasonsResult.data.find((season) => season.isActive);
          const fallbackSeason = activeSeason || seasonsResult.data[0];
          next.seasonId = fallbackSeason ? String(fallbackSeason.id) : '';
        }

        return next;
      });

      setIsLoadingOptions(false);
    };

    loadOptions();

    return () => {
      isMounted = false;
    };
  }, [advanceId, isEditMode, open]);

  useEffect(() => {
    if (!selectedProducer || form.paymentMethod !== 'transfer') {
      return;
    }

    if (selectedProducer.bankAccounts.length === 0) {
      setForm((prev) => ({ ...prev, bankAccountIndex: '' }));
      return;
    }

    const defaultAccountIndex = selectedProducer.bankAccounts.findIndex(
      (account) => account.isDefault,
    );
    const fallbackIndex = defaultAccountIndex >= 0 ? defaultAccountIndex : 0;

    setForm((prev) => {
      if (prev.bankAccountIndex) {
        return prev;
      }

      return {
        ...prev,
        bankAccountIndex: String(fallbackIndex),
      };
    });
  }, [selectedProducer, form.paymentMethod]);

  const selectedSeason = useMemo(
    () => seasonOptions.find((season) => String(season.id) === form.seasonId) ?? null,
    [form.seasonId, seasonOptions],
  );

  const producerAutoCompleteOptions = useMemo<ProducerAutoCompleteOption[]>(() => {
    const normalizedQuery = producerSearch.trim().toLowerCase();

    if (!normalizedQuery) {
      return producerOptions;
    }

    const hasMatches = producerOptions.some((producer) => {
      return (
        producer.name.toLowerCase().includes(normalizedQuery) ||
        producer.rut.toLowerCase().includes(normalizedQuery) ||
        (producer.city || '').toLowerCase().includes(normalizedQuery)
      );
    });

    if (hasMatches) {
      return producerOptions;
    }

    return [
      ...producerOptions,
      {
        id: CREATE_PRODUCER_OPTION_ID,
        query: producerSearch.trim(),
        isCreateOption: true,
      } as CreateProducerOption,
    ];
  }, [producerOptions, producerSearch]);

  const selectedBankAccount = useMemo(() => {
    if (!selectedProducer || form.bankAccountIndex === '') {
      return null;
    }

    const bankAccountIndex = Number(form.bankAccountIndex);
    if (Number.isNaN(bankAccountIndex)) {
      return null;
    }

    return selectedProducer.bankAccounts[bankAccountIndex] ?? null;
  }, [form.bankAccountIndex, selectedProducer]);

  const producerBankAccountOptions = useMemo(() => {
    if (!selectedProducer) {
      return [];
    }

    return selectedProducer.bankAccounts.map((account, index) => ({
      id: String(index),
      label: formatBankAccountLabel(account, index),
    }));
  }, [selectedProducer]);

  const seasonSelectOptions = useMemo(
    () =>
      seasonOptions.map((season) => ({
        id: String(season.id),
        label: `${season.code} · ${season.name}`,
      })),
    [seasonOptions],
  );

  const numericAmount = form.amount ? Number(form.amount) : 0;
  const numericInterestRate = form.interestRate === '' ? NaN : Number(form.interestRate);
  const requiresTransferAccount = form.paymentMethod === 'transfer';
  const producerHasNoBankAccounts = Boolean(
    requiresTransferAccount && selectedProducer && selectedProducer.bankAccounts.length === 0,
  );
  const paymentMethodLabel =
    PAYMENT_METHOD_OPTIONS.find((option) => option.id === form.paymentMethod)?.label || '-';
  const paymentReferenceLabel =
    form.paymentMethod === 'transfer'
      ? 'Referencia transferencia'
      : form.paymentMethod === 'check'
        ? 'Numero de cheque'
        : 'Referencia interna';

  const handleFieldChange = <K extends keyof AdvanceFormState>(
    field: K,
    value: AdvanceFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleProducerChange = (option: ProducerAutoCompleteOption | null) => {
    if (isEditMode) {
      return;
    }

    if (!option) {
      setSelectedProducer(null);
      setErrorMessage(null);
      setForm((prev) => ({
        ...prev,
        bankAccountIndex: '',
        checkPayeeName: '',
        checkPayeeRut: '',
      }));
      return;
    }

    if (isCreateProducerOption(option)) {
      setCreateProducerDialogOpen(true);
      setProducerAutocompleteResetKey((prev) => prev + 1);
      return;
    }

    setSelectedProducer(option);
    setErrorMessage(null);

    setForm((prev) => ({
      ...prev,
      bankAccountIndex: '',
      checkPayeeName: option.name,
      checkPayeeRut: option.rut,
    }));
  };

  const handleProducerCreated = (producer: ProducerRecord) => {
    // Add the new producer to the list
    setProducerOptions((currentProducers) => {
      const newProducer: AdvanceProducerOption = {
        id: Number(producer.id),
        name: producer.name || '',
        rut: producer.rut || '',
        city: producer.city || '',
        bankAccounts: [],
      };

      const nextProducers = [
        newProducer,
        ...currentProducers.filter((p) => p.id !== newProducer.id),
      ];

      return nextProducers;
    });

    // Set it as the selected producer
    const newProducer: AdvanceProducerOption = {
      id: Number(producer.id),
      name: producer.name || '',
      rut: producer.rut || '',
      city: producer.city || '',
      bankAccounts: [],
    };

    setSelectedProducer(newProducer);
    setProducerSearch('');
    setProducerAutocompleteResetKey((prev) => prev + 1);

    setForm((prev) => ({
      ...prev,
      bankAccountIndex: '',
      checkPayeeName: newProducer.name,
      checkPayeeRut: newProducer.rut,
    }));
  };

  const handleCloseCreateProducerDialog = () => {
    setCreateProducerDialogOpen(false);
    setProducerSearch('');
    setProducerAutocompleteResetKey((prev) => prev + 1);
  };

  const validateForm = () => {
    if (!selectedProducer) {
      return 'Debes seleccionar un productor';
    }

    if (!form.seasonId) {
      return 'Debes seleccionar una temporada';
    }

    if (!form.amount || Number(form.amount) <= 0) {
      return 'Debes indicar un monto valido para el anticipo';
    }

    if (Number.isNaN(numericInterestRate) || numericInterestRate < 0) {
      return 'La tasa mensual debe ser mayor o igual a 0';
    }

    if (!form.issueDate) {
      return 'Debes indicar la fecha del anticipo';
    }

    if (form.paymentMethod === 'transfer') {
      if (selectedProducer.bankAccounts.length === 0) {
        return 'El productor no tiene cuentas bancarias registradas para transferencias';
      }

      if (form.bankAccountIndex === '') {
        return 'Debes seleccionar la cuenta bancaria de destino';
      }

      if (!form.referenceNumber.trim()) {
        return 'Debes indicar el numero de referencia de la transferencia';
      }
    }

    if (form.paymentMethod === 'check') {
      if (!form.referenceNumber.trim()) {
        return 'Debes indicar el numero de cheque';
      }

      if (!form.checkBankName) {
        return 'Debes seleccionar el banco emisor del cheque';
      }
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    if (!selectedProducer) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const payload = {
      seasonId: Number(form.seasonId),
      amount: Number(form.amount),
      issueDate: form.issueDate,
      interestRate: Number(form.interestRate || '0'),
      description: form.description.trim() || undefined,
      paymentMethod: form.paymentMethod,
      referenceNumber: form.referenceNumber.trim() || undefined,
      paymentNotes: form.paymentNotes.trim() || undefined,
      bankAccountIndex:
        form.paymentMethod === 'transfer' && form.bankAccountIndex !== ''
          ? Number(form.bankAccountIndex)
          : undefined,
      checkBankName:
        form.paymentMethod === 'check' ? form.checkBankName || undefined : undefined,
      checkIssueDate:
        form.paymentMethod === 'check' && form.checkIssueDate
          ? form.checkIssueDate
          : undefined,
      checkDueDate:
        form.paymentMethod === 'check' && form.checkDueDate
          ? form.checkDueDate
          : undefined,
      checkPayeeName:
        form.paymentMethod === 'check' && form.checkPayeeName.trim()
          ? form.checkPayeeName.trim()
          : undefined,
      checkPayeeRut:
        form.paymentMethod === 'check' && form.checkPayeeRut.trim()
          ? form.checkPayeeRut.trim()
          : undefined,
    };

    if (isEditMode) {
      if (!advanceId) {
        setIsSaving(false);
        setErrorMessage('No se encontro el anticipo a editar');
        return;
      }

      const updateResult = await updateAdvanceWithPayment(advanceId, payload);

      setIsSaving(false);

      if (!updateResult.success || !updateResult.data) {
        setErrorMessage(updateResult.error || 'No fue posible actualizar el anticipo');
        return;
      }

      onSuccess?.(updateResult.data);
      onClose();
      return;
    }

    const createResult = await createAdvance({
      producerId: selectedProducer.id,
      ...payload,
    });

    setIsSaving(false);

    if (!createResult.success || !createResult.data) {
      setErrorMessage(createResult.error || 'No fue posible crear el anticipo');
      return;
    }

    onSuccess?.(createResult.data);
    onClose();
  };

  return (
    <>
      <Dialog
        open={open}
      onClose={onClose}
      title={isEditMode ? 'Editar anticipo' : 'Nuevo anticipo'}
      size="custom"
      fullWidth={true}
      maxWidth="1120px"
      minHeight="min(760px, calc(100vh - 48px))"
      maxHeight="calc(100vh - 24px)"
      height="min(860px, calc(100vh - 24px))"
      scroll="paper"
      headerClassName="border-b border-gray-200 !mb-0 !px-6 !pt-4 !pb-4"
      titleClassName="text-lg font-bold text-foreground !p-0"
      bodyClassName="!px-6 !pt-4 !pb-4"
      showCloseButton={false}
      actions={
        <div className="flex flex-wrap justify-between gap-3">
          <Button variant="outlined" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={isSaving}
            disabled={isLoadingOptions || isSaving}
          >
            {isEditMode ? 'Guardar cambios' : 'Guardar anticipo'}
          </Button>
        </div>
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-5">
        {errorMessage && <Alert variant="error">{errorMessage}</Alert>}

        {paymentTraceWarning && <Alert variant="warning">{paymentTraceWarning}</Alert>}

        {producerHasNoBankAccounts && (
          <Alert variant="warning">
            El productor no tiene cuentas bancarias registradas. Para guardar un anticipo por transferencia necesitas agregar al menos una cuenta bancaria al productor.
          </Alert>
        )}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
          <div className="flex min-h-0 flex-col gap-5">
            <section className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-neutral-900">Datos del anticipo</h3>
                <p className="text-sm text-neutral-500">
                  {isEditMode
                    ? 'Visualiza y ajusta toda la informacion del anticipo seleccionado.'
                    : 'Selecciona el productor, la temporada y el monto del anticipo a registrar.'}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <AutoComplete<ProducerAutoCompleteOption>
                    key={producerAutocompleteResetKey}
                    label="Productor"
                    placeholder={
                      isLoadingOptions
                        ? 'Cargando productores...'
                        : 'Buscar productor por nombre o RUT'
                    }
                    options={producerAutoCompleteOptions}
                    value={selectedProducer}
                    onChange={handleProducerChange}
                    onInputChange={setProducerSearch}
                    getOptionLabel={(option) =>
                      isCreateProducerOption(option)
                        ? `+ Nuevo productor "${option.query}"`
                        : `${option.name} · ${option.rut}`
                    }
                    getOptionValue={(option) => option.id}
                    filterOption={(option, inputValue) => {
                      if (isCreateProducerOption(option)) {
                        return true;
                      }

                      const query = inputValue.toLowerCase();
                      return (
                        option.name.toLowerCase().includes(query) ||
                        option.rut.toLowerCase().includes(query) ||
                        (option.city || '').toLowerCase().includes(query)
                      );
                    }}
                    disabled={isLoadingOptions || isSaving || isEditMode}
                  />
                </div>

                <Select
                  label="Temporada"
                  value={form.seasonId || null}
                  onChange={(value) => handleFieldChange('seasonId', value ? String(value) : '')}
                  options={seasonSelectOptions}
                  disabled={isLoadingOptions || isSaving}
                />

                <TextField
                  label="Fecha de entrega"
                  type="date"
                  value={form.issueDate}
                  onChange={(event) => handleFieldChange('issueDate', event.target.value)}
                  disabled={isSaving}
                />

                <TextField
                  label="Monto anticipo"
                  type="currency"
                  value={form.amount}
                  onChange={(event) => handleFieldChange('amount', event.target.value)}
                  placeholder="$ 0"
                  disabled={isSaving}
                />

                <TextField
                  label="Tasa interes mensual (%)"
                  type="number"
                  value={form.interestRate}
                  onChange={(event) => handleFieldChange('interestRate', event.target.value)}
                  min="0"
                  step="0.01"
                  disabled={isSaving}
                />

                <div className="md:col-span-2">
                  <TextField
                    label="Descripcion"
                    type="textarea"
                    rows={3}
                    value={form.description}
                    onChange={(event) => handleFieldChange('description', event.target.value)}
                    placeholder="Motivo o contexto del anticipo"
                    disabled={isSaving}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-neutral-900">Datos del pago</h3>
                <p className="text-sm text-neutral-500">
                  Registra el medio de pago y los datos que quedaran asociados a la transaccion financiera del anticipo.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Select
                  label="Medio de pago"
                  value={form.paymentMethod}
                  onChange={(value) =>
                    handleFieldChange(
                      'paymentMethod',
                      (value ? String(value) : 'transfer') as AdvancePaymentMethod,
                    )
                  }
                  options={PAYMENT_METHOD_OPTIONS}
                  disabled={isSaving}
                />

                <TextField
                  label={
                    form.paymentMethod === 'transfer'
                      ? 'Referencia transferencia'
                      : form.paymentMethod === 'check'
                        ? 'Numero de cheque'
                        : 'Referencia interna'
                  }
                  type="text"
                  value={form.referenceNumber}
                  onChange={(event) =>
                    handleFieldChange('referenceNumber', event.target.value)
                  }
                  placeholder={
                    form.paymentMethod === 'cash'
                      ? 'Opcional'
                      : 'Ingresa el identificador del pago'
                  }
                  disabled={isSaving}
                />

                {form.paymentMethod === 'transfer' && (
                  <div className="md:col-span-2">
                    <Select
                      label="Cuenta bancaria del productor"
                      value={form.bankAccountIndex || null}
                      onChange={(value) =>
                        handleFieldChange('bankAccountIndex', value ? String(value) : '')
                      }
                      options={producerBankAccountOptions}
                      disabled={isSaving || !selectedProducer || producerHasNoBankAccounts}
                    />
                  </div>
                )}

                {form.paymentMethod === 'check' && (
                  <>
                    <Select
                      label="Banco emisor"
                      value={form.checkBankName || null}
                      onChange={(value) =>
                        handleFieldChange('checkBankName', value ? String(value) : '')
                      }
                      options={paymentBankOptions}
                      disabled={isSaving}
                    />

                    <TextField
                      label="Fecha cobro cheque"
                      type="date"
                      value={form.checkDueDate}
                      onChange={(event) =>
                        handleFieldChange('checkDueDate', event.target.value)
                      }
                      disabled={isSaving}
                    />

                    <TextField
                      label="Nombre beneficiario"
                      type="text"
                      value={form.checkPayeeName}
                      onChange={(event) =>
                        handleFieldChange('checkPayeeName', event.target.value)
                      }
                      placeholder="Nombre que figurara en el cheque"
                      disabled={isSaving}
                    />

                    <TextField
                      label="RUT beneficiario"
                      type="dni"
                      value={form.checkPayeeRut}
                      onChange={(event) =>
                        handleFieldChange('checkPayeeRut', event.target.value)
                      }
                      placeholder="12.345.678-9"
                      disabled={isSaving}
                    />
                  </>
                )}

                <div className="md:col-span-2">
                  <TextField
                    label="Observaciones del pago"
                    type="textarea"
                    rows={3}
                    value={form.paymentNotes}
                    onChange={(event) => handleFieldChange('paymentNotes', event.target.value)}
                    placeholder="Notas internas del pago o respaldo operativo"
                    disabled={isSaving}
                  />
                </div>
              </div>
            </section>
          </div>

          <aside className="flex min-h-0 flex-col gap-5">
            <section className="rounded-xl border border-gray-200 bg-neutral-50 p-5">
              <h3 className="text-base font-semibold text-neutral-900">Resumen</h3>
              <div className="mt-4 space-y-3 text-sm text-neutral-700">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-neutral-500">Nombre productor</span>
                  <span className="text-right font-medium text-neutral-900">
                    {selectedProducer?.name || '-'}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-neutral-500">RUT productor</span>
                  <span className="text-right font-medium text-neutral-900">
                    {selectedProducer?.rut || '-'}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-neutral-500">Temporada</span>
                  <span className="text-right font-medium text-neutral-900">
                    {selectedSeason ? `${selectedSeason.code} · ${selectedSeason.name}` : '-'}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-neutral-500">Monto</span>
                  <span className="text-right text-lg font-semibold text-neutral-900">
                    {formatCurrency(numericAmount || 0)}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-neutral-500">Tasa mensual</span>
                  <span className="font-medium text-neutral-900">
                    {Number.isNaN(numericInterestRate) ? '-' : `${numericInterestRate.toFixed(2)} %`}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-neutral-500">Medio de pago</span>
                  <span className="font-medium text-right text-neutral-900">
                    {paymentMethodLabel}
                  </span>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-neutral-500">{paymentReferenceLabel}</span>
                      <span className="text-right font-medium text-neutral-900">
                        {form.referenceNumber.trim() || '-'}
                      </span>
                    </div>

                    {form.paymentMethod === 'transfer' && (
                      <>
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-neutral-500">Cuenta destino</span>
                          <span className="text-right font-medium text-neutral-900">
                            {selectedBankAccount
                              ? formatBankAccountLabel(
                                  selectedBankAccount,
                                  Number(form.bankAccountIndex || 0),
                                )
                              : 'Selecciona una cuenta'}
                          </span>
                        </div>
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-neutral-500">Titular</span>
                          <span className="text-right font-medium text-neutral-900">
                            {selectedBankAccount?.holderName || selectedProducer?.name || '-'}
                          </span>
                        </div>
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-neutral-500">RUT titular</span>
                          <span className="text-right font-medium text-neutral-900">
                            {selectedBankAccount?.holderRut || selectedProducer?.rut || '-'}
                          </span>
                        </div>
                      </>
                    )}

                    {form.paymentMethod === 'check' && (
                      <>
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-neutral-500">Banco emisor</span>
                          <span className="text-right font-medium text-neutral-900">
                            {form.checkBankName || '-'}
                          </span>
                        </div>
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-neutral-500">Fecha cobro</span>
                          <span className="text-right font-medium text-neutral-900">
                            {formatDateLabel(form.checkDueDate)}
                          </span>
                        </div>
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-neutral-500">Beneficiario</span>
                          <span className="text-right font-medium text-neutral-900">
                            {form.checkPayeeName.trim() || '-'}
                          </span>
                        </div>
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-neutral-500">RUT beneficiario</span>
                          <span className="text-right font-medium text-neutral-900">
                            {form.checkPayeeRut.trim() || '-'}
                          </span>
                        </div>
                      </>
                    )}

                    <div className="flex items-start justify-between gap-3">
                      <span className="text-neutral-500">Observaciones pago</span>
                      <span className="text-right font-medium text-neutral-900 whitespace-pre-line">
                        {form.paymentNotes.trim() || '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

          </aside>
        </div>
      </div>
    </Dialog>

    <CreateProducerDialog
      open={createProducerDialogOpen}
      onClose={handleCloseCreateProducerDialog}
      onSuccess={handleProducerCreated}
    />
    </>
  );
}