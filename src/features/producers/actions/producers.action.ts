'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { throwIfBackendUnavailable } from '@/lib/api/backend-connection-error';
import {
  Producer,
  CreateProducerPayload,
  UpdateProducerPayload,
  BankAccount,
  ProducerReceptionItem,
  ProducerReceptionStatus,
  ProducerPendingBalance,
} from '../types/producers.types';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/producers`;

function getAuthHeaders(token: string): HeadersInit {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

function extractBackendErrorMessage(errorData: any, fallback: string): string {
  const parseMessage = (value: unknown): string | null => {
    if (Array.isArray(value)) {
      const parsed = value
        .map((entry) => {
          if (typeof entry === 'string') return entry;
          if (entry && typeof entry === 'object' && 'message' in entry) {
            const nested = (entry as any).message;
            return typeof nested === 'string' ? nested : String(nested);
          }
          return String(entry);
        })
        .filter((entry) => entry.trim().length > 0);

      return parsed.length > 0 ? parsed.join(', ') : null;
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }

    return null;
  };

  return (
    parseMessage(errorData?.message) ||
    parseMessage(errorData?.data?.message) ||
    parseMessage(errorData?.error) ||
    fallback
  );
}

function normalizeReceptionStatus(status: unknown): ProducerReceptionStatus {
  const normalized = String(status || '').toLowerCase();

  if (normalized === 'analyzed') {
    return 'analyzed';
  }

  if (normalized === 'settled') {
    return 'settled';
  }

  if (normalized === 'cancelled' || normalized === 'pending' || normalized === 'in_process') {
    return 'cancelled';
  }

  return 'cancelled';
}

function normalizeProducerPendingBalance(raw: any): ProducerPendingBalance {
  const source = raw?.data ?? raw ?? {};

  const receptions = Array.isArray(source.receptions)
    ? source.receptions.map((reception: any) => ({
        id: Number(reception?.id ?? 0),
        guideNumber: String(reception?.guideNumber ?? ''),
        seasonId: Number(reception?.seasonId ?? 0),
        seasonName:
          reception?.seasonName === null || reception?.seasonName === undefined
            ? null
            : String(reception.seasonName),
        riceTypeId: Number(reception?.riceTypeId ?? 0),
        riceTypeName:
          reception?.riceTypeName === null || reception?.riceTypeName === undefined
            ? null
            : String(reception.riceTypeName),
        licensePlate: String(reception?.licensePlate ?? ''),
        createdAt: String(reception?.createdAt ?? ''),
        status: String(reception?.status ?? 'cancelled'),
        netWeight: Number(reception?.netWeight ?? 0),
        ricePrice: Number(reception?.ricePrice ?? 0),
        dryPercent: Number(reception?.dryPercent ?? 0),
        netAmount: Number(reception?.netAmount ?? 0),
        dryingReferenceAmount: Number(
          reception?.dryingReferenceAmount ?? reception?.dryingDiscount ?? 0,
        ),
        riceVatAmount: Number(reception?.riceVatAmount ?? 0),
        totalAmount: Number(
          reception?.totalAmount ?? reception?.netAmount ?? 0,
        ),
      }))
    : [];

  const advances = Array.isArray(source.advances)
    ? source.advances.map((advance: any) => ({
        id: Number(advance?.id ?? 0),
        seasonId: Number(advance?.seasonId ?? 0),
        seasonName:
          advance?.seasonName === null || advance?.seasonName === undefined
            ? null
            : String(advance.seasonName),
        issueDate:
          advance?.issueDate === null || advance?.issueDate === undefined
            ? null
            : String(advance.issueDate),
        interestEndDate:
          advance?.interestEndDate === null || advance?.interestEndDate === undefined
            ? null
            : String(advance.interestEndDate),
        isInterestCalculationEnabled: Boolean(advance?.isInterestCalculationEnabled),
        interestRate: Number(advance?.interestRate ?? 0),
        amount: Number(advance?.amount ?? 0),
        interest: Number(advance?.interest ?? 0),
        totalPending: Number(advance?.totalPending ?? 0),
        description:
          advance?.description === null || advance?.description === undefined
            ? null
            : String(advance.description),
      }))
    : [];

  return {
    producer: {
      id: Number(source?.producer?.id ?? 0),
      name: String(source?.producer?.name ?? ''),
      rut: String(source?.producer?.rut ?? ''),
    },
    summary: {
      receptionsCount: Number(source?.summary?.receptionsCount ?? 0),
      advancesCount: Number(source?.summary?.advancesCount ?? 0),
      totalReceptionNet: Number(source?.summary?.totalReceptionNet ?? 0),
      totalReceptionVat: Number(source?.summary?.totalReceptionVat ?? 0),
      totalReceptionWithVat: Number(
        source?.summary?.totalReceptionWithVat ??
          source?.summary?.totalReceptionNet ??
          0,
      ),
      totalDryingReference: Number(
        source?.summary?.totalDryingReference ??
          source?.summary?.totalDryingDiscount ??
          0,
      ),
      totalAdvanceCapital: Number(source?.summary?.totalAdvanceCapital ?? 0),
      totalAdvanceInterest: Number(source?.summary?.totalAdvanceInterest ?? 0),
      totalAdvancesWithInterest: Number(source?.summary?.totalAdvancesWithInterest ?? 0),
      pendingBalance: Number(source?.summary?.pendingBalance ?? 0),
      calculatedAt: String(source?.summary?.calculatedAt ?? ''),
    },
    receptions,
    advances,
  };
}

interface FetchProducersParams {
  page?: number;
  limit?: number;
  search?: string;
  sortField?: string;
  sort?: 'ASC' | 'DESC';
}

interface FetchProducersResult {
  data: Producer[];
  total: number;
  page: number;
  limit: number;
}

export async function fetchProducers(params?: FetchProducersParams): Promise<FetchProducersResult> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      console.error('No access token in session');
      return { data: [], total: 0, page: 1, limit: 10 };
    }

    const headers = getAuthHeaders(token);
    const response = await fetch(API_BASE_URL, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch producers: ${response.status}`);
    }

    const producers = await response.json();
    const data = Array.isArray(producers) ? producers : (producers?.data || []);

    // Asegurar que los IDs son números
    const normalizedData = data.map((p: any) => ({
      ...p,
      id: typeof p.id === 'string' ? parseInt(p.id, 10) : p.id,
    })) as Producer[];

    // Client-side filtering and pagination
    let filtered = normalizedData;

    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      filtered = filtered.filter((p: Producer) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.rut.toLowerCase().includes(searchLower) ||
        p.email.toLowerCase().includes(searchLower) ||
        p.city.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    if (params?.sortField) {
      filtered.sort((a: Producer, b: Producer) => {
        const aVal = (a as any)[params.sortField || 'name'];
        const bVal = (b as any)[params.sortField || 'name'];

        if (typeof aVal === 'string') {
          return params.sort === 'DESC' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
        }

        return params.sort === 'DESC' ? (bVal > aVal ? 1 : -1) : aVal > bVal ? 1 : -1;
      });
    }

    // Pagination
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const start = (page - 1) * limit;
    const paginatedData = filtered.slice(start, start + limit);

    return {
      data: paginatedData,
      total: filtered.length,
      page,
      limit,
    };
  } catch (error) {
    throwIfBackendUnavailable(error);
    console.error('Error fetching producers:', error);
    return { data: [], total: 0, page: 1, limit: 10 };
  }
}

export async function fetchProducerReceptions(
  producerId: number,
  status?: ProducerReceptionStatus,
): Promise<{ success: boolean; data: ProducerReceptionItem[]; error?: string }> {
  try {
    const normalizedProducerId = Number(producerId);

    if (!Number.isFinite(normalizedProducerId) || normalizedProducerId <= 0) {
      return { success: false, data: [], error: 'Productor inválido' };
    }

    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      return { success: false, data: [], error: 'No access token' };
    }

    const headers = getAuthHeaders(token);
    const OPERATIONS_API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/operations`;
    const queryParams = new URLSearchParams();

    if (status === 'analyzed') {
      queryParams.set('status', 'analyzed');
    } else if (status === 'settled') {
      queryParams.set('status', 'settled');
    } else if (status === 'cancelled') {
      queryParams.set('status', 'cancelled');
    }

    const queryString = queryParams.toString();
    const response = await fetch(
      `${OPERATIONS_API_BASE_URL}/producers/${normalizedProducerId}/receptions${
        queryString ? `?${queryString}` : ''
      }`,
      {
        headers,
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = extractBackendErrorMessage(
        errorData,
        `Failed to fetch producer receptions: ${response.status}`,
      );
      return { success: false, data: [], error: errorMessage };
    }

    const payload = await response.json();
    const receptions = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

    const normalizedData: ProducerReceptionItem[] = receptions.map((reception: any) => ({
      id: Number(reception.id),
      guide: String(reception.guideNumber || reception.guide || ''),
      createdAt: String(reception.createdAt || ''),
      seasonId: reception.seasonId ? Number(reception.seasonId) : undefined,
      seasonName: String(reception.season?.name || reception.seasonName || 'Sin temporada'),
      riceTypeId: reception.riceTypeId ? Number(reception.riceTypeId) : undefined,
      riceTypeName: String(reception.riceType?.name || reception.riceTypeName || 'Sin tipo'),
      grossWeight: Number(reception.grossWeight) || 0,
      tare: Number(reception.tareWeight || reception.tare) || 0,
      netWeight: Number(reception.netWeight) || 0,
      licensePlate: String(reception.licensePlate || '-'),
      status: normalizeReceptionStatus(reception.status),
    }));

    return { success: true, data: normalizedData };
  } catch (error) {
    throwIfBackendUnavailable(error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function fetchProducerPendingBalance(
  producerId: number,
): Promise<{ success: boolean; data?: ProducerPendingBalance; error?: string }> {
  try {
    const normalizedProducerId = Number(producerId);

    if (!Number.isFinite(normalizedProducerId) || normalizedProducerId <= 0) {
      return { success: false, error: 'Productor inválido' };
    }

    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      return { success: false, error: 'No access token' };
    }

    const headers = getAuthHeaders(token);
    const FINANCES_API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/finances`;
    const response = await fetch(
      `${FINANCES_API_BASE_URL}/producers/${normalizedProducerId}/pending-balance`,
      {
        headers,
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = extractBackendErrorMessage(
        errorData,
        `Failed to fetch producer pending balance: ${response.status}`,
      );

      return { success: false, error: errorMessage };
    }

    const payload = await response.json();
    return { success: true, data: normalizeProducerPendingBalance(payload) };
  } catch (error) {
    throwIfBackendUnavailable(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function createProducer(data: CreateProducerPayload): Promise<{ success: boolean; data?: Producer; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      return { success: false, error: 'No access token' };
    }

    const headers = getAuthHeaders(token);
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = extractBackendErrorMessage(
        errorData,
        `Failed to create producer: ${response.status}`
      );
      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    // Backend wraps response in { success, data, timestamp }
    const producerData = responseData.data || responseData;
    
    const normalizedProducer = {
      ...producerData,
      id: typeof producerData.id === 'string' ? parseInt(producerData.id, 10) : producerData.id,
    } as Producer;
    return { success: true, data: normalizedProducer };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

export async function updateProducer(
  id: number,
  data: UpdateProducerPayload
): Promise<{ success: boolean; data?: Producer; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      return { success: false, error: 'No access token' };
    }

    const headers = getAuthHeaders(token);
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = extractBackendErrorMessage(
        errorData,
        `Failed to update producer: ${response.status}`,
      );
      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    // Backend wraps response in { success, data, timestamp }
    const producerData = responseData.data || responseData;
    
    const normalizedProducer = {
      ...producerData,
      id: typeof producerData.id === 'string' ? parseInt(producerData.id, 10) : producerData.id,
    } as Producer;
    return { success: true, data: normalizedProducer };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

export async function deleteProducer(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      return { success: false, error: 'No access token' };
    }

    const headers = getAuthHeaders(token);
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to delete producer: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

// ============================================================
// Bank Accounts Operations
// ============================================================

export async function addBankAccount(
  producerId: number,
  account: {
    bankName: string;
    accountType: string;
    accountNumber: string;
    holderName: string;
    holderRut: string;
    isDefault?: boolean;
  }
): Promise<{ success: boolean; data?: Producer; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      return { success: false, error: 'No access token' };
    }

    const headers = getAuthHeaders(token);
    const response = await fetch(`${API_BASE_URL}/${producerId}/bank-accounts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(account),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to add bank account: ${response.status}`);
    }

    const responseData = await response.json();
    // Backend wraps response in { success, data, timestamp }
    const producerData = responseData.data || responseData;
    
    const normalizedProducer = {
      ...producerData,
      id: typeof producerData.id === 'string' ? parseInt(producerData.id, 10) : producerData.id,
    } as Producer;
    return { success: true, data: normalizedProducer };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error adding bank account:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

export async function removeBankAccount(
  producerId: number,
  accountIndex: number
): Promise<{ success: boolean; data?: Producer; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      return { success: false, error: 'No access token' };
    }

    const headers = getAuthHeaders(token);
    const response = await fetch(`${API_BASE_URL}/${producerId}/bank-accounts/${accountIndex}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to remove bank account: ${response.status}`);
    }

    const responseData = await response.json();
    // Backend wraps response in { success, data, timestamp }
    const producerData = responseData.data || responseData;
    
    const normalizedProducer = {
      ...producerData,
      id: typeof producerData.id === 'string' ? parseInt(producerData.id, 10) : producerData.id,
    } as Producer;
    return { success: true, data: normalizedProducer };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error removing bank account:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

export interface BankOption {
  id: string;
  label: string;
}

export interface BankOptionsResponse {
  banks: BankOption[];
  accountTypes: BankOption[];
}

export async function fetchBankOptions(): Promise<BankOptionsResponse> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      console.error('No access token in session');
      return { banks: [], accountTypes: [] };
    }

    const CONFIGURATION_API = `${process.env.NEXT_PUBLIC_API_URL}/configuration/banks`;
    const headers = getAuthHeaders(token);
    
    console.log('Fetching bank options from:', CONFIGURATION_API);
    const response = await fetch(CONFIGURATION_API, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`Failed to fetch bank options: ${response.status}`);
      return { banks: [], accountTypes: [] };
    }

    const responseData = await response.json();
    console.log('Bank options response:', responseData);
    
    // Backend wraps response in { success, data, timestamp } structure
    const bankData = responseData.data || responseData;
    
    const result: BankOptionsResponse = {
      banks: bankData.banks || [],
      accountTypes: bankData.accountTypes || [],
    };
    
    console.log('Returning bank options:', result);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching bank options:', errorMessage);
    return { banks: [], accountTypes: [] };
  }
}
