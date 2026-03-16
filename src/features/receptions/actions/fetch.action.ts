'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { throwIfBackendUnavailable } from '@/lib/api/backend-connection-error';
import {
  ReceptionListItem,
  CreateReceptionPayload,
  Reception,
  ReceptionAnalysis,
  UpdateReceptionPayload,
} from '../types/receptions.types';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/operations/receptions`;
const CONFIG_API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/configuration`;

function getAuthHeaders(token: string): HeadersInit {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

function parseOptionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parseOptionalBoolean(value: unknown): boolean | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (['true', '1', 'yes', 'si', 'on'].includes(normalized)) {
      return true;
    }

    if (['false', '0', 'no', 'off'].includes(normalized)) {
      return false;
    }
  }

  return undefined;
}

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

function unwrapResponseData<T = any>(payload: any): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T;
  }

  return payload as T;
}

function extractErrorMessage(errorData: any, fallback: string): string {
  if (!errorData) {
    return fallback;
  }

  if (typeof errorData === 'string' && errorData.trim()) {
    return errorData;
  }

  if (Array.isArray(errorData?.message)) {
    return errorData.message.filter(Boolean).join(', ') || fallback;
  }

  if (typeof errorData?.message === 'string' && errorData.message.trim()) {
    return errorData.message;
  }

  if (typeof errorData?.error === 'string' && errorData.error.trim()) {
    return errorData.error;
  }

  return fallback;
}

function normalizeReceptionStatus(status: unknown): ReceptionListItem['status'] {
  const normalized = String(status ?? '').trim().toLowerCase();

  if (normalized === 'analyzed' || normalized === 'settled' || normalized === 'cancelled') {
    return normalized;
  }

  if (normalized === 'pending' || normalized === 'in_process') {
    return 'cancelled';
  }

  return 'cancelled';
}

async function resolveSeasonId(
  token: string,
  providedSeasonId?: number,
): Promise<number | null> {
  const normalizedProvidedSeasonId = Number(providedSeasonId ?? 0);
  if (normalizedProvidedSeasonId > 0) {
    return normalizedProvidedSeasonId;
  }

  const response = await fetch(`${CONFIG_API_BASE_URL}/seasons`, {
    method: 'GET',
    headers: getAuthHeaders(token),
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  const seasons = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];

  if (!Array.isArray(seasons) || seasons.length === 0) {
    return null;
  }

  const activeSeason = seasons.find((season: any) => Boolean(season?.isActive));
  const selectedSeason = activeSeason || seasons[0];
  const seasonId = Number(selectedSeason?.id ?? 0);

  return seasonId > 0 ? seasonId : null;
}

export interface CreateReceptionAndAnalysisPayload {
  reception: {
    producerId: number;
    riceTypeId: number;
    templateId?: number;
    seasonId?: number;
    guide: string;
    licensePlate: string;
    grossWeight: number;
    tare: number;
    price: number;
    note?: string;
    dryPercent?: number;
  };
  analysis: {
    templateId?: number;
    useToleranceGroup?: boolean;
    groupToleranceName?: string;
    groupToleranceValue?: number;
    humedadRange?: number;
    humedadPercent?: number;
    humedadValue?: number;
    humedadTolerance?: number;
    humedadIsGroup?: boolean;
    humedadTolVisible?: boolean;
    impurezasRange?: number;
    impurezasPercent?: number;
    impurezasValue?: number;
    impurezasTolerance?: number;
    impurezasIsGroup?: boolean;
    impurezasTolVisible?: boolean;
    verdesRange?: number;
    verdesPercent?: number;
    verdesValue?: number;
    verdesTolerance?: number;
    verdesIsGroup?: boolean;
    verdesTolVisible?: boolean;
    manchadosRange?: number;
    manchadosPercent?: number;
    manchadosValue?: number;
    manchadosTolerance?: number;
    manchadosIsGroup?: boolean;
    manchadosTolVisible?: boolean;
    yesososRange?: number;
    yesososPercent?: number;
    yesososValue?: number;
    yesososTolerance?: number;
    yesososIsGroup?: boolean;
    yesososTolVisible?: boolean;
    peladosRange?: number;
    peladosPercent?: number;
    peladosValue?: number;
    peladosTolerance?: number;
    peladosIsGroup?: boolean;
    peladosTolVisible?: boolean;
    vanoRange?: number;
    vanoPercent?: number;
    vanoValue?: number;
    vanoTolerance?: number;
    vanoIsGroup?: boolean;
    vanoTolVisible?: boolean;
    hualcachoRange?: number;
    hualcachoPercent?: number;
    hualcachoValue?: number;
    hualcachoTolerance?: number;
    hualcachoIsGroup?: boolean;
    hualcachoTolVisible?: boolean;
    totalGroupPercent?: number;
    groupTolerance?: number;
    summaryPercent?: number;
    summaryTolerance?: number;
    summaryPenaltyKg?: number;
    bonusEnabled?: boolean;
    bonusPercent?: number;
    dryPercent?: number;
    notes?: string;
  };
}

export interface FetchReceptionsParams {
  status?: ReceptionListItem['status'];
  includeDeleted?: boolean;
  search?: string;
  sort?: 'asc' | 'desc';
  sortField?: string;
  filters?: string;
  page?: number;
  limit?: number;
}

export interface FetchReceptionsResult {
  data: ReceptionListItem[];
  total: number;
  page: number;
  limit: number;
}

export async function fetchReceptions(
  params: FetchReceptionsParams = {},
): Promise<FetchReceptionsResult> {
  const requestedPage =
    Number.isFinite(params.page) && Number(params.page) > 0
      ? Math.floor(Number(params.page))
      : 1;
  const requestedLimit =
    Number.isFinite(params.limit) && Number(params.limit) > 0
      ? Math.floor(Number(params.limit))
      : 25;

  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      console.error('No access token in session');
      return {
        data: [],
        total: 0,
        page: requestedPage,
        limit: requestedLimit,
      };
    }

    const headers = getAuthHeaders(token);
    const queryParams = new URLSearchParams();
    const includeDeleted = params.includeDeleted ?? true;

    queryParams.set('includeDeleted', includeDeleted ? 'true' : 'false');

    if (params.status) {
      queryParams.set('status', params.status);
    }

    const normalizedSearch = params.search?.trim();
    if (normalizedSearch) {
      queryParams.set('search', normalizedSearch);
    }

    if (params.sortField) {
      queryParams.set('sortField', params.sortField);
    }

    if (params.sort) {
      queryParams.set('sort', params.sort);
    }

    const normalizedFilters = params.filters?.trim();
    if (normalizedFilters) {
      queryParams.set('filters', normalizedFilters);
    }

    queryParams.set('page', String(requestedPage));
    queryParams.set('limit', String(requestedLimit));

    const requestUrl = `${API_BASE_URL}?${queryParams.toString()}`;

    const response = await fetch(requestUrl, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch receptions: ${response.status}`);
    }

    const payload = await response.json();
    const unwrappedPayload = unwrapResponseData<any>(payload);

    // Backend can return either a plain array, { data: [...] },
    // or a wrapped paginated object { success, data: { data, total, page, limit } }.
    const receptions = Array.isArray(unwrappedPayload)
      ? unwrappedPayload
      : Array.isArray(unwrappedPayload?.data)
        ? unwrappedPayload.data
        : [];

    const total =
      typeof unwrappedPayload?.total === 'number' && Number.isFinite(unwrappedPayload.total)
        ? unwrappedPayload.total
        : receptions.length;
    const page =
      typeof unwrappedPayload?.page === 'number' && Number.isFinite(unwrappedPayload.page)
        ? unwrappedPayload.page
        : requestedPage;
    const limit =
      typeof unwrappedPayload?.limit === 'number' && Number.isFinite(unwrappedPayload.limit)
        ? unwrappedPayload.limit
        : requestedLimit;
    
    const receptionItems: ReceptionListItem[] = receptions.map((reception: any) => ({
      storedTotalDiscountKg: parseOptionalNumber(reception.totalDiscountKg),
      storedBonusKg: parseOptionalNumber(reception.bonusKg),
      storedFinalNetWeight: parseOptionalNumber(reception.finalNetWeight),
      id: reception.id,
      producer: reception.producer?.name || reception.producer || '',
      season:
        reception.season?.name ||
        reception.season?.code ||
        (typeof reception.season === 'string' ? reception.season : ''),
      rut: reception.producer?.rut || '',
      producerAddress: reception.producer?.address || '',
      producerCity: reception.producer?.city || '',
      riceType: reception.riceType?.name || reception.riceType || '',
      templateName: reception.template?.name || '',
      templateConfig: {
        availableHumedad: parseOptionalBoolean(reception.template?.availableHumedad),
        availableGranosVerdes: parseOptionalBoolean(
          reception.template?.availableGranosVerdes,
        ),
        availableImpurezas: parseOptionalBoolean(reception.template?.availableImpurezas),
        availableVano: parseOptionalBoolean(reception.template?.availableVano),
        availableHualcacho: parseOptionalBoolean(reception.template?.availableHualcacho),
        availableGranosManchados: parseOptionalBoolean(
          reception.template?.availableGranosManchados,
        ),
        availableGranosPelados: parseOptionalBoolean(
          reception.template?.availableGranosPelados,
        ),
        availableGranosYesosos: parseOptionalBoolean(
          reception.template?.availableGranosYesosos,
        ),
      },
      dryPercent: parseOptionalNumber(reception.dryPercent),
      price: Number(reception.ricePrice) || 0,
      grossWeight: Number(reception.grossWeight) || 0,
      tare: Number(reception.tareWeight || reception.tare) || 0,
      netWeight: Number(reception.netWeight) || 0,
      guide: reception.guideNumber || reception.guide || '',
      licensePlate: reception.licensePlate || '',
      note: reception.notes || '',
      createdAt: reception.createdAt,
      deletedAt:
        reception.deletedAt === null || reception.deletedAt === undefined
          ? null
          : String(reception.deletedAt),
      totalConDescuentos: parseOptionalNumber(reception.totalDiscountKg) ?? 0,
      bonusKg: parseOptionalNumber(reception.bonusKg) ?? 0,
      paddyNeto: parseOptionalNumber(reception.finalNetWeight) ?? (Number(reception.netWeight) || 0),
      status: normalizeReceptionStatus(reception.status),
      templateBonusEnabled: Boolean(reception.template?.availableBonus),
      templateBonusTolerance: parseOptionalNumber(reception.template?.toleranceBonus) || 0,
      analysis: null,
    }));

    const receptionsWithAnalysis = await Promise.all(
      receptionItems.map(async (reception: ReceptionListItem) => {
        if (reception.status === 'cancelled') {
          return reception;
        }

        const analysisResult = await fetchReceptionAnalysis(reception.id);

        if (!analysisResult.success) {
          console.error(
            `Error fetching analysis for reception ${reception.id}:`,
            analysisResult.error,
          );
          return reception;
        }

        const analysis = analysisResult.data ?? null;
        const fallbackTotalDiscount =
          parseOptionalNumber(analysis?.summaryPenaltyKg) ??
          ((reception.netWeight * Number(analysis?.summaryPercent ?? analysis?.totalGroupPercent ?? 0)) / 100);

        const totalDiscountKg =
          reception.storedTotalDiscountKg ?? fallbackTotalDiscount;

        const bonusPercentFallback =
          parseOptionalNumber(analysis?.bonusPercent) ??
          reception.templateBonusTolerance ??
          0;
        const bonusEnabledFallback =
          analysis?.bonusEnabled ??
          reception.templateBonusEnabled ??
          false;

        const bonusKg =
          reception.storedBonusKg ??
          (bonusEnabledFallback
            ? (reception.netWeight * bonusPercentFallback) / 100
            : 0);

        const paddyNeto =
          reception.storedFinalNetWeight ??
          (reception.netWeight - totalDiscountKg + bonusKg);

        return {
          ...reception,
          totalConDescuentos: roundTo2(totalDiscountKg),
          bonusKg: roundTo2(bonusKg),
          paddyNeto: roundTo2(paddyNeto),
          analysis,
        };
      }),
    );

    return {
      data: receptionsWithAnalysis,
      total,
      page,
      limit,
    };
  } catch (error) {
    throwIfBackendUnavailable(error);
    console.error('Error fetching receptions:', error);
    return {
      data: [],
      total: 0,
      page: requestedPage,
      limit: requestedLimit,
    };
  }
}

export async function fetchReceptionById(
  receptionId: number,
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      return { success: false, error: 'No access token' };
    }

    const headers = getAuthHeaders(token);
    const response = await fetch(`${API_BASE_URL}/${receptionId}`, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        extractErrorMessage(
          errorData,
          `No se pudo obtener la recepción ${receptionId} (${response.status})`,
        ),
      );
    }

    const payload = await response.json();
    return { success: true, data: unwrapResponseData<any>(payload) };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

function buildAnalysisPayload(
  analysis: CreateReceptionAndAnalysisPayload['analysis'],
) {
  return {
    templateId: parseOptionalNumber(analysis.templateId),
    useToleranceGroup: analysis.useToleranceGroup,
    groupToleranceName: analysis.groupToleranceName?.trim() || undefined,
    groupToleranceValue: parseOptionalNumber(analysis.groupToleranceValue),

    humedadRange: parseOptionalNumber(analysis.humedadRange),
    humedadPercent: parseOptionalNumber(analysis.humedadPercent),
    humedadValue: parseOptionalNumber(analysis.humedadValue),
    humedadTolerance: parseOptionalNumber(analysis.humedadTolerance),
    humedadIsGroup: analysis.humedadIsGroup,
    humedadTolVisible: analysis.humedadTolVisible,

    impurezasRange: parseOptionalNumber(analysis.impurezasRange),
    impurezasPercent: parseOptionalNumber(analysis.impurezasPercent),
    impurezasValue: parseOptionalNumber(analysis.impurezasValue),
    impurezasTolerance: parseOptionalNumber(analysis.impurezasTolerance),
    impurezasIsGroup: analysis.impurezasIsGroup,
    impurezasTolVisible: analysis.impurezasTolVisible,

    verdesRange: parseOptionalNumber(analysis.verdesRange),
    verdesPercent: parseOptionalNumber(analysis.verdesPercent),
    verdesValue: parseOptionalNumber(analysis.verdesValue),
    verdesTolerance: parseOptionalNumber(analysis.verdesTolerance),
    verdesIsGroup: analysis.verdesIsGroup,
    verdesTolVisible: analysis.verdesTolVisible,

    manchadosRange: parseOptionalNumber(analysis.manchadosRange),
    manchadosPercent: parseOptionalNumber(analysis.manchadosPercent),
    manchadosValue: parseOptionalNumber(analysis.manchadosValue),
    manchadosTolerance: parseOptionalNumber(analysis.manchadosTolerance),
    manchadosIsGroup: analysis.manchadosIsGroup,
    manchadosTolVisible: analysis.manchadosTolVisible,

    yesososRange: parseOptionalNumber(analysis.yesososRange),
    yesososPercent: parseOptionalNumber(analysis.yesososPercent),
    yesososValue: parseOptionalNumber(analysis.yesososValue),
    yesososTolerance: parseOptionalNumber(analysis.yesososTolerance),
    yesososIsGroup: analysis.yesososIsGroup,
    yesososTolVisible: analysis.yesososTolVisible,

    peladosRange: parseOptionalNumber(analysis.peladosRange),
    peladosPercent: parseOptionalNumber(analysis.peladosPercent),
    peladosValue: parseOptionalNumber(analysis.peladosValue),
    peladosTolerance: parseOptionalNumber(analysis.peladosTolerance),
    peladosIsGroup: analysis.peladosIsGroup,
    peladosTolVisible: analysis.peladosTolVisible,

    vanoRange: parseOptionalNumber(analysis.vanoRange),
    vanoPercent: parseOptionalNumber(analysis.vanoPercent),
    vanoValue: parseOptionalNumber(analysis.vanoValue),
    vanoTolerance: parseOptionalNumber(analysis.vanoTolerance),
    vanoIsGroup: analysis.vanoIsGroup,
    vanoTolVisible: analysis.vanoTolVisible,

    hualcachoRange: parseOptionalNumber(analysis.hualcachoRange),
    hualcachoPercent: parseOptionalNumber(analysis.hualcachoPercent),
    hualcachoValue: parseOptionalNumber(analysis.hualcachoValue),
    hualcachoTolerance: parseOptionalNumber(analysis.hualcachoTolerance),
    hualcachoIsGroup: analysis.hualcachoIsGroup,
    hualcachoTolVisible: analysis.hualcachoTolVisible,

    summaryPercent: parseOptionalNumber(analysis.summaryPercent),
    summaryTolerance: parseOptionalNumber(analysis.summaryTolerance),
    summaryPenaltyKg: parseOptionalNumber(analysis.summaryPenaltyKg),
    bonusEnabled: analysis.bonusEnabled,
    bonusPercent: parseOptionalNumber(analysis.bonusPercent),

    totalGroupPercent: parseOptionalNumber(analysis.totalGroupPercent),
    groupTolerance: parseOptionalNumber(analysis.groupTolerance),
    dryPercent: parseOptionalNumber(analysis.dryPercent),
    notes: analysis.notes?.trim() || undefined,
  };
}

export async function fetchReceptionAnalysis(
  receptionId: number,
): Promise<{ success: boolean; data?: ReceptionAnalysis | null; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      return { success: false, error: 'No access token' };
    }

    const headers = getAuthHeaders(token);
    const response = await fetch(`${API_BASE_URL}/${receptionId}/analysis`, {
      headers,
      cache: 'no-store',
    });

    if (response.status === 404) {
      return { success: true, data: null };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch analysis: ${response.status}`);
    }

    const payload = await response.json();
    const analysis = unwrapResponseData<any>(payload);

    if (!analysis || typeof analysis !== 'object') {
      return { success: true, data: null };
    }

    return {
      success: true,
      data: {
        id: Number(analysis.id),
        receptionId: Number(analysis.receptionId) || receptionId,
        templateId: parseOptionalNumber(analysis.templateId),
        useToleranceGroup: parseOptionalBoolean(analysis.useToleranceGroup),
        groupToleranceName:
          typeof analysis.groupToleranceName === 'string'
            ? analysis.groupToleranceName
            : undefined,
        groupToleranceValue: parseOptionalNumber(
          analysis.groupToleranceValue ?? analysis.groupTolerance,
        ),
        humedadRange: parseOptionalNumber(analysis.humedadRange),
        humedadValue: parseOptionalNumber(
          analysis.humedadValue ?? analysis.humedadRange,
        ),
        humedadPercent: parseOptionalNumber(analysis.humedadPercent),
        humedadTolerance: parseOptionalNumber(analysis.humedadTolerance),
        humedadIsGroup: parseOptionalBoolean(analysis.humedadIsGroup),
        humedadTolVisible: parseOptionalBoolean(analysis.humedadTolVisible),
        impurezasRange: parseOptionalNumber(analysis.impurezasRange),
        impurezasValue: parseOptionalNumber(
          analysis.impurezasValue ?? analysis.impurezasRange,
        ),
        impurezasPercent: parseOptionalNumber(analysis.impurezasPercent),
        impurezasTolerance: parseOptionalNumber(analysis.impurezasTolerance),
        impurezasIsGroup: parseOptionalBoolean(analysis.impurezasIsGroup),
        impurezasTolVisible: parseOptionalBoolean(analysis.impurezasTolVisible),
        verdesRange: parseOptionalNumber(analysis.verdesRange),
        verdesValue: parseOptionalNumber(analysis.verdesValue ?? analysis.verdesRange),
        verdesPercent: parseOptionalNumber(analysis.verdesPercent),
        verdesTolerance: parseOptionalNumber(analysis.verdesTolerance),
        verdesIsGroup: parseOptionalBoolean(analysis.verdesIsGroup),
        verdesTolVisible: parseOptionalBoolean(analysis.verdesTolVisible),
        manchadosRange: parseOptionalNumber(analysis.manchadosRange),
        manchadosValue: parseOptionalNumber(
          analysis.manchadosValue ?? analysis.manchadosRange,
        ),
        manchadosPercent: parseOptionalNumber(analysis.manchadosPercent),
        manchadosTolerance: parseOptionalNumber(analysis.manchadosTolerance),
        manchadosIsGroup: parseOptionalBoolean(analysis.manchadosIsGroup),
        manchadosTolVisible: parseOptionalBoolean(analysis.manchadosTolVisible),
        yesososRange: parseOptionalNumber(analysis.yesososRange),
        yesososValue: parseOptionalNumber(analysis.yesososValue ?? analysis.yesososRange),
        yesososPercent: parseOptionalNumber(analysis.yesososPercent),
        yesososTolerance: parseOptionalNumber(analysis.yesososTolerance),
        yesososIsGroup: parseOptionalBoolean(analysis.yesososIsGroup),
        yesososTolVisible: parseOptionalBoolean(analysis.yesososTolVisible),
        peladosRange: parseOptionalNumber(analysis.peladosRange),
        peladosValue: parseOptionalNumber(analysis.peladosValue ?? analysis.peladosRange),
        peladosPercent: parseOptionalNumber(analysis.peladosPercent),
        peladosTolerance: parseOptionalNumber(analysis.peladosTolerance),
        peladosIsGroup: parseOptionalBoolean(analysis.peladosIsGroup),
        peladosTolVisible: parseOptionalBoolean(analysis.peladosTolVisible),
        vanoRange: parseOptionalNumber(analysis.vanoRange),
        vanoValue: parseOptionalNumber(analysis.vanoValue ?? analysis.vanoRange),
        vanoPercent: parseOptionalNumber(analysis.vanoPercent),
        vanoTolerance: parseOptionalNumber(analysis.vanoTolerance),
        vanoIsGroup: parseOptionalBoolean(analysis.vanoIsGroup),
        vanoTolVisible: parseOptionalBoolean(analysis.vanoTolVisible),
        hualcachoRange: parseOptionalNumber(analysis.hualcachoRange),
        hualcachoValue: parseOptionalNumber(
          analysis.hualcachoValue ?? analysis.hualcachoRange,
        ),
        hualcachoPercent: parseOptionalNumber(analysis.hualcachoPercent),
        hualcachoTolerance: parseOptionalNumber(analysis.hualcachoTolerance),
        hualcachoIsGroup: parseOptionalBoolean(analysis.hualcachoIsGroup),
        hualcachoTolVisible: parseOptionalBoolean(analysis.hualcachoTolVisible),
        totalGroupPercent: parseOptionalNumber(
          analysis.totalGroupPercent ?? analysis.summaryPercent,
        ),
        groupTolerance: parseOptionalNumber(
          analysis.groupTolerance ?? analysis.groupToleranceValue,
        ),
        summaryPercent: parseOptionalNumber(
          analysis.summaryPercent ?? analysis.totalGroupPercent,
        ),
        summaryTolerance: parseOptionalNumber(analysis.summaryTolerance),
        summaryPenaltyKg: parseOptionalNumber(analysis.summaryPenaltyKg),
        bonusEnabled: parseOptionalBoolean(analysis.bonusEnabled),
        bonusPercent: parseOptionalNumber(analysis.bonusPercent),
        dryPercent: parseOptionalNumber(analysis.dryPercent),
        notes: analysis.notes || undefined,
        createdAt: analysis.createdAt || undefined,
        updatedAt: analysis.updatedAt || undefined,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

export async function createReception(data: CreateReceptionPayload): Promise<{ success: boolean; data?: Reception; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      return { success: false, error: 'No access token' };
    }

    const templateId = Number(data.templateId ?? 0);
    if (templateId <= 0) {
      return { success: false, error: 'Debe seleccionar una plantilla válida' };
    }

    const seasonId = await resolveSeasonId(token, data.seasonId);
    if (!seasonId) {
      return { success: false, error: 'No se encontró una temporada activa para registrar la recepción' };
    }

    const dryPercent = Number(data.dryPercent ?? 0);
    const headers = getAuthHeaders(token);
    const receptionPayload = {
      producerId: Number(data.producerId),
      templateId,
      seasonId,
      riceTypeId: Number(data.riceTypeId),
      guideNumber: data.guide,
      ricePrice: Number(data.price),
      licensePlate: data.licensePlate,
      grossWeight: Number(data.grossWeight),
      tareWeight: Number(data.tare),
      dryPercent: Number.isFinite(dryPercent) ? dryPercent : 0,
      dryFeeApplied: (Number.isFinite(dryPercent) ? dryPercent : 0) > 0,
      notes: data.note?.trim() || undefined,
    };

    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(receptionPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        extractErrorMessage(errorData, `Failed to create reception: ${response.status}`),
      );
    }

    const reception = unwrapResponseData<Reception>(await response.json());
    return { success: true, data: reception };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

export async function createReceptionAndAnalysis(
  payload: CreateReceptionAndAnalysisPayload,
): Promise<{
  success: boolean;
  data?: { receptionId: number; reception: any; analysis: any };
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      return { success: false, error: 'No access token' };
    }

    const templateId = Number(payload.reception.templateId ?? 0);
    if (templateId <= 0) {
      return { success: false, error: 'Debe seleccionar una plantilla válida' };
    }

    const seasonId = await resolveSeasonId(token, payload.reception.seasonId);
    if (!seasonId) {
      return {
        success: false,
        error: 'No existe una temporada activa disponible para crear la recepción',
      };
    }

    const headers = getAuthHeaders(token);
    const dryPercent = Number(
      payload.reception.dryPercent ?? payload.analysis.dryPercent ?? 0,
    );
    const normalizedDryPercent = Number.isFinite(dryPercent) ? dryPercent : 0;

    const receptionPayload = {
      producerId: Number(payload.reception.producerId),
      templateId,
      seasonId,
      riceTypeId: Number(payload.reception.riceTypeId),
      guideNumber: payload.reception.guide,
      ricePrice: Number(payload.reception.price),
      licensePlate: payload.reception.licensePlate,
      grossWeight: Number(payload.reception.grossWeight),
      tareWeight: Number(payload.reception.tare),
      dryPercent: normalizedDryPercent,
      dryFeeApplied: normalizedDryPercent > 0,
      notes: payload.reception.note?.trim() || undefined,
    };

    const analysisPayload = buildAnalysisPayload(payload.analysis);

    const createResponse = await fetch(`${API_BASE_URL}/with-analysis`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        reception: receptionPayload,
        analysis: analysisPayload,
      }),
    });

    if (!createResponse.ok) {
      const createError = await createResponse.json().catch(() => ({}));
      return {
        success: false,
        error: extractErrorMessage(
          createError,
          `No se pudo guardar la recepción con análisis (${createResponse.status})`,
        ),
      };
    }

    const createdData = unwrapResponseData<any>(await createResponse.json());
    const receptionId = Number(
      createdData?.receptionId ?? createdData?.reception?.id ?? 0,
    );

    if (!receptionId) {
      return {
        success: false,
        error: 'No se recibió un ID válido de la recepción creada',
      };
    }

    return {
      success: true,
      data: {
        receptionId,
        reception: createdData?.reception,
        analysis: createdData?.analysis,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

export async function updateReceptionAndAnalysis(
  receptionId: number,
  payload: CreateReceptionAndAnalysisPayload,
): Promise<{
  success: boolean;
  data?: { reception: any; analysis: any | null };
  error?: string;
}> {
  try {
    const receptionResult = await updateReception(receptionId, {
      templateId: Number(payload.reception.templateId ?? 0) || undefined,
      guide: payload.reception.guide,
      licensePlate: payload.reception.licensePlate,
      grossWeight: Number(payload.reception.grossWeight),
      tare: Number(payload.reception.tare),
      price: Number(payload.reception.price),
      dryPercent: Number(payload.reception.dryPercent ?? payload.analysis.dryPercent ?? 0),
      note: payload.reception.note,
    });

    if (!receptionResult.success) {
      return {
        success: false,
        error: receptionResult.error || 'No se pudo actualizar la recepción',
      };
    }

    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      return { success: false, error: 'No access token' };
    }

    const headers = getAuthHeaders(token);
    const analysisPayload = buildAnalysisPayload(payload.analysis);
    const existingAnalysisResult = await fetchReceptionAnalysis(receptionId);

    if (!existingAnalysisResult.success) {
      return {
        success: false,
        error:
          existingAnalysisResult.error ||
          'No se pudo verificar el análisis de la recepción',
      };
    }

    const hasAnalysis = Boolean(existingAnalysisResult.data?.id);
    const analysisEndpoint = `${API_BASE_URL}/${receptionId}/analysis`;
    const analysisResponse = await fetch(analysisEndpoint, {
      method: hasAnalysis ? 'PUT' : 'POST',
      headers,
      body: JSON.stringify(analysisPayload),
    });

    if (!analysisResponse.ok) {
      const errorData = await analysisResponse.json().catch(() => ({}));
      return {
        success: false,
        error: extractErrorMessage(
          errorData,
          `No se pudo actualizar el análisis (${analysisResponse.status})`,
        ),
      };
    }

    const analysisData = unwrapResponseData<any>(await analysisResponse.json());

    return {
      success: true,
      data: {
        reception: receptionResult.data,
        analysis: analysisData,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

export async function updateReception(
  id: number,
  data: UpdateReceptionPayload
): Promise<{ success: boolean; data?: Reception; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      return { success: false, error: 'No access token' };
    }

    const headers = getAuthHeaders(token);
    const receptionPayload: Record<string, unknown> = {};

    if (data.producerId !== undefined) receptionPayload.producerId = Number(data.producerId);
    if (data.templateId !== undefined) receptionPayload.templateId = Number(data.templateId);
    if (data.seasonId !== undefined) receptionPayload.seasonId = Number(data.seasonId);
    if (data.riceTypeId !== undefined) receptionPayload.riceTypeId = Number(data.riceTypeId);
    if (data.guide !== undefined) receptionPayload.guideNumber = data.guide;
    if (data.licensePlate !== undefined) receptionPayload.licensePlate = data.licensePlate;
    if (data.grossWeight !== undefined) receptionPayload.grossWeight = Number(data.grossWeight);
    if (data.tare !== undefined) receptionPayload.tareWeight = Number(data.tare);
    if (data.price !== undefined) receptionPayload.ricePrice = Number(data.price);
    if (data.dryPercent !== undefined) {
      const dryPercent = Number(data.dryPercent);
      receptionPayload.dryPercent = Number.isFinite(dryPercent) ? dryPercent : 0;
      receptionPayload.dryFeeApplied = (Number.isFinite(dryPercent) ? dryPercent : 0) > 0;
    }
    if (data.note !== undefined) receptionPayload.notes = data.note?.trim() || undefined;

    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(receptionPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to update reception: ${response.status}`);
    }

    const reception = unwrapResponseData<Reception>(await response.json());
    return { success: true, data: reception };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

export async function deleteReception(id: number): Promise<{ success: boolean; error?: string }> {
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
      throw new Error(`Failed to delete reception: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}
