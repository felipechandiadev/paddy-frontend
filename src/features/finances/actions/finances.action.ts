'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { throwIfBackendUnavailable } from '@/lib/api/backend-connection-error';
import {
  Advance,
  AdvanceDetails,
  AdvanceProducerOption,
  AdvanceSeasonOption,
  CreateAdvancePayload,
  CompleteSettlementPayload,
  CreateSettlementPayload,
  PaymentBankOption,
  Settlement,
  SettlementProducerOption,
  SettlementReceptionPrintLine,
  SettlementAdvancePrintLine,
  SettlementReceptionCandidate,
  Transaction,
  UpdateSettlementPayload,
  UpdateSettlementReceptionDryPercentResponse,
  UpdateSettlementReceptionRicePriceResponse,
  UpdateAdvancePayload,
} from '../types/finances.types';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/finances`;
const PRODUCERS_API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/producers`;
const CONFIGURATION_API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/configuration`;
const OPERATIONS_API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/operations`;

function normalizeAdvance(raw: any): Advance {
  const source = raw?.data ?? raw ?? {};
  const rawStatus = String(source.status ?? 'paid').toLowerCase();
  const normalizedStatus: 'paid' | 'settled' | 'cancelled' =
    rawStatus === 'settled' || rawStatus === 'liquidated'
      ? 'settled'
      : rawStatus === 'cancelled' || rawStatus === 'canceled'
        ? 'cancelled'
      : rawStatus === 'paid'
        ? 'paid'
        : 'paid';
  const rawPaymentMethod = String(source.paymentMethod ?? '').toLowerCase();
  const paymentMethod: Advance['paymentMethod'] =
    rawPaymentMethod === 'transfer' ||
    rawPaymentMethod === 'check' ||
    rawPaymentMethod === 'cash'
      ? rawPaymentMethod
      : null;

  return {
    ...source,
    amount: Number(source.amount ?? 0),
    interestRate: Number(source.interestRate ?? 0),
    totalDays: Number(source.totalDays ?? 0),
    accruedInterest: Number(source.accruedInterest ?? 0),
    interestEndDate: source.interestEndDate ?? null,
    isInterestCalculationEnabled: Boolean(source.isInterestCalculationEnabled),
    status: normalizedStatus,
    paymentMethod,
    bank:
      source.bank === null || source.bank === undefined
        ? null
        : String(source.bank),
    referenceNumber:
      source.referenceNumber === null || source.referenceNumber === undefined
        ? null
        : String(source.referenceNumber),
  } as Advance;
}

function normalizeAdvanceDetails(raw: any): AdvanceDetails {
  const source = raw?.data ?? raw ?? {};
  const base = normalizeAdvance(source);

  const rawPaymentMethod = String(source.paymentMethod ?? '').toLowerCase();
  const paymentMethod: AdvanceDetails['paymentMethod'] =
    rawPaymentMethod === 'transfer' ||
    rawPaymentMethod === 'check' ||
    rawPaymentMethod === 'cash'
      ? rawPaymentMethod
      : null;

  const rawBankAccountIndex =
    source.bankAccountIndex === null || source.bankAccountIndex === undefined
      ? null
      : Number(source.bankAccountIndex);

  return {
    ...base,
    transactionId:
      source.transactionId === null || source.transactionId === undefined
        ? null
        : Number(source.transactionId),
    paymentMethod,
    referenceNumber:
      source.referenceNumber === null || source.referenceNumber === undefined
        ? null
        : String(source.referenceNumber),
    paymentNotes:
      source.paymentNotes === null || source.paymentNotes === undefined
        ? null
        : String(source.paymentNotes),
    bankAccountIndex:
      rawBankAccountIndex === null || Number.isNaN(rawBankAccountIndex)
        ? null
        : rawBankAccountIndex,
    bankAccount:
      source.bankAccount && typeof source.bankAccount === 'object'
        ? {
            bankCode: Number(source.bankAccount.bankCode ?? 0),
            bankName: String(source.bankAccount.bankName ?? ''),
            accountNumber: String(source.bankAccount.accountNumber ?? ''),
            accountTypeCode: Number(source.bankAccount.accountTypeCode ?? 0),
            accountTypeName: String(source.bankAccount.accountTypeName ?? ''),
            holderName:
              source.bankAccount.holderName === null ||
              source.bankAccount.holderName === undefined
                ? undefined
                : String(source.bankAccount.holderName),
            holderRut:
              source.bankAccount.holderRut === null ||
              source.bankAccount.holderRut === undefined
                ? undefined
                : String(source.bankAccount.holderRut),
            isDefault:
              source.bankAccount.isDefault === null ||
              source.bankAccount.isDefault === undefined
                ? undefined
                : Boolean(source.bankAccount.isDefault),
          }
        : null,
    checkBankName:
      source.checkBankName === null || source.checkBankName === undefined
        ? null
        : String(source.checkBankName),
    checkIssueDate:
      source.checkIssueDate === null || source.checkIssueDate === undefined
        ? null
        : String(source.checkIssueDate),
    checkDueDate:
      source.checkDueDate === null || source.checkDueDate === undefined
        ? null
        : String(source.checkDueDate),
    checkPayeeName:
      source.checkPayeeName === null || source.checkPayeeName === undefined
        ? null
        : String(source.checkPayeeName),
    checkPayeeRut:
      source.checkPayeeRut === null || source.checkPayeeRut === undefined
        ? null
        : String(source.checkPayeeRut),
  };
}

function normalizeAdvancePaymentMethod(
  rawPaymentMethod: unknown,
): AdvanceDetails['paymentMethod'] {
  const paymentMethod = String(rawPaymentMethod ?? '').toLowerCase();

  return paymentMethod === 'transfer' ||
    paymentMethod === 'check' ||
    paymentMethod === 'cash'
    ? paymentMethod
    : null;
}

function buildAdvanceDetailsFromTransactionFallback(
  advanceRaw: any,
  transactionRaw: any,
): AdvanceDetails {
  const base = normalizeAdvance(advanceRaw);
  const metadata =
    transactionRaw?.metadata && typeof transactionRaw.metadata === 'object'
      ? transactionRaw.metadata
      : {};
  const checkDetails =
    metadata.checkDetails && typeof metadata.checkDetails === 'object'
      ? metadata.checkDetails
      : {};
  const rawBankAccountIndex = metadata?.bankAccount?.accountIndex;
  const bankAccountIndex =
    rawBankAccountIndex === null || rawBankAccountIndex === undefined
      ? null
      : Number(rawBankAccountIndex);
  const bankAccount =
    metadata.bankAccount && typeof metadata.bankAccount === 'object'
      ? metadata.bankAccount
      : null;
  const hasTransaction = Boolean(transactionRaw);

  return {
    ...base,
    transactionId:
      transactionRaw?.id === null || transactionRaw?.id === undefined
        ? null
        : Number(transactionRaw.id),
    paymentMethod: hasTransaction
      ? normalizeAdvancePaymentMethod(metadata.paymentMethod)
      : 'cash',
    referenceNumber:
      transactionRaw?.referenceNumber === null ||
      transactionRaw?.referenceNumber === undefined
        ? null
        : String(transactionRaw.referenceNumber),
    paymentNotes:
      transactionRaw?.notes === null || transactionRaw?.notes === undefined
        ? base.description ?? null
        : String(transactionRaw.notes),
    bankAccountIndex:
      bankAccountIndex === null || Number.isNaN(bankAccountIndex)
        ? null
        : bankAccountIndex,
    bankAccount:
      bankAccount && typeof bankAccount === 'object'
        ? {
            bankCode: Number(bankAccount.bankCode ?? 0),
            bankName: String(bankAccount.bankName ?? ''),
            accountNumber: String(bankAccount.accountNumber ?? ''),
            accountTypeCode: Number(bankAccount.accountTypeCode ?? 0),
            accountTypeName: String(bankAccount.accountTypeName ?? ''),
            holderName:
              bankAccount.holderName === null || bankAccount.holderName === undefined
                ? undefined
                : String(bankAccount.holderName),
            holderRut:
              bankAccount.holderRut === null || bankAccount.holderRut === undefined
                ? undefined
                : String(bankAccount.holderRut),
            isDefault:
              bankAccount.isDefault === null || bankAccount.isDefault === undefined
                ? undefined
                : Boolean(bankAccount.isDefault),
          }
        : null,
    checkBankName:
      checkDetails.bankName === null || checkDetails.bankName === undefined
        ? null
        : String(checkDetails.bankName),
    checkIssueDate:
      checkDetails.issueDate === null || checkDetails.issueDate === undefined
        ? null
        : String(checkDetails.issueDate),
    checkDueDate:
      checkDetails.dueDate === null || checkDetails.dueDate === undefined
        ? null
        : String(checkDetails.dueDate),
    checkPayeeName:
      checkDetails.payeeName === null || checkDetails.payeeName === undefined
        ? null
        : String(checkDetails.payeeName),
    checkPayeeRut:
      checkDetails.payeeRut === null || checkDetails.payeeRut === undefined
        ? null
        : String(checkDetails.payeeRut),
  };
}

function extractCollection(raw: any): any[] {
  if (Array.isArray(raw)) {
    return raw;
  }

  return Array.isArray(raw?.data) ? raw.data : [];
}

function normalizeSettlementReceptionPrintLine(
  raw: any,
): SettlementReceptionPrintLine {
  const source = raw?.data ?? raw ?? {};

  return {
    id: Number(source.id ?? 0),
    receptionDate:
      source.receptionDate === null || source.receptionDate === undefined
        ? null
        : String(source.receptionDate),
    guideNumber: String(source.guideNumber ?? ''),
    riceTypeName:
      source.riceTypeName === null || source.riceTypeName === undefined
        ? null
        : String(source.riceTypeName),
    paddyKg: Number(source.paddyKg ?? 0),
    ricePrice: Number(source.ricePrice ?? 0),
    paddySubTotal: Number(source.paddySubTotal ?? 0),
    paddyVat: Number(source.paddyVat ?? 0),
    paddyTotal: Number(source.paddyTotal ?? 0),
    dryPercent: Number(source.dryPercent ?? 0),
    dryingSubTotal: Number(source.dryingSubTotal ?? 0),
    dryingVat: Number(source.dryingVat ?? 0),
    dryingTotal: Number(source.dryingTotal ?? 0),
  };
}

function normalizeSettlementAdvancePrintLine(
  raw: any,
): SettlementAdvancePrintLine {
  const source = raw?.data ?? raw ?? {};
  const rawPaymentMethod = String(source.paymentMethod ?? '').toLowerCase();
  const paymentMethod: SettlementAdvancePrintLine['paymentMethod'] =
    rawPaymentMethod === 'transfer' ||
    rawPaymentMethod === 'check' ||
    rawPaymentMethod === 'cash'
      ? rawPaymentMethod
      : null;

  return {
    id: Number(source.id ?? 0),
    issueDate:
      source.issueDate === null || source.issueDate === undefined
        ? null
        : String(source.issueDate),
    amount: Number(source.amount ?? 0),
    interestRate: Number(source.interestRate ?? 0),
    totalDays: Number(source.totalDays ?? 0),
    accumulatedInterest: Number(source.accumulatedInterest ?? 0),
    paymentMethod,
    bank:
      source.bank === null || source.bank === undefined
        ? null
        : String(source.bank),
    reference:
      source.reference === null || source.reference === undefined
        ? null
        : String(source.reference),
    transferAccount:
      source.transferAccount === null || source.transferAccount === undefined
        ? null
        : String(source.transferAccount),
  };
}

function normalizeSettlement(raw: any): Settlement {
  const source = raw?.data ?? raw ?? {};
  const rawStatus = String(source.status ?? 'draft').toLowerCase();
  const normalizedStatus: Settlement['status'] =
    rawStatus === 'completed' || rawStatus === 'cancelled'
      ? rawStatus
      : 'draft';
  const normalizedReceptionIds = Array.isArray(source.receptionIds)
    ? source.receptionIds
        .map((id: unknown) => Number(id))
        .filter((id: number) => Number.isFinite(id) && id > 0)
    : [];
  const normalizedAdvanceIds = Array.isArray(source.advanceIds)
    ? source.advanceIds
        .map((id: unknown) => Number(id))
        .filter((id: number) => Number.isFinite(id) && id > 0)
    : [];
  const calculationDetails =
    source.calculationDetails && typeof source.calculationDetails === 'object'
      ? (source.calculationDetails as Record<string, unknown>)
      : null;
  const settlementReceptions = Array.isArray(source.settlementReceptions)
    ? source.settlementReceptions.map(normalizeSettlementReceptionPrintLine)
    : [];
  const settlementAdvances = Array.isArray(source.settlementAdvances)
    ? source.settlementAdvances.map(normalizeSettlementAdvancePrintLine)
    : [];

  return {
    ...source,
    status: normalizedStatus,
    totalReceptions: Number(source.totalReceptions ?? 0),
    totalPrice: Number(source.totalPrice ?? 0),
    totalDiscounts: Number(source.totalDiscounts ?? 0),
    totalBonuses: Number(source.totalBonuses ?? 0),
    finalAmount: Number(source.finalAmount ?? 0),
    totalAdvances: Number(source.totalAdvances ?? 0),
    totalInterest: Number(source.totalInterest ?? 0),
    ivaRice: Number(source.ivaRice ?? 0),
    ivaServices: Number(source.ivaServices ?? 0),
    amountDue: Number(source.amountDue ?? 0),
    interestNet: Number(source.interestNet ?? 0),
    interestVat: Number(source.interestVat ?? 0),
    interestTotal: Number(source.interestTotal ?? 0),
    servicesNet: Number(source.servicesNet ?? 0),
    servicesVat: Number(source.servicesVat ?? 0),
    servicesTotal: Number(source.servicesTotal ?? 0),
    liquidationNet: Number(source.liquidationNet ?? 0),
    liquidationVat: Number(source.liquidationVat ?? 0),
    liquidationTotal: Number(source.liquidationTotal ?? 0),
    receptionIds: normalizedReceptionIds,
    advanceIds: normalizedAdvanceIds,
    notes:
      source.notes === null || source.notes === undefined
        ? null
        : String(source.notes),
    issuedAt:
      source.issuedAt === null || source.issuedAt === undefined
        ? undefined
        : String(source.issuedAt),
    deletedAt:
      source.deletedAt === null || source.deletedAt === undefined
        ? null
        : String(source.deletedAt),
    calculationDetails,
    settlementReceptions,
    settlementAdvances,
  } as Settlement;
}

function normalizeTransaction(raw: any): Transaction {
  const source = raw?.data ?? raw ?? {};
  const rawType = String(source.type ?? 'payment').toLowerCase();

  const normalizeOptionalId = (value: unknown): number | null => {
    if (value === null || value === undefined) {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  };

  const normalizedType: Transaction['type'] =
    rawType === 'advance' ||
    rawType === 'payment' ||
    rawType === 'deduction' ||
    rawType === 'interest' ||
    rawType === 'refund' ||
    rawType === 'settlement'
      ? rawType
      : 'payment';

  const metadata =
    source.metadata && typeof source.metadata === 'object'
      ? source.metadata
      : undefined;

  const rawPaymentMethod = String(metadata?.paymentMethod ?? '').toLowerCase();
  const paymentMethod: Transaction['paymentMethod'] =
    rawPaymentMethod === 'transfer' ||
    rawPaymentMethod === 'check' ||
    rawPaymentMethod === 'cash'
      ? rawPaymentMethod
      : null;

  return {
    ...source,
    receptionId: normalizeOptionalId(source.receptionId),
    advanceId: normalizeOptionalId(source.advanceId),
    settlementId: normalizeOptionalId(source.settlementId),
    type: normalizedType,
    amount: Number(source.amount ?? 0),
    transactionDate: String(
      source.transactionDate ?? source.createdAt ?? new Date().toISOString(),
    ),
    paymentMethod,
    metadata,
    referenceNumber:
      source.referenceNumber === undefined || source.referenceNumber === null
        ? undefined
        : String(source.referenceNumber),
    notes:
      source.notes === undefined || source.notes === null
        ? undefined
        : String(source.notes),
    producer: source.producer
      ? {
          id: Number(source.producer.id ?? 0),
          name: String(source.producer.name ?? ''),
          rut: String(source.producer.rut ?? ''),
        }
      : undefined,
  } as Transaction;
}

function normalizeSettlementProducerOption(raw: any): SettlementProducerOption {
  const source = raw?.data ?? raw ?? {};

  return {
    id: Number(source.id ?? 0),
    name: String(source.name ?? ''),
    rut: String(source.rut ?? ''),
    city: source.city ? String(source.city) : undefined,
    bankAccounts: Array.isArray(source.bankAccounts)
      ? source.bankAccounts.map((account: any) => ({
          bankCode: Number(account.bankCode ?? 0),
          bankName: String(account.bankName ?? ''),
          accountNumber: String(account.accountNumber ?? ''),
          accountTypeCode: Number(account.accountTypeCode ?? 0),
          accountTypeName: String(account.accountTypeName ?? ''),
          holderName: account.holderName ? String(account.holderName) : undefined,
          holderRut: account.holderRut ? String(account.holderRut) : undefined,
          isDefault: account.isDefault === undefined ? undefined : Boolean(account.isDefault),
        }))
      : [],
  };
}

function normalizeAdvanceProducerOption(raw: any): AdvanceProducerOption {
  const source = raw?.data ?? raw ?? {};

  return {
    id: Number(source.id ?? 0),
    name: String(source.name ?? ''),
    rut: String(source.rut ?? ''),
    city: source.city ? String(source.city) : undefined,
    bankAccounts: Array.isArray(source.bankAccounts)
      ? source.bankAccounts.map((account: any) => ({
          bankCode: Number(account.bankCode ?? 0),
          bankName: String(account.bankName ?? ''),
          accountNumber: String(account.accountNumber ?? ''),
          accountTypeCode: Number(account.accountTypeCode ?? 0),
          accountTypeName: String(account.accountTypeName ?? ''),
          holderName: account.holderName ? String(account.holderName) : undefined,
          holderRut: account.holderRut ? String(account.holderRut) : undefined,
          isDefault:
            account.isDefault === undefined ? undefined : Boolean(account.isDefault),
        }))
      : [],
  };
}

function normalizeAdvanceSeasonOption(raw: any): AdvanceSeasonOption {
  const source = raw?.data ?? raw ?? {};

  return {
    id: Number(source.id ?? 0),
    code: String(source.code ?? ''),
    name: String(source.name ?? ''),
    year: Number(source.year ?? 0),
    isActive: Boolean(source.isActive),
    startDate:
      source.startDate === null || source.startDate === undefined
        ? null
        : String(source.startDate),
    endDate:
      source.endDate === null || source.endDate === undefined
        ? null
        : String(source.endDate),
  };
}

function normalizePaymentBankOption(raw: any): PaymentBankOption {
  const source = raw?.data ?? raw ?? {};

  return {
    id: String(source.id ?? ''),
    label: String(source.label ?? ''),
  };
}

function normalizeSettlementReceptionCandidate(
  raw: any
): SettlementReceptionCandidate {
  const source = raw?.data ?? raw ?? {};
  const netWeight = Number(source.netWeight ?? 0);
  const ricePrice = Number(source.ricePrice ?? 0);
  const rawStatus = String(source.status ?? 'cancelled').toLowerCase();
  const status: SettlementReceptionCandidate['status'] =
    rawStatus === 'analyzed' || rawStatus === 'settled' || rawStatus === 'cancelled'
      ? rawStatus
      : rawStatus === 'pending' || rawStatus === 'in_process'
        ? 'cancelled'
        : 'cancelled';
  const hasAnalysis =
    source.hasAnalysis === undefined || source.hasAnalysis === null
      ? status !== 'cancelled' ||
        (source.dryPercent !== null && source.dryPercent !== undefined)
      : Boolean(source.hasAnalysis);

  return {
    id: Number(source.id ?? 0),
    producerId: Number(source.producerId ?? 0),
    seasonId: Number(source.seasonId ?? source.season?.id ?? 0),
    guideNumber: String(source.guideNumber ?? ''),
    licensePlate: String(source.licensePlate ?? ''),
    riceTypeName: String(source.riceType?.name ?? ''),
    seasonName: String(source.season?.name ?? ''),
    seasonCode: String(source.season?.code ?? ''),
    netWeight,
    ricePrice,
    estimatedAmount: Math.round(netWeight * ricePrice),
    status,
    dryPercent:
      source.dryPercent === null || source.dryPercent === undefined
        ? null
        : Number(source.dryPercent),
    hasAnalysis,
    settlementId:
      source.settlementId === null || source.settlementId === undefined
        ? null
        : Number(source.settlementId),
    createdAt: String(source.createdAt ?? ''),
  };
}

function getAuthHeaders(token: string): HeadersInit {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

interface FetchAdvancesParams {
  producerId?: number;
  page?: number;
  limit?: number;
  search?: string;
  sort?: 'asc' | 'desc';
  sortField?: string;
  filters?: string;
  includeDeleted?: boolean;
}

interface FetchAdvancesResult {
  data: Advance[];
  total: number;
  page: number;
  limit: number;
}

interface FetchTransactionsParams {
  producerId?: number;
  type?: Transaction['type'];
}

interface FetchTransactionsResult {
  data: Transaction[];
  total: number;
}

interface FetchSettlementsParams {
  producerId?: number;
  status?: Settlement['status'];
  page?: number;
  limit?: number;
  search?: string;
  sort?: 'asc' | 'desc';
  sortField?: string;
  filters?: string;
}

interface FetchSettlementsResult {
  data: Settlement[];
  total: number;
  page: number;
  limit: number;
}

interface FetchSettlementProducerOptionsResult {
  data: SettlementProducerOption[];
  total: number;
}

interface FetchSettlementReceptionCandidatesResult {
  data: SettlementReceptionCandidate[];
  total: number;
  error?: string;
}

interface FetchAdvanceProducerOptionsResult {
  data: AdvanceProducerOption[];
  total: number;
}

interface FetchAdvanceSeasonOptionsResult {
  data: AdvanceSeasonOption[];
  total: number;
}

interface FetchPaymentBankOptionsResult {
  data: PaymentBankOption[];
  total: number;
}

export async function fetchAdvances(
  params?: FetchAdvancesParams
): Promise<FetchAdvancesResult> {
  const requestedPage =
    Number.isFinite(params?.page) && Number(params?.page) > 0
      ? Math.floor(Number(params?.page))
      : 1;
  const requestedLimit =
    Number.isFinite(params?.limit) && Number(params?.limit) > 0
      ? Math.floor(Number(params?.limit))
      : 25;
  const shouldPaginate = params?.page !== undefined || params?.limit !== undefined;

  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      console.error('No access token in session');
      return { data: [], total: 0, page: requestedPage, limit: requestedLimit };
    }

    const headers = getAuthHeaders(token);
    const queryParams = new URLSearchParams();

    if (params?.producerId) {
      queryParams.append('producerId', String(params.producerId));
    }

    if (params?.includeDeleted) {
      queryParams.append('includeDeleted', 'true');
    }

    const normalizedSearch = params?.search?.trim();
    if (normalizedSearch) {
      queryParams.append('search', normalizedSearch);
    }

    if (params?.sortField) {
      queryParams.append('sortField', params.sortField);
    }

    if (params?.sort) {
      queryParams.append('sort', params.sort);
    }

    const normalizedFilters = params?.filters?.trim();
    if (normalizedFilters) {
      queryParams.append('filters', normalizedFilters);
    }

    if (shouldPaginate) {
      queryParams.append('page', String(requestedPage));
      queryParams.append('limit', String(requestedLimit));
    }

    const queryString = queryParams.toString();
    const endpoint = `/advances${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch advances: ${response.status}`);
    }

    const payload = await response.json();
    const unwrappedPayload = payload?.data ?? payload;

    const advances = Array.isArray(unwrappedPayload)
      ? unwrappedPayload
      : Array.isArray(unwrappedPayload?.data)
        ? unwrappedPayload.data
        : [];

    const normalizedData = (advances as any[]).map(normalizeAdvance);

    const total =
      typeof unwrappedPayload?.total === 'number' && Number.isFinite(unwrappedPayload.total)
        ? unwrappedPayload.total
        : normalizedData.length;
    const page =
      typeof unwrappedPayload?.page === 'number' && Number.isFinite(unwrappedPayload.page)
        ? unwrappedPayload.page
        : requestedPage;
    const limit =
      typeof unwrappedPayload?.limit === 'number' && Number.isFinite(unwrappedPayload.limit)
        ? unwrappedPayload.limit
        : shouldPaginate
          ? requestedLimit
          : normalizedData.length || requestedLimit;

    return {
      data: normalizedData,
      total,
      page,
      limit,
    };
  } catch (error) {
    throwIfBackendUnavailable(error);
    console.error('Error fetching advances:', error);
    return { data: [], total: 0, page: requestedPage, limit: requestedLimit };
  }
}

export async function fetchTransactions(
  params?: FetchTransactionsParams
): Promise<FetchTransactionsResult> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      console.error('No access token in session');
      return { data: [], total: 0 };
    }

    const headers = getAuthHeaders(token);
    const queryParams = new URLSearchParams();

    if (params?.producerId) {
      queryParams.append('producerId', String(params.producerId));
    }

    if (params?.type) {
      queryParams.append('type', params.type);
    }

    const endpoint = `/transactions${queryParams.toString() ? `?${queryParams}` : ''}`;

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.status}`);
    }

    const transactions = await response.json();
    const data = Array.isArray(transactions)
      ? transactions
      : (transactions?.data || []);
    const normalizedData = (data as any[]).map(normalizeTransaction);

    return {
      data: normalizedData,
      total: normalizedData.length,
    };
  } catch (error) {
    throwIfBackendUnavailable(error);
    console.error('Error fetching transactions:', error);
    return { data: [], total: 0 };
  }
}

export async function fetchAdvanceDetails(
  advanceId: number
): Promise<AdvanceDetails | null> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      console.error('No access token in session');
      return null;
    }

    const headers = getAuthHeaders(token);
    const response = await fetch(`${API_BASE_URL}/advances/${advanceId}/details`, {
      headers,
      cache: 'no-store',
    });

    if (response.ok) {
      const advance = await response.json();
      return normalizeAdvanceDetails(advance);
    }

    if (response.status !== 404) {
      throw new Error(`Failed to fetch advance details: ${response.status}`);
    }

    const fallbackAdvanceResponse = await fetch(`${API_BASE_URL}/advances/${advanceId}`, {
      headers,
      cache: 'no-store',
    });

    if (!fallbackAdvanceResponse.ok) {
      throw new Error(
        `Failed to fetch advance fallback details: ${fallbackAdvanceResponse.status}`,
      );
    }

    const fallbackAdvancePayload = await fallbackAdvanceResponse.json();
    const fallbackAdvance = fallbackAdvancePayload?.data ?? fallbackAdvancePayload ?? {};
    const producerId = Number(fallbackAdvance?.producerId ?? 0);

    let matchingTransaction: any = null;

    if (producerId > 0) {
      const fallbackTransactionsResponse = await fetch(
        `${API_BASE_URL}/transactions?producerId=${producerId}&type=advance`,
        {
          headers,
          cache: 'no-store',
        },
      );

      if (fallbackTransactionsResponse.ok) {
        const fallbackTransactionsPayload = await fallbackTransactionsResponse.json();
        const fallbackTransactions = extractCollection(fallbackTransactionsPayload);

        matchingTransaction =
          fallbackTransactions.find(
            (transaction) => Number(transaction?.advanceId ?? 0) === advanceId,
          ) ?? null;
      }
    }

    return buildAdvanceDetailsFromTransactionFallback(
      fallbackAdvance,
      matchingTransaction,
    );
  } catch (error) {
    console.error('Error fetching advance details:', error);
    return null;
  }
}

export async function fetchSettlements(
  params?: FetchSettlementsParams
): Promise<FetchSettlementsResult> {
  const requestedPage =
    Number.isFinite(params?.page) && Number(params?.page) > 0
      ? Math.floor(Number(params?.page))
      : 1;
  const requestedLimit =
    Number.isFinite(params?.limit) && Number(params?.limit) > 0
      ? Math.floor(Number(params?.limit))
      : 25;
  const shouldPaginate = params?.page !== undefined || params?.limit !== undefined;

  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      console.error('No access token in session');
      return { data: [], total: 0, page: requestedPage, limit: requestedLimit };
    }

    const headers = getAuthHeaders(token);
    const queryParams = new URLSearchParams();

    if (params?.producerId) {
      queryParams.append('producerId', String(params.producerId));
    }

    if (params?.status) {
      queryParams.append('status', params.status);
    }

    const normalizedSearch = params?.search?.trim();
    if (normalizedSearch) {
      queryParams.append('search', normalizedSearch);
    }

    if (params?.sortField) {
      queryParams.append('sortField', params.sortField);
    }

    if (params?.sort) {
      queryParams.append('sort', params.sort);
    }

    const normalizedFilters = params?.filters?.trim();
    if (normalizedFilters) {
      queryParams.append('filters', normalizedFilters);
    }

    if (shouldPaginate) {
      queryParams.append('page', String(requestedPage));
      queryParams.append('limit', String(requestedLimit));
    }

    const endpoint = `/settlements${queryParams.toString() ? `?${queryParams}` : ''}`;

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch settlements: ${response.status}`);
    }

    const payload = await response.json();
    const unwrappedPayload = payload?.data ?? payload;

    const settlements = Array.isArray(unwrappedPayload)
      ? unwrappedPayload
      : Array.isArray(unwrappedPayload?.data)
        ? unwrappedPayload.data
        : [];

    const normalizedData = (settlements as any[]).map(normalizeSettlement);

    const total =
      typeof unwrappedPayload?.total === 'number' && Number.isFinite(unwrappedPayload.total)
        ? unwrappedPayload.total
        : normalizedData.length;
    const page =
      typeof unwrappedPayload?.page === 'number' && Number.isFinite(unwrappedPayload.page)
        ? unwrappedPayload.page
        : requestedPage;
    const limit =
      typeof unwrappedPayload?.limit === 'number' && Number.isFinite(unwrappedPayload.limit)
        ? unwrappedPayload.limit
        : shouldPaginate
          ? requestedLimit
          : normalizedData.length || requestedLimit;

    return {
      data: normalizedData,
      total,
      page,
      limit,
    };
  } catch (error) {
    throwIfBackendUnavailable(error);
    console.error('Error fetching settlements:', error);
    return { data: [], total: 0, page: requestedPage, limit: requestedLimit };
  }
}

export async function fetchSettlementById(
  settlementId: number,
): Promise<Settlement | null> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      console.error('No access token in session');
      return null;
    }

    const headers = getAuthHeaders(token);
    const response = await fetch(`${API_BASE_URL}/settlements/${settlementId}`, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch settlement details: ${response.status}`);
    }

    const settlement = await response.json();
    return normalizeSettlement(settlement);
  } catch (error) {
    throwIfBackendUnavailable(error);
    console.error('Error fetching settlement details:', error);
    return null;
  }
}

export async function fetchSettlementProducerOptions(
  search?: string
): Promise<FetchSettlementProducerOptionsResult> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      console.error('No access token in session');
      return { data: [], total: 0 };
    }

    const headers = getAuthHeaders(token);
    const response = await fetch(PRODUCERS_API_BASE_URL, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch producer options: ${response.status}`);
    }

    const producers = await response.json();
    const data = Array.isArray(producers) ? producers : (producers?.data || []);
    const normalizedData = (data as any[]).map(normalizeSettlementProducerOption);
    const filteredData = search
      ? normalizedData.filter((producer) => {
          const query = search.toLowerCase();
          return (
            producer.name.toLowerCase().includes(query) ||
            producer.rut.toLowerCase().includes(query) ||
            (producer.city || '').toLowerCase().includes(query)
          );
        })
      : normalizedData;

    return {
      data: filteredData,
      total: filteredData.length,
    };
  } catch (error) {
    console.error('Error fetching producer options:', error);
    return { data: [], total: 0 };
  }
}

export async function fetchAdvanceProducerOptions(
  search?: string
): Promise<FetchAdvanceProducerOptionsResult> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      console.error('No access token in session');
      return { data: [], total: 0 };
    }

    const headers = getAuthHeaders(token);
    const response = await fetch(PRODUCERS_API_BASE_URL, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch advance producer options: ${response.status}`);
    }

    const producers = await response.json();
    const data = Array.isArray(producers) ? producers : (producers?.data || []);
    const normalizedData = (data as any[]).map(normalizeAdvanceProducerOption);
    const filteredData = search
      ? normalizedData.filter((producer) => {
          const query = search.toLowerCase();
          return (
            producer.name.toLowerCase().includes(query) ||
            producer.rut.toLowerCase().includes(query) ||
            (producer.city || '').toLowerCase().includes(query)
          );
        })
      : normalizedData;

    return {
      data: filteredData,
      total: filteredData.length,
    };
  } catch (error) {
    console.error('Error fetching advance producer options:', error);
    return { data: [], total: 0 };
  }
}

export async function fetchAdvanceSeasonOptions(): Promise<FetchAdvanceSeasonOptionsResult> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      console.error('No access token in session');
      return { data: [], total: 0 };
    }

    const headers = getAuthHeaders(token);
    const response = await fetch(`${CONFIGURATION_API_BASE_URL}/seasons`, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch advance season options: ${response.status}`);
    }

    const seasons = await response.json();
    const data = Array.isArray(seasons) ? seasons : (seasons?.data || []);
    const normalizedData = (data as any[]).map(normalizeAdvanceSeasonOption);

    return {
      data: normalizedData,
      total: normalizedData.length,
    };
  } catch (error) {
    console.error('Error fetching advance season options:', error);
    return { data: [], total: 0 };
  }
}

export async function fetchPaymentBankOptions(): Promise<FetchPaymentBankOptionsResult> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      console.error('No access token in session');
      return { data: [], total: 0 };
    }

    const headers = getAuthHeaders(token);
    const response = await fetch(`${CONFIGURATION_API_BASE_URL}/banks`, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch payment bank options: ${response.status}`);
    }

    const bankResponse = await response.json();
    const data = Array.isArray(bankResponse?.data?.banks)
      ? bankResponse.data.banks
      : Array.isArray(bankResponse?.banks)
        ? bankResponse.banks
        : [];
    const normalizedData = (data as any[]).map(normalizePaymentBankOption);

    return {
      data: normalizedData,
      total: normalizedData.length,
    };
  } catch (error) {
    console.error('Error fetching payment bank options:', error);
    return { data: [], total: 0 };
  }
}

export async function fetchSettlementReceptionCandidates(
  producerId: number,
  settlementId?: number,
): Promise<FetchSettlementReceptionCandidatesResult> {
  const parseResponseDataArray = (payload: any): any[] => {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (Array.isArray(payload?.data)) {
      return payload.data;
    }

    return [];
  };

  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      const errorMessage = 'No access token in session';
      console.error(errorMessage);
      return { data: [], total: 0, error: errorMessage };
    }

    const headers = getAuthHeaders(token);
    const candidatesResponse = await fetch(
      `${API_BASE_URL}/settlements/candidates?producerId=${producerId}`,
      {
        headers,
        cache: 'no-store',
      }
    );

    const candidatesData = candidatesResponse.ok
      ? parseResponseDataArray(await candidatesResponse.json())
      : [];
    const normalizedCandidates = (candidatesData as any[]).map(
      normalizeSettlementReceptionCandidate,
    );

    if (settlementId === undefined || settlementId === null) {
      if (candidatesResponse.ok) {
        return {
          data: normalizedCandidates,
          total: normalizedCandidates.length,
        };
      }

      const fallbackResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/operations/producers/${producerId}/receptions`,
        {
          headers,
          cache: 'no-store',
        }
      );

      if (!fallbackResponse.ok) {
        const candidatesError = await candidatesResponse.json().catch(() => ({}));
        const fallbackError = await fallbackResponse.json().catch(() => ({}));
        const candidatesMessage =
          Array.isArray(candidatesError?.message)
            ? candidatesError.message.join(', ')
            : candidatesError?.message ||
              `Failed to fetch settlement reception candidates: ${candidatesResponse.status}`;
        const fallbackMessage =
          Array.isArray(fallbackError?.message)
            ? fallbackError.message.join(', ')
            : fallbackError?.message ||
              `Failed to fetch producer receptions: ${fallbackResponse.status}`;
        const errorMessage = `${candidatesMessage}. Fallback error: ${fallbackMessage}`;

        console.error('Error fetching settlement reception candidates:', errorMessage);
        return {
          data: [],
          total: 0,
          error: errorMessage,
        };
      }

      const fallbackPayload = await fallbackResponse.json();
      const fallbackData = parseResponseDataArray(fallbackPayload);
      const filteredReceptions = (fallbackData as any[]).filter((reception) => {
        const rawStatus = String(reception?.status ?? 'cancelled').toLowerCase();
        const isSettled = rawStatus === 'settled';
        const hasSettlement = Boolean(reception?.settlementId);

        return !isSettled && !hasSettlement;
      });

      const normalizedData = filteredReceptions.map(normalizeSettlementReceptionCandidate);

      return {
        data: normalizedData,
        total: normalizedData.length,
      };
    }

    const fallbackResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/operations/producers/${producerId}/receptions`,
      {
        headers,
        cache: 'no-store',
      }
    );

    if (!fallbackResponse.ok) {
      const candidatesError = await candidatesResponse.json().catch(() => ({}));
      const fallbackError = await fallbackResponse.json().catch(() => ({}));
      const candidatesMessage =
        Array.isArray(candidatesError?.message)
          ? candidatesError.message.join(', ')
          : candidatesError?.message ||
            `Failed to fetch settlement reception candidates: ${candidatesResponse.status}`;
      const fallbackMessage =
        Array.isArray(fallbackError?.message)
          ? fallbackError.message.join(', ')
          : fallbackError?.message ||
            `Failed to fetch producer receptions: ${fallbackResponse.status}`;
      const errorMessage = `${candidatesMessage}. Fallback error: ${fallbackMessage}`;

      console.error('Error fetching settlement reception candidates:', errorMessage);
      return {
        data: [],
        total: 0,
        error: errorMessage,
      };
    }

    const fallbackPayload = await fallbackResponse.json();
    const fallbackData = parseResponseDataArray(fallbackPayload);
    const normalizedFallback = (fallbackData as any[]).map(
      normalizeSettlementReceptionCandidate,
    );
    const linkedToSettlement = normalizedFallback.filter(
      (reception) => Number(reception.settlementId ?? 0) === Number(settlementId),
    );

    const mergedById = new Map<number, SettlementReceptionCandidate>();
    for (const reception of normalizedCandidates) {
      mergedById.set(reception.id, reception);
    }
    for (const reception of linkedToSettlement) {
      mergedById.set(reception.id, reception);
    }

    const normalizedData = Array.from(mergedById.values());

    return {
      data: normalizedData,
      total: normalizedData.length,
    };
  } catch (error) {
    console.error('Error fetching settlement reception candidates:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error fetching candidates';
    return { data: [], total: 0, error: errorMessage };
  }
}

export async function updateSettlementReceptionDryPercent(
  receptionId: number,
  dryPercent: number,
): Promise<{
  success: boolean;
  data?: UpdateSettlementReceptionDryPercentResponse;
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      return { success: false, error: 'No access token' };
    }

    const headers = getAuthHeaders(token);
    const response = await fetch(
      `${OPERATIONS_API_BASE_URL}/receptions/${receptionId}/analysis/dry-percent`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ dryPercent }),
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      const errorMessage =
        Array.isArray(errorPayload?.message)
          ? errorPayload.message.join(', ')
          : errorPayload?.message ||
            `Failed to update reception dry percent: ${response.status}`;
      return { success: false, error: errorMessage };
    }

    const payload = await response.json();
    const source = payload?.data ?? payload ?? {};

    return {
      success: true,
      data: {
        receptionId: Number(source.receptionId ?? receptionId),
        dryPercent: Number(source.dryPercent ?? dryPercent),
        analysisRecordId: Number(source.analysisRecordId ?? 0),
      },
    };
  } catch (error) {
    throwIfBackendUnavailable(error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'No fue posible actualizar el porcentaje de secado.',
    };
  }
}

export async function updateSettlementReceptionRicePrice(
  receptionId: number,
  ricePrice: number,
): Promise<{
  success: boolean;
  data?: UpdateSettlementReceptionRicePriceResponse;
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      return { success: false, error: 'No access token' };
    }

    const headers = getAuthHeaders(token);
    const response = await fetch(
      `${OPERATIONS_API_BASE_URL}/receptions/${receptionId}/rice-price`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ ricePrice }),
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      const errorMessage =
        Array.isArray(errorPayload?.message)
          ? errorPayload.message.join(', ')
          : errorPayload?.message ||
            `Failed to update reception rice price: ${response.status}`;
      return { success: false, error: errorMessage };
    }

    const payload = await response.json();
    const source = payload?.data ?? payload ?? {};

    return {
      success: true,
      data: {
        receptionId: Number(source.receptionId ?? receptionId),
        ricePrice: Number(source.ricePrice ?? ricePrice),
      },
    };
  } catch (error) {
    throwIfBackendUnavailable(error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'No fue posible actualizar el precio por kg.',
    };
  }
}

export async function updateAdvance(
  advanceId: number,
  payload: UpdateAdvancePayload
): Promise<Advance | null> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      console.error('No access token in session');
      return null;
    }

    const headers = getAuthHeaders(token);

    const response = await fetch(`${API_BASE_URL}/advances/${advanceId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to update advance: ${response.status}`);
    }

    const advance = await response.json();
    return normalizeAdvance(advance);
  } catch (error) {
    console.error('Error updating advance:', error);
    return null;
  }
}

export async function deleteAdvance(
  advanceId: number,
): Promise<{ success: boolean; data?: Advance; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      return { success: false, error: 'No access token' };
    }

    const headers = getAuthHeaders(token);
    const response = await fetch(`${API_BASE_URL}/advances/${advanceId}`, {
      method: 'DELETE',
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const backendMessage = errorData?.message;
      const errorMessage = Array.isArray(backendMessage)
        ? backendMessage.join(', ')
        : backendMessage || `Failed to delete advance: ${response.status}`;
      throw new Error(errorMessage);
    }

    const deletedAdvance = await response.json();
    const hasAdvanceData =
      deletedAdvance &&
      typeof deletedAdvance === 'object' &&
      ((deletedAdvance as any).id !== undefined ||
        ((deletedAdvance as any).data && (deletedAdvance as any).data.id !== undefined));

    return {
      success: true,
      data: hasAdvanceData ? normalizeAdvance(deletedAdvance) : undefined,
    };
  } catch (error) {
    console.error('Error deleting advance:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function updateAdvanceWithPayment(
  advanceId: number,
  payload: UpdateAdvancePayload
): Promise<{ success: boolean; data?: Advance; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      return { success: false, error: 'No access token' };
    }

    const headers = getAuthHeaders(token);
    const response = await fetch(`${API_BASE_URL}/advances/${advanceId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const backendMessage = errorData?.message;
      const errorMessage = Array.isArray(backendMessage)
        ? backendMessage.join(', ')
        : backendMessage || `Failed to update advance: ${response.status}`;
      throw new Error(errorMessage);
    }

    const advance = await response.json();
    return {
      success: true,
      data: normalizeAdvance(advance),
    };
  } catch (error) {
    console.error('Error updating advance with payment details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function createAdvance(
  payload: CreateAdvancePayload
): Promise<{ success: boolean; data?: Advance; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      return { success: false, error: 'No access token' };
    }

    const headers = getAuthHeaders(token);
    const response = await fetch(`${API_BASE_URL}/advances`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const backendMessage = errorData?.message;
      const errorMessage = Array.isArray(backendMessage)
        ? backendMessage.join(', ')
        : backendMessage || `Failed to create advance: ${response.status}`;
      throw new Error(errorMessage);
    }

    const advance = await response.json();

    return {
      success: true,
      data: normalizeAdvance(advance),
    };
  } catch (error) {
    console.error('Error creating advance:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function createSettlement(
  payload: CreateSettlementPayload
): Promise<{ success: boolean; data?: Settlement; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      return { success: false, error: 'No access token' };
    }

    const headers = getAuthHeaders(token);
    const response = await fetch(`${API_BASE_URL}/settlements`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const backendMessage = errorData?.message;
      const errorMessage = Array.isArray(backendMessage)
        ? backendMessage.join(', ')
        : backendMessage || `Failed to create settlement: ${response.status}`;
      throw new Error(errorMessage);
    }

    const settlement = await response.json();
    return {
      success: true,
      data: normalizeSettlement(settlement),
    };
  } catch (error) {
    console.error('Error creating settlement:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function updateSettlement(
  settlementId: number,
  payload: UpdateSettlementPayload,
): Promise<{ success: boolean; data?: Settlement; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      return { success: false, error: 'No access token' };
    }

    const headers = getAuthHeaders(token);
    const response = await fetch(`${API_BASE_URL}/settlements/${settlementId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const backendMessage = errorData?.message;
      const errorMessage = Array.isArray(backendMessage)
        ? backendMessage.join(', ')
        : backendMessage || `Failed to update settlement: ${response.status}`;
      throw new Error(errorMessage);
    }

    const settlement = await response.json();
    return {
      success: true,
      data: normalizeSettlement(settlement),
    };
  } catch (error) {
    console.error('Error updating settlement:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function deleteSettlement(
  settlementId: number,
): Promise<{ success: boolean; data?: Settlement; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      return { success: false, error: 'No access token' };
    }

    const headers = getAuthHeaders(token);
    const response = await fetch(`${API_BASE_URL}/settlements/${settlementId}`, {
      method: 'DELETE',
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const backendMessage = errorData?.message;
      const errorMessage = Array.isArray(backendMessage)
        ? backendMessage.join(', ')
        : backendMessage || `Failed to delete settlement: ${response.status}`;
      throw new Error(errorMessage);
    }

    const settlement = await response.json();
    return {
      success: true,
      data: normalizeSettlement(settlement),
    };
  } catch (error) {
    console.error('Error deleting settlement:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function completeSettlement(
  settlementId: number,
  payload: CompleteSettlementPayload,
): Promise<{ success: boolean; data?: Settlement; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      return { success: false, error: 'No access token' };
    }

    const headers = getAuthHeaders(token);
    const response = await fetch(
      `${API_BASE_URL}/settlements/${settlementId}/complete`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const backendMessage = errorData?.message;
      const errorMessage = Array.isArray(backendMessage)
        ? backendMessage.join(', ')
        : backendMessage || `Failed to complete settlement: ${response.status}`;
      throw new Error(errorMessage);
    }

    const settlement = await response.json();
    return {
      success: true,
      data: normalizeSettlement(settlement),
    };
  } catch (error) {
    throwIfBackendUnavailable(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
