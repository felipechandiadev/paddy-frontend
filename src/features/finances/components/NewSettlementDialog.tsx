'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Alert from '@/shared/components/ui/Alert/Alert';
import AutoComplete from '@/shared/components/ui/AutoComplete/AutoComplete';
import Dialog from '@/shared/components/ui/Dialog/Dialog';
import { Button } from '@/shared/components/ui/Button/Button';
import IconButton from '@/shared/components/ui/IconButton/IconButton';
import Select from '@/shared/components/ui/Select/Select';
import Switch from '@/shared/components/ui/Switch/Switch';
import { TextField } from '@/shared/components/ui/TextField/TextField';
import {
  completeSettlement,
  createSettlement,
  fetchSettlementById,
  fetchAdvances,
  fetchSettlementProducerOptions,
  fetchSettlementReceptionCandidates,
  updateSettlement,
  updateSettlementReceptionDryPercent,
  updateSettlementReceptionRicePrice,
  updateAdvanceWithPayment as updateAdvanceWithResult,
} from '../actions/finances.action';
import {
  Advance,
  CompleteSettlementPayload,
  Settlement,
  SettlementProducerOption,
  SettlementReceptionCandidate,
} from '../types/finances.types';
import { calculateAdvanceInterest } from '../services/advanceInterest';

interface NewSettlementDialogProps {
  open: boolean;
  onClose: () => void;
  mode?: 'create' | 'edit';
  settlementId?: number | null;
  onSuccess?: (settlement: Settlement) => void;
}

type SettlementStep = 1 | 2 | 3 | 4;
type SettlementServiceKey = 'drying' | 'interest';

interface SettlementServiceDefinition {
  title: string;
  description: string;
  serviceType: string;
  vatLabel: string;
}

interface ServiceInvoiceForm {
  enabled: boolean;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceNetAmount: string;
}

interface ServiceInvoiceErrors {
  invoiceNumber?: string;
  invoiceDate?: string;
  invoiceNetAmount?: string;
}

interface ServiceInvoiceComputed {
  netAmount: number;
  vatAmount: number;
  totalAmount: number;
}

type ServiceInvoiceFormMap = Record<SettlementServiceKey, ServiceInvoiceForm>;
type ServiceInvoiceErrorsMap = Record<SettlementServiceKey, ServiceInvoiceErrors>;
type ServiceInvoiceComputedMap = Record<SettlementServiceKey, ServiceInvoiceComputed>;

const SERVICE_VAT_RATE = 0.19;
const RICE_VAT_RATE = 0.19;
const SERVICE_KEYS: SettlementServiceKey[] = ['drying', 'interest'];

const SERVICE_DEFINITIONS: Record<SettlementServiceKey, SettlementServiceDefinition> = {
  drying: {
    title: 'Secado',
    description: 'Servicio de Secado',
    serviceType: 'Acondicionamiento',
    vatLabel: 'Si (19%)',
  },
  interest: {
    title: 'Intereses',
    description: 'Intereses Financieros',
    serviceType: 'Servicio Financiero',
    vatLabel: 'Si (19%)',
  },
};

const buildInitialServiceInvoices = (): ServiceInvoiceFormMap => ({
  drying: {
    enabled: true,
    invoiceNumber: '',
    invoiceDate: '',
    invoiceNetAmount: '',
  },
  interest: {
    enabled: true,
    invoiceNumber: '',
    invoiceDate: '',
    invoiceNetAmount: '',
  },
});

const buildInitialServiceInvoiceErrors = (): ServiceInvoiceErrorsMap => ({
  drying: {},
  interest: {},
});

const parseCurrencyInput = (value: string): number => {
  const normalized = String(value ?? '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '');

  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : 0;
};

const normalizeTextInput = (value: unknown): string =>
  value === null || value === undefined ? '' : String(value);

const normalizeDateInput = (value: unknown): string => {
  const rawValue = normalizeTextInput(value).trim();

  if (!rawValue) {
    return '';
  }

  return rawValue.includes('T') ? rawValue.split('T')[0] : rawValue;
};

const toDateInputValue = (value: string | null | undefined): string => {
  const rawValue = normalizeTextInput(value).trim();

  if (!rawValue) {
    return '';
  }

  return rawValue.includes('T') ? rawValue.split('T')[0] : rawValue;
};

async function fetchSettlementAdvanceCandidates({
  producerId,
  initialAdvanceIds,
  isEditMode,
}: {
  producerId: number;
  initialAdvanceIds: number[];
  isEditMode: boolean;
}): Promise<Advance[]> {
  const result = await fetchAdvances({ producerId });
  const initialAdvanceSet = new Set(initialAdvanceIds);

  return result.data.filter((advance) => {
    if (isEditMode && initialAdvanceSet.has(advance.id)) {
      return true;
    }

    return advance.status === 'paid' && advance.isActive;
  });
}

// ===== STEP 4 TYPES =====
type PaymentMethod = 'transfer' | 'check' | 'cash';

interface PurchaseInvoiceForm {
  invoiceNumber: string;
  invoiceDate: string;
}

interface PurchaseInvoiceErrors {
  invoiceNumber?: string;
  invoiceDate?: string;
}

interface PaymentDetailsForm {
  paymentMethod: PaymentMethod | null;
  paymentDate: string;
  referenceNumber: string;
  bankAccountIndex: number | null;
  notes: string;
}

interface PaymentDetailsErrors {
  paymentDate?: string;
}

const PAYMENT_METHOD_OPTIONS: { id: string; label: string }[] = [
  { id: 'transfer', label: 'Transferencia bancaria' },
  { id: 'check', label: 'Cheque' },
  { id: 'cash', label: 'Efectivo' },
];

const buildInitialPurchaseInvoice = (): PurchaseInvoiceForm => ({
  invoiceNumber: '',
  invoiceDate: '',
});

const buildInitialPaymentDetails = (): PaymentDetailsForm => ({
  paymentMethod: null,
  paymentDate: '',
  referenceNumber: '',
  bankAccountIndex: null,
  notes: '',
});

const NewSettlementDialog: React.FC<NewSettlementDialogProps> = ({
  open,
  onClose,
  mode = 'create',
  settlementId = null,
  onSuccess,
}) => {
  const isEditMode = mode === 'edit';
  const [currentStep, setCurrentStep] = useState<SettlementStep>(1);
  const [isLoadingProducers, setIsLoadingProducers] = useState(false);
  const [isLoadingReceptions, setIsLoadingReceptions] = useState(false);
  const [isLoadingAdvances, setIsLoadingAdvances] = useState(false);
  const [producerOptions, setProducerOptions] = useState<SettlementProducerOption[]>([]);
  const [selectedProducer, setSelectedProducer] =
    useState<SettlementProducerOption | null>(null);
  const [receptionCandidates, setReceptionCandidates] = useState<
    SettlementReceptionCandidate[]
  >([]);
  const [advanceCandidates, setAdvanceCandidates] = useState<Advance[]>([]);
  const [selectedReceptionIds, setSelectedReceptionIds] = useState<number[]>([]);
  const [selectedAdvanceIds, setSelectedAdvanceIds] = useState<number[]>([]);
  const [receptionErrorMessage, setReceptionErrorMessage] = useState<string | null>(null);
  const [advancesErrorMessage, setAdvancesErrorMessage] = useState<string | null>(null);
  const [servicesValidationMessage, setServicesValidationMessage] = useState<string | null>(null);
  const [serviceInvoices, setServiceInvoices] = useState<ServiceInvoiceFormMap>(
    buildInitialServiceInvoices
  );
  const [serviceInvoiceErrors, setServiceInvoiceErrors] =
    useState<ServiceInvoiceErrorsMap>(buildInitialServiceInvoiceErrors);

  const [purchaseInvoice, setPurchaseInvoice] = useState<PurchaseInvoiceForm>(buildInitialPurchaseInvoice);
  const [purchaseInvoiceErrors, setPurchaseInvoiceErrors] = useState<PurchaseInvoiceErrors>({});
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetailsForm>(buildInitialPaymentDetails);
  const [paymentDetailsErrors, setPaymentDetailsErrors] = useState<PaymentDetailsErrors>({});
  const [summaryValidationMessage, setSummaryValidationMessage] = useState<string | null>(null);
  const [isCreatingSettlement, setIsCreatingSettlement] = useState(false);
  const [isLoadingSettlement, setIsLoadingSettlement] = useState(false);
  const [settlementStatus, setSettlementStatus] = useState<Settlement['status'] | null>(null);
  const [initialReceptionIds, setInitialReceptionIds] = useState<number[]>([]);
  const [initialAdvanceIds, setInitialAdvanceIds] = useState<number[]>([]);
  const [isDryPercentDialogOpen, setIsDryPercentDialogOpen] = useState(false);
  const [editingReception, setEditingReception] = useState<SettlementReceptionCandidate | null>(null);
  const [dryPercentInput, setDryPercentInput] = useState('');
  const [dryPercentDialogError, setDryPercentDialogError] = useState<string | null>(null);
  const [isSavingDryPercent, setIsSavingDryPercent] = useState(false);
  const [isRicePriceDialogOpen, setIsRicePriceDialogOpen] = useState(false);
  const [editingRicePriceReception, setEditingRicePriceReception] =
    useState<SettlementReceptionCandidate | null>(null);
  const [ricePriceInput, setRicePriceInput] = useState('');
  const [ricePriceDialogError, setRicePriceDialogError] = useState<string | null>(null);
  const [isSavingRicePrice, setIsSavingRicePrice] = useState(false);
  const [isInterestRateDialogOpen, setIsInterestRateDialogOpen] = useState(false);
  const [editingInterestRateAdvance, setEditingInterestRateAdvance] =
    useState<Advance | null>(null);
  const [interestRateInput, setInterestRateInput] = useState('');
  const [interestRateDialogError, setInterestRateDialogError] = useState<string | null>(null);
  const [isSavingInterestRate, setIsSavingInterestRate] = useState(false);
  const [isInterestEndDateDialogOpen, setIsInterestEndDateDialogOpen] = useState(false);
  const [editingInterestEndDateAdvance, setEditingInterestEndDateAdvance] =
    useState<Advance | null>(null);
  const [interestEndDateInput, setInterestEndDateInput] = useState('');
  const [interestEndDateDialogError, setInterestEndDateDialogError] =
    useState<string | null>(null);
  const [isSavingInterestEndDate, setIsSavingInterestEndDate] = useState(false);
  const [isLiquidatingSettlement, setIsLiquidatingSettlement] = useState(false);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      setSelectedProducer(null);
      setReceptionCandidates([]);
      setAdvanceCandidates([]);
      setSelectedReceptionIds([]);
      setSelectedAdvanceIds([]);
      setReceptionErrorMessage(null);
      setAdvancesErrorMessage(null);
      setServicesValidationMessage(null);
      setServiceInvoices(buildInitialServiceInvoices());
      setServiceInvoiceErrors(buildInitialServiceInvoiceErrors());
      setPurchaseInvoice(buildInitialPurchaseInvoice());
      setPurchaseInvoiceErrors({});
      setPaymentDetails(buildInitialPaymentDetails());
      setPaymentDetailsErrors({});
      setSummaryValidationMessage(null);
      setIsLoadingSettlement(false);
      setSettlementStatus(null);
      setInitialReceptionIds([]);
      setInitialAdvanceIds([]);
      setIsDryPercentDialogOpen(false);
      setEditingReception(null);
      setDryPercentInput('');
      setDryPercentDialogError(null);
      setIsSavingDryPercent(false);
      setIsRicePriceDialogOpen(false);
      setEditingRicePriceReception(null);
      setRicePriceInput('');
      setRicePriceDialogError(null);
      setIsSavingRicePrice(false);
      setIsInterestRateDialogOpen(false);
      setEditingInterestRateAdvance(null);
      setInterestRateInput('');
      setInterestRateDialogError(null);
      setIsSavingInterestRate(false);
      setIsInterestEndDateDialogOpen(false);
      setEditingInterestEndDateAdvance(null);
      setInterestEndDateInput('');
      setInterestEndDateDialogError(null);
      setIsSavingInterestEndDate(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let isMounted = true;

    const loadDialogData = async () => {
      setIsLoadingProducers(true);
      setReceptionErrorMessage(null);
      setAdvancesErrorMessage(null);
      setSummaryValidationMessage(null);

      try {
        const producerResult = await fetchSettlementProducerOptions();

        if (!isMounted) {
          return;
        }

        setProducerOptions(producerResult.data);

        if (!isEditMode) {
          return;
        }

        if (!settlementId) {
          setSummaryValidationMessage(
            'No fue posible identificar la liquidacion a editar.'
          );
          return;
        }

        setIsLoadingSettlement(true);

        const settlement = await fetchSettlementById(settlementId);

        if (!isMounted) {
          return;
        }

        if (!settlement) {
          setSummaryValidationMessage(
            `No fue posible cargar la liquidacion #${settlementId}.`
          );
          return;
        }

        const producerFromOptions = producerResult.data.find(
          (producer) => producer.id === settlement.producerId
        );

        const fallbackProducer: SettlementProducerOption = {
          id: settlement.producerId,
          name: settlement.producer?.name ?? `Productor #${settlement.producerId}`,
          rut: settlement.producer?.rut ?? '-',
          bankAccounts: [],
        };

        setSelectedProducer(producerFromOptions ?? fallbackProducer);
        setSettlementStatus(settlement.status ?? null);
        setInitialReceptionIds(
          Array.isArray(settlement.receptionIds) ? settlement.receptionIds : []
        );
        setInitialAdvanceIds(
          Array.isArray(settlement.advanceIds) ? settlement.advanceIds : []
        );

        const calculationDetails =
          settlement.calculationDetails &&
          typeof settlement.calculationDetails === 'object'
            ? (settlement.calculationDetails as Record<string, unknown>)
            : {};

        const serviceInvoicesRaw =
          calculationDetails.serviceInvoices &&
          typeof calculationDetails.serviceInvoices === 'object'
            ? (calculationDetails.serviceInvoices as Partial<
                Record<SettlementServiceKey, Record<string, unknown>>
              >)
            : {};

        const nextServiceInvoices = buildInitialServiceInvoices();

        for (const serviceKey of SERVICE_KEYS) {
          const rawService = serviceInvoicesRaw[serviceKey];

          if (!rawService || typeof rawService !== 'object') {
            nextServiceInvoices[serviceKey] = {
              ...nextServiceInvoices[serviceKey],
              enabled: false,
            };
            continue;
          }

          const netAmount = Number(rawService.invoiceNetAmount ?? 0);

          nextServiceInvoices[serviceKey] = {
            enabled: true,
            invoiceNumber: normalizeTextInput(rawService.invoiceNumber),
            invoiceDate: normalizeDateInput(rawService.invoiceDate),
            invoiceNetAmount:
              Number.isFinite(netAmount) && netAmount > 0
                ? String(Math.round(netAmount))
                : '',
          };
        }

        const purchaseInvoiceRaw =
          calculationDetails.purchaseInvoice &&
          typeof calculationDetails.purchaseInvoice === 'object'
            ? (calculationDetails.purchaseInvoice as Record<string, unknown>)
            : {};

        const paymentDetailsRaw =
          calculationDetails.paymentDetails &&
          typeof calculationDetails.paymentDetails === 'object'
            ? (calculationDetails.paymentDetails as Record<string, unknown>)
            : {};

        const paymentMethodRaw = normalizeTextInput(
          paymentDetailsRaw.paymentMethod
        ).toLowerCase();
        const paymentMethod: PaymentMethod | null =
          paymentMethodRaw === 'transfer' ||
          paymentMethodRaw === 'check' ||
          paymentMethodRaw === 'cash'
            ? (paymentMethodRaw as PaymentMethod)
            : null;

        const paymentBankAccountIndex = Number(paymentDetailsRaw.bankAccountIndex);

        setServiceInvoices(nextServiceInvoices);
        setServiceInvoiceErrors(buildInitialServiceInvoiceErrors());
        setPurchaseInvoice({
          invoiceNumber: normalizeTextInput(purchaseInvoiceRaw.invoiceNumber),
          invoiceDate: normalizeDateInput(purchaseInvoiceRaw.invoiceDate),
        });
        setPurchaseInvoiceErrors({});
        setPaymentDetails({
          paymentMethod,
          paymentDate: normalizeDateInput(paymentDetailsRaw.paymentDate),
          referenceNumber: normalizeTextInput(paymentDetailsRaw.referenceNumber),
          bankAccountIndex: Number.isFinite(paymentBankAccountIndex)
            ? paymentBankAccountIndex
            : null,
          notes: normalizeTextInput(
            paymentDetailsRaw.notes ?? settlement.notes ?? ''
          ),
        });
        setPaymentDetailsErrors({});
      } finally {
        if (isMounted) {
          setIsLoadingProducers(false);
          setIsLoadingSettlement(false);
        }
      }
    };

    loadDialogData();

    return () => {
      isMounted = false;
    };
  }, [open, isEditMode, settlementId]);

  useEffect(() => {
    if (!open || !selectedProducer) {
      setReceptionCandidates([]);
      setAdvanceCandidates([]);
      setSelectedReceptionIds([]);
      setSelectedAdvanceIds([]);
      setCurrentStep(1);
      setServicesValidationMessage(null);
      setServiceInvoices(buildInitialServiceInvoices());
      setServiceInvoiceErrors(buildInitialServiceInvoiceErrors());
      setPurchaseInvoice(buildInitialPurchaseInvoice());
      setPurchaseInvoiceErrors({});
      setPaymentDetails(buildInitialPaymentDetails());
      setPaymentDetailsErrors({});
      setSummaryValidationMessage(null);
      return;
    }

    let isMounted = true;

    const loadReceptionCandidates = async () => {
      setIsLoadingReceptions(true);
      setReceptionErrorMessage(null);

      const result = await fetchSettlementReceptionCandidates(
        selectedProducer.id,
        isEditMode ? settlementId ?? undefined : undefined
      );

      if (!isMounted) {
        return;
      }

      setReceptionCandidates(result.data);
      const availableReceptionIds = new Set(result.data.map((reception) => reception.id));

      setSelectedReceptionIds((previousSelection) => {
        if (!isEditMode) {
          return [];
        }

        if (previousSelection.length > 0) {
          return previousSelection.filter((id) => availableReceptionIds.has(id));
        }

        return initialReceptionIds.filter((id) => availableReceptionIds.has(id));
      });

      setReceptionErrorMessage(result.error ?? null);
      setIsLoadingReceptions(false);
    };

    loadReceptionCandidates();

    return () => {
      isMounted = false;
    };
  }, [open, selectedProducer, isEditMode, settlementId, initialReceptionIds]);

  useEffect(() => {
    if (!open || !selectedProducer) {
      setAdvanceCandidates([]);
      setSelectedAdvanceIds([]);
      return;
    }

    let isMounted = true;

    const loadAdvanceCandidates = async () => {
      setIsLoadingAdvances(true);
      setAdvancesErrorMessage(null);

      try {
        const paidAdvances = await fetchSettlementAdvanceCandidates({
          producerId: selectedProducer.id,
          initialAdvanceIds,
          isEditMode,
        });

        if (!isMounted) {
          return;
        }

        setAdvanceCandidates(paidAdvances);
        const availableAdvanceIds = new Set(paidAdvances.map((advance) => advance.id));

        setSelectedAdvanceIds((previousSelection) => {
          if (!isEditMode) {
            return [];
          }

          if (previousSelection.length > 0) {
            return previousSelection.filter((id) => availableAdvanceIds.has(id));
          }

          return initialAdvanceIds.filter((id) => availableAdvanceIds.has(id));
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const errorMessage =
          error instanceof Error
            ? error.message
            : 'No fue posible cargar los anticipos del productor.';
        setAdvancesErrorMessage(errorMessage);
        setAdvanceCandidates([]);
        setSelectedAdvanceIds([]);
      } finally {
        if (isMounted) {
          setIsLoadingAdvances(false);
        }
      }
    };

    loadAdvanceCandidates();

    return () => {
      isMounted = false;
    };
  }, [open, selectedProducer, isEditMode, initialAdvanceIds]);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    []
  );

  const selectedReceptions = useMemo(
    () =>
      receptionCandidates.filter((reception) =>
        selectedReceptionIds.includes(reception.id)
      ),
    [receptionCandidates, selectedReceptionIds]
  );

  const selectedAdvances = useMemo(
    () =>
      advanceCandidates.filter((advance) => selectedAdvanceIds.includes(advance.id)),
    [advanceCandidates, selectedAdvanceIds]
  );

  const getDryingValue = (reception: SettlementReceptionCandidate): number => {
    const dryPercent = reception.dryPercent ?? 0;
    return reception.estimatedAmount * (dryPercent / 100);
  };

  const getAdvanceEstimatedInterest = (advance: Advance): number => {
    return calculateAdvanceInterest(advance);
  };

  const selectedReceptionsCount = selectedReceptionIds.length;
  const selectedAdvancesCount = selectedAdvanceIds.length;
  const selectedEstimatedAmount = selectedReceptions.reduce(
    (total, reception) => total + reception.estimatedAmount,
    0
  );
  const selectedDryingAmount = selectedReceptions.reduce(
    (total, reception) => total + getDryingValue(reception),
    0
  );

  const totalNetWeight = receptionCandidates.reduce(
    (total, reception) => total + reception.netWeight,
    0
  );
  const totalEstimatedAmount = receptionCandidates.reduce(
    (total, reception) => total + reception.estimatedAmount,
    0
  );
  const totalDryingAmount = receptionCandidates.reduce(
    (total, reception) => total + getDryingValue(reception),
    0
  );
  const selectedAdvancesAmount = selectedAdvances.reduce(
    (total, advance) => total + advance.amount,
    0
  );
  const totalAdvancesAmount = advanceCandidates.reduce(
    (total, advance) => total + advance.amount,
    0
  );
  const allReceptionsSelected =
    receptionCandidates.length > 0 &&
    receptionCandidates.every((reception) =>
      selectedReceptionIds.includes(reception.id)
    );
  const allAdvancesSelected =
    advanceCandidates.length > 0 &&
    advanceCandidates.every((advance) => selectedAdvanceIds.includes(advance.id));
  const canGoToStepTwo = Boolean(selectedProducer) && selectedReceptionIds.length > 0;
  const canGoToStepThree = canGoToStepTwo;

  const selectedReceptionsNetAmount = selectedEstimatedAmount;
  const selectedReceptionsIvaAmount = Math.round(
    selectedReceptionsNetAmount * RICE_VAT_RATE
  );
  const selectedReceptionsTotalAmount =
    selectedReceptionsNetAmount + selectedReceptionsIvaAmount;
  const selectedEstimatedInterest = selectedAdvances.reduce(
    (total, advance) => total + getAdvanceEstimatedInterest(advance),
    0
  );
  const estimatedBalanceAfterAdvances =
    selectedReceptionsTotalAmount - selectedAdvancesAmount;

  const serviceReferenceAmounts = useMemo(
    () => ({
      drying: Math.round(selectedDryingAmount),
      interest: Math.round(selectedEstimatedInterest),
    }),
    [selectedDryingAmount, selectedEstimatedInterest]
  );

  const serviceInvoiceComputed = useMemo(() => {
    const computed = {} as ServiceInvoiceComputedMap;

    for (const serviceKey of SERVICE_KEYS) {
      const netAmount = Math.round(
        parseCurrencyInput(serviceInvoices[serviceKey].invoiceNetAmount)
      );
      const vatAmount = Math.round(netAmount * SERVICE_VAT_RATE);

      computed[serviceKey] = {
        netAmount,
        vatAmount,
        totalAmount: netAmount + vatAmount,
      };
    }

    return computed;
  }, [serviceInvoices]);

  const serviceInvoiceTotals = useMemo(
    () =>
      SERVICE_KEYS.reduce(
        (totals, serviceKey) => {
          if (!serviceInvoices[serviceKey].enabled) {
            return totals;
          }

          return {
            netAmount: totals.netAmount + serviceInvoiceComputed[serviceKey].netAmount,
            vatAmount: totals.vatAmount + serviceInvoiceComputed[serviceKey].vatAmount,
            totalAmount:
              totals.totalAmount + serviceInvoiceComputed[serviceKey].totalAmount,
          };
        },
        { netAmount: 0, vatAmount: 0, totalAmount: 0 }
      ),
    [serviceInvoiceComputed, serviceInvoices]
  );

  const selectedSeasonId = useMemo(
    () => selectedReceptions[0]?.seasonId ?? 0,
    [selectedReceptions]
  );

  const finalBalanceToPay = useMemo(
    () =>
      selectedReceptionsTotalAmount -
      selectedAdvancesAmount -
      serviceInvoiceTotals.totalAmount,
    [
      selectedReceptionsTotalAmount,
      selectedAdvancesAmount,
      serviceInvoiceTotals.totalAmount,
    ]
  );

  const servicesAreValidated =
    (servicesValidationMessage?.startsWith('Validacion correcta') ?? false);

  const canGoToStepFour = canGoToStepThree && servicesAreValidated;

  useEffect(() => {
    if (selectedAdvanceIds.length === 0) {
      setServiceInvoices((prev) => ({
        ...prev,
        interest: { ...prev.interest, enabled: false },
      }));
    }
  }, [selectedAdvanceIds]);

  const missingRequirements = useMemo(() => {
    const sections: { section: string; items: string[] }[] = [];

    if (selectedReceptionIds.length === 0) {
      sections.push({
        section: 'Recepciones (Paso 1)',
        items: ['Al menos una recepcion seleccionada'],
      });
    }

    const serviceItems: string[] = [];
    if (serviceInvoices.drying.enabled) {
      if (!serviceInvoices.drying.invoiceNumber.trim()) serviceItems.push('Folio factura secado');
      if (!serviceInvoices.drying.invoiceDate) serviceItems.push('Fecha factura secado');
      if (parseCurrencyInput(serviceInvoices.drying.invoiceNetAmount) <= 0)
        serviceItems.push('Monto neto factura secado');
    }
    if (serviceInvoices.interest.enabled) {
      if (!serviceInvoices.interest.invoiceNumber.trim()) serviceItems.push('Folio factura intereses');
      if (!serviceInvoices.interest.invoiceDate) serviceItems.push('Fecha factura intereses');
      if (parseCurrencyInput(serviceInvoices.interest.invoiceNetAmount) <= 0)
        serviceItems.push('Monto neto factura intereses');
    }
    if (serviceItems.length > 0) {
      sections.push({ section: 'Servicios y facturas (Paso 3)', items: serviceItems });
    }

    const summaryItems: string[] = [];
    if (!purchaseInvoice.invoiceNumber.trim()) summaryItems.push('Numero de factura de compra');
    if (!purchaseInvoice.invoiceDate) summaryItems.push('Fecha de factura de compra');
    if (!paymentDetails.paymentMethod) summaryItems.push('Metodo de pago');
    if (!paymentDetails.paymentDate) summaryItems.push('Fecha de pago');
    if (summaryItems.length > 0) {
      sections.push({ section: 'Resumen y pago (Paso 4)', items: summaryItems });
    }

    return sections;
  }, [selectedReceptionIds, serviceInvoices, purchaseInvoice, paymentDetails]);

  const isLiquidarEnabled = useMemo(
    () => missingRequirements.length === 0 && !isLiquidatingSettlement,
    [missingRequirements, isLiquidatingSettlement]
  );

  const toggleReceptionSelection = (receptionId: number, checked: boolean) => {
    setSelectedReceptionIds((prev) => {
      if (checked) {
        return prev.includes(receptionId) ? prev : [...prev, receptionId];
      }

      return prev.filter((id) => id !== receptionId);
    });
  };

  const toggleAllReceptions = (checked: boolean) => {
    setSelectedReceptionIds(
      checked ? receptionCandidates.map((reception) => reception.id) : []
    );
  };

  const openDryPercentDialog = (reception: SettlementReceptionCandidate) => {
    setEditingReception(reception);
    setDryPercentInput(
      reception.dryPercent !== null && reception.dryPercent !== undefined
        ? String(reception.dryPercent)
        : ''
    );
    setDryPercentDialogError(null);
    setIsDryPercentDialogOpen(true);
  };

  const closeDryPercentDialog = (forceClose = false) => {
    if (isSavingDryPercent && !forceClose) {
      return;
    }

    setIsDryPercentDialogOpen(false);
    setEditingReception(null);
    setDryPercentInput('');
    setDryPercentDialogError(null);
  };

  const openRicePriceDialog = (reception: SettlementReceptionCandidate) => {
    setEditingRicePriceReception(reception);
    setRicePriceInput(String(reception.ricePrice ?? ''));
    setRicePriceDialogError(null);
    setIsRicePriceDialogOpen(true);
  };

  const closeRicePriceDialog = (forceClose = false) => {
    if (isSavingRicePrice && !forceClose) {
      return;
    }

    setIsRicePriceDialogOpen(false);
    setEditingRicePriceReception(null);
    setRicePriceInput('');
    setRicePriceDialogError(null);
  };

  const saveDryPercent = async () => {
    if (!editingReception) {
      return;
    }

    if (!editingReception.hasAnalysis) {
      setDryPercentDialogError(
        'La recepción no tiene registro de análisis. No se puede editar secado.',
      );
      return;
    }

    const normalizedInput = dryPercentInput.replace(',', '.').trim();
    const parsedDryPercent = Number(normalizedInput);

    if (!Number.isFinite(parsedDryPercent)) {
      setDryPercentDialogError('Debes ingresar un porcentaje de secado válido.');
      return;
    }

    if (parsedDryPercent < 0 || parsedDryPercent > 100) {
      setDryPercentDialogError('El porcentaje de secado debe estar entre 0 y 100.');
      return;
    }

    setIsSavingDryPercent(true);
    setDryPercentDialogError(null);

    try {
      const result = await updateSettlementReceptionDryPercent(
        editingReception.id,
        parsedDryPercent,
      );

      if (!result.success || !result.data) {
        setDryPercentDialogError(
          result.error || 'No fue posible actualizar el porcentaje de secado.',
        );
        return;
      }

      setReceptionCandidates((prev) =>
        prev.map((reception) =>
          reception.id === result.data!.receptionId
            ? { ...reception, dryPercent: result.data!.dryPercent }
            : reception,
        ),
      );

      closeDryPercentDialog(true);
    } catch (error) {
      setDryPercentDialogError(
        error instanceof Error
          ? error.message
          : 'No fue posible actualizar el porcentaje de secado.',
      );
    } finally {
      setIsSavingDryPercent(false);
    }
  };

  const saveRicePrice = async () => {
    if (!editingRicePriceReception) {
      return;
    }

    const normalizedInput = ricePriceInput.replace(',', '.').trim();
    const parsedRicePrice = Number(normalizedInput);

    if (!Number.isFinite(parsedRicePrice)) {
      setRicePriceDialogError('Debes ingresar un precio por kg valido.');
      return;
    }

    if (parsedRicePrice <= 0) {
      setRicePriceDialogError('El precio por kg debe ser mayor a cero.');
      return;
    }

    setIsSavingRicePrice(true);
    setRicePriceDialogError(null);

    try {
      const result = await updateSettlementReceptionRicePrice(
        editingRicePriceReception.id,
        parsedRicePrice,
      );

      if (!result.success || !result.data) {
        setRicePriceDialogError(
          result.error || 'No fue posible actualizar el precio por kg.',
        );
        return;
      }

      setReceptionCandidates((prev) =>
        prev.map((reception) =>
          reception.id === result.data!.receptionId
            ? {
                ...reception,
                ricePrice: result.data!.ricePrice,
                estimatedAmount: Math.round(reception.netWeight * result.data!.ricePrice),
              }
            : reception,
        ),
      );

      closeRicePriceDialog(true);
    } catch (error) {
      setRicePriceDialogError(
        error instanceof Error
          ? error.message
          : 'No fue posible actualizar el precio por kg.',
      );
    } finally {
      setIsSavingRicePrice(false);
      setIsLiquidatingSettlement(false);
      setIsInfoDialogOpen(false);
    }
  };

  const toggleAdvanceSelection = (advanceId: number, checked: boolean) => {
    setSelectedAdvanceIds((prev) => {
      if (checked) {
        return prev.includes(advanceId) ? prev : [...prev, advanceId];
      }

      return prev.filter((id) => id !== advanceId);
    });
  };

  const toggleAllAdvances = (checked: boolean) => {
    setSelectedAdvanceIds(
      checked ? advanceCandidates.map((advance) => advance.id) : []
    );
  };

  const refreshAdvanceCandidates = async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    if (!selectedProducer) {
      return {
        success: false,
        error: 'No hay un productor seleccionado para recargar anticipos.',
      };
    }

    setIsLoadingAdvances(true);
    setAdvancesErrorMessage(null);

    try {
      const nextAdvanceCandidates = await fetchSettlementAdvanceCandidates({
        producerId: selectedProducer.id,
        initialAdvanceIds,
        isEditMode,
      });
      const availableAdvanceIds = new Set(
        nextAdvanceCandidates.map((advance) => advance.id)
      );

      setAdvanceCandidates(nextAdvanceCandidates);
      setSelectedAdvanceIds((previousSelection) =>
        previousSelection.filter((id) => availableAdvanceIds.has(id))
      );
      setServicesValidationMessage(null);
      setSummaryValidationMessage(null);

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'No fue posible recargar los anticipos del productor.';

      setAdvancesErrorMessage(errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoadingAdvances(false);
    }
  };

  const openInterestRateDialog = (advance: Advance) => {
    setEditingInterestRateAdvance(advance);
    setInterestRateInput(String(advance.interestRate ?? ''));
    setInterestRateDialogError(null);
    setIsInterestRateDialogOpen(true);
  };

  const closeInterestRateDialog = (forceClose = false) => {
    if (isSavingInterestRate && !forceClose) {
      return;
    }

    setIsInterestRateDialogOpen(false);
    setEditingInterestRateAdvance(null);
    setInterestRateInput('');
    setInterestRateDialogError(null);
  };

  const openInterestEndDateDialog = (advance: Advance) => {
    setEditingInterestEndDateAdvance(advance);
    setInterestEndDateInput(toDateInputValue(advance.interestEndDate ?? null));
    setInterestEndDateDialogError(null);
    setIsInterestEndDateDialogOpen(true);
  };

  const closeInterestEndDateDialog = (forceClose = false) => {
    if (isSavingInterestEndDate && !forceClose) {
      return;
    }

    setIsInterestEndDateDialogOpen(false);
    setEditingInterestEndDateAdvance(null);
    setInterestEndDateInput('');
    setInterestEndDateDialogError(null);
  };

  const saveInterestRate = async () => {
    if (!editingInterestRateAdvance) {
      return;
    }

    const normalizedInput = interestRateInput.replace(',', '.').trim();
    const parsedInterestRate = Number(normalizedInput);

    if (!normalizedInput.length || !Number.isFinite(parsedInterestRate)) {
      setInterestRateDialogError('Debes ingresar un porcentaje de interés válido.');
      return;
    }

    if (parsedInterestRate < 0) {
      setInterestRateDialogError('El porcentaje de interés no puede ser negativo.');
      return;
    }

    setIsSavingInterestRate(true);
    setInterestRateDialogError(null);

    try {
      const result = await updateAdvanceWithResult(editingInterestRateAdvance.id, {
        interestRate: parsedInterestRate,
      });

      if (!result.success || !result.data) {
        setInterestRateDialogError(
          result.error || 'No fue posible actualizar el porcentaje de interés.',
        );
        return;
      }

      const refreshResult = await refreshAdvanceCandidates();

      if (!refreshResult.success) {
        setInterestRateDialogError(
          refreshResult.error ||
            'El cambio se guardó, pero no fue posible recargar la tabla de anticipos.',
        );
        return;
      }

      closeInterestRateDialog(true);
    } catch (error) {
      setInterestRateDialogError(
        error instanceof Error
          ? error.message
          : 'No fue posible actualizar el porcentaje de interés.',
      );
    } finally {
      setIsSavingInterestRate(false);
    }
  };

  const saveInterestEndDate = async () => {
    if (!editingInterestEndDateAdvance) {
      return;
    }

    setIsSavingInterestEndDate(true);
    setInterestEndDateDialogError(null);

    try {
      const result = await updateAdvanceWithResult(editingInterestEndDateAdvance.id, {
        interestEndDate: interestEndDateInput.trim() || null,
      });

      if (!result.success || !result.data) {
        setInterestEndDateDialogError(
          result.error ||
            'No fue posible actualizar la fecha de finalización del interés.',
        );
        return;
      }

      const refreshResult = await refreshAdvanceCandidates();

      if (!refreshResult.success) {
        setInterestEndDateDialogError(
          refreshResult.error ||
            'El cambio se guardó, pero no fue posible recargar la tabla de anticipos.',
        );
        return;
      }

      closeInterestEndDateDialog(true);
    } catch (error) {
      setInterestEndDateDialogError(
        error instanceof Error
          ? error.message
          : 'No fue posible actualizar la fecha de finalización del interés.',
      );
    } finally {
      setIsSavingInterestEndDate(false);
    }
  };

  const updateServiceInvoiceField = (
    serviceKey: SettlementServiceKey,
    field: 'invoiceNumber' | 'invoiceDate' | 'invoiceNetAmount',
    value: string
  ) => {
    setServiceInvoices((prev) => ({
      ...prev,
      [serviceKey]: {
        ...prev[serviceKey],
        [field]: value,
      },
    }));

    setServiceInvoiceErrors((prev) => ({
      ...prev,
      [serviceKey]: {
        ...prev[serviceKey],
        [field]: undefined,
      },
    }));

    setServicesValidationMessage(null);
  };

  const toggleServiceInclusion = (
    serviceKey: SettlementServiceKey,
    checked: boolean
  ) => {
    setServiceInvoices((prev) => ({
      ...prev,
      [serviceKey]: {
        ...prev[serviceKey],
        enabled: checked,
      },
    }));

    if (!checked) {
      setServiceInvoiceErrors((prev) => ({
        ...prev,
        [serviceKey]: {},
      }));
    }

    setServicesValidationMessage(null);
  };

  const applyServiceSuggestedAmounts = () => {
    setServiceInvoices((prev) => {
      const shouldSetDryingSuggestion =
        !prev.drying.invoiceNetAmount && serviceReferenceAmounts.drying > 0;
      const shouldSetInterestSuggestion =
        !prev.interest.invoiceNetAmount && serviceReferenceAmounts.interest > 0;

      return {
        drying: {
          ...prev.drying,
          enabled:
            serviceReferenceAmounts.drying > 0 ? true : prev.drying.enabled,
          invoiceNetAmount: shouldSetDryingSuggestion
            ? String(serviceReferenceAmounts.drying)
            : prev.drying.invoiceNetAmount,
        },
        interest: {
          ...prev.interest,
          enabled:
            serviceReferenceAmounts.interest > 0 ? true : prev.interest.enabled,
          invoiceNetAmount: shouldSetInterestSuggestion
            ? String(serviceReferenceAmounts.interest)
            : prev.interest.invoiceNetAmount,
        },
      };
    });
  };

  const validateServiceInvoices = (): boolean => {
    const nextErrors = buildInitialServiceInvoiceErrors();
    let hasErrors = false;

    for (const serviceKey of SERVICE_KEYS) {
      const serviceInvoice = serviceInvoices[serviceKey];

      if (!serviceInvoice.enabled) {
        continue;
      }

      const invoiceNumber = serviceInvoice.invoiceNumber.trim();
      if (invoiceNumber && !/^[A-Za-z0-9-]{3,30}$/.test(invoiceNumber)) {
        nextErrors[serviceKey].invoiceNumber =
          'El folio solo permite letras, numeros y guion.';
        hasErrors = true;
      }

      if (serviceInvoice.invoiceDate) {
        const invoiceDate = new Date(`${serviceInvoice.invoiceDate}T00:00:00`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (Number.isNaN(invoiceDate.getTime())) {
          nextErrors[serviceKey].invoiceDate = 'La fecha de factura no es valida.';
          hasErrors = true;
        } else if (invoiceDate > today) {
          nextErrors[serviceKey].invoiceDate =
            'La fecha de factura no puede ser futura.';
          hasErrors = true;
        }
      }

      const netAmount = parseCurrencyInput(serviceInvoice.invoiceNetAmount);
      if (netAmount <= 0) {
        nextErrors[serviceKey].invoiceNetAmount =
          'El monto neto de factura debe ser mayor a cero.';
        hasErrors = true;
      }
    }

    setServiceInvoiceErrors(nextErrors);
    setServicesValidationMessage(
      hasErrors
        ? 'Revisa los datos informados de servicios antes de pre-liquidar.'
        : 'Validacion correcta: los servicios estan listos para pre-liquidar.'
    );

    return !hasErrors;
  };

  const validateSummaryForm = (): boolean => {
    const nextPurchaseErrors: PurchaseInvoiceErrors = {};
    const nextPaymentErrors: PaymentDetailsErrors = {};
    let hasErrors = false;

    const invoiceNum = purchaseInvoice.invoiceNumber.trim();
    if (invoiceNum && !/^[A-Za-z0-9-]{1,30}$/.test(invoiceNum)) {
      nextPurchaseErrors.invoiceNumber = 'Solo letras, numeros y guion (max 30 caracteres).';
      hasErrors = true;
    }

    if (purchaseInvoice.invoiceDate) {
      const d = new Date(`${purchaseInvoice.invoiceDate}T00:00:00`);
      if (Number.isNaN(d.getTime())) {
        nextPurchaseErrors.invoiceDate = 'La fecha no es valida.';
        hasErrors = true;
      }
    }

    if (paymentDetails.paymentDate) {
      const d = new Date(`${paymentDetails.paymentDate}T00:00:00`);
      if (Number.isNaN(d.getTime())) {
        nextPaymentErrors.paymentDate = 'La fecha de pago no es valida.';
        hasErrors = true;
      }
    }

    setPurchaseInvoiceErrors(nextPurchaseErrors);
    setPaymentDetailsErrors(nextPaymentErrors);
    if (hasErrors) {
      setSummaryValidationMessage(
        'Revisa los datos opcionales informados antes de pre-liquidar.'
      );
    }
    return !hasErrors;
  };

  const handleSaveSettlement = async () => {
    if (!validateSummaryForm() || !selectedProducer) {
      return;
    }

    if (isEditMode && !settlementId) {
      setSummaryValidationMessage(
        'No fue posible identificar la liquidacion a editar.'
      );
      return;
    }

    setIsCreatingSettlement(true);
    setSummaryValidationMessage(null);

    try {
      const calculationDetails: Record<string, unknown> = {
        summary: {
          totalReceptions: selectedReceptionsCount,
          netRiceAmount: selectedReceptionsNetAmount,
          riceVatAmount: selectedReceptionsIvaAmount,
          totalRiceAmount: selectedReceptionsTotalAmount,
          dryingReferenceAmount: selectedDryingAmount,
          totalAdvances: selectedAdvancesAmount,
          estimatedInterest: selectedEstimatedInterest,
          totalServicesWithVat: serviceInvoiceTotals.totalAmount,
          finalBalance: finalBalanceToPay,
        },
        serviceInvoices: SERVICE_KEYS.reduce(
          (acc, key) => {
            if (serviceInvoices[key].enabled) {
              acc[key] = {
                invoiceNumber: serviceInvoices[key].invoiceNumber.trim() || null,
                invoiceDate: serviceInvoices[key].invoiceDate || null,
                invoiceNetAmount: serviceInvoiceComputed[key].netAmount,
                vatAmount: serviceInvoiceComputed[key].vatAmount,
                totalAmount: serviceInvoiceComputed[key].totalAmount,
              };
            }
            return acc;
          },
          {} as Record<string, unknown>
        ),
        purchaseInvoice: {
          invoiceNumber: purchaseInvoice.invoiceNumber.trim() || null,
          invoiceDate: purchaseInvoice.invoiceDate || null,
          netAmount: selectedReceptionsNetAmount,
          ivaAmount: selectedReceptionsIvaAmount,
          totalAmount: selectedReceptionsTotalAmount,
        },
        paymentDetails: {
          paymentMethod: paymentDetails.paymentMethod,
          paymentDate: paymentDetails.paymentDate || null,
          referenceNumber: paymentDetails.referenceNumber.trim() || null,
          bankAccountIndex: paymentDetails.bankAccountIndex,
          notes: paymentDetails.notes.trim() || null,
        },
      };

      const sharedPayload = {
        receptionIds: selectedReceptionIds,
        advanceIds: selectedAdvanceIds,
        calculationDetails,
        notes: paymentDetails.notes.trim(),
      };

      const result = isEditMode
        ? await updateSettlement(settlementId as number, sharedPayload)
        : await createSettlement({
            producerId: selectedProducer.id,
            seasonId: selectedSeasonId,
            ...sharedPayload,
          });

      if (result.success) {
        setSummaryValidationMessage(
          isEditMode
            ? `Liquidacion #${result.data?.id} actualizada correctamente.`
            : `Pre-liquidacion #${result.data?.id} guardada correctamente.`
        );

        if (result.data) {
          onSuccess?.(result.data);
        }

        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setSummaryValidationMessage(
          isEditMode
            ? `Error al actualizar la liquidacion: ${result.error}`
            : `Error al crear la liquidacion: ${result.error}`
        );
      }
    } catch {
      setSummaryValidationMessage(
        isEditMode
          ? 'Ocurrio un error inesperado al actualizar la liquidacion.'
          : 'Ocurrio un error inesperado al crear la liquidacion.'
      );
    } finally {
      setIsCreatingSettlement(false);
    }
  };

  const handleLiquidarSettlement = async () => {
    if (!selectedProducer) return;
    if (!validateSummaryForm()) return;
    if (!isLiquidarEnabled) return;

    setIsLiquidatingSettlement(true);
    setSummaryValidationMessage(null);

    try {
      const calculationDetails: Record<string, unknown> = {
        summary: {
          totalReceptions: selectedReceptionsCount,
          netRiceAmount: selectedReceptionsNetAmount,
          riceVatAmount: selectedReceptionsIvaAmount,
          totalRiceAmount: selectedReceptionsTotalAmount,
          dryingReferenceAmount: selectedDryingAmount,
          totalAdvances: selectedAdvancesAmount,
          estimatedInterest: selectedEstimatedInterest,
          totalServicesWithVat: serviceInvoiceTotals.totalAmount,
          finalBalance: finalBalanceToPay,
        },
        serviceInvoices: SERVICE_KEYS.reduce(
          (acc, key) => {
            if (serviceInvoices[key].enabled) {
              acc[key] = {
                invoiceNumber: serviceInvoices[key].invoiceNumber.trim() || null,
                invoiceDate: serviceInvoices[key].invoiceDate || null,
                invoiceNetAmount: serviceInvoiceComputed[key].netAmount,
                vatAmount: serviceInvoiceComputed[key].vatAmount,
                totalAmount: serviceInvoiceComputed[key].totalAmount,
              };
            }
            return acc;
          },
          {} as Record<string, unknown>
        ),
        purchaseInvoice: {
          invoiceNumber: purchaseInvoice.invoiceNumber.trim() || null,
          invoiceDate: purchaseInvoice.invoiceDate || null,
          netAmount: selectedReceptionsNetAmount,
          ivaAmount: selectedReceptionsIvaAmount,
          totalAmount: selectedReceptionsTotalAmount,
        },
        paymentDetails: {
          paymentMethod: paymentDetails.paymentMethod,
          paymentDate: paymentDetails.paymentDate || null,
          referenceNumber: paymentDetails.referenceNumber.trim() || null,
          bankAccountIndex: paymentDetails.bankAccountIndex,
          notes: paymentDetails.notes.trim() || null,
        },
      };

      const sharedPayload = {
        receptionIds: selectedReceptionIds,
        advanceIds: selectedAdvanceIds,
        calculationDetails,
        notes: paymentDetails.notes.trim(),
      };

      let targetId: number | undefined = isEditMode ? (settlementId as number) : undefined;

      if (isEditMode && targetId) {
        const updateResult = await updateSettlement(targetId, sharedPayload);
        if (!updateResult.success) {
          setSummaryValidationMessage(
            `Error al actualizar antes de liquidar: ${updateResult.error}`
          );
          return;
        }
      } else {
        const createResult = await createSettlement({
          producerId: selectedProducer.id,
          seasonId: selectedSeasonId,
          ...sharedPayload,
        });
        if (!createResult.success || !createResult.data) {
          setSummaryValidationMessage(
            `Error al crear la pre-liquidacion: ${createResult.error}`
          );
          return;
        }
        targetId = createResult.data.id;
      }

      const completePayload: CompleteSettlementPayload = {
        calculationDetails,
        notes: paymentDetails.notes.trim() || undefined,
        paymentDetails: {
          paymentMethod: paymentDetails.paymentMethod ?? undefined,
          paymentDate: paymentDetails.paymentDate || undefined,
          referenceNumber: paymentDetails.referenceNumber.trim() || undefined,
          bankAccountIndex: paymentDetails.bankAccountIndex ?? undefined,
          notes: paymentDetails.notes.trim() || undefined,
        },
      };

      const completeResult = await completeSettlement(targetId!, completePayload);

      if (completeResult.success) {
        setSummaryValidationMessage(`Liquidacion #${targetId} completada correctamente.`);
        if (completeResult.data) {
          onSuccess?.(completeResult.data);
        }
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setSummaryValidationMessage(`Error al liquidar: ${completeResult.error}`);
      }
    } catch {
      setSummaryValidationMessage('Ocurrio un error inesperado al liquidar la liquidacion.');
    } finally {
      setIsLiquidatingSettlement(false);
    }
  };

  const moveToStep = (step: SettlementStep) => {
    if (step === 1) {
      setCurrentStep(1);
      setServicesValidationMessage(null);
      return;
    }

    if (step === 2) {
      if (!canGoToStepTwo) {
        return;
      }

      setCurrentStep(2);
      setServicesValidationMessage(null);
      return;
    }

    if (step === 3) {
      if (!canGoToStepThree) {
        return;
      }

      applyServiceSuggestedAmounts();
      setCurrentStep(3);
      setServicesValidationMessage(null);
      return;
    }

    if (!canGoToStepFour) {
      return;
    }

    setSummaryValidationMessage(null);
    setCurrentStep(4);
  };

  const moveToNextStep = () => {
    if (currentStep === 1) {
      moveToStep(2);
      return;
    }

    if (currentStep === 2) {
      moveToStep(3);
      return;
    }

    if (currentStep === 3) {
      const isValid = validateServiceInvoices();
      if (isValid) {
        setSummaryValidationMessage(null);
        setCurrentStep(4);
      }
    }
  };

  const moveToPreviousStep = () => {
    if (currentStep === 4) {
      moveToStep(3);
      return;
    }

    if (currentStep === 3) {
      moveToStep(2);
      return;
    }

    moveToStep(1);
  };

  const getStatusConfig = (
    status: SettlementReceptionCandidate['status']
  ) => {
    if (status === 'cancelled') {
      return {
        label: 'Cancelada',
        className: 'bg-red-100 text-red-700',
      };
    }

    if (status === 'analyzed') {
      return {
        label: 'Analizada',
        className: 'bg-blue-100 text-blue-800',
      };
    }

    if (status === 'settled') {
      return {
        label: 'Liquidada',
        className: 'bg-green-100 text-green-800',
      };
    }

    return {
      label: 'Cancelada',
      className: 'bg-red-100 text-red-700',
    };
  };

  const settlementStatusLabels: Record<Settlement['status'], string> = {
    draft: 'Pre-liquidacion',
    completed: 'Completada',
    cancelled: 'Cancelada',
  };
  const settlementStatusStyles: Record<Settlement['status'], string> = {
    draft: 'bg-gray-100 text-gray-700',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-700',
  };

  const dialogTitle = isEditMode ? (
    <span className="flex items-center gap-2">
      {`Editar liquidacion${settlementId ? ` #${settlementId}` : ''}`}
      {settlementStatus && (
        <span
          className={`rounded px-2 py-0.5 text-[11px] font-medium ${settlementStatusStyles[settlementStatus]}`}
        >
          {settlementStatusLabels[settlementStatus]}
        </span>
      )}
    </span>
  ) : (
    'Crear liquidacion'
  );

  if (!open) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
        <div className="w-screen h-screen max-w-none bg-white rounded-lg shadow-2xl flex flex-col">
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900">{dialogTitle}</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-lg font-medium leading-none"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden px-2.5 pt-1 pb-2">
            <div className="flex h-full flex-col gap-2">
              <div className="grid gap-2 md:grid-cols-4">
            <button
              type="button"
              onClick={() => moveToStep(1)}
              className={`rounded-lg border px-2.5 py-2 text-left transition ${
                currentStep === 1
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                    Paso 1
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-neutral-900">
                    Seleccionar recepciones
                  </p>
                  <p className="mt-0.5 text-[11px] text-neutral-600">
                    {selectedReceptionsCount} recepciones marcadas
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-neutral-400">
                    Monto
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold text-neutral-900">
                    {currencyFormatter.format(selectedEstimatedAmount)}
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={canGoToStepTwo ? () => moveToStep(2) : undefined}
              disabled={!canGoToStepTwo}
              className={`rounded-lg border px-2.5 py-2 text-left transition ${
                currentStep === 2
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 bg-white'
              } ${!canGoToStepTwo ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                    Paso 2
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-neutral-900">
                    Seleccionar anticipos
                  </p>
                  <p className="mt-0.5 text-[11px] text-neutral-600">
                    {selectedAdvancesCount} anticipos marcados
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-neutral-400">
                    Monto
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold text-neutral-900">
                    {currencyFormatter.format(selectedAdvancesAmount)}
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={canGoToStepThree ? () => moveToStep(3) : undefined}
              disabled={!canGoToStepThree}
              className={`rounded-lg border px-2.5 py-2 text-left transition ${
                currentStep === 3
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 bg-white'
              } ${!canGoToStepThree ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                    Paso 3
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-neutral-900">
                    Servicios y facturas
                  </p>
                  <p className="mt-0.5 text-[11px] text-neutral-600">
                    Validacion de servicios
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-neutral-400">
                    Monto
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold text-neutral-900">
                    {currencyFormatter.format(serviceInvoiceTotals.totalAmount)}
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={canGoToStepFour ? () => moveToStep(4) : undefined}
              disabled={!canGoToStepFour}
              className={`rounded-lg border px-2.5 py-2 text-left transition ${
                currentStep === 4
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 bg-white'
              } ${!canGoToStepFour ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                    Paso 4
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-neutral-900">
                    {isEditMode ? 'Resumen y edicion' : 'Resumen y creacion'}
                  </p>
                  <p className="mt-0.5 text-[11px] text-neutral-600">
                    Revision final y datos de pago
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-neutral-400">
                    Saldo
                  </p>
                  <p
                    className={`mt-0.5 text-[11px] font-semibold ${
                      finalBalanceToPay >= 0 ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {currencyFormatter.format(finalBalanceToPay)}
                  </p>
                </div>
              </div>
            </button>
        </div>

        <AutoComplete<SettlementProducerOption>
            label="Productor"
            placeholder={isLoadingProducers ? 'Cargando productores...' : 'Buscar productor por nombre o RUT'}
            options={producerOptions}
            value={selectedProducer}
            onChange={(option) => {
              setSelectedProducer(option);
              setReceptionErrorMessage(null);
              setAdvancesErrorMessage(null);
              setServicesValidationMessage(null);
              setServiceInvoiceErrors(buildInitialServiceInvoiceErrors());
            }}
            getOptionLabel={(option) => `${option.name} · ${option.rut}`}
            getOptionValue={(option) => option.id}
            filterOption={(option, inputValue) => {
              const query = inputValue.toLowerCase();
              return (
                option.name.toLowerCase().includes(query) ||
                option.rut.toLowerCase().includes(query) ||
                (option.city || '').toLowerCase().includes(query)
              );
            }}
            disabled={isLoadingProducers || isEditMode}
            compact
          />

        {currentStep === 1 && receptionErrorMessage && (
          <Alert variant="error" className="px-2.5 py-1.5 text-xs leading-4">{receptionErrorMessage}</Alert>
        )}

        {currentStep === 2 && advancesErrorMessage && (
          <Alert variant="error" className="px-2.5 py-1.5 text-xs leading-4">{advancesErrorMessage}</Alert>
        )}

        {currentStep === 3 && servicesValidationMessage && (
          <Alert
            className="px-2.5 py-1.5 text-xs leading-4"
            variant={
              servicesValidationMessage.startsWith('Validacion correcta')
                ? 'success'
                : 'warning'
            }
          >
            {servicesValidationMessage}
          </Alert>
        )}

        {currentStep === 4 && summaryValidationMessage && (
          <Alert
            className="px-2.5 py-1.5 text-xs leading-4"
            variant={
              summaryValidationMessage.includes('guardada correctamente') ||
              summaryValidationMessage.includes('actualizada correctamente')
                ? 'success'
                : 'error'
            }
          >
            {summaryValidationMessage}
          </Alert>
        )}

        {isEditMode && isLoadingSettlement && (
          <Alert variant="info" className="px-2.5 py-1.5 text-xs leading-4">
            Cargando datos de la liquidacion para edicion...
          </Alert>
        )}

        {!selectedProducer && !isLoadingSettlement && (
          <Alert variant="info" className="px-2.5 py-1.5 text-xs leading-4">
            Primero selecciona un productor. Luego podras marcar las recepciones que entraran en la liquidacion.
          </Alert>
        )}

        {currentStep === 1 &&
          selectedProducer &&
          !isLoadingReceptions &&
          !receptionErrorMessage &&
          receptionCandidates.length === 0 && (
          <Alert variant="warning" className="px-2.5 py-1.5 text-xs leading-4">
            El productor seleccionado no tiene recepciones pendientes de liquidar.
          </Alert>
          )}

        {currentStep === 2 &&
          selectedProducer &&
          !isLoadingAdvances &&
          !advancesErrorMessage &&
          advanceCandidates.length === 0 && (
            <Alert variant="warning" className="px-2.5 py-1.5 text-xs leading-4">
              El productor seleccionado no tiene anticipos pagados disponibles para liquidar.
            </Alert>
          )}

        <div className="min-h-0 flex-1 rounded-xl border border-gray-200 bg-white p-2">
          {currentStep === 1 ? (
            isLoadingReceptions ? (
              <div className="flex h-full min-h-52 items-center justify-center text-xs text-gray-500">
                Cargando recepciones del productor...
              </div>
            ) : (
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-2 pb-2">
                <div>
                  <h3 className="text-xs font-semibold text-neutral-900">
                    Recepciones disponibles para la liquidacion
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Marca las recepciones que seran incluidas en esta liquidacion.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="rounded bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700">
                    {selectedReceptionsCount} seleccionadas
                  </span>
                  <span className="rounded bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700">
                    Total estimado {currencyFormatter.format(selectedEstimatedAmount)}
                  </span>
                  <span className="rounded bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700">
                    Valor secado {currencyFormatter.format(selectedDryingAmount)}
                  </span>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-auto">
                <table className="min-w-full border-separate border-spacing-0 text-[10px] leading-4">
                  <thead className="sticky top-0 z-10 bg-white">
                    <tr>
                      <th className="w-16 border-b border-gray-200 px-1.5 py-1.5 text-center text-[9px] font-semibold text-neutral-900">
                        <div className="flex flex-col items-center gap-1">
                          <span>Incluir</span>
                          <Switch
                            checked={allReceptionsSelected}
                            onChange={toggleAllReceptions}
                            disabled={receptionCandidates.length === 0}
                          />
                        </div>
                      </th>
                      <th className="border-b border-gray-200 px-1.5 py-1.5 text-left text-[9px] font-semibold text-neutral-900">
                        Guia
                      </th>
                      <th className="border-b border-gray-200 px-1.5 py-1.5 text-left text-[9px] font-semibold text-neutral-900">
                        Fecha
                      </th>
                      <th className="border-b border-gray-200 px-1.5 py-1.5 text-left text-[9px] font-semibold text-neutral-900">
                        Tipo arroz
                      </th>
                      <th className="border-b border-gray-200 px-1.5 py-1.5 text-left text-[9px] font-semibold text-neutral-900">
                        Temporada
                      </th>
                      <th className="border-b border-gray-200 px-1.5 py-1.5 text-left text-[9px] font-semibold text-neutral-900">
                        Patente
                      </th>
                      <th className="border-b border-gray-200 px-1.5 py-1.5 text-right text-[9px] font-semibold text-neutral-900">
                        Peso neto
                      </th>
                      <th className="border-b border-gray-200 px-1.5 py-1.5 text-right text-[9px] font-semibold text-neutral-900">
                        Secado
                      </th>
                      <th className="border-b border-gray-200 px-1.5 py-1.5 text-right text-[9px] font-semibold text-neutral-900">
                        Precio kg
                      </th>
                      <th className="border-b border-gray-200 px-1.5 py-1.5 text-right text-[9px] font-semibold text-neutral-900">
                        Valor secado
                      </th>
                      <th className="border-b border-gray-200 px-1.5 py-1.5 text-right text-[9px] font-semibold text-neutral-900">
                        Monto estimado
                      </th>
                      <th className="border-b border-gray-200 px-1.5 py-1.5 text-left text-[9px] font-semibold text-neutral-900">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {receptionCandidates.map((reception) => {
                      const isSelected = selectedReceptionIds.includes(reception.id);
                      const statusConfig = getStatusConfig(reception.status);

                      return (
                        <tr
                          key={reception.id}
                          className={isSelected ? 'bg-emerald-50/60' : 'bg-white'}
                        >
                          <td className="border-b border-gray-100 px-1.5 py-1.5 text-center align-middle">
                            <div className="flex items-center justify-center">
                              <Switch
                                checked={isSelected}
                                onChange={(checked) =>
                                  toggleReceptionSelection(reception.id, checked)
                                }
                              />
                            </div>
                          </td>
                          <td className="border-b border-gray-100 px-1.5 py-1.5 text-neutral-900">
                            {reception.guideNumber}
                          </td>
                          <td className="border-b border-gray-100 px-1.5 py-1.5 text-neutral-700">
                            {new Date(reception.createdAt).toLocaleDateString('es-CL')}
                          </td>
                          <td className="border-b border-gray-100 px-1.5 py-1.5 text-neutral-700">
                            {reception.riceTypeName || '-'}
                          </td>
                          <td className="border-b border-gray-100 px-1.5 py-1.5 text-neutral-700">
                            {reception.seasonCode || reception.seasonName || '-'}
                          </td>
                          <td className="border-b border-gray-100 px-1.5 py-1.5 text-neutral-700">
                            {reception.licensePlate || '-'}
                          </td>
                          <td className="border-b border-gray-100 px-1.5 py-1.5 text-right text-neutral-700">
                            {reception.netWeight.toFixed(2)} kg
                          </td>
                          <td className="border-b border-gray-100 px-1.5 py-1.5 text-neutral-700">
                            <div className="flex items-center justify-end gap-1">
                              <span>
                                {reception.dryPercent !== null && reception.dryPercent !== undefined
                                  ? `${reception.dryPercent.toFixed(2)} %`
                                  : '-'}
                              </span>
                              <IconButton
                                icon="edit"
                                variant="basicSecondary"
                                size="xs"
                                ariaLabel="Editar porcentaje de secado"
                                title={
                                  reception.hasAnalysis
                                    ? 'Editar secado del análisis'
                                    : 'Sin análisis para editar secado'
                                }
                                disabled={!reception.hasAnalysis}
                                onClick={() => openDryPercentDialog(reception)}
                              />
                            </div>
                          </td>
                          <td className="border-b border-gray-100 px-1.5 py-1.5 text-right text-neutral-700">
                            <div className="flex items-center justify-end gap-1">
                              <span>{currencyFormatter.format(reception.ricePrice)}</span>
                              <IconButton
                                icon="edit"
                                variant="basicSecondary"
                                size="xs"
                                ariaLabel="Editar precio por kg"
                                title={
                                  reception.status !== 'settled' && reception.status !== 'cancelled'
                                    ? 'Editar precio por kg'
                                    : 'No se puede editar una recepción liquidada o cancelada'
                                }
                                disabled={
                                  reception.status === 'settled' ||
                                  reception.status === 'cancelled'
                                }
                                onClick={() => openRicePriceDialog(reception)}
                              />
                            </div>
                          </td>
                          <td className="border-b border-gray-100 px-1.5 py-1.5 text-right text-neutral-700">
                            {currencyFormatter.format(getDryingValue(reception))}
                          </td>
                          <td className="border-b border-gray-100 px-1.5 py-1.5 text-right font-medium text-neutral-900">
                            {currencyFormatter.format(reception.estimatedAmount)}
                          </td>
                          <td className="border-b border-gray-100 px-1.5 py-1.5">
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${statusConfig.className}`}
                            >
                              {statusConfig.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="sticky bottom-0 z-10 bg-white">
                    <tr>
                      <td
                        colSpan={6}
                        className="border-t border-gray-300 px-1.5 py-1.5 text-right text-[9px] font-semibold uppercase tracking-wide text-neutral-700"
                      >
                        Totales
                      </td>
                      <td className="border-t border-gray-300 px-1.5 py-1.5 text-right font-semibold text-neutral-900">
                        {totalNetWeight.toFixed(2)} kg
                      </td>
                      <td className="border-t border-gray-300 px-1.5 py-1.5 text-right text-neutral-500">
                        -
                      </td>
                      <td className="border-t border-gray-300 px-1.5 py-1.5 text-right text-neutral-500">
                        -
                      </td>
                      <td className="border-t border-gray-300 px-1.5 py-1.5 text-right font-semibold text-neutral-900">
                        {currencyFormatter.format(totalDryingAmount)}
                      </td>
                      <td className="border-t border-gray-300 px-1.5 py-1.5 text-right font-semibold text-neutral-900">
                        {currencyFormatter.format(totalEstimatedAmount)}
                      </td>
                      <td className="border-t border-gray-300 px-1.5 py-1.5 text-neutral-500">
                        -
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {receptionCandidates.length === 0 && (
                  <div className="flex min-h-40 items-center justify-center px-4 text-center text-xs text-neutral-500">
                    No hay recepciones disponibles para este productor.
                  </div>
                )}
              </div>
            </div>
            )
          ) : currentStep === 2 && isLoadingAdvances ? (
            <div className="flex h-full min-h-52 items-center justify-center text-xs text-gray-500">
              Cargando anticipos del productor...
            </div>
          ) : (
            currentStep === 2 ? (
              <div className="flex h-full min-h-0 flex-col">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-2 pb-2">
                <div>
                  <h3 className="text-xs font-semibold text-neutral-900">
                    Anticipos disponibles para liquidar
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Selecciona los anticipos pagados del mismo productor para incluirlos en esta liquidacion.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="rounded bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700">
                    {selectedAdvancesCount} anticipos seleccionados
                  </span>
                  <span className="rounded bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700">
                    Total anticipos {currencyFormatter.format(selectedAdvancesAmount)}
                  </span>
                  <span className="rounded bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700">
                    Saldo estimado {currencyFormatter.format(estimatedBalanceAfterAdvances)}
                  </span>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-auto">
                <table className="min-w-full border-separate border-spacing-0 text-[10px] leading-4">
                  <thead className="sticky top-0 z-10 bg-neutral-50">
                    <tr>
                      <th className="w-16 border-b border-gray-200 px-1.5 py-1.5 text-center text-[9px] font-semibold text-neutral-900">
                        <div className="flex flex-col items-center gap-1">
                          <span>Incluir</span>
                          <Switch
                            checked={allAdvancesSelected}
                            onChange={toggleAllAdvances}
                            disabled={advanceCandidates.length === 0}
                          />
                        </div>
                      </th>
                      <th className="border-b border-gray-200 px-1.5 py-1.5 text-left text-[9px] font-semibold text-neutral-900">
                        ID
                      </th>
                      <th className="border-b border-gray-200 px-1.5 py-1.5 text-left text-[9px] font-semibold text-neutral-900">
                        Fecha
                      </th>
                      <th className="border-b border-gray-200 px-1.5 py-1.5 text-right text-[9px] font-semibold text-neutral-900">
                        Monto
                      </th>
                      <th className="border-b border-gray-200 px-1.5 py-1.5 text-right text-[9px] font-semibold text-neutral-900">
                        Interes %
                      </th>
                      <th className="border-b border-gray-200 px-1.5 py-1.5 text-right text-[9px] font-semibold text-neutral-900">
                        Interes acumulado
                      </th>
                      <th className="border-b border-gray-200 px-1.5 py-1.5 text-left text-[9px] font-semibold text-neutral-900">
                        Fecha finalizacion interes
                      </th>
                      <th className="border-b border-gray-200 px-1.5 py-1.5 text-left text-[9px] font-semibold text-neutral-900">
                        Estado
                      </th>
                      <th className="border-b border-gray-200 px-1.5 py-1.5 text-left text-[9px] font-semibold text-neutral-900">
                        Descripcion
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {advanceCandidates.map((advance) => {
                      const isSelected = selectedAdvanceIds.includes(advance.id);
                      const canEditAdvanceSettings = advance.status !== 'cancelled';

                      return (
                        <tr
                          key={advance.id}
                          className={isSelected ? 'bg-emerald-50/60' : 'bg-white'}
                        >
                          <td className="border-b border-gray-100 px-1.5 py-1.5 text-center align-middle">
                            <div className="flex items-center justify-center">
                              <Switch
                                checked={isSelected}
                                onChange={(checked) =>
                                  toggleAdvanceSelection(advance.id, checked)
                                }
                              />
                            </div>
                          </td>
                          <td className="border-b border-gray-100 px-1.5 py-1.5 text-neutral-900">
                            #{advance.id}
                          </td>
                          <td className="border-b border-gray-100 px-1.5 py-1.5 text-neutral-700">
                            {new Date(advance.issueDate).toLocaleDateString('es-CL')}
                          </td>
                          <td className="border-b border-gray-100 px-1.5 py-1.5 text-right font-medium text-neutral-900">
                            {currencyFormatter.format(advance.amount)}
                          </td>
                          <td className="border-b border-gray-100 px-1.5 py-1.5 text-right text-neutral-700">
                            <div className="flex items-center justify-end gap-1">
                              <span>{Number(advance.interestRate).toFixed(2)} %</span>
                              <IconButton
                                icon="edit"
                                variant="basicSecondary"
                                size="xs"
                                ariaLabel={`Editar interes del anticipo ${advance.id}`}
                                title={
                                  canEditAdvanceSettings
                                    ? 'Editar porcentaje de interés'
                                    : 'No se puede editar un anticipo anulado'
                                }
                                disabled={!canEditAdvanceSettings}
                                onClick={() => openInterestRateDialog(advance)}
                              />
                            </div>
                          </td>
                          <td className="border-b border-gray-100 px-1.5 py-1.5 text-right font-medium text-neutral-900">
                            {currencyFormatter.format(calculateAdvanceInterest(advance))}
                          </td>
                          <td className="border-b border-gray-100 px-1.5 py-1.5 text-neutral-700">
                            <div className="flex items-center gap-1">
                              <span>
                                {advance.interestEndDate
                                  ? new Date(advance.interestEndDate).toLocaleDateString('es-CL')
                                  : new Date().toLocaleDateString('es-CL')}
                              </span>
                              <IconButton
                                icon="edit"
                                variant="basicSecondary"
                                size="xs"
                                ariaLabel={`Editar fecha final de interes del anticipo ${advance.id}`}
                                title={
                                  canEditAdvanceSettings
                                    ? 'Editar fecha de finalización del interés'
                                    : 'No se puede editar un anticipo anulado'
                                }
                                disabled={!canEditAdvanceSettings}
                                onClick={() => openInterestEndDateDialog(advance)}
                              />
                            </div>
                          </td>
                          <td className="border-b border-gray-100 px-1.5 py-1.5 text-neutral-700">
                            {advance.status === 'paid'
                              ? 'Pagado'
                              : advance.status === 'settled'
                                ? 'Liquidado'
                                : 'Anulado'}
                          </td>
                          <td className="border-b border-gray-100 px-1.5 py-1.5 text-neutral-700">
                            {advance.description || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="sticky bottom-0 z-10 bg-neutral-100">
                    <tr>
                      <td
                        colSpan={3}
                        className="border-t border-gray-300 px-1.5 py-1.5 text-right text-[9px] font-semibold uppercase tracking-wide text-neutral-700"
                      >
                        Totales seleccionados
                      </td>
                      <td className="border-t border-gray-300 px-1.5 py-1.5 text-right font-semibold text-neutral-900">
                        {currencyFormatter.format(selectedAdvancesAmount)}
                      </td>
                      <td className="border-t border-gray-300 px-1.5 py-1.5 text-right text-neutral-500">
                        -
                      </td>
                      <td className="border-t border-gray-300 px-1.5 py-1.5 text-right font-semibold text-neutral-900">
                        {currencyFormatter.format(selectedEstimatedInterest)}
                      </td>
                      <td className="border-t border-gray-300 px-1.5 py-1.5 text-neutral-500">
                        -
                      </td>
                      <td className="border-t border-gray-300 px-1.5 py-1.5 text-neutral-500">
                        -
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {advanceCandidates.length === 0 && (
                  <div className="flex min-h-40 items-center justify-center px-4 text-center text-xs text-neutral-500">
                    No hay anticipos pagados disponibles para este productor.
                  </div>
                )}
              </div>
            </div>
            ) : currentStep === 3 ? (
              <div className="flex h-full min-h-0 flex-col">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-2 pb-2">
                  <div>
                    <h3 className="text-xs font-semibold text-neutral-900">
                      Definicion de servicios y facturas
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      Ingresa los datos de facturas para servicios de secado e intereses (ambos afectos a IVA 19%).
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="rounded bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700">
                      Neto servicios {currencyFormatter.format(serviceInvoiceTotals.netAmount)}
                    </span>
                    <span className="rounded bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700">
                      IVA servicios {currencyFormatter.format(serviceInvoiceTotals.vatAmount)}
                    </span>
                    <span className="rounded bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700">
                      Total facturado {currencyFormatter.format(serviceInvoiceTotals.totalAmount)}
                    </span>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-auto p-2">
                  <div className="grid gap-2 md:grid-cols-2">
                    {SERVICE_KEYS.map((serviceKey) => {
                      const definition = SERVICE_DEFINITIONS[serviceKey];
                      const form = serviceInvoices[serviceKey];
                      const errors = serviceInvoiceErrors[serviceKey];
                      const amounts = serviceInvoiceComputed[serviceKey];
                      const suggestedAmount = serviceReferenceAmounts[serviceKey];

                      return (
                        <div
                          key={serviceKey}
                          className={`rounded-xl border p-2.5 ${
                            form.enabled
                              ? 'border-emerald-200 bg-emerald-50/30'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-semibold text-neutral-900">
                                {definition.title}
                              </p>
                              <p className="text-[11px] text-neutral-600">
                                {definition.description}
                              </p>
                              <p className="mt-0.5 text-[11px] text-neutral-500">
                                {definition.serviceType}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs text-neutral-600">Incluir</span>
                              <Switch
                                checked={form.enabled}
                                onChange={(checked) =>
                                  toggleServiceInclusion(serviceKey, checked)
                                }
                                disabled={
                                  serviceKey === 'interest' && selectedAdvanceIds.length === 0
                                }
                              />
                              {serviceKey === 'interest' && selectedAdvanceIds.length === 0 && (
                                <span className="text-[10px] text-neutral-400">Sin anticipos</span>
                              )}
                            </div>
                          </div>

                          <div className="mb-2 grid gap-2 text-[11px] text-neutral-600 md:grid-cols-2">
                            <div className="rounded-lg border border-gray-200 bg-white px-2 py-1.5">
                              <p className="font-semibold uppercase tracking-wide text-neutral-500">
                                Afecto IVA
                              </p>
                              <p className="text-neutral-900">{definition.vatLabel}</p>
                            </div>
                            <div className="rounded-lg border border-gray-200 bg-white px-2 py-1.5">
                              <p className="font-semibold uppercase tracking-wide text-neutral-500">
                                Monto sugerido
                              </p>
                              <p className="text-neutral-900">
                                {currencyFormatter.format(suggestedAmount)}
                              </p>
                            </div>
                          </div>

                          <div className="grid gap-2 md:grid-cols-2">
                            <div>
                              <TextField
                                label="Folio factura"
                                value={form.invoiceNumber}
                                onChange={(event) =>
                                  updateServiceInvoiceField(
                                    serviceKey,
                                    'invoiceNumber',
                                    event.target.value
                                  )
                                }
                                placeholder="Ej: FAC-00125"
                                disabled={!form.enabled}
                                compact
                              />
                              {errors.invoiceNumber && (
                                <p className="mt-1 text-xs text-red-600">
                                  {errors.invoiceNumber}
                                </p>
                              )}
                            </div>

                            <div>
                              <TextField
                                label="Fecha factura"
                                type="date"
                                value={form.invoiceDate}
                                onChange={(event) =>
                                  updateServiceInvoiceField(
                                    serviceKey,
                                    'invoiceDate',
                                    event.target.value
                                  )
                                }
                                disabled={!form.enabled}
                                compact
                              />
                              {errors.invoiceDate && (
                                <p className="mt-1 text-xs text-red-600">
                                  {errors.invoiceDate}
                                </p>
                              )}
                            </div>

                            <div className="md:col-span-2">
                              <TextField
                                label="Monto neto factura"
                                type="currency"
                                value={form.invoiceNetAmount}
                                onChange={(event) =>
                                  updateServiceInvoiceField(
                                    serviceKey,
                                    'invoiceNetAmount',
                                    event.target.value
                                  )
                                }
                                placeholder="$ 0"
                                required={form.enabled}
                                disabled={!form.enabled}
                                compact
                              />
                              {errors.invoiceNetAmount && (
                                <p className="mt-1 text-xs text-red-600">
                                  {errors.invoiceNetAmount}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="mt-2 grid gap-2 text-[11px] md:grid-cols-3">
                            <div className="rounded-lg border border-gray-200 bg-white px-2 py-1.5">
                              <p className="font-semibold uppercase tracking-wide text-neutral-500">
                                Neto
                              </p>
                              <p className="text-xs font-semibold text-neutral-900">
                                {currencyFormatter.format(amounts.netAmount)}
                              </p>
                            </div>
                            <div className="rounded-lg border border-gray-200 bg-white px-2 py-1.5">
                              <p className="font-semibold uppercase tracking-wide text-neutral-500">
                                IVA 19%
                              </p>
                              <p className="text-xs font-semibold text-neutral-900">
                                {currencyFormatter.format(amounts.vatAmount)}
                              </p>
                            </div>
                            <div className="rounded-lg border border-gray-200 bg-white px-2 py-1.5">
                              <p className="font-semibold uppercase tracking-wide text-neutral-500">
                                Total factura
                              </p>
                              <p className="text-xs font-semibold text-neutral-900">
                                {currencyFormatter.format(amounts.totalAmount)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-0 flex-col">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-2 pb-2">
                  <div>
                    <h3 className="text-xs font-semibold text-neutral-900">
                      {isEditMode
                        ? 'Resumen y edicion de liquidacion'
                        : 'Resumen y creacion de liquidacion'}
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      Verifica el resumen financiero e ingresa los datos de factura de compra y pago al productor.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className={`rounded px-2 py-0.5 font-semibold ${finalBalanceToPay >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      Saldo a pagar {currencyFormatter.format(finalBalanceToPay)}
                    </span>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-auto p-2">
                  <div className="grid gap-2 md:grid-cols-2">

                    {/* Left column: Financial Summary */}
                    <div className="flex flex-col gap-2">

                      {/* Receptions section */}
                      <div className="rounded-xl border border-gray-200 bg-white p-2.5">
                        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                          Recepciones
                        </h4>
                        <div className="space-y-1 text-[11px]">
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-600">{selectedReceptionsCount} recepciones · neto</span>
                            <span className="font-medium text-neutral-900">{currencyFormatter.format(selectedReceptionsNetAmount)}</span>
                          </div>
                          <div className="flex items-center justify-between text-neutral-600">
                            <span>IVA arroz (19%)</span>
                            <span>{currencyFormatter.format(selectedReceptionsIvaAmount)}</span>
                          </div>
                          <div className="flex items-center justify-between border-t border-gray-100 pt-1.5 font-semibold text-neutral-900">
                            <span>Total recepciones</span>
                            <span>{currencyFormatter.format(selectedReceptionsTotalAmount)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Advances & interest section */}
                      <div className="rounded-xl border border-gray-200 bg-white p-2.5">
                        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                          Anticipos
                        </h4>
                        <div className="space-y-1 text-[11px]">
                          <div className="flex items-center justify-between text-rose-600">
                            <span>(-) {selectedAdvancesCount} anticipo{selectedAdvancesCount !== 1 ? 's' : ''}</span>
                            <span>-{currencyFormatter.format(selectedAdvancesAmount)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Services section */}
                      <div className="rounded-xl border border-gray-200 bg-white p-2.5">
                        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                          Servicios facturados (c/IVA)
                        </h4>
                        <div className="space-y-1 text-[11px]">
                          {SERVICE_KEYS.filter((k) => serviceInvoices[k].enabled).map((k) => (
                            <div key={k} className="flex items-center justify-between text-rose-600">
                              <span>(-) {SERVICE_DEFINITIONS[k].title}</span>
                              <span>-{currencyFormatter.format(serviceInvoiceComputed[k].totalAmount)}</span>
                            </div>
                          ))}
                          {SERVICE_KEYS.every((k) => !serviceInvoices[k].enabled) && (
                            <p className="text-xs text-neutral-400">Sin servicios incluidos</p>
                          )}
                          <div className="flex items-center justify-between border-t border-gray-100 pt-1.5 text-xs font-medium text-neutral-600">
                            <span>IVA servicios (19%)</span>
                            <span>{currencyFormatter.format(serviceInvoiceTotals.vatAmount)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Final balance */}
                      <div className={`rounded-xl border-2 p-2.5 ${finalBalanceToPay >= 0 ? 'border-emerald-300 bg-emerald-50' : 'border-amber-300 bg-amber-50'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-xs font-semibold uppercase tracking-wide ${finalBalanceToPay >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                              Saldo a pagar al productor
                            </p>
                            <p className={`mt-0.5 text-xs ${finalBalanceToPay >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {selectedProducer?.name} · {selectedProducer?.rut}
                            </p>
                          </div>
                          <p className={`text-xl font-bold ${finalBalanceToPay >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {currencyFormatter.format(finalBalanceToPay)}
                          </p>
                        </div>
                      </div>

                    </div>

                    {/* Right column: Purchase invoice + Payment details */}
                    <div className="flex flex-col gap-2">

                      {/* Purchase invoice from producer */}
                      <div className="rounded-xl border border-gray-200 bg-white p-2.5">
                        <h4 className="mb-1 text-xs font-semibold text-neutral-900">
                          Factura de compra del productor
                        </h4>
                        <p className="mb-2 text-[11px] text-neutral-500">
                          Documento emitido por el productor por la venta de arroz. Opcional mientras la pre-liquidacion este en draft.
                        </p>

                        <div className="mb-2 grid grid-cols-2 gap-x-3 gap-y-1 rounded-lg bg-neutral-50 px-2 py-1.5 text-[11px]">
                          <div>
                            <p className="font-semibold uppercase tracking-wide text-neutral-500">Emisor</p>
                            <p className="text-neutral-900">{selectedProducer?.name}</p>
                          </div>
                          <div>
                            <p className="font-semibold uppercase tracking-wide text-neutral-500">RUT</p>
                            <p className="text-neutral-900">{selectedProducer?.rut}</p>
                          </div>
                          <div>
                            <p className="font-semibold uppercase tracking-wide text-neutral-500">Monto neto arroz</p>
                            <p className="text-neutral-900">{currencyFormatter.format(selectedReceptionsNetAmount)}</p>
                          </div>
                          <div>
                            <p className="font-semibold uppercase tracking-wide text-neutral-500">Recepciones</p>
                            <p className="text-neutral-900">{selectedReceptionsCount}</p>
                          </div>
                        </div>

                        <div className="grid gap-2 md:grid-cols-2">
                          <div>
                            <TextField
                              label="Numero de factura"
                              value={purchaseInvoice.invoiceNumber}
                              onChange={(e) => {
                                setPurchaseInvoice((prev) => ({ ...prev, invoiceNumber: e.target.value }));
                                setPurchaseInvoiceErrors((prev) => ({ ...prev, invoiceNumber: undefined }));
                                setSummaryValidationMessage(null);
                              }}
                              placeholder="Ej: 125"
                              compact
                            />
                            {purchaseInvoiceErrors.invoiceNumber && (
                              <p className="mt-1 text-xs text-red-600">{purchaseInvoiceErrors.invoiceNumber}</p>
                            )}
                          </div>

                          <div>
                            <TextField
                              label="Fecha de factura"
                              type="date"
                              value={purchaseInvoice.invoiceDate}
                              onChange={(e) => {
                                setPurchaseInvoice((prev) => ({ ...prev, invoiceDate: e.target.value }));
                                setPurchaseInvoiceErrors((prev) => ({ ...prev, invoiceDate: undefined }));
                                setSummaryValidationMessage(null);
                              }}
                              compact
                            />
                            {purchaseInvoiceErrors.invoiceDate && (
                              <p className="mt-1 text-xs text-red-600">{purchaseInvoiceErrors.invoiceDate}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Payment details */}
                      <div className="rounded-xl border border-gray-200 bg-white p-2.5">
                        <h4 className="mb-1 text-xs font-semibold text-neutral-900">
                          Datos del pago al productor
                        </h4>
                        <p className="mb-2 text-[11px] text-neutral-500">
                          Informacion del pago al momento de liquidar la deuda. Opcional mientras la pre-liquidacion este en draft.
                        </p>

                        <div className="grid gap-2">
                          <Select
                            label="Metodo de pago"
                            options={PAYMENT_METHOD_OPTIONS}
                            value={paymentDetails.paymentMethod}
                            placeholder="Selecciona metodo de pago"
                            onChange={(val) =>
                              setPaymentDetails((prev) => ({
                                ...prev,
                                paymentMethod: (val as PaymentMethod | null) ?? null,
                                bankAccountIndex: null,
                              }))
                            }
                            allowClear
                            compact
                          />

                          <div>
                            <TextField
                              label="Fecha de pago"
                              type="date"
                              value={paymentDetails.paymentDate}
                              onChange={(e) => {
                                setPaymentDetails((prev) => ({ ...prev, paymentDate: e.target.value }));
                                setPaymentDetailsErrors((prev) => ({ ...prev, paymentDate: undefined }));
                                setSummaryValidationMessage(null);
                              }}
                              compact
                            />
                            {paymentDetailsErrors.paymentDate && (
                              <p className="mt-1 text-xs text-red-600">{paymentDetailsErrors.paymentDate}</p>
                            )}
                          </div>

                          <TextField
                            label="Numero de referencia"
                            value={paymentDetails.referenceNumber}
                            onChange={(e) =>
                              setPaymentDetails((prev) => ({ ...prev, referenceNumber: e.target.value }))
                            }
                            placeholder="N° transferencia o cheque"
                            compact
                          />

                          {paymentDetails.paymentMethod === 'transfer' &&
                            selectedProducer?.bankAccounts &&
                            selectedProducer.bankAccounts.length > 0 && (
                              <Select
                                label="Cuenta destino del productor"
                                options={selectedProducer.bankAccounts.map((acc, idx) => ({
                                  id: idx,
                                  label: `${acc.bankName} · ${acc.accountTypeName} · ${acc.accountNumber}`,
                                }))}
                                value={paymentDetails.bankAccountIndex}
                                onChange={(val) =>
                                  setPaymentDetails((prev) => ({
                                    ...prev,
                                    bankAccountIndex: val !== null ? Number(val) : null,
                                  }))
                                }
                                allowClear
                                compact
                              />
                            )}

                          <TextField
                            label="Notas"
                            value={paymentDetails.notes}
                            onChange={(e) =>
                              setPaymentDetails((prev) => ({ ...prev, notes: e.target.value }))
                            }
                            placeholder="Observaciones adicionales"
                            compact
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {currentStep > 1 && (
              <Button variant="outlined" size="sm" onClick={moveToPreviousStep}>
                {currentStep === 4
                  ? 'Volver a servicios'
                  : currentStep === 3
                    ? 'Volver a anticipos'
                    : 'Volver a recepciones'}
              </Button>
            )}

            {currentStep < 3 && (
              <Button
                variant="primary"
                size="sm"
                onClick={moveToNextStep}
                disabled={currentStep === 1 ? !canGoToStepTwo : !canGoToStepThree}
              >
                {currentStep === 1 ? 'Siguiente: anticipos' : 'Siguiente: servicios'}
              </Button>
            )}

            {currentStep === 3 && (
              <Button variant="primary" size="sm" onClick={moveToNextStep}>
                Siguiente: resumen
              </Button>
            )}

            {currentStep === 4 && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSaveSettlement}
                  disabled={isCreatingSettlement || isLiquidatingSettlement}
                >
                  {isCreatingSettlement
                    ? isEditMode
                      ? 'Guardando...'
                      : 'Pre-liquidando...'
                    : isEditMode
                      ? 'Guardar cambios'
                      : 'Pre-liquidar'}
                </Button>
                <IconButton
                  icon="info"
                  variant="basicSecondary"
                  size="sm"
                  ariaLabel="Ver datos faltantes para liquidar"
                  onClick={() => setIsInfoDialogOpen(true)}
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleLiquidarSettlement}
                  disabled={!isLiquidarEnabled || isCreatingSettlement || isLiquidatingSettlement}
                >
                  {isLiquidatingSettlement ? 'Liquidando...' : 'Liquidar'}
                </Button>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs text-neutral-600">
              {currentStep === 1
                ? 'Paso 1 de 4: seleccion de recepciones.'
                : currentStep === 2
                  ? 'Paso 2 de 4: seleccion de anticipos.'
                  : currentStep === 3
                    ? 'Paso 3 de 4: servicios y facturas.'
                    : isEditMode
                      ? 'Paso 4 de 4: resumen y edicion.'
                      : 'Paso 4 de 4: resumen y creacion.'}
            </p>
          </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      <Dialog
        open={isInterestRateDialogOpen}
        onClose={() => closeInterestRateDialog()}
        title="Editar porcentaje de interés del anticipo"
        size="xs"
        showCloseButton={true}
        closeButtonText="Cerrar"
        hideActions={true}
      >
        <div className="space-y-3">
          {editingInterestRateAdvance && (
            <p className="text-xs text-neutral-600">
              Anticipo #{editingInterestRateAdvance.id} · {currencyFormatter.format(editingInterestRateAdvance.amount)}
            </p>
          )}

          <TextField
            label="Interés mensual (%)"
            type="number"
            value={interestRateInput}
            onChange={(event) => {
              setInterestRateInput(event.target.value);
              setInterestRateDialogError(null);
            }}
            min="0"
            step="0.01"
            placeholder="Ej: 2.50"
            compact
          />

          {interestRateDialogError && (
            <Alert variant="error">{interestRateDialogError}</Alert>
          )}

          <div className="flex justify-end gap-2 border-t border-gray-200 pt-2">
            <Button
              variant="outlined"
              size="sm"
              onClick={() => closeInterestRateDialog()}
              disabled={isSavingInterestRate}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={saveInterestRate}
              disabled={isSavingInterestRate || !editingInterestRateAdvance}
            >
              {isSavingInterestRate ? 'Guardando interés...' : 'Guardar interés'}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={isInterestEndDateDialogOpen}
        onClose={() => closeInterestEndDateDialog()}
        title="Editar fecha de finalización del interés"
        size="xs"
        showCloseButton={true}
        closeButtonText="Cerrar"
        hideActions={true}
      >
        <div className="space-y-3">
          {editingInterestEndDateAdvance && (
            <p className="text-xs text-neutral-600">
              Anticipo #{editingInterestEndDateAdvance.id} · {currencyFormatter.format(editingInterestEndDateAdvance.amount)}
            </p>
          )}

          <TextField
            label="Fecha de finalización"
            type="date"
            value={interestEndDateInput}
            onChange={(event) => {
              setInterestEndDateInput(event.target.value);
              setInterestEndDateDialogError(null);
            }}
            compact
          />

          <p className="text-[11px] text-neutral-500">
            Si la fecha queda vacía, el cálculo usará la fecha actual.
          </p>

          {interestEndDateDialogError && (
            <Alert variant="error">{interestEndDateDialogError}</Alert>
          )}

          <div className="flex justify-end gap-2 border-t border-gray-200 pt-2">
            <Button
              variant="outlined"
              size="sm"
              onClick={() => closeInterestEndDateDialog()}
              disabled={isSavingInterestEndDate}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={saveInterestEndDate}
              disabled={isSavingInterestEndDate || !editingInterestEndDateAdvance}
            >
              {isSavingInterestEndDate ? 'Guardando fecha...' : 'Guardar fecha'}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={isDryPercentDialogOpen}
        onClose={() => closeDryPercentDialog()}
        title="Editar secado de recepcion"
        size="xs"
        showCloseButton={true}
        closeButtonText="Cerrar"
        hideActions={true}
      >
        <div className="space-y-3">
          {editingReception && (
            <p className="text-xs text-neutral-600">
              Guia {editingReception.guideNumber} · {editingReception.riceTypeName || 'Sin tipo de arroz'}
            </p>
          )}

          <TextField
            label="Porcentaje de secado (%)"
            type="number"
            value={dryPercentInput}
            onChange={(event) => {
              setDryPercentInput(event.target.value);
              setDryPercentDialogError(null);
            }}
            min="0"
            max="100"
            step="0.01"
            placeholder="Ej: 2.50"
            compact
          />

          {dryPercentDialogError && (
            <Alert variant="error">{dryPercentDialogError}</Alert>
          )}

          <div className="flex justify-end gap-2 border-t border-gray-200 pt-2">
            <Button
              variant="outlined"
              size="sm"
              onClick={() => closeDryPercentDialog()}
              disabled={isSavingDryPercent}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={saveDryPercent}
              disabled={isSavingDryPercent || !editingReception}
            >
              {isSavingDryPercent ? 'Guardando secado...' : 'Guardar secado'}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={isRicePriceDialogOpen}
        onClose={() => closeRicePriceDialog()}
        title="Editar precio por kg de recepcion"
        size="xs"
        showCloseButton={true}
        closeButtonText="Cerrar"
        hideActions={true}
      >
        <div className="space-y-3">
          {editingRicePriceReception && (
            <p className="text-xs text-neutral-600">
              Guia {editingRicePriceReception.guideNumber} · {editingRicePriceReception.riceTypeName || 'Sin tipo de arroz'}
            </p>
          )}

          <TextField
            label="Precio por kg (CLP)"
            type="number"
            value={ricePriceInput}
            onChange={(event) => {
              setRicePriceInput(event.target.value);
              setRicePriceDialogError(null);
            }}
            min="0.01"
            step="0.01"
            placeholder="Ej: 520"
            compact
          />

          {ricePriceDialogError && (
            <Alert variant="error">{ricePriceDialogError}</Alert>
          )}

          <div className="flex justify-end gap-2 border-t border-gray-200 pt-2">
            <Button
              variant="outlined"
              size="sm"
              onClick={() => closeRicePriceDialog()}
              disabled={isSavingRicePrice}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={saveRicePrice}
              disabled={isSavingRicePrice || !editingRicePriceReception}
            >
              {isSavingRicePrice ? 'Guardando precio...' : 'Guardar precio'}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={isInfoDialogOpen}
        onClose={() => setIsInfoDialogOpen(false)}
        title="Datos requeridos para liquidar"
        size="xs"
        showCloseButton={false}
        hideActions={false}
        headerClassName="border-b border-gray-200"
        titleClassName="text-lg font-bold text-foreground"
        actions={
          <div className="flex gap-3 pt-4 justify-between">
            <Button
              variant="outlined"
              onClick={() => setIsInfoDialogOpen(false)}
            >
              Cerrar
            </Button>
            <Button
              variant="primary"
              onClick={() => setIsInfoDialogOpen(false)}
            >
              Entendido
            </Button>
          </div>
        }
      >
        {missingRequirements.length === 0 ? (
          <Alert variant="success">
            Todos los datos necesarios estan completos. Puedes liquidar.
          </Alert>
        ) : (
          <div className="space-y-4">
            <Alert variant="warning" className="px-2.5 py-1.5 text-xs leading-4">
              Completa los siguientes datos para habilitar la liquidacion.
            </Alert>
            {missingRequirements.map((section) => (
              <div
                key={section.section}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden p-2"
              >
                <p className="mb-1 text-xs font-semibold text-neutral-700">{section.section}</p>
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <div key={item} className="flex items-center gap-1.5 text-xs text-rose-600">
                      <span className="inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rose-400" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Dialog>
    </>
  );
};

export default NewSettlementDialog;
