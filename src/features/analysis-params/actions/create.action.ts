'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { throwIfBackendUnavailable } from '@/lib/api/backend-connection-error';
import { analysisParamsApi } from '../services/analysis-params.api';
import {
  AnalysisParam,
  CreateAnalysisParamPayload,
} from '../types/analysis-params.types';

interface CreateAnalysisParamResult {
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

function normalizeAnalysisParam(raw: any): AnalysisParam {
  const id = toNumber(raw?.id, 0);
  return {
    id,
    discountCode: toNumber(raw?.discountCode, 0),
    discountName: toStringValue(raw?.discountName, ''),
    unit: toStringValue(raw?.unit, ''),
    rangeStart: toNumber(raw?.rangeStart),
    rangeEnd: toNumber(raw?.rangeEnd),
    discountPercent: toNumber(raw?.discountPercent),
    priority: toNumber(raw?.priority, 0),
    isActive: typeof raw?.isActive === 'boolean' ? raw.isActive : true,
    createdAt: toStringValue(raw?.createdAt, ''),
    updatedAt: toStringValue(raw?.updatedAt, ''),
  };
}

export async function createAnalysisParam(
  payload: CreateAnalysisParamPayload,
): Promise<CreateAnalysisParamResult> {
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

    const response = await analysisParamsApi.create(
      session.user.accessToken,
      payload,
    );

    revalidatePath('/paddy/settings/analysis-params');

    return {
      success: true,
      data: normalizeAnalysisParam(response.data),
    };
  } catch (error) {
    throwIfBackendUnavailable(error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'No fue posible crear el parámetro de análisis',
    };
  }
}
