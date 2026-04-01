import {
  fetchAdvanceProducerOptions,
  fetchAdvanceSeasonOptions,
} from '@/features/finances/actions/finances.action';
import { AdvanceSeasonOption } from '@/features/finances/types/finances.types';
import { InterestRevenueReport } from '@/features/reports/components';

export const dynamic = 'force-dynamic';

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseSeasonDate(value?: string | null): Date | null {
  if (!value) {
    return null;
  }

  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T00:00:00`
    : value;
  const parsed = new Date(normalized);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function resolveInitialRange(seasons: AdvanceSeasonOption[], today: Date): {
  initialStartDate: string;
  initialEndDate: string;
  initialSeasonId?: number;
} {
  const seasonsWithDates = seasons
    .map((season) => ({
      season,
      startDate: parseSeasonDate(season.startDate),
      endDate: parseSeasonDate(season.endDate),
    }))
    .filter(
      (
        item,
      ): item is {
        season: AdvanceSeasonOption;
        startDate: Date;
        endDate: Date;
      } => Boolean(item.startDate && item.endDate),
    );

  if (seasonsWithDates.length === 0) {
    return {
      initialStartDate: toDateInputValue(new Date(today.getFullYear(), 0, 1)),
      initialEndDate: toDateInputValue(new Date(today.getFullYear(), 11, 31)),
    };
  }

  const latestClosedSeason = [...seasonsWithDates]
    .filter((item) => item.endDate.getTime() <= today.getTime())
    .sort((a, b) => b.endDate.getTime() - a.endDate.getTime())[0];

  const preferredSeason =
    latestClosedSeason ??
    [...seasonsWithDates].sort(
      (a, b) => b.endDate.getTime() - a.endDate.getTime(),
    )[0];

  return {
    initialStartDate: toDateInputValue(preferredSeason.startDate),
    initialEndDate: toDateInputValue(preferredSeason.endDate),
    initialSeasonId: preferredSeason.season.id,
  };
}

export default async function InterestRevenueReportPage() {
  const [seasonsResult, producersResult] = await Promise.all([
    fetchAdvanceSeasonOptions(),
    fetchAdvanceProducerOptions(),
  ]);

  const today = new Date();
  const { initialStartDate, initialEndDate, initialSeasonId } =
    resolveInitialRange(seasonsResult.data, today);
  const initialPrintDateLabel = today.toLocaleDateString('es-CL');

  return (
    <div className="space-y-6">
      <InterestRevenueReport
        seasons={seasonsResult.data}
        producers={producersResult.data}
        initialStartDate={initialStartDate}
        initialEndDate={initialEndDate}
        initialSeasonId={initialSeasonId}
        initialPrintDateLabel={initialPrintDateLabel}
      />
    </div>
  );
}
