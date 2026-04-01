'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { throwIfBackendUnavailable } from '@/lib/api/backend-connection-error';
import {
  BudgetReturnFilters,
  BudgetReturnReportResponse,
  DryingReportFilters,
  DryingRevenueReportResponse,
  InventoryBookFilters,
  InventoryBookMonthlyReportResponse,
  InventoryBookSeasonFilters,
  InventoryBookSeasonSummaryResponse,
  FinancialProfitabilityFilters,
  FinancialProfitabilityReportResponse,
  FinancialServicesInterestReportFilters,
  FinancialServicesInterestReportResponse,
  ProcessYieldFilters,
  ProcessYieldReportResponse,
  ReportActionResult,
  RicePriceReportFilters,
  RicePriceReportResponse,
  VolumePriceByProducerReportResponse,
  VolumePriceProducerDetailReportResponse,
  VolumePriceReportFilters,
  VolumePriceReportResponse,
  CashProjectionFilters,
  CashProjectionResponse,
} from '../types/reports.types';

const ANALYTICS_API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/analytics`;

function getAuthHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const payload = await response.json();
    const message = payload?.message ?? payload?.error ?? payload?.data?.message;

    if (Array.isArray(message)) {
      const merged = message.map((entry) => String(entry)).join(', ').trim();
      return merged || fallback;
    }

    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }

    return fallback;
  } catch {
    return fallback;
  }
}

function normalizePayload<T>(raw: any): T {
  return (raw?.data ?? raw) as T;
}

export async function fetchDryingRevenueReport(
  filters: DryingReportFilters,
): Promise<ReportActionResult<DryingRevenueReportResponse>> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      return {
        success: false,
        data: null,
        error: 'No hay sesión activa para consultar el reporte.',
      };
    }

    const headers = getAuthHeaders(token);
    const query = new URLSearchParams();

    query.set('fechaInicio', filters.fechaInicio);
    query.set('fechaFin', filters.fechaFin);

    if (filters.seasonId) {
      query.set('seasonId', String(filters.seasonId));
    }

    if (filters.producerId) {
      query.set('producerId', String(filters.producerId));
    }

    if (filters.riceTypeId) {
      query.set('riceTypeId', String(filters.riceTypeId));
    }

    if (filters.receptionStatus) {
      query.set('receptionStatus', filters.receptionStatus);
    }

    if (filters.groupBy) {
      query.set('groupBy', filters.groupBy);
    }

    const response = await fetch(
      `${ANALYTICS_API_BASE_URL}/drying/revenue?${query.toString()}`,
      {
        headers,
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          data: null,
          error: 'SESSION_EXPIRED',
        };
      }

      const error = await parseErrorMessage(
        response,
        `No fue posible obtener el Reporte 1 (${response.status}).`,
      );

      return {
        success: false,
        data: null,
        error,
      };
    }

    const payload = await response.json();

    return {
      success: true,
      data: normalizePayload<DryingRevenueReportResponse>(payload),
    };
  } catch (error) {
    throwIfBackendUnavailable(error);

    return {
      success: false,
      data: null,
      error:
        error instanceof Error
          ? error.message
          : 'Error inesperado al obtener el Reporte 1.',
    };
  }
}

export async function fetchFinancialServicesInterestReport(
  filters: FinancialServicesInterestReportFilters,
): Promise<ReportActionResult<FinancialServicesInterestReportResponse>> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      return {
        success: false,
        data: null,
        error: 'No hay sesión activa para consultar el reporte.',
      };
    }

    const headers = getAuthHeaders(token);
    const query = new URLSearchParams();

    query.set('fechaInicio', filters.fechaInicio);
    query.set('fechaFin', filters.fechaFin);

    if (filters.seasonId) {
      query.set('seasonId', String(filters.seasonId));
    }

    if (filters.producerId) {
      query.set('producerId', String(filters.producerId));
    }

    if (filters.status) {
      query.set('status', filters.status);
    }

    if (filters.calculationMode) {
      query.set('calculationMode', filters.calculationMode);
    }

    if (filters.groupBy) {
      query.set('groupBy', filters.groupBy);
    }

    const response = await fetch(
      `${ANALYTICS_API_BASE_URL}/financial-services/interests?${query.toString()}`,
      {
        headers,
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          data: null,
          error: 'SESSION_EXPIRED',
        };
      }

      const error = await parseErrorMessage(
        response,
        `No fue posible obtener el Reporte 2 (${response.status}).`,
      );

      return {
        success: false,
        data: null,
        error,
      };
    }

    const payload = await response.json();

    return {
      success: true,
      data: normalizePayload<FinancialServicesInterestReportResponse>(payload),
    };
  } catch (error) {
    throwIfBackendUnavailable(error);

    return {
      success: false,
      data: null,
      error:
        error instanceof Error
          ? error.message
          : 'Error inesperado al obtener el Reporte 2.',
    };
  }
}

export async function fetchVolumePriceReport(
  filters: VolumePriceReportFilters,
): Promise<ReportActionResult<VolumePriceReportResponse>> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      return {
        success: false,
        data: null,
        error: 'No hay sesión activa para consultar el reporte.',
      };
    }

    const headers = getAuthHeaders(token);
    const query = new URLSearchParams();

    query.set('seasonId', String(filters.seasonId));

    if (filters.riceTypeId) {
      query.set('riceTypeId', String(filters.riceTypeId));
    }

    const response = await fetch(
      `${ANALYTICS_API_BASE_URL}/volume-price?${query.toString()}`,
      {
        headers,
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          data: null,
          error: 'SESSION_EXPIRED',
        };
      }

      const error = await parseErrorMessage(
        response,
        `No fue posible obtener el Reporte 6 (${response.status}).`,
      );

      return {
        success: false,
        data: null,
        error,
      };
    }

    const payload = await response.json();

    return {
      success: true,
      data: normalizePayload<VolumePriceReportResponse>(payload),
    };
  } catch (error) {
    throwIfBackendUnavailable(error);

    return {
      success: false,
      data: null,
      error:
        error instanceof Error
          ? error.message
          : 'Error inesperado al obtener el Reporte 6.',
    };
  }
}

export async function fetchVolumePriceByProducerReport(
  filters: VolumePriceReportFilters,
): Promise<ReportActionResult<VolumePriceByProducerReportResponse>> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      return {
        success: false,
        data: null,
        error: 'No hay sesión activa para consultar el reporte.',
      };
    }

    const headers = getAuthHeaders(token);
    const query = new URLSearchParams();

    query.set('seasonId', String(filters.seasonId));

    if (filters.riceTypeId) {
      query.set('riceTypeId', String(filters.riceTypeId));
    }

    const response = await fetch(
      `${ANALYTICS_API_BASE_URL}/volume-price/by-producer?${query.toString()}`,
      {
        headers,
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          data: null,
          error: 'SESSION_EXPIRED',
        };
      }

      const error = await parseErrorMessage(
        response,
        `No fue posible obtener el Reporte 6 por productor (${response.status}).`,
      );

      return {
        success: false,
        data: null,
        error,
      };
    }

    const payload = await response.json();

    return {
      success: true,
      data: normalizePayload<VolumePriceByProducerReportResponse>(payload),
    };
  } catch (error) {
    throwIfBackendUnavailable(error);

    return {
      success: false,
      data: null,
      error:
        error instanceof Error
          ? error.message
          : 'Error inesperado al obtener el Reporte 6 por productor.',
    };
  }
}

export async function fetchVolumePriceProducerDetailReport(
  producerId: number,
  filters: VolumePriceReportFilters,
): Promise<ReportActionResult<VolumePriceProducerDetailReportResponse>> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      return {
        success: false,
        data: null,
        error: 'No hay sesión activa para consultar el reporte.',
      };
    }

    const headers = getAuthHeaders(token);
    const query = new URLSearchParams();

    query.set('seasonId', String(filters.seasonId));

    if (filters.riceTypeId) {
      query.set('riceTypeId', String(filters.riceTypeId));
    }

    const response = await fetch(
      `${ANALYTICS_API_BASE_URL}/volume-price/producer/${producerId}?${query.toString()}`,
      {
        headers,
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          data: null,
          error: 'SESSION_EXPIRED',
        };
      }

      const error = await parseErrorMessage(
        response,
        `No fue posible obtener el detalle del Reporte 6 (${response.status}).`,
      );

      return {
        success: false,
        data: null,
        error,
      };
    }

    const payload = await response.json();

    return {
      success: true,
      data: normalizePayload<VolumePriceProducerDetailReportResponse>(payload),
    };
  } catch (error) {
    throwIfBackendUnavailable(error);

    return {
      success: false,
      data: null,
      error:
        error instanceof Error
          ? error.message
          : 'Error inesperado al obtener detalle del Reporte 6.',
    };
  }
}

export async function fetchCashProjectionReport(
  filters: CashProjectionFilters,
): Promise<ReportActionResult<CashProjectionResponse>> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      return {
        success: false,
        data: null,
        error: 'No hay sesión activa para consultar el reporte.',
      };
    }

    const headers = getAuthHeaders(token);
    const query = new URLSearchParams();

    if (filters.seasonId) {
      query.set('seasonId', String(filters.seasonId));
    }

    const qs = query.toString();
    const url = `${ANALYTICS_API_BASE_URL}/cash-projection${qs ? `?${qs}` : ''}`;

    const response = await fetch(url, { headers, cache: 'no-store' });

    if (!response.ok) {
      if (response.status === 401) {
        return { success: false, data: null, error: 'SESSION_EXPIRED' };
      }

      const error = await parseErrorMessage(
        response,
        `No fue posible obtener el reporte de Proyección de Caja (${response.status}).`,
      );

      return { success: false, data: null, error };
    }

    const payload = await response.json();

    return {
      success: true,
      data: normalizePayload<CashProjectionResponse>(payload),
    };
  } catch (error) {
    throwIfBackendUnavailable(error);

    return {
      success: false,
      data: null,
      error:
        error instanceof Error
          ? error.message
          : 'Error inesperado al obtener el reporte de Proyección de Caja.',
    };
  }
}

export async function fetchInventoryBookReport(
  filters: InventoryBookFilters,
): Promise<ReportActionResult<InventoryBookMonthlyReportResponse>> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      return {
        success: false,
        data: null,
        error: 'No hay sesión activa para consultar el reporte.',
      };
    }

    const headers = getAuthHeaders(token);
    const query = new URLSearchParams();

    query.set('seasonId', String(filters.seasonId));
    query.set('month', filters.month);

    const response = await fetch(
      `${ANALYTICS_API_BASE_URL}/inventory-book?${query.toString()}`,
      {
        headers,
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          data: null,
          error: 'SESSION_EXPIRED',
        };
      }

      const error = await parseErrorMessage(
        response,
        `No fue posible obtener el Libro de Existencias (${response.status}).`,
      );

      return {
        success: false,
        data: null,
        error,
      };
    }

    const payload = await response.json();

    return {
      success: true,
      data: normalizePayload<InventoryBookMonthlyReportResponse>(payload),
    };
  } catch (error) {
    throwIfBackendUnavailable(error);

    return {
      success: false,
      data: null,
      error:
        error instanceof Error
          ? error.message
          : 'Error inesperado al obtener el Libro de Existencias.',
    };
  }
}

export async function fetchInventoryBookSeasonSummary(
  filters: InventoryBookSeasonFilters,
): Promise<ReportActionResult<InventoryBookSeasonSummaryResponse>> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      return {
        success: false,
        data: null,
        error: 'No hay sesión activa para consultar el reporte.',
      };
    }

    const headers = getAuthHeaders(token);
    const query = new URLSearchParams();
    query.set('seasonId', String(filters.seasonId));

    const response = await fetch(
      `${ANALYTICS_API_BASE_URL}/inventory-book/season-summary?${query.toString()}`,
      {
        headers,
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          data: null,
          error: 'SESSION_EXPIRED',
        };
      }

      const error = await parseErrorMessage(
        response,
        `No fue posible obtener el resumen del Libro de Existencias (${response.status}).`,
      );

      return {
        success: false,
        data: null,
        error,
      };
    }

    const payload = await response.json();

    return {
      success: true,
      data: normalizePayload<InventoryBookSeasonSummaryResponse>(payload),
    };
  } catch (error) {
    throwIfBackendUnavailable(error);

    return {
      success: false,
      data: null,
      error:
        error instanceof Error
          ? error.message
          : 'Error inesperado al obtener el resumen del Libro de Existencias.',
    };
  }
}

export async function fetchFinancialProfitabilityReport(
  filters: FinancialProfitabilityFilters,
): Promise<ReportActionResult<FinancialProfitabilityReportResponse>> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      return {
        success: false,
        data: null,
        error: 'No hay sesión activa para consultar el reporte.',
      };
    }

    const headers = getAuthHeaders(token);
    const query = new URLSearchParams();

    query.set('seasonId', String(filters.seasonId));

    if (filters.cutoffDate) {
      query.set('cutoffDate', filters.cutoffDate);
    }

    if (filters.producerId) {
      query.set('producerId', String(filters.producerId));
    }

    if (filters.calculationMode) {
      query.set('calculationMode', filters.calculationMode);
    }

    const response = await fetch(
      `${ANALYTICS_API_BASE_URL}/financial-services/profitability?${query.toString()}`,
      {
        headers,
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          data: null,
          error: 'SESSION_EXPIRED',
        };
      }

      const error = await parseErrorMessage(
        response,
        `No fue posible obtener el Reporte 3 (${response.status}).`,
      );

      return {
        success: false,
        data: null,
        error,
      };
    }

    const payload = await response.json();

    return {
      success: true,
      data: normalizePayload<FinancialProfitabilityReportResponse>(payload),
    };
  } catch (error) {
    throwIfBackendUnavailable(error);

    return {
      success: false,
      data: null,
      error:
        error instanceof Error
          ? error.message
          : 'Error inesperado al obtener el Reporte 3.',
    };
  }
}

export async function fetchBudgetReturnReport(
  filters: BudgetReturnFilters,
): Promise<ReportActionResult<BudgetReturnReportResponse>> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      return {
        success: false,
        data: null,
        error: 'No hay sesión activa para consultar el reporte.',
      };
    }

    const headers = getAuthHeaders(token);
    const query = new URLSearchParams();

    query.set('fechaInicio', filters.fechaInicio);
    query.set('fechaFin', filters.fechaFin);

    if (filters.seasonId) {
      query.set('seasonId', String(filters.seasonId));
    }

    if (filters.producerId) {
      query.set('producerId', String(filters.producerId));
    }

    const response = await fetch(
      `${ANALYTICS_API_BASE_URL}/budget-return?${query.toString()}`,
      {
        headers,
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          data: null,
          error: 'SESSION_EXPIRED',
        };
      }

      const error = await parseErrorMessage(
        response,
        `No fue posible obtener el Reporte 4 (${response.status}).`,
      );

      return {
        success: false,
        data: null,
        error,
      };
    }

    const payload = await response.json();

    return {
      success: true,
      data: normalizePayload<BudgetReturnReportResponse>(payload),
    };
  } catch (error) {
    throwIfBackendUnavailable(error);

    return {
      success: false,
      data: null,
      error:
        error instanceof Error
          ? error.message
          : 'Error inesperado al obtener el Reporte 4.',
    };
  }
}

export async function fetchProcessYieldReport(
  filters: ProcessYieldFilters,
): Promise<ReportActionResult<ProcessYieldReportResponse>> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      return {
        success: false,
        data: null,
        error: 'No hay sesión activa para consultar el reporte.',
      };
    }

    const headers = getAuthHeaders(token);
    const query = new URLSearchParams();

    query.set('seasonId', String(filters.seasonId));

    if (filters.fechaInicio) {
      query.set('fechaInicio', filters.fechaInicio);
    }

    if (filters.fechaFin) {
      query.set('fechaFin', filters.fechaFin);
    }

    if (filters.producerId) {
      query.set('producerId', String(filters.producerId));
    }

    if (filters.riceTypeId) {
      query.set('riceTypeId', String(filters.riceTypeId));
    }

    if (filters.groupBy) {
      query.set('groupBy', filters.groupBy);
    }

    const response = await fetch(
      `${ANALYTICS_API_BASE_URL}/process-yield?${query.toString()}`,
      {
        headers,
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          data: null,
          error: 'SESSION_EXPIRED',
        };
      }

      const error = await parseErrorMessage(
        response,
        `No fue posible obtener el Reporte 5 (${response.status}).`,
      );

      return {
        success: false,
        data: null,
        error,
      };
    }

    const payload = await response.json();

    return {
      success: true,
      data: normalizePayload<ProcessYieldReportResponse>(payload),
    };
  } catch (error) {
    throwIfBackendUnavailable(error);

    return {
      success: false,
      data: null,
      error:
        error instanceof Error
          ? error.message
          : 'Error inesperado al obtener el Reporte 5.',
    };
  }
}

export async function fetchRicePriceReport(
  filters: RicePriceReportFilters,
): Promise<ReportActionResult<RicePriceReportResponse>> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      return {
        success: false,
        data: null,
        error: 'No hay sesión activa para consultar el reporte.',
      };
    }

    const headers = getAuthHeaders(token);
    const query = new URLSearchParams();

    query.set('fechaInicio', filters.fechaInicio);
    query.set('fechaFin', filters.fechaFin);

    if (filters.riceTypeId) {
      query.set('riceTypeId', String(filters.riceTypeId));
    }

    if (filters.groupBy) {
      query.set('groupBy', filters.groupBy);
    }

    const response = await fetch(
      `${ANALYTICS_API_BASE_URL}/rice-price?${query.toString()}`,
      {
        headers,
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          data: null,
          error: 'SESSION_EXPIRED',
        };
      }

      const error = await parseErrorMessage(
        response,
        `No fue posible obtener el reporte de precios (${response.status}).`,
      );

      return {
        success: false,
        data: null,
        error,
      };
    }

    const payload = await response.json();

    return {
      success: true,
      data: normalizePayload<RicePriceReportResponse>(payload),
    };
  } catch (error) {
    throwIfBackendUnavailable(error);

    return {
      success: false,
      data: null,
      error:
        error instanceof Error
          ? error.message
          : 'Error inesperado al obtener el reporte de precios.',
    };
  }
}
