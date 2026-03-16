'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { throwIfBackendUnavailable } from '@/lib/api/backend-connection-error';
import { analysisParamsApi } from '../services/analysis-params.api';
import {
  AnalysisParam,
  UpdateAnalysisParamPayload,
} from '../types/analysis-params.types';

interface UpdateAnalysisParamResult {
  success: boolean;
  data?: AnalysisParam;
  error?: string;
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toStringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function unwrapPayload(raw: any): any {
  if (raw && typeof raw === 'object' && 'data' in raw) {
    return raw.data;
  }

  return raw;
}

function normalizeAnalysisParam(raw: any): AnalysisParam {
  const source = unwrapPayload(raw);
  const id = toNumber(source?.id, 0);

  return {
    id,
    discountCode: toNumber(source?.discountCode, 0),
    discountName: toStringValue(source?.discountName, ''),
    unit: toStringValue(source?.unit, ''),
    rangeStart: toNumber(source?.rangeStart),
    rangeEnd: toNumber(source?.rangeEnd),
    discountPercent: toNumber(source?.discountPercent),
    priority: toNumber(source?.priority, 0),
    isActive: typeof source?.isActive === 'boolean' ? source.isActive : true,
    createdAt: toStringValue(source?.createdAt, ''),
    updatedAt: toStringValue(source?.updatedAt, ''),
  };
}

export async function updateAnalysisParamIsActive(
  id: number,
  isActive: boolean,
): Promise<UpdateAnalysisParamResult> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.accessToken) {
      return {
        success: false,
        error: 'No authentication token',
      };
    }

    const response = await analysisParamsApi.update(session.user.accessToken, id, {
      isActive,
    });

    revalidatePath('/paddy/settings/analysis-params');

    return {
      success: true,
      data: normalizeAnalysisParam(response),
    };
  } catch (error) {
    throwIfBackendUnavailable(error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'No fue posible actualizar el estado del parámetro de análisis',
    };
  }
}

export async function updateAnalysisParam(
  id: number,
  payload: UpdateAnalysisParamPayload,
): Promise<UpdateAnalysisParamResult> {
  try {
    if (payload.end <= payload.start) {
      return {
        success: false,
        error: 'El inicio del rango debe ser menor que el fin del rango',
      };
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.accessToken) {
      return {
        success: false,
        error: 'No authentication token',
      };
    }

    const response = await analysisParamsApi.update(
      session.user.accessToken,
      id,
      payload,
    );

    revalidatePath('/paddy/settings/analysis-params');

    return {
      success: true,
      data: normalizeAnalysisParam(response),
    };
  } catch (error) {
    throwIfBackendUnavailable(error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'No fue posible actualizar el parámetro de análisis',
    };
  }
}
