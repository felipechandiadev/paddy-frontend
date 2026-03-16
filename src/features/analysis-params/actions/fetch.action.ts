'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { throwIfBackendUnavailable } from '@/lib/api/backend-connection-error';
import { analysisParamsApi } from '../services/analysis-params.api';
import { AnalysisParam } from '../types/analysis-params.types';

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toStringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function extractCollection(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;

    if (Array.isArray(record.data)) {
      return record.data;
    }

    if (record.data && typeof record.data === 'object') {
      const nested = record.data as Record<string, unknown>;
      if (Array.isArray(nested.data)) {
        return nested.data;
      }
    }
  }

  return [];
}

function normalizeFlatParam(rawItem: any, fallbackIndex: number): AnalysisParam {
  const id = toNumber(rawItem?.id, fallbackIndex + 1);
  return {
    id,
    discountCode: toNumber(rawItem?.discountCode, id),
    discountName: toStringValue(rawItem?.discountName, ''),
    unit: toStringValue(rawItem?.unit, ''),
    rangeStart: toNumber(rawItem?.rangeStart),
    rangeEnd: toNumber(rawItem?.rangeEnd),
    discountPercent: toNumber(rawItem?.discountPercent),
    priority: toNumber(rawItem?.priority, fallbackIndex + 1),
    isActive: typeof rawItem?.isActive === 'boolean' ? rawItem.isActive : true,
    createdAt: toStringValue(rawItem?.createdAt, ''),
    updatedAt: toStringValue(rawItem?.updatedAt, ''),
  };
}

function normalizeAnalysisParams(payload: unknown): AnalysisParam[] {
  const collection = extractCollection(payload);

  const normalized = collection.flatMap((item: any, itemIndex: number) => {
    if (Array.isArray(item?.ranges)) {
      return item.ranges.map((range: any, rangeIndex: number) => ({
        id: toNumber(range?.id, itemIndex * 100 + rangeIndex + 1),
        discountCode: toNumber(item?.id, itemIndex + 1),
        discountName: toStringValue(item?.name, ''),
        unit: toStringValue(item?.description, ''),
        rangeStart: toNumber(range?.rangeStart),
        rangeEnd: toNumber(range?.rangeEnd),
        discountPercent: toNumber(range?.percent),
        priority: toNumber(range?.priority, rangeIndex + 1),
        isActive: typeof range?.isActive === 'boolean' ? range.isActive : true,
        createdAt: toStringValue(range?.createdAt, ''),
        updatedAt: toStringValue(range?.updatedAt, ''),
      }));
    }

    return [normalizeFlatParam(item, itemIndex)];
  });

  return normalized;
}

export async function fetchAnalysisParams(): Promise<AnalysisParam[]> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.accessToken) {
      console.error('No access token in session');
      return [];
    }

    const response = await analysisParamsApi.list(session.user.accessToken, true);
    return normalizeAnalysisParams(response);
  } catch (error) {
    throwIfBackendUnavailable(error);
    console.error('Error fetching analysis params:', error);
    return [];
  }
}
