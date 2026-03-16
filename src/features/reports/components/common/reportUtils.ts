import type { Option } from '@/shared/components/ui/Select/Select';
import { AdvanceProducerOption, AdvanceSeasonOption } from '@/features/finances/types/finances.types';
import {
  DryingReceptionStatusFilter,
  AdvanceStatusFilter,
  InterestCalculationMode,
  ReportGroupBy,
} from '../../types/reports.types';

export const REPORT_GROUP_BY_OPTIONS: Option[] = [
  { id: 'day', label: 'Dia' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
];

export const INTEREST_CALCULATION_OPTIONS: Option[] = [
  { id: 'devengado', label: 'Devengado' },
  { id: 'liquidado', label: 'Liquidado' },
];

export const INTEREST_STATUS_OPTIONS: Option[] = [
  { id: 'paid', label: 'Pagado' },
  { id: 'settled', label: 'Liquidado' },
  { id: 'cancelled', label: 'Anulado' },
];

export const DRYING_RECEPTION_STATUS_OPTIONS: Option[] = [
  { id: 'settled', label: 'Liquidadas' },
  { id: 'analyzed', label: 'Analizadas' },
  { id: 'analyzed_settled', label: 'Analizadas y Liquidadas' },
];

export const REPORT_GROUP_BY_LABELS: Record<ReportGroupBy, string> = {
  day: 'Dia',
  week: 'Semana',
  month: 'Mes',
};

export const DRYING_RECEPTION_STATUS_LABELS: Record<
  DryingReceptionStatusFilter,
  string
> = {
  settled: 'Liquidadas',
  analyzed: 'Analizadas',
  analyzed_settled: 'Analizadas y Liquidadas',
};

export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toOptionalNumber(value: string | number | null): number | undefined {
  if (value === null || value === '' || value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}

export function formatDateValue(value: string | Date | null | undefined): string {
  if (!value) {
    return '-';
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '-';
  }

  return parsed.toLocaleDateString('es-CL');
}

export function normalizeStatusLabel(status: string | null | undefined): string {
  const normalized = String(status ?? '').toLowerCase();

  if (normalized === 'paid') return 'Pagado';
  if (normalized === 'settled') return 'Liquidado';
  if (normalized === 'completed') return 'Liquidada';
  if (normalized === 'cancelled') return 'Anulado';
  if (normalized === 'analyzed') return 'Analizado';

  return normalized ? normalized : '-';
}

export function normalizeReceptionStatusLabel(status: string | null | undefined): string {
  const normalized = String(status ?? '').toLowerCase();

  if (normalized === 'complete' || normalized === 'completed' || normalized === 'settled') {
    return 'Liquidada';
  }

  if (normalized === 'analyzed') {
    return 'Analizada';
  }

  return normalizeStatusLabel(status);
}

export function mapSeasonOptions(seasons: AdvanceSeasonOption[]): Option[] {
  return seasons
    .slice()
    .sort((a, b) => b.year - a.year)
    .map((season) => ({
      id: season.id,
      label: `${season.code} - ${season.name}`,
    }));
}

export function mapProducerOptions(producers: AdvanceProducerOption[]): Option[] {
  return producers
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((producer) => ({
      id: producer.id,
      label: `${producer.name} (${producer.rut})`,
    }));
}

export function toAdvanceStatusFilter(value: string | number | null): AdvanceStatusFilter | undefined {
  if (value === null || value === '' || value === undefined) {
    return undefined;
  }

  if (value === 'paid' || value === 'settled' || value === 'cancelled') {
    return value;
  }

  return undefined;
}

export function toDryingReceptionStatusFilter(
  value: string | number | null,
  fallback: DryingReceptionStatusFilter = 'analyzed_settled',
): DryingReceptionStatusFilter {
  if (value === 'settled' || value === 'analyzed' || value === 'analyzed_settled') {
    return value;
  }

  return fallback;
}

export function toInterestCalculationMode(
  value: string | number | null,
  fallback: InterestCalculationMode = 'devengado',
): InterestCalculationMode {
  if (value === 'devengado' || value === 'liquidado') {
    return value;
  }

  return fallback;
}
